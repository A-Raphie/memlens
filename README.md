# MemLens · Agent Memory Debugger

**See what your agent remembers, forgets, and contradicts.**

MemLens ingests AI-agent session logs, builds a knowledge graph in [HydraDB](https://github.com/hydra-db/hydradb), and lets you query and debug the agent's memory: walk the provenance of any belief, and find the places where the agent contradicts itself.

Built for **Hack Hydra 2026 · Track 3 (Agent Memory)**.

- **Demo video:** https://memlens.vercel.app/memlens-demo.mp4 (1:29)
- **Live landing:** https://memlens.vercel.app (the debugger itself runs against a local HydraDB — see Quickstart)

---

## Why this exists

AI agents accumulate memory across sessions. Nobody audits it. Conflicting facts, stale beliefs, and silent gaps pile up until the agent confidently says things that contradict what it said last week — and by the time a user notices, the root cause is buried across hundreds of turns.

MemLens makes agent memory **visible, queryable, and debuggable**:

1. **Upload** a session log (LongMemEval JSON format)
2. **Graph** it: sessions → turns → entities → facts, written as a real graph in HydraDB
3. **Query** in natural language or raw OpenCypher
4. **Fix** memory drift: contradiction pairs are joined through shared entities and surfaced with their provenance

## How HydraDB is used (and why it matters)

HydraDB is load-bearing, not a bolt-on:

- **It is the agent's memory.** Every session, turn, entity, and fact is a labeled node; every relationship (CONTAINS, MENTIONS, CREATED) is a typed edge. Nothing is stored in a relational table.
- **Contradiction detection is a graph join.** Facts are connected to the turns that created them, turns to the entities they mention. Finding contradictions means asking "which facts share an entity but state different things?" — a multi-hop traversal that is painful in SQL and natural in a graph.
- **Queries run through Bolt.** The backend speaks OpenCypher to a self-hosted HydraDB node (docker compose, local filesystem provider). The debugger's query console passes raw `MATCH ... RETURN` straight through to the engine.
- **Written against the real engine.** The ingestion pipeline is built for HydraDB's supported OpenCypher subset: integer node ids, edge-shaped `MERGE` writes with follow-up `SET`, auto-commit transactions, and app-side string search (the engine's `WHERE` covers property comparisons). Every write is idempotent, so re-ingesting a session is a no-op.

## Quickstart (Docker)

```bash
git clone https://github.com/A-Raphie/memlens.git
cd memlens
docker compose up --build
```

- Debugger UI: http://localhost:3000/app
- API: http://localhost:8000/api/health
- HydraDB Bolt: localhost:7687

Then upload a session log: click the dropzone in **01 INGEST** and pick `data/sample_sessions.json` (5 sample sessions), or drag any LongMemEval-format JSON.

### Manual run (no Docker for the backend)

```bash
# 1. HydraDB — docker only for the DB
docker compose up -d hydradb

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
HYDRADB_HOST=127.0.0.1 HYDRADB_TOKEN=local-development-token-32-bytes \
  uvicorn main:app --host 127.0.0.1 --port 8000

# 3. Frontend
cd ../frontend
npm install
npx vite --port 3000
```

> The dev token above is HydraDB's documented local-development token (written by the hydradb container to its auth-token file). It never leaves your machine.

## What you'll see

- **Telemetry strip** — live counts straight from `COUNT` queries: sessions, turns, entities, facts, edges, contradictions
- **Sessions** — every ingested session with turn/fact/entity breakdowns
- **Contradictions** — fact pairs that share an entity but state different things; click a pair to jump to the fact in the graph
- **Graph** — Cytoscape.js canvas over the live graph: violet sessions, blue turns, green diamond entities, amber facts
- **Query console** — natural language (`what does the agent remember about restaurants`) or raw OpenCypher (`MATCH (f:Fact) RETURN f.content LIMIT 5`); the mode chip flips automatically

## API

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/stats` | per-label node counts, edge counts, contradiction count (503 if HydraDB unreachable) |
| POST | `/api/ingest` | upload a LongMemEval JSON; parses turns, extracts entities + facts, writes the graph |
| GET | `/api/graph` | nodes + typed edges for visualization |
| POST | `/api/query` | natural language or `query_type: "cypher"` passthrough |
| GET | `/api/sessions` / `/api/sessions/{id}` | session list + detail |
| GET | `/api/conflicts` | contradiction pairs |
| GET | `/api/entities` | entity list |

## Project structure

```
backend/    FastAPI service (main.py, ingest.py, hydra_client.py)
frontend/   React + Vite + Cytoscape.js (Landing, Debugger, tokens.js)
data/       sample session logs (LongMemEval format)
demo-video/ storyboard + contact sheet for the demo recording
```

## Attribution

- [HydraDB](https://github.com/hydra-db/hydradb) — the graph database (self-hosted OSS image, Bolt protocol)
- [LongMemEval](https://arxiv.org/abs/2410.10813) — session-log format used by the sample data
- [Cytoscape.js](https://js.cytoscape.org/), [FastAPI](https://fastapi.tiangolo.com/), [React](https://react.dev/)

## License

MIT — see [LICENSE](LICENSE).
