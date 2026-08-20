"""Session log parser and HydraDB ingestion pipeline.

HydraDB query-engine constraints this pipeline is written against:
- node `id` properties must be integers
- writes are auto-commit, single-statement, and edge-shaped:
  MERGE (a {id: N})-[:REL]->(b {id: M}) creates missing endpoint nodes
- MATCH ... SET updates properties on existing nodes
- reads support RETURN <binding>.<property>, ORDER BY, SKIP/LIMIT, count(*),
  and WHERE with boolean combinations of property comparisons
- no CONTAINS / IN / subqueries — search and conflict detection happen here
"""

import json
import hashlib
from datetime import datetime

from hydra_client import run_query

ID_SPACE = 2 ** 48
EDGE_TYPES = ("HAS", "CONTAINS", "MENTIONS", "CREATED")


def hid(*parts) -> int:
    """Stable integer id from arbitrary string parts (HydraDB requires int ids)."""
    return int(hashlib.md5("|".join(str(p) for p in parts).encode()).hexdigest(), 16) % ID_SPACE


def parse_session_file(file_content: str) -> dict:
    """Parse a LongMemEval-style session JSON file."""
    data = json.loads(file_content)

    if isinstance(data, list):
        return {"questions": data}
    elif "question" in data:
        return {"questions": [data]}
    return data


def extract_entities(text: str) -> list[dict]:
    """Extract named entities from text using simple heuristics."""
    entities = []
    words = text.split()
    current_entity = []
    for word in words:
        if word[0].isupper() and len(word) > 1 and word not in ("I", "The", "A", "An", "This", "That", "It", "My", "Your"):
            current_entity.append(word)
        else:
            if current_entity:
                entities.append({"name": " ".join(current_entity), "type": "concept"})
                current_entity = []
    if current_entity:
        entities.append({"name": " ".join(current_entity), "type": "concept"})

    seen = set()
    unique = []
    for e in entities:
        key = e["name"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(e)
    return unique


def extract_facts(turns: list[dict], session_id: str) -> list[dict]:
    """Extract facts from conversation turns."""
    facts = []
    for turn in turns:
        content = turn.get("content", "")
        role = turn.get("role", "")

        if role == "assistant" and len(content) > 20:
            sentences = [s.strip() for s in content.replace(".", ".\n").split("\n") if len(s.strip()) > 15]
            for sentence in sentences[:3]:
                facts.append({"content": sentence, "confidence": 0.8, "turn_role": role})

        if role == "user":
            lower = content.lower()
            preference_signals = ["prefer", "like", "want", "need", "use", "always", "never", "favorite"]
            if any(signal in lower for signal in preference_signals):
                facts.append({"content": content, "confidence": 0.9, "turn_role": "user_preference"})

    return facts


def build_ingestion_queries(session_data: dict) -> list[tuple[str, dict]]:
    """Build auto-commit write queries for one session.

    Strategy: MERGE an edge from an existing anchor (Graph id 0 for sessions,
    the parent session/turn otherwise) so every node creation is edge-shaped,
    then SET the non-id properties on the freshly merged nodes.
    """
    queries: list[tuple[str, dict]] = []
    session_key = session_data.get("id")
    date = session_data.get("date", session_data.get("question_date", datetime.now().isoformat()))
    question_type = session_data.get("question_type", "unknown")
    sid = hid("session", session_key)

    # Session hangs off the shared Graph anchor (id 0), which MERGE creates once.
    queries.append((
        "MERGE (g:Graph {id: 0})-[:HAS]->(s:Session {id: $sid})",
        {"sid": sid},
    ))
    queries.append((
        "MATCH (s:Session {id: $sid}) SET s.date = $date, s.question_type = $qtype, s.key = $key",
        {"sid": sid, "date": str(date), "qtype": str(question_type), "key": str(session_key)},
    ))

    turns = session_data.get("turns", [])
    for i, turn in enumerate(turns):
        role = turn.get("role", "unknown")
        content = turn.get("content", "")
        tid = hid("turn", session_key, i)

        queries.append((
            "MERGE (s:Session {id: $sid})-[:CONTAINS]->(t:Turn {id: $tid})",
            {"sid": sid, "tid": tid},
        ))
        queries.append((
            "MATCH (t:Turn {id: $tid}) SET t.role = $role, t.content = $content",
            {"tid": tid, "role": str(role), "content": str(content)[:500]},
        ))

        for ent in extract_entities(content):
            eid = hid("entity", ent["name"].lower())
            queries.append((
                "MERGE (t:Turn {id: $tid})-[:MENTIONS]->(e:Entity {id: $eid})",
                {"tid": tid, "eid": eid},
            ))
            queries.append((
                "MATCH (e:Entity {id: $eid}) SET e.name = $name, e.type = $etype",
                {"eid": eid, "name": ent["name"], "etype": ent["type"]},
            ))

        for fi, fact in enumerate(extract_facts([turn], session_key)):
            fid = hid("fact", session_key, i, fi)
            queries.append((
                "MERGE (t:Turn {id: $tid})-[:CREATED]->(f:Fact {id: $fid})",
                {"tid": tid, "fid": fid},
            ))
            queries.append((
                "MATCH (f:Fact {id: $fid}) SET f.content = $content, f.confidence = $confidence",
                {"fid": fid, "content": str(fact["content"])[:300], "confidence": fact["confidence"]},
            ))

    return queries


def detect_conflicts(driver) -> list[dict]:
    """Find pairs of contradictory facts.

    HydraDB's WHERE clause cannot do CONTAINS or subqueries, so this joins
    facts -> turns -> entities in Python and flags fact pairs that mention the
    same entity but state different content (negation asymmetry ranks first).
    """
    facts = run_query(
        driver,
        "MATCH (f:Fact) RETURN f.id AS id, f.content AS content ORDER BY id LIMIT 500",
    )
    if not facts:
        return []

    fact_turn = {
        r["id"]: r["tid"]
        for r in run_query(
            driver,
            "MATCH (t:Turn)-[:CREATED]->(f:Fact) RETURN f.id AS id, t.id AS tid LIMIT 2000",
        )
    }
    turn_entities: dict[int, set] = {}
    for r in run_query(
        driver,
        "MATCH (t:Turn)-[:MENTIONS]->(e:Entity) RETURN t.id AS tid, e.name AS name LIMIT 4000",
    ):
        turn_entities.setdefault(r["tid"], set()).add(r["name"])

    by_entity: dict[str, list] = {}
    for f in facts:
        for name in turn_entities.get(fact_turn.get(f["id"]), ()):
            by_entity.setdefault(name, []).append(f)

    scored = []
    seen_texts = set()
    for name, fl in by_entity.items():
        if len(fl) < 2:
            continue
        for i in range(len(fl)):
            for j in range(i + 1, len(fl)):
                a, b = fl[i], fl[j]
                if a["content"] == b["content"]:
                    continue
                # The same sentence can be extracted as several Fact nodes —
                # dedupe pairs by content so the panel never repeats itself.
                key = (min(a["content"], b["content"]), max(a["content"], b["content"]))
                if key in seen_texts:
                    continue
                seen_texts.add(key)
                negated = ("not " in a["content"].lower()) != ("not " in b["content"].lower())
                scored.append((0 if negated else 1, a, b))

    scored.sort(key=lambda t: t[0])
    return [
        {"fact1_id": a["id"], "fact1": a["content"], "fact2_id": b["id"], "fact2": b["content"]}
        for _, a, b in scored[:20]
    ]
