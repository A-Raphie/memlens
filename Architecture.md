# MemLens — Architecture

## Overview

MemLens is a three-layer system: a HydraDB graph database stores agent memory as a knowledge graph, a Python FastAPI backend handles ingestion and querying, and a React frontend provides visualization and interaction. The flow is: session logs → backend parses and ingests into HydraDB → frontend queries the graph and renders it with Cytoscape.js.

## Components

- **HydraDB** (Docker container) — Graph database storing sessions, turns, entities, facts, and their relationships. Provides OpenCypher queries and Bolt protocol access.
- **MinIO** (Docker container) — S3-compatible object storage backing HydraDB's storage layer.
- **FastAPI Backend** (Python) — REST API handling ingestion, querying, and graph data retrieval. Connects to HydraDB via Bolt protocol (Neo4j driver).
- **React Frontend** — Single-page app with file upload, Cytoscape.js graph visualization, query bar, and session timeline.

## Data model

```
(:Session {id: string, date: string, question_type: string})
  -[:CONTAINS]-> (:Turn {id: string, role: string, content: string, timestamp: string, has_answer: boolean})
  -[:MENTIONS]-> (:Entity {name: string, type: string})
  -[:CREATED]-> (:Fact {id: string, content: string, confidence: float, timestamp: string})

(:Fact)
  -[:CONTRADICTS]-> (:Fact)
  -[:SUPPORTS]-> (:Fact)
  -[:DERIVED_FROM]-> (:Turn)

(:Entity)
  -[:SAME_AS]-> (:Entity)
  -[:APPEARS_IN]-> (:Turn)
```

**Node types:**
- `Session` — One conversation session from the agent's history
- `Turn` — A single message (user or assistant) within a session
- `Entity` — A named entity extracted from session content (person, concept, preference)
- `Fact` — A piece of knowledge inferred from session content

**Edge types:**
- `CONTAINS` — Session → Turn (temporal ordering)
- `MENTIONS` — Session → Entity (entity appears in session)
- `CREATED` — Session → Fact (fact was established in this session)
- `CONTRADICTS` — Fact → Fact (two facts conflict)
- `SUPPORTS` — Fact → Fact (two facts agree)
- `DERIVED_FROM` — Fact → Turn (which turn produced this fact)
- `SAME_AS` — Entity → Entity (entity resolution: "Sam" = "Samuel")
- `APPEARS_IN` — Entity → Turn (entity mentioned in specific turn)

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Cytoscape.js | React for component model, Cytoscape.js purpose-built for graph visualization |
| Backend | Python + FastAPI | Fast to build, async support, Neo4j driver works with HydraDB's Bolt protocol |
| Graph DB | HydraDB (Docker) | Hackathon requirement, OpenCypher queries, graph-native storage on S3 |
| Object Storage | MinIO | S3-compatible, runs locally, backs HydraDB's storage layer |
| Sample Data | LongMemEval V1 JSON | Clean session format, ready to use, real benchmark data |

## Key decisions & trade-offs

- **Bolt protocol over HTTP API** — HydraDB exposes both. Bolt (port 7687) is the standard Neo4j protocol, so the Python `neo4j` driver works out of the box. HTTP API (port 8443) would require custom HTTP calls. Bolt is more ergonomic and better documented.
- **No auth** — Single-user local tool. Adds no value for a hackathon demo, adds complexity.
- **Cytoscape.js over D3** — D3 is more flexible but requires building graph rendering from scratch. Cytoscape.js has built-in layout algorithms, zoom/pan, and node interaction. Faster to build, good enough for this scope.
- **Local Docker Compose over cloud** — No cloud account needed, reproducible, instant demo on any machine. Trade-off: no live URL for judges, but a screen recording solves that.
- **LongMemEval as sample data** — Real benchmark dataset, clean JSON format, demonstrates the tool's value immediately. Trade-off: we don't control the data format, so ingestion may need adaptation.

## API surface

```
POST   /api/ingest          — Upload session logs, parse, ingest into HydraDB
GET    /api/graph            — Return graph data (nodes + edges) for visualization
POST   /api/query            — Natural language query → OpenCypher → graph results
GET    /api/sessions         — List all ingested sessions
GET    /api/sessions/{id}    — Get details for one session
GET    /api/conflicts        — Return all conflicting fact pairs
GET    /api/entities         — Return all entities with resolution info
```

## Open architectural questions

- [assumption: HydraDB's OpenCypher supports MATCH with variable-length paths for multi-hop traversal]
- [assumption: MinIO can run in Docker alongside HydraDB without port conflicts]
- [assumption: Cytoscape.js can render 500+ nodes without significant lag — may need to limit visible graph scope]
