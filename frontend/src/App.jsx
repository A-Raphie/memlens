import React, { useState, useCallback, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import GraphView from "./GraphView";
import QueryBar from "./QueryBar";
import Sidebar from "./Sidebar";
import UploadPanel from "./UploadPanel";
import Landing from "./Landing";
import { NODE_COLORS, API_URL, CYPHER_RE } from "./tokens";
import "./App.css";

const STRIP_LABELS = {
  Session: "SESSIONS",
  Turn: "TURNS",
  Entity: "ENTITIES",
  Fact: "FACTS",
};

function Debugger() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [queryResults, setQueryResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [online, setOnline] = useState(false);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/graph?limit=500`);
      const data = await res.json();
      setGraphData(data);
    } catch (err) {
      setStatus(`Error fetching graph: ${err.message}`);
    }
  }, []);

  const fetchTelemetry = useCallback(async () => {
    try {
      const [statsRes, sessionsRes, conflictsRes] = await Promise.all([
        fetch(`${API_URL}/api/stats`),
        fetch(`${API_URL}/api/sessions`),
        fetch(`${API_URL}/api/conflicts`),
      ]);
      if (!statsRes.ok) throw new Error("stats unavailable");
      setStats(await statsRes.json());
      setSessions((await sessionsRes.json()).sessions || []);
      setConflicts((await conflictsRes.json()).conflicts || []);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
    fetchTelemetry();
    // Self-healing refresh: a transient backend restart heals within one
    // interval instead of leaving an empty graph for the whole session.
    const id = setInterval(() => {
      fetchGraph();
      fetchTelemetry();
    }, 15000);
    return () => clearInterval(id);
  }, [fetchGraph, fetchTelemetry]);

  const handleUpload = async (file) => {
    setUploading(true);
    setStatus("Ingesting sessions...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/ingest`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setStatus(`Ingested ${data.questions_ingested} sessions \u00b7 ${data.queries_executed} graph writes`);
      if (data.errors?.length) {
        setStatus((s) => `${s} \u00b7 ${data.errors.length} errors`);
      }
      await Promise.all([fetchGraph(), fetchTelemetry()]);
    } catch (err) {
      setStatus(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async (query) => {
    const queryType = CYPHER_RE.test(query) ? "cypher" : "natural";
    try {
      const res = await fetch(`${API_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, query_type: queryType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || res.statusText);
      const rows = (data.results || []).map((r) => {
        if (r && r.content !== undefined) return r;
        const parts = Object.entries(r).map(([k, v]) => `${k}: ${v}`);
        return { content: parts.join(" \u00b7 "), type: "cypher" };
      });
      setQueryResults(rows);
    } catch (err) {
      setQueryResults([{ content: `Error: ${err.message}`, type: "error" }]);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <div className="header-brand">
          <Link to="/" className="header-logo">
            MemLens
          </Link>
          <span className="header-sep">&middot;</span>
          <span className="header-subtitle">Agent Memory Debugger</span>
        </div>
        <div className="header-right">
          <div className={`header-status ${online ? "" : "header-status--offline"}`}>
            <span className="header-status-dot" />
            HYDRADB&nbsp;&nbsp;{online ? "ONLINE" : "OFFLINE"}
          </div>
          <div className="header-badge">Hack Hydra &middot; Track 3</div>
        </div>
      </div>

      <div className="stats">
        <div className={`stats-live ${online ? "" : "stats-live--offline"}`}>
          <span className="stats-live-dot" />
          {online ? "LIVE" : "OFFLINE"}
        </div>
        <span className="stats-sep">/</span>
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="stats-item">
            <span className="stats-dot" style={{ background: color }} />
            <span>{STRIP_LABELS[type]}</span>
            <span className="stats-count">{stats?.nodes?.[type] ?? 0}</span>
          </div>
        ))}
        <div className="stats-item">
          <span className="stats-dot stats-dot--edge" />
          <span>EDGES</span>
          <span className="stats-count">{stats?.edges ?? graphData.edges.length}</span>
        </div>
        <div className="stats-item stats-item--warn">
          <span className="stats-dot stats-dot--warn" />
          <span>CONTRADICTIONS</span>
          <span className="stats-count">{stats?.conflicts ?? conflicts.length}</span>
        </div>
        {status && <div className="stats-status">{status}</div>}
      </div>

      <div className="main">
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="section-header">
              <span className="section-num">01</span>
              <span className="section-title">Ingest</span>
            </div>
            <UploadPanel onUpload={handleUpload} uploading={uploading} />
          </div>

          <Sidebar
            sessions={sessions}
            conflicts={conflicts}
            selectedNode={selectedNode}
            graphData={graphData}
            queryResults={queryResults}
            onSelectNode={setSelectedNode}
          />
        </div>

        <div className="graph-area">
          <GraphView
            graphData={graphData}
            nodeColors={NODE_COLORS}
            onSelectNode={setSelectedNode}
          />
          <div className="query-bar">
            <QueryBar onQuery={handleQuery} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Debugger />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
