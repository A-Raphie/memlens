# MemLens — PRD

## Problem

Agent memory systems are black boxes. When an AI agent gives a wrong answer, developers can't see why — which sessions contributed the wrong fact, where knowledge conflicts exist, or how information flows across sessions. Today, debugging agent memory means reading raw JSON logs and guessing. There is no visual tool that lets you inspect, query, and understand what an agent "remembers."

This matters because agent memory failures are silent. A conflicting fact from session 3 silently contaminates session 7's answer, and nobody notices until the user complains. The cost is wrong outputs, lost trust, and hours of manual log reading.

## Personas

- **Primary: AI Engineer building agent memory** — They're implementing cross-session memory for an AI agent (chatbot, coding assistant, etc.) and need to verify the memory layer is working correctly. They need to trace a specific wrong answer back to its source, spot conflicting facts, and confirm entity resolution is accurate.
- **Secondary: AI Team Lead** — They manage a team building production agent systems. They need observability into what the agent remembers across users and sessions, to audit memory quality before it goes to production.
- **Tertiary: Curious Developer** — They want to understand how agent memory works under the hood. They want to upload sample data, explore the graph, and learn how cross-session knowledge flows.

## Jobs to be Done

1. When the agent gives a wrong answer, I want to trace which sessions and facts led to that answer, so I can fix the root cause.
2. When I suspect knowledge conflicts, I want to see all contradictory facts highlighted in the graph, so I can resolve them.
3. When I ingest new session data, I want to see the knowledge graph build in real time, so I can verify the ingestion pipeline is working.
4. When I query the agent's memory, I want to see the graph traversal path, so I understand why a particular answer was returned.
5. When I audit entity resolution, I want to see which entities were merged and why, so I can catch false merges.

## Scope (v1)

**In scope:**
- Ingest agent session logs (JSON format, role/content turns) into HydraDB as a knowledge graph
- Visualize the graph with Cytoscape.js (zoom, pan, click nodes for details)
- Query the graph with natural language or OpenCypher to trace knowledge chains
- Show temporal information (when facts were created/modified)
- Detect and highlight conflicting facts
- Entity resolution display (show merged entities)
- Local Docker Compose deployment (single machine, no cloud needed)
- No authentication (single-user local tool)

**Out of scope (v1):**
- Multi-user / team support
- Real-time streaming ingestion
- Authentication / authorization
- Cloud deployment
- Mobile responsive UI
- Custom dashboard / analytics
- Integration with specific agent frameworks (LangChain, CrewAI, etc.)
- Custom entity resolution algorithms (use HydraDB's built-in extraction)

## Success metrics

- **Functional:** Successfully ingest 50+ sessions from LongMemEval, visualize the graph, and return accurate query results
- **Demo:** 3-minute video shows complete flow: ingest → graph build → query → conflict detection
- **Judging:** Judges can clearly see why a graph DB is needed (not just a vector store) from the demo
- **Build:** Working Docker Compose setup that starts with one command

## Open questions

- [assumption: LongMemEval V1 JSON format is compatible with our ingestion pipeline — need to verify actual JSON structure]
- [assumption: HydraDB Docker image includes OpenCypher support — need to verify query syntax]
- [assumption: Cytoscape.js can handle graphs with 1000+ nodes performantly — may need to limit visible scope]
