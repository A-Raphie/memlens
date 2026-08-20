"""MemLens — Agent Memory Debugger API.

All queries are written against HydraDB's supported OpenCypher subset:
auto-commit single statements, integer node ids, typed one-hop edge
patterns, RETURN <binding>.<property> / count(*), ORDER BY / SKIP / LIMIT,
and WHERE limited to property comparisons. Search and conflict joining
happen in Python (see ingest.py).
"""

import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from hydra_client import get_bolt_driver, run_query, run_write_query
from ingest import (
    parse_session_file,
    build_ingestion_queries,
    detect_conflicts,
    EDGE_TYPES,
)

# Anchor edges (Graph id 0 -> Session) exist for writes but are noise in the
# visualization; the anchor node is never part of the rendered graph.
GRAPH_EDGE_TYPES = ("CONTAINS", "MENTIONS", "CREATED")

app = FastAPI(title="MemLens API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

driver = None


def get_driver():
    global driver
    if driver is None:
        driver = get_bolt_driver()
    return driver


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "memlens"}


@app.get("/api/stats")
async def get_stats():
    """Node/edge/conflict counts for telemetry strips. 503 when HydraDB is unreachable."""
    d = get_driver()
    try:
        nodes = {}
        for label in ("Session", "Turn", "Entity", "Fact"):
            rows = run_query(d, f"MATCH (n:{label}) RETURN count(*) AS c")
            nodes[label] = rows[0]["c"] if rows else 0
        edges = 0
        for rel in EDGE_TYPES:
            rows = run_query(d, f"MATCH ()-[r:{rel}]->() RETURN count(*) AS c")
            edges += rows[0]["c"] if rows else 0
        conflicts = len(detect_conflicts(d))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"HydraDB unreachable: {e}")
    return {"nodes": nodes, "edges": edges, "conflicts": conflicts}


class QueryRequest(BaseModel):
    query: str
    query_type: str = "natural"  # "natural" or "cypher"


@app.post("/api/ingest")
async def ingest_sessions(file: UploadFile = File(...)):
    """Ingest session logs into HydraDB."""
    content = await file.read()
    try:
        data = parse_session_file(content.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    d = get_driver()
    total_queries = 0
    errors = []

    for question in data.get("questions", []):
        session_data = {
            "id": question.get("question_id", f"q_{total_queries}"),
            "date": question.get("question_date", "unknown"),
            "question_type": question.get("question_type", "unknown"),
            "turns": [],
        }

        for session_turns in question.get("haystack_sessions", []):
            for turn in session_turns:
                session_data["turns"].append({
                    "role": turn.get("role", "unknown"),
                    "content": turn.get("content", ""),
                    "has_answer": turn.get("has_answer", False),
                })

        for cypher, params in build_ingestion_queries(session_data):
            try:
                run_write_query(d, cypher, params)
                total_queries += 1
            except Exception as e:
                errors.append(str(e))

    return {
        "status": "ok",
        "questions_ingested": len(data.get("questions", [])),
        "queries_executed": total_queries,
        "errors": errors[:10] if errors else [],
    }


LABEL_QUERIES = {
    "Session": "MATCH (n:Session) RETURN n.id AS id, n.key AS label ORDER BY id LIMIT $limit",
    "Turn": "MATCH (n:Turn) RETURN n.id AS id, n.content AS label ORDER BY id LIMIT $limit",
    "Entity": "MATCH (n:Entity) RETURN n.id AS id, n.name AS label ORDER BY id LIMIT $limit",
    "Fact": "MATCH (n:Fact) RETURN n.id AS id, n.content AS label ORDER BY id LIMIT $limit",
}


@app.get("/api/graph")
async def get_graph(limit: int = 200):
    """Return graph data for Cytoscape.js visualization."""
    d = get_driver()
    nodes = []
    for label, q in LABEL_QUERIES.items():
        for n in run_query(d, q, {"limit": limit}):
            text = str(n.get("label") or n["id"])
            nodes.append({
                "data": {"id": str(n["id"]), "label": text[:50], "type": label}
            })

    edges = []
    per_type = max(50, limit)
    for rel in GRAPH_EDGE_TYPES:
        rows = run_query(
            d,
            f"MATCH (a)-[r:{rel}]->(b) RETURN a.id AS src, b.id AS tgt LIMIT $limit",
            {"limit": per_type},
        )
        for e in rows:
            src, tgt = str(e["src"]), str(e["tgt"])
            edges.append({
                "data": {"id": f"{src}_{rel}_{tgt}", "source": src, "target": tgt, "relationship": rel}
            })

    return {"nodes": nodes, "edges": edges}


@app.post("/api/query")
async def query_graph(req: QueryRequest):
    """Query the knowledge graph."""
    d = get_driver()

    if req.query_type == "cypher":
        try:
            results = run_query(d, req.query)
            return {"status": "ok", "results": results}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    # Natural language: HydraDB WHERE has no CONTAINS, so filter in Python.
    needle = req.query.lower()
    matches = []
    for row in run_query(
        d, "MATCH (f:Fact) RETURN f.id AS id, f.content AS content, f.confidence AS confidence ORDER BY id LIMIT 500"
    ):
        if needle in str(row.get("content") or "").lower():
            matches.append({"id": row["id"], "content": row["content"], "confidence": row.get("confidence", 0), "type": "Fact"})
    for row in run_query(
        d, "MATCH (e:Entity) RETURN e.id AS id, e.name AS name ORDER BY id LIMIT 500"
    ):
        if needle in str(row.get("name") or "").lower():
            matches.append({"id": row["id"], "content": row["name"], "confidence": 1.0, "type": "Entity"})

    return {"status": "ok", "results": matches[:20]}


@app.get("/api/sessions")
async def list_sessions():
    """List all ingested sessions."""
    d = get_driver()
    rows = run_query(
        d,
        "MATCH (s:Session) RETURN s.id AS id, s.key AS key, s.date AS date, "
        "s.question_type AS question_type ORDER BY id",
    )
    return {"sessions": rows}


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get details for one session."""
    d = get_driver()
    try:
        sid = int(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Session id must be an integer")

    s = run_query(
        d,
        "MATCH (s:Session {id: $id}) RETURN s.id AS id, s.key AS key, s.date AS date, "
        "s.question_type AS question_type",
        {"id": sid},
    )
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")

    turns = run_query(
        d,
        "MATCH (s:Session {id: $id})-[:CONTAINS]->(t:Turn) RETURN t.id AS id, t.role AS role LIMIT 200",
        {"id": sid},
    )
    facts = run_query(
        d,
        "MATCH (s:Session {id: $id})-[:CONTAINS]->(t:Turn)-[:CREATED]->(f:Fact) "
        "RETURN f.id AS id, f.content AS content LIMIT 200",
        {"id": sid},
    )
    entities = run_query(
        d,
        "MATCH (s:Session {id: $id})-[:CONTAINS]->(t:Turn)-[:MENTIONS]->(e:Entity) "
        "RETURN e.id AS id, e.name AS name LIMIT 200",
        {"id": sid},
    )
    return {"s": s[0], "turns": turns, "facts": facts, "entities": entities}


@app.get("/api/conflicts")
async def get_conflicts():
    """Return all conflicting fact pairs."""
    d = get_driver()
    conflicts = detect_conflicts(d)
    return {"conflicts": conflicts}


@app.get("/api/entities")
async def get_entities():
    """Return all entities."""
    d = get_driver()
    rows = run_query(
        d,
        "MATCH (e:Entity) RETURN e.id AS id, e.name AS name, e.type AS type ORDER BY id LIMIT 500",
    )
    return {"entities": rows}
