# MemLens — Tasks

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

## Phase 0 — Foundations
- [ ] Set up project directory structure (backend/, frontend/, docker-compose.yml)
- [ ] Create Docker Compose with HydraDB + MinIO containers
- [ ] Verify HydraDB starts and accepts Bolt protocol connections
- [ ] Download LongMemEval V1 sample data (JSON)
- [ ] Verify sample data format and plan ingestion schema

## Phase 1 — MVP (Ingest + Visualize)
- [ ] Build FastAPI skeleton with health endpoint
- [ ] Implement HydraDB connection via Neo4j driver (Bolt protocol)
- [ ] Write ingestion pipeline: parse session JSON → create Session/Turn nodes via OpenCypher
- [ ] Write entity extraction: extract entities from turn content → create Entity nodes + MENTIONS edges
- [ ] Write fact extraction: infer facts from turns → create Fact nodes + CREATED/DERIVED_FROM edges
- [ ] Implement POST /api/ingest endpoint (accept JSON, run pipeline, return status)
- [ ] Implement GET /api/graph endpoint (return all nodes + edges for Cytoscape.js)
- [ ] Scaffold React app with Cytoscape.js graph component
- [ ] Implement file upload → POST /api/ingest → refresh graph flow
- [ ] Implement graph rendering: nodes colored by type, edges styled by relationship

## Phase 2 — Query + Conflict Detection
- [ ] Implement POST /api/query endpoint (natural language → OpenCypher → results)
- [ ] Build query bar in frontend (text input → send query → highlight results on graph)
- [ ] Implement conflict detection: find Fact pairs with CONTRADICTS edges
- [ ] Implement GET /api/conflicts endpoint
- [ ] Add conflict highlighting to graph (red edges, pulsing nodes)
- [ ] Implement entity resolution view: show SAME_AS clusters

## Phase 3 — Polish + Demo
- [ ] Add session timeline view (sessions arranged chronologically)
- [ ] Add node detail sidebar (click node → show properties, connections)
- [ ] Style the UI (dark theme, clean layout)
- [ ] Record 3-minute demo video
- [ ] Write README.md with setup instructions
- [ ] Final testing: ingest → query → visualize full flow

## Dependencies

- Phase 1 depends on Phase 0 (Docker must work before backend)
- Phase 2 depends on Phase 1 (ingestion must work before querying)
- Phase 3 depends on Phase 2 (querying must work before polish)

## Done = Shipped

A working Docker Compose setup that:
1. Starts HydraDB + MinIO + backend + frontend with one command
2. Lets you upload LongMemEval session logs
3. Builds and displays a knowledge graph
4. Lets you query the graph and see results highlighted
5. Shows conflicting facts
6. Has a 3-minute demo video ready for submission
