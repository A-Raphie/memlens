import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "./tokens";

const STEPS = [
  {
    num: "01",
    title: "Upload",
    desc: "Drop your agent session logs into MemLens. JSON format, any length.",
    icon: "▲",
  },
  {
    num: "02",
    title: "Graph",
    desc: "Sessions are parsed into a knowledge graph stored in HydraDB. Nodes for sessions, turns, entities, and facts.",
    icon: "◈",
  },
  {
    num: "03",
    title: "Query",
    desc: "Ask natural-language questions about your agent's memory. Find contradictions, gaps, and stale beliefs.",
    icon: "◉",
  },
  {
    num: "04",
    title: "Fix",
    desc: "Pinpoint exactly which turns introduced conflicting facts. Debug memory drift before it reaches production.",
    icon: "✦",
  },
];

const STACK = [
  { name: "HydraDB", role: "Graph database", note: "Bolt protocol, OpenCypher" },
  { name: "FastAPI", role: "REST API", note: "Python 3.11, async" },
  { name: "React", role: "Frontend", note: "Vite, Cytoscape.js" },
  { name: "Docker", role: "Infrastructure", note: "4-service compose" },
];

function useLiveStats() {
  const [stats, setStats] = useState(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(`${API_URL}/api/stats`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("unavailable"))))
        .then((d) => {
          if (!cancelled) {
            setStats(d);
            setOnline(true);
          }
        })
        .catch(() => {
          if (!cancelled) setOnline(false);
        });
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { stats, online };
}

export default function Landing() {
  const { stats, online } = useLiveStats();
  const nodeCount = stats
    ? Object.values(stats.nodes || {}).reduce((a, b) => a + b, 0)
    : null;
  return (
    <div className="landing">
      {/* ---- Hero ---- */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-badge">Hack Hydra &middot; Track 3</div>
          <h1 className="landing-title">
            <span className="landing-title-accent">MemLens</span>
            <span className="landing-title-sub">Agent Memory Debugger</span>
          </h1>
          <p className="landing-tagline">
            See what your agent remembers, forgets, and contradicts.
            <br />
            Upload session logs. Build a knowledge graph. Query the truth.
          </p>
          {stats && (
            <div className="landing-hero-metrics">
              <div className="landing-metric">
                <span className="landing-metric-value">
                  {nodeCount !== null ? nodeCount.toLocaleString() : "\u2014"}
                </span>
                <span className="landing-metric-label">GRAPH NODES</span>
              </div>
              <div className="landing-metric">
                <span className="landing-metric-value">
                  {(stats.edges ?? 0).toLocaleString()}
                </span>
                <span className="landing-metric-label">EDGES MAPPED</span>
              </div>
              <div className="landing-metric">
                <span className={`landing-metric-value ${stats.conflicts > 0 ? "landing-metric-value--warn" : ""}`}>
                  {stats.conflicts.toLocaleString()}
                </span>
                <span className="landing-metric-label">CONTRADICTIONS</span>
              </div>
            </div>
          )}
          <div className="landing-actions">
            <Link to="/app" className="landing-btn landing-btn--primary">
              Launch Debugger
            </Link>
            <a href="#how-it-works" className="landing-btn landing-btn--ghost">
              How It Works
            </a>
          </div>

          <div className="landing-code-block">
            <div className="landing-code-header">
              <span className="landing-code-dot" />
              <span className="landing-code-dot" />
              <span className="landing-code-dot" />
              <span className="landing-code-file">query.cypher</span>
            </div>
            <pre className="landing-code-pre"><code><span className="code-keyword">MATCH</span> (s:Session)-[:CONTAINS]&#x3E;(t:Turn)
       -[:MENTIONS]&#x3E;(e:Entity)-[:HAS_FACT]&#x3E;(f:Fact)
<span className="code-keyword">WHERE</span> f.content <span className="code-keyword">CONTAINS</span> <span className="code-string">'restaurant'</span>
<span className="code-keyword">RETURN</span> e.name, f.content, f.confidence
<span className="code-keyword">ORDER BY</span> f.confidence <span className="code-keyword">DESC</span></code></pre>
          </div>
        </div>
        <div className="landing-hero-glow" />
      </section>

      {/* ---- Live data panel ---- */}
      <section className="landing-section landing-section--alt landing-section--panel">
        <div className="landing-section-inner">
          <div className="landing-panel">
            <div className="landing-panel-row">
              <span className="landing-panel-label">GRAPH_STATUS</span>
              <span
                className={`landing-panel-value ${online ? "" : "landing-panel-value--error"}`}
              >
                {online ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
            <div className="landing-panel-row">
              <span className="landing-panel-label">SESSIONS</span>
              <span className="landing-panel-value">
                {stats ? (stats.nodes?.Session ?? 0).toLocaleString() : "\u2014"}
              </span>
            </div>
            <div className="landing-panel-row">
              <span className="landing-panel-label">NODES</span>
              <span className="landing-panel-value">
                {nodeCount !== null ? nodeCount.toLocaleString() : "\u2014"}
              </span>
            </div>
            <div className="landing-panel-row">
              <span className="landing-panel-label">EDGES</span>
              <span className="landing-panel-value">
                {stats ? (stats.edges ?? 0).toLocaleString() : "\u2014"}
              </span>
            </div>
            <div className="landing-panel-row">
              <span className="landing-panel-label">CONTRADICTIONS</span>
              <span
                className={`landing-panel-value ${
                  stats && stats.conflicts > 0 ? "landing-panel-value--warn" : ""
                }`}
              >
                {stats ? stats.conflicts.toLocaleString() : "\u2014"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- 01 / About ---- */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-num">01 /</span>
            <span className="landing-section-label">The Problem</span>
          </div>
          <h2 className="landing-section-title">
            AI agents accumulate memory across sessions.
            <br />
            Nobody audits it.
          </h2>
          <p className="landing-section-body">
            Agents learn from conversations, tools, and feedback. Over time they
            pick up conflicting facts, stale beliefs, and silent gaps. By the
            time a user notices something is wrong, the root cause is buried
            across hundreds of turns. MemLens makes agent memory visible,
            queryable, and debuggable.
          </p>
        </div>
      </section>

      {/* ---- 02 / How It Works ---- */}
      <section id="how-it-works" className="landing-section landing-section--alt">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-num">02 /</span>
            <span className="landing-section-label">How It Works</span>
          </div>
          <div className="landing-steps">
            {STEPS.map((step) => (
              <div key={step.num} className="landing-step">
                <div className="landing-step-icon">{step.icon}</div>
                <div className="landing-step-num">{step.num}</div>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 03 / Tech Stack ---- */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-num">03 /</span>
            <span className="landing-section-label">Tech Stack</span>
          </div>
          <div className="landing-stack">
            {STACK.map((item) => (
              <div key={item.name} className="landing-stack-item">
                <div className="landing-stack-name">{item.name}</div>
                <div className="landing-stack-role">{item.role}</div>
                <div className="landing-stack-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="landing-section landing-section--cta">
        <div className="landing-section-inner landing-cta-inner">
          <h2 className="landing-cta-title">Ready to see inside your agent?</h2>
          <p className="landing-cta-body">
            Upload a session log and explore the knowledge graph in under a minute.
          </p>
          <Link to="/app" className="landing-btn landing-btn--primary landing-btn--lg">
            Launch MemLens
          </Link>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span className="landing-footer-brand">MemLens</span>
          <span className="landing-footer-sep">&middot;</span>
          <span className="landing-footer-text">
            Built for Hack Hydra 2026 · Track 3 · Agent Memory
          </span>
        </div>
      </footer>
    </div>
  );
}
