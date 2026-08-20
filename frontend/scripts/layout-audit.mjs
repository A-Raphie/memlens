// Deterministic layout audit (deterministic-design design-spatial):
// measure real geometry of major regions, compute horizontal balance
// of visual mass and alignment consistency. Numbers, not vibes.
import { chromium } from "playwright-core";

const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(process.argv[2], { waitUntil: "networkidle", timeout: 30000 });
await p.waitForTimeout(parseInt(process.argv[3] || "5000", 10));

const audit = await p.evaluate(() => {
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const vw = window.innerWidth;
  const regions = {};
  for (const [name, sel] of Object.entries({
    header: ".header", strip: ".stats", sidebar: ".sidebar",
    graph: ".graph-area", query: ".query-bar", hero: ".landing-hero-inner",
    sectionInner: ".landing-section-inner", footer: ".landing-footer-inner",
  })) {
    const bb = box(sel);
    if (bb) regions[name] = bb;
  }
  // Horizontal centroid of visual mass (area-weighted) for the main content row
  const mass = Object.entries(regions).map(([n, r]) => ({ n, cx: r.x + r.w / 2, area: r.w * r.h }));
  const totalArea = mass.reduce((a, m) => a + m.area, 0);
  const centroidX = mass.reduce((a, m) => a + m.cx * m.area, 0) / totalArea;
  const out = { viewport: vw, regions, centroidX, centerDeltaPct: +(((centroidX - vw / 2) / vw) * 100).toFixed(2) };
  // landing: check all section inners share x/width (alignment oracle)
  const inners = [...document.querySelectorAll(".landing-section-inner")].map((el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), w: Math.round(r.width) };
  });
  if (inners.length) {
    out.sectionInners = inners;
    out.aligned = inners.every((i) => i.x === inners[0].x && i.w === inners[0].w);
  }
  // debugger: sidebar fraction vs graph fraction
  if (regions.sidebar && regions.graph) {
    const contentW = regions.sidebar.w + regions.graph.w;
    out.sidebarPct = +((regions.sidebar.w / contentW) * 100).toFixed(1);
    out.graphPct = +((regions.graph.w / contentW) * 100).toFixed(1);
  }
  return out;
});
console.log(JSON.stringify(audit, null, 1));
await b.close();
