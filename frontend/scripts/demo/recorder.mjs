// MemLens demo recorder — composite stage + cursor overlay, per demo-video skill.
// Scenes follow ../demo-video/STORYBOARD.md. No secrets; all data is live.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");
const { mountStage } = require("./stage.cjs");
const { injectCursor, moveCursor, clickCursor } = require("./cursor.cjs");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = "http://127.0.0.1:3000";
const API = "http://127.0.0.1:8010";
const VID_DIR = "/tmp/memlens-demo-vid";
const ORB = "/Applications/OrbStack.app/Contents/MacOS/xbin";

// Fresh session ids per run so every recording visibly ingests NEW data
// (re-ingesting the same ids would be a MERGE no-op and nothing would move).
const RUN = Date.now().toString(36);
const DEMO_FILE = `/tmp/memlens-demo-live-${RUN}.json`;
fs.writeFileSync(DEMO_FILE, JSON.stringify({
  questions: [
    {
      question_id: `live_${RUN}_1`,
      question_date: "2026-08-18",
      question_type: "single-session-user",
      haystack_sessions: [[
        { role: "user", content: "Actually I switched everything off Render. I do not like Render anymore, deployment kept failing. Vercel handles all my deploys now." },
        { role: "assistant", content: "Got it. Your deploys now run on Vercel and you've moved away from Render after the failures." },
      ]],
    },
    {
      question_id: `live_${RUN}_2`,
      question_date: "2026-08-18",
      question_type: "single-session-user",
      haystack_sessions: [[
        { role: "user", content: "Also I stopped using Python for new pipelines. I prefer Go now for data pipelines, the concurrency is better." },
        { role: "assistant", content: "Understood. New data pipelines are written in Go; you've moved away from Python for that." },
      ]],
    },
  ],
}, null, 2));

const t0 = Date.now();
const mark = (name) => console.log(`[marker] ${name} ${((Date.now() - t0) / 1000).toFixed(2)}`);
const hold = (ms) => page.waitForTimeout(ms);

let page;

async function navFrameto(url, waitMs = 4000) {
  await page.evaluate((u) => { document.getElementById("__app").src = u; }, url);
  await page.waitForTimeout(waitMs);
  return page.frameLocator("#__app");
}

async function canvasClickAt(frame, selectorExpr) {
  // Click a Cytoscape node: renderedPosition is relative to the cy container,
  // so add the container's offset inside the iframe, then the iframe's offset
  // in the stage page.
  const pos = await frame.locator(":root").evaluate((_, expr) => {
    const cy = window.__cy;
    if (!cy) return null;
    let node = cy.nodes(expr)[0];
    if (!node) node = cy.nodes()[0];
    const p = node.renderedPosition();
    const r = cy.container().getBoundingClientRect();
    return { x: r.x + p.x, y: r.y + p.y };
  }, selectorExpr);
  const box = await page.locator("#__app").boundingBox();
  const x = box.x + pos.x;
  const y = box.y + pos.y;
  await moveCursor(page, x, y, 18);
  await page.waitForTimeout(250);
  await page.evaluate(() => window.__demoClick && window.__demoClick());
  await page.mouse.click(x, y);
}

async function typeSlow(text, delay = 65) {
  await page.keyboard.type(text, { delay });
}

async function showOverlay(html) {
  await page.evaluate((h) => {
    document.getElementById("__overlay")?.remove();
    const win = document.getElementById("__win");
    const el = document.createElement("div");
    el.id = "__overlay";
    el.style.cssText = "position:absolute;inset:0;z-index:30;background:#000";
    el.innerHTML = h;
    win.style.position = "relative";
    win.appendChild(el);
  }, html);
}

const terminalHtml = (stats, composeOut) => `
  <div style="position:absolute;inset:0;background:#161618;display:flex;align-items:center;justify-content:center">
    <div style="width:82%;background:#1d1f21;border-radius:10px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.55)">
      <div style="height:36px;background:#2d2f32;display:flex;align-items:center;gap:8px;padding:0 12px">
        <span style="width:11px;height:11px;border-radius:50%;background:#ff5f57"></span>
        <span style="width:11px;height:11px;border-radius:50%;background:#febc2e"></span>
        <span style="width:11px;height:11px;border-radius:50%;background:#28c840"></span>
        <span style="color:#9aa0a8;font:12px -apple-system;padding-left:8px">raphie@mac — zsh — memlens</span>
      </div>
      <pre style="margin:0;padding:18px 22px;font:12.5px/1.75 'IBM Plex Mono',monospace;color:#d6d9e0;text-align:left">$ <span style="color:#34d399">docker compose ps</span>
${composeOut}
$ <span style="color:#34d399">curl -s ${API}/api/stats</span>
${stats}</pre>
    </div>
  </div>`;

