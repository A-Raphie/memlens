import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import { TOKENS } from "./tokens";

const CYTOSCAPE_STYLE = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
      color: TOKENS.text,
      "font-size": "10px",
      "font-family": "Inter",
      "text-outline-color": TOKENS.bg,
      "text-outline-width": 2,
      width: 30,
      height: 30,
      "border-width": 2,
      "border-color": TOKENS.border,
    },
  },
  {
    selector: 'node[type="Session"]',
    style: {
      "background-color": TOKENS.nodeSession,
      width: 42,
      height: 42,
      "font-weight": "bold",
      "font-size": "11px",
    },
  },
  {
    selector: 'node[type="Turn"]',
    style: { "background-color": TOKENS.nodeTurn, width: 24, height: 24 },
  },
  {
    selector: 'node[type="Entity"]',
    style: {
      "background-color": TOKENS.accent,
      width: 28,
      height: 28,
      shape: "diamond",
    },
  },
  {
    selector: 'node[type="Fact"]',
    style: {
      "background-color": TOKENS.statusPending,
      width: 26,
      height: 26,
      shape: "roundrectangle",
    },
  },
  {
    selector: "edge",
    style: {
      width: 1.5,
      "line-color": "rgba(255,255,255,0.1)",
      "target-arrow-color": "rgba(255,255,255,0.1)",
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.8,
      "curve-style": "bezier",
      label: "data(relationship)",
      "font-size": "8px",
      color: TOKENS.textDim,
      "text-rotation": "autorotate",
      "font-family": "IBM Plex Mono",
    },
  },
  {
    selector: 'edge[relationship="CONTRADICTS"]',
    style: {
      "line-color": TOKENS.statusError,
      "target-arrow-color": TOKENS.statusError,
      width: 2.5,
      "line-style": "dashed",
    },
  },
  {
    selector: 'edge[relationship="SUPPORTS"]',
    style: {
      "line-color": TOKENS.accentEdge,
      "target-arrow-color": TOKENS.accentEdge,
      width: 2,
    },
  },
  {
    selector: "node:selected",
    style: {
      "border-width": 3,
      "border-color": TOKENS.accent,
      "background-color": TOKENS.accentHover,
    },
  },
  {
    selector: ".highlighted",
    style: {
      "border-width": 3,
      "border-color": TOKENS.statusPending,
    },
  },
];

const LAYOUT = {
  name: "cose",
  animate: true,
  animationDuration: 800,
  nodeRepulsion: 8000,
  idealEdgeLength: 120,
  edgeElasticity: 0.1,
  gravity: 0.3,
  numIter: 500,
  padding: 40,
};

function buildElements(data) {
  // Drop edges whose endpoints are missing — Cytoscape throws on
  // dangling refs and would blank the whole app.
  const ids = new Set(data.nodes.map((n) => n.data.id));
  const edges = data.edges.filter(
    (e) => ids.has(e.data.source) && ids.has(e.data.target)
  );
  return [...data.nodes, ...edges];
}

export default function GraphView({ graphData, nodeColors, onSelectNode }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (graphData.nodes.length === 0) {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      return;
    }

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: buildElements(graphData),
      style: CYTOSCAPE_STYLE,
      layout: LAYOUT,
      minZoom: 0.2,
      maxZoom: 3,
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      onSelectNode({
        id: node.id(),
        type: node.data("type"),
        label: node.data("label"),
        edges: node.connectedEdges().map((e) => ({
          relationship: e.data("relationship"),
          target: e.target().id(),
          source: e.source().id(),
        })),
      });
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        onSelectNode(null);
      }
    });

    cyRef.current = cy;
    window.__cy = cy; // exposed for the demo recorder to locate node positions

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      window.__cy = null;
    };
  }, [graphData, onSelectNode]);

  if (graphData.nodes.length === 0) {
    return (
      <div className="graph-empty">
        <div className="graph-empty-icon">&#9670;</div>
        <div className="graph-empty-text">Upload session logs to build the knowledge graph</div>
        <div className="graph-empty-steps">
          <span><b>01</b> UPLOAD &middot; LongMemEval JSON</span>
          <span><b>02</b> GRAPH &middot; sessions &rarr; turns &rarr; entities &rarr; facts</span>
          <span><b>03</b> QUERY &middot; facts &middot; conflicts &middot; gaps</span>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="graph-canvas" />;
}
