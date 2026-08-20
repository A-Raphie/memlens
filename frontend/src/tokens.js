// Single source of truth for JS-side design tokens.
// Mirrors the :root block in App.css — update both together.
// Palette verified from hackhydra.hydradb.com production CSS (sponsor brand):
// emerald #10b981 on pure black + zinc neutrals.

export const TOKENS = {
  bg: "#000000",
  surface: "#0a0a0b",
  surface2: "#18181b",
  border: "#27272a",
  text: "#fafafa",
  textDim: "#71717a",
  accent: "#10b981",
  accentHover: "#34d399",
  accentEdge: "rgba(16, 185, 129, 0.4)",
  statusPending: "#f59e0b",
  statusError: "#fb7185",
  nodeSession: "#7c6cff",
  nodeTurn: "#3b82f6",
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'IBM Plex Mono', 'SF Mono', monospace",
};

export const NODE_COLORS = {
  Session: TOKENS.nodeSession,
  Turn: TOKENS.nodeTurn,
  Entity: TOKENS.accent,
  Fact: TOKENS.statusPending,
};

export const RESULT_COLORS = {
  Fact: TOKENS.statusPending,
  Entity: TOKENS.accent,
  Session: TOKENS.nodeSession,
  Turn: TOKENS.nodeTurn,
  cypher: "#a1a1aa",
  error: TOKENS.statusError,
};

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Queries starting with these words are sent as raw OpenCypher instead of
// natural language. Shared by the query console (mode chip) and App (submit).
export const CYPHER_RE = /^\s*(MATCH|RETURN|WHERE|WITH|CREATE|MERGE|UNWIND|CALL|OPTIONAL)\b/i;