const endCardHtml = `
  <div style="position:absolute;inset:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px">
    <div style="font:800 64px/1 Inter,-apple-system,sans-serif;letter-spacing:-2.5px;color:#10b981">MemLens</div>
    <div style="font:500 13px 'IBM Plex Mono',monospace;letter-spacing:6px;color:#a1a1aa;padding-left:6px">AGENT MEMORY DEBUGGER</div>
    <div style="display:flex;gap:14px;margin-top:12px">
      <div style="border:1px solid #27272a;border-radius:8px;padding:10px 22px;font:600 13px 'IBM Plex Mono',monospace;color:#34d399">memlens.vercel.app</div>
      <div style="border:1px solid #27272a;border-radius:8px;padding:10px 22px;font:600 13px 'IBM Plex Mono',monospace;color:#fafafa">github.com/A-Raphie/memlens</div>
    </div>
    <div style="font:400 12px 'IBM Plex Mono',monospace;color:#52525b;margin-top:8px">HACK HYDRA 2026 · TRACK 3 · AGENT MEMORY</div>
  </div>`;

fs.rmSync(VID_DIR, { recursive: true, force: true });
fs.mkdirSync(VID_DIR, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: VID_DIR, size: { width: 1440, height: 900 } },
});
page = await context.newPage();

// Real terminal output for scene 7, captured now.
const composeOut = execSync("docker compose ps", { cwd: path.resolve(HERE, "../.."), env: { ...process.env, PATH: `${ORB}:${process.env.PATH}` } })
  .toString().trim().split("\n").slice(0, 3).map(l => l.replace(/\s+/g, " ")).join("\n");
const statsJson = execSync(`curl -s ${API}/api/stats`).toString();

// ---- Scene 1: hook, live graph ----
await mountStage(page, { title: "MemLens · Agent Memory Debugger", url: `${APP}/app` });
await injectCursor(page);
let frame = page.frameLocator("#__app");
await frame.locator("canvas").first().waitFor({ state: "visible", timeout: 20000 });
await hold(5000); // layout animation settles
mark("s1_graph_visible");
await hold(3000);
// slow canvas pan
await page.mouse.move(900, 480);
await page.mouse.down();
for (let i = 1; i <= 10; i++) await page.mouse.move(900 - i * 16, 480 - i * 5);
await page.mouse.up();
mark("s1_pan_done");
await hold(2500);

// ---- Scene 2: problem on the landing ----
frame = await navFrameto(`${APP}/`, 3500);
await frame.locator(".landing-hero-metrics").waitFor({ state: "visible", timeout: 10000 });
mark("s2_hero_visible");
await hold(3500);
await frame.locator(":root").evaluate((el) => el.scrollTo({ top: 1500, behavior: "smooth" }));
await hold(4500);
mark("s2_problem_shown");
await hold(2500);

// ---- Scene 3: live ingest ----
frame = await navFrameto(`${APP}/app`, 4500);
await frame.locator("canvas").first().waitFor({ state: "visible", timeout: 20000 });
await hold(1500);
await clickCursor(page, frame.locator(".upload-dropzone"));
await frame.locator("input.upload-input").setInputFiles(DEMO_FILE);
await frame.locator(".stats-status", { hasText: "Ingested" }).waitFor({ timeout: 30000 });
mark("s3_ingested");
await hold(4000); // counts tick, new nodes appear
mark("s3_counts_updated");
await hold(2500);

// ---- Scene 4: inspect a fact node ----
await canvasClickAt(frame, '[type="Fact"]');
await frame.locator(".node-card").waitFor({ state: "visible", timeout: 8000 });
mark("s4_inspect_filled");
await hold(2500);
const edgeTarget = frame.locator(".edge-target").first();
if (await edgeTarget.count() > 0) {
  await clickCursor(page, edgeTarget);
  await hold(2000);
}
mark("s4_jump_done");
await hold(1500);

// ---- Scene 5: contradictions ----
const conflictsSection = frame.locator(".sidebar-section", { hasText: "Contradictions" });
await conflictsSection.scrollIntoViewIfNeeded();
await hold(1200);
mark("s5_conflicts_visible");
await clickCursor(page, frame.locator(".conflict-card").first());
await hold(2500);
mark("s5_pair_clicked");
await hold(2000);

// ---- Scene 6: query console, NL then Cypher ----
await clickCursor(page, frame.locator(".query-input"));
await typeSlow("Python");
await hold(600);
await clickCursor(page, frame.locator(".query-btn"));
await frame.locator(".result-card").first().waitFor({ timeout: 15000 });
mark("s6_nl_results");
await hold(3500);
await frame.locator(".query-input").fill("");
await clickCursor(page, frame.locator(".query-input"));
await typeSlow("MATCH (f:Fact) RETURN f.content AS c ORDER BY c LIMIT 5");
await hold(1200); // chip shows CYPHER
mark("s6_chip_cypher");
await clickCursor(page, frame.locator(".query-btn"));
await hold(3500);
mark("s6_cypher_results");
await hold(2000);

// ---- Scene 7: HydraDB proof (real terminal output) ----
await showOverlay(terminalHtml(statsJson, composeOut));
mark("s7_terminal");
await hold(11000);

// ---- Scene 8: end card ----
await showOverlay(endCardHtml);
mark("s8_endcard");
await hold(8000);

mark("end");
await context.close(); // finalizes the video
await browser.close();
console.log("DONE. video in", VID_DIR);
