# MemLens — Handoff

Read this first if you're picking up the project.

## Current state

Full codebase built. Backend (FastAPI) and frontend (React + Vite + Cytoscape.js) are complete. Docker Compose configured. Backend verified — health endpoint returns 200. Ingestion pipeline correctly tries to connect to HydraDB (needs Docker running). Frontend builds successfully. Ready for demo recording.

## What's done

- [x] Project idea finalized: MemLens — Agent Memory Debugger
- [x] Track selected: Track 3 (Agent Memory)
- [x] Tech stack decided: Python FastAPI + React + Cytoscape.js + HydraDB + MinIO
- [x] Spec files created: PRD.md, Architecture.md, Tasks.md, Memory.md, Handoff.md
- [x] Docker Compose with HydraDB + MinIO
- [x] Backend: FastAPI app with ingest, graph, query, sessions, conflicts, entities endpoints
- [x] Frontend: React + Vite + Cytoscape.js graph visualization + upload + query bar + sidebar
- [x] Ingestion pipeline: parses LongMemEval JSON, creates Session/Turn/Entity/Fact nodes
- [x] Sample data: 5 session examples covering different memory types
- [x] README with setup instructions
- [x] Backend health endpoint verified (200 OK)
- [x] Frontend builds successfully

## In progress

- [~] Need HydraDB Docker running to test full ingest → graph → query flow

## Blocked / waiting

- None currently

## How to run it

Not runnable yet. Once Docker Compose is set up:

```bash
cd /Users/raphie/Documents/memlens
docker compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# HydraDB: bolt://localhost:7687
# MinIO: http://localhost:9000
```

## Next steps

1. Create project directory structure
2. Write docker-compose.yml with HydraDB + MinIO
3. Verify HydraDB starts and accepts connections
4. Download LongMemEval V1 sample data
5. Begin Phase 1: FastAPI backend + ingestion pipeline

## Open questions

- Does HydraDB Docker image include OpenCypher support out of the box?
- What's the exact JSON structure of LongMemEval V1?
- Can Cytoscape.js handle 500+ nodes without lag?

## Pointers

- Spec: [PRD.md](./PRD.md) · [Architecture.md](./Architecture.md)
- Plan: [Tasks.md](./Tasks.md)
- History: [Memory.md](./Memory.md)
