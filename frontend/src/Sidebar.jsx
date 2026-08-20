import React, { useEffect, useState } from "react";
import { API_URL, RESULT_COLORS, TOKENS } from "./tokens";

const NODE_BADGE_CLASS = {
  Session: "node-badge node-badge--session",
  Turn: "node-badge node-badge--turn",
  Entity: "node-badge node-badge--entity",
  Fact: "node-badge node-badge--fact",
};

function SessionList({ sessions }) {
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetch(`${API_URL}/api/sessions/${encodeURIComponent(selectedId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((d) => { if (!cancelled) setDetail(d); })
      .catch(() => { if (!cancelled) setDetail(null); });
    return () => { cancelled = true; };
  }, [selectedId]);

  if (sessions.length === 0) {
    return <div className="empty-state">No sessions ingested yet</div>;
  }

  const factSample = (detail?.facts || []).filter((f) => f?.content).slice(0, 3);

  return (
    <div className="session-list">
      {sessions.map((s) => (
        <div
          key={s.id}
          className={`session-item ${selectedId === s.id ? "session-item--active" : ""}`}
          onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
        >
          <span className="session-id">{s.key || s.id}</span>
          <span className="session-meta">{s.date}</span>
        </div>
      ))}
      {selectedId && detail && (
        <div className="session-detail">
          <div className="session-detail-row">
            <span className="session-detail-label">TURNS</span>
            <span className="session-detail-value">{detail.turns?.length ?? 0}</span>
          </div>
          <div className="session-detail-row">
            <span className="session-detail-label">FACTS</span>
            <span className="session-detail-value">{detail.facts?.length ?? 0}</span>
          </div>
          <div className="session-detail-row">
            <span className="session-detail-label">ENTITIES</span>
            <span className="session-detail-value">{detail.entities?.length ?? 0}</span>
          </div>
          {factSample.length > 0 && (
            <div className="session-detail-facts">
              {factSample.map((f, i) => (
                <div key={i}>&bull; {f.content}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConflictList({ conflicts, graphData, onSelectNode }) {
  if (conflicts.length === 0) {
    return <div className="empty-state">No contradictions detected</div>;
  }

  const jumpTo = (factId) => {
    const node = graphData.nodes.find((n) => n.data.id === String(factId));
    if (node) {
      onSelectNode({
        id: node.data.id,
        type: node.data.type,
        label: node.data.label,
        edges: [],
      });
    }
  };

  return (
    <>
      {conflicts.map((c, i) => (
        <div key={i} className="conflict-card" onClick={() => jumpTo(c.fact1_id)}>
          <div className="conflict-line">{c.fact1}</div>
          <div className="conflict-vs">CONTRADICTS</div>
          <div className="conflict-line">{c.fact2}</div>
        </div>
      ))}
    </>
  );
}

export default function Sidebar({
  sessions,
  conflicts,
  selectedNode,
  graphData,
  queryResults,
  onSelectNode,
}) {
  return (
    <>
      {/* Sessions */}
      <div className="sidebar-section">
        <div className="section-header">
          <span className="section-num">02</span>
          <span className="section-title">Sessions</span>
        </div>
        <SessionList sessions={sessions} />
      </div>

      {/* Contradictions */}
      <div className="sidebar-section">
        <div className="section-header">
          <span className="section-num">03</span>
          <span className="section-title">Contradictions</span>
          {conflicts.length > 0 && (
            <span className="conflict-count">{conflicts.length}</span>
          )}
        </div>
        <ConflictList
          conflicts={conflicts}
          graphData={graphData}
          onSelectNode={onSelectNode}
        />
      </div>

      {/* Selected node */}
      <div className="sidebar-section">
        <div className="section-header">
          <span className="section-num">04</span>
          <span className="section-title">Inspect</span>
        </div>
        {selectedNode ? (
          <div className="node-card">
            <div className={NODE_BADGE_CLASS[selectedNode.type] || "node-badge"}>
              {selectedNode.type}
            </div>
            <div className="node-label">{selectedNode.label}</div>
            {selectedNode.edges?.length > 0 && (
              <>
                <div className="node-connections-header">
                  Connections ({selectedNode.edges.length})
                </div>
                <div className="edge-list">
                  {selectedNode.edges.slice(0, 10).map((edge, i) => (
                    <div key={i} className="edge-item">
                      <span className="edge-rel">{edge.relationship}</span>
                      <span className="edge-arrow">&rarr;</span>
                      <span
                        className="edge-target"
                        onClick={() => {
                          const nodeId =
                            edge.target === selectedNode.id ? edge.source : edge.target;
                          const node = graphData.nodes.find(
                            (n) => n.data.id === nodeId
                          );
                          if (node) {
                            onSelectNode({
                              id: node.data.id,
                              type: node.data.type,
                              label: node.data.label,
                              edges: [],
                            });
                          }
                        }}
                      >
                        {edge.target === selectedNode.id ? edge.source : edge.target}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="empty-state">
            Click a node in the graph to inspect it
          </div>
        )}
      </div>

      {/* Query results */}
      <div className="sidebar-section">
        <div className="section-header">
          <span className="section-num">05</span>
          <span className="section-title">Results</span>
        </div>
        {queryResults && queryResults.length > 0 ? (
          <>
            <div className="result-count">
              {queryResults.length} result{queryResults.length !== 1 ? "s" : ""}
            </div>
            {queryResults.map((r, i) => {
              const color = RESULT_COLORS[r.type] || TOKENS.textDim;
              return (
                <div
                  key={i}
                  className={`result-card ${r.type === "error" ? "result-card--error" : ""}`}
                >
                  <div className="result-type">
                    <span className="result-type-dot" style={{ background: color }} />
                    <span style={{ color }}>{r.type || "Result"}</span>
                  </div>
                  <div className="result-content">{r.content}</div>
                  {r.confidence !== undefined && r.type !== "error" && r.type !== "cypher" && (
                    <div className="result-confidence">
                      <span className="result-confidence-label">
                        CONFIDENCE {(r.confidence * 100).toFixed(0)}%
                      </span>
                      <div className="confidence-track">
                        <div
                          className={`confidence-fill ${
                            r.confidence >= 0.7
                              ? ""
                              : r.confidence >= 0.4
                              ? "confidence-fill--mid"
                              : "confidence-fill--low"
                          }`}
                          style={{ width: `${Math.max(2, Math.round(r.confidence * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : queryResults && queryResults.length === 0 ? (
          <div className="empty-state">No results found</div>
        ) : (
          <div className="empty-state">
            Run a query to see results here
          </div>
        )}
      </div>
    </>
  );
}
