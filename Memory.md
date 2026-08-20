# MemLens — Memory

Running log of decisions, conventions, and gotchas. Newest at the top.

## Decisions

- **2026-08-17** — Switched from react-scripts to Vite: react-scripts install was slow and heavy, Vite is faster to install and build.
- **2026-08-17** — Track 3 (Agent Memory) selected: strongest fit for graph-native demo, highest originality potential, buildable in 3 days.
- **2026-08-17** — Local Docker Compose deployment: no cloud needed, instant demo on any machine.
- **2026-08-17** — No auth: single-user local tool, adds no value for hackathon demo.
- **2026-08-17** — Bolt protocol over HTTP API: Neo4j Python driver works out of the box, more ergonomic.
- **2026-08-17** — Cytoscape.js over D3: purpose-built graph viz, faster to build, good enough for scope.
- **2026-08-17** — LongMemEval V1 as sample data: clean JSON, real benchmark, demonstrates value immediately.

## Conventions

- All API endpoints prefixed with `/api/`
- Graph nodes use labels: Session, Turn, Entity, Fact
- Graph edges use types: CONTAINS, MENTIONS, CREATED, CONTRADICTS, SUPPORTS, DERIVED_FROM, SAME_AS, APPEARS_IN
- Frontend uses dark theme for demo presentation

## Gotchas

- HydraDB is Rust-based, needs libcypher-parser + SuiteSparse GraphBLAS — Docker image should handle this
- There are two products called "HydraDB" — we're using the self-hosted OSS repo, not the hosted API
- LongMemEval JSON format needs verification before ingestion pipeline is finalized

## Things to not forget

- Submission deadline: Aug 20, 2026 at 11:59 PM PT
- Demo video must be ≤ 3 minutes
- GitHub repo must be public with clear README
- No participant-authored commits before Aug 12, 2026
