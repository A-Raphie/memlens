# Demo Storyboard: MemLens

**Hackathon:** Hack Hydra 2026 · Track 3 (Agent Memory) · submit Aug 20 11:59 PM PT
**Time limit:** 3:00 · **Target:** ~2:30-2:50
**Judging criteria:** Technical execution · Use of HydraDB/graph-native · Product completeness & usability · Quality of results · Originality

**Setup:** Composite stage (wallpaper + floating Chrome window), drawn cursor overlay with click rings, no OS chrome. Local live stack: OrbStack + HydraDB (bolt 7687) + FastAPI :8010 + Vite :3000. Narration is read as voiceover in post.

| # | Time | Scene | Criterion | Show | Say (VO) | Action |
|---|------|-------|-----------|------|----------|--------|
| 1 | 0:00-0:12 | Hook: live graph | Product + HydraDB | /app full graph, ONLINE dot, telemetry SESSIONS 5 · TURNS 17 · ENTITIES 31 · FACTS 19 · EDGES 83 · CONTRADICTIONS 14 | "This is MemLens — a debugger for AI agent memory. Every node on this graph is live data in HydraDB, and it just found 14 contradictions in what this agent believes." | Let graph breathe, slow canvas pan |
| 2 | 0:12-0:26 | Problem | Originality | Landing hero (live metrics) → scroll to 01 / THE PROBLEM | "AI agents accumulate memory across sessions — and nobody audits it. Conflicting facts, stale beliefs, silent gaps. MemLens makes agent memory visible, queryable, and debuggable." | Smooth scroll to problem section |
| 3 | 0:26-0:58 | Live ingest | Product + Technical | /app → dropzone → upload data/demo_extra_sessions.json | "Upload a session log in LongMemEval format. MemLens parses every turn, extracts entities and facts, and writes a knowledge graph into HydraDB — sessions contain turns, turns mention entities, turns create facts." | Cursor-click dropzone, file uploads, counts tick UP, new contradiction appears |
| 4 | 0:58-1:24 | Inspect | Product + usability | Click amber Fact node → 04 INSPECT fills → click a connection to jump | "Click any node to inspect it. Facts link back to the turns that created them — walk the provenance chain of any belief." | Canvas node click via cy position, connection jump |
| 5 | 1:24-1:52 | Contradictions | Originality + Quality | 03 CONTRADICTIONS panel, click the NEW pair (negation-ranked first) | "This is why MemLens exists. It joins facts through shared entities and flags pairs where the agent contradicts itself — including the pair we just created. Click one to jump straight to the fact." | Scroll panel, click new pair, inspect updates |
| 6 | 1:52-2:20 | Query console | Technical + HydraDB | Type `Python` → results w/ confidence bars; then raw Cypher, chip flips CYPHER | "Ask in plain English — or drop to raw OpenCypher. The chip flips automatically; this is a real Cypher query hitting HydraDB over Bolt." | Visible typing, RUN, chip flip, raw rows |
| 7 | 2:20-2:36 | HydraDB proof | Use of HydraDB | Terminal overlay: real `docker compose ps` + `curl /api/stats` output | "HydraDB is doing real work — self-hosted from the OSS repo, Bolt on 7687. Every count is a live COUNT query. Without graph traversal, joining facts through shared entities is a multi-table mess." | Overlay holds with real output |
| 8 | 2:36-2:48 | Close | All | End card: memlens.vercel.app · github.com/A-Raphie/memlens | "MemLens — see what your agent remembers, forgets, and contradicts. Built for Hack Hydra, Track 3." | Links sit on screen |

## Checklist
- [ ] Live URL on screen: https://memlens.vercel.app (end card)
- [ ] GitHub on screen: https://github.com/A-Raphie/memlens (PUSH REPO BEFORE SUBMITTING)
- [ ] Real data only: all counts trace to live HydraDB
- [ ] No explorer/white-flash tabs (terminal overlay is styled, not raw browser JSON)
- [ ] Cursor overlay with click rings on every product interaction
