// Hack Hydra 2026 submission filler. SUBMIT=1 to actually submit; dry-run otherwise.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

const DO_SUBMIT = process.env.SUBMIT === "1";
const FORM = "https://docs.google.com/forms/d/e/1FAIpQLSdXpGqgsxPKRlaii1MXjlFCAfKYRBOxO8xa801LmT6z65IejA/viewform";

const EMAIL = "arnxto@gmail.com";
const NAME = "Ernest Ohagwu";
const LINKEDIN = "https://www.linkedin.com/in/ernest-ohagwu-930a69183/";
const X_HANDLE = "@a_raphie";
const CONTRIBUTIONS =
  "Solo team. Full stack: FastAPI backend written against HydraDB's OpenCypher subset (Bolt), React + Cytoscape.js frontend, contradiction detection via entity joins, demo video recording + editing.";

const TEXT_ANSWERS = [
  { match: ["primary contact name"], value: NAME },
  {
    match: ["project description"],
    value:
      "MemLens is an agent memory debugger: upload AI-agent session logs, build a knowledge graph in HydraDB, and query what your agent remembers, forgets, and contradicts. Live graph visualization, provenance inspection, contradiction detection, and a natural-language + raw OpenCypher query console. Repo: https://github.com/A-Raphie/memlens · Demo: https://memlens.vercel.app/memlens-demo.mp4",
  },
  {
    match: ["what problem"],
    value:
      "AI agents accumulate memory across sessions and nobody audits it. Conflicting facts, stale beliefs, and silent gaps pile up until the agent contradicts what it said last week — and by the time a user notices, the root cause is buried across hundreds of turns. Debugging agent memory today means reading raw JSON logs and guessing.",
  },
  {
    match: ["tech stack"],
    value:
      "Python 3.11 · FastAPI · Neo4j Bolt driver · HydraDB (self-hosted OSS image, OpenCypher over Bolt) · React · Vite · Cytoscape.js · Docker Compose",
  },
  { match: ["primary contact email"], value: EMAIL },
  { match: ["team members"], value: `${NAME} - ${EMAIL}` },
  { match: ["contribution"], value: CONTRIBUTIONS },
  { match: ["linkedin"], value: LINKEDIN },
  { match: ["x / twitter", "twitter handle"], value: X_HANDLE },
  { match: ["project name"], value: "MemLens — Agent Memory Debugger" },
  { match: ["github"], value: "https://github.com/A-Raphie/memlens" },
  { match: ["demo video", "video"], value: "https://memlens.vercel.app/memlens-demo.mp4" },
  { match: ["live", "deployed", "url"], value: "https://memlens.vercel.app" },
  {
    match: ["describe", "what did you build", "summary", "about"],
    value:
      "MemLens is a debugger for AI agent memory. Upload agent session logs (LongMemEval format); MemLens parses every turn, extracts entities and facts, and writes a knowledge graph into HydraDB over Bolt. The debugger visualizes the live graph, walks the provenance of any belief, and surfaces contradictions: fact pairs that share an entity but state different things — a multi-hop graph join that would be a multi-table mess in SQL. Natural-language and raw OpenCypher query console included. Demo: https://memlens.vercel.app/memlens-demo.mp4",
  },
  {
    match: ["hydradb", "graph"],
    value:
      "HydraDB is the agent's memory itself — every Session, Turn, Entity and Fact is a labeled node, every CONTAINS/MENTIONS/CREATED relation a typed edge, all queried over Bolt. The ingestion pipeline is written for HydraDB's supported OpenCypher subset (integer ids, edge-shaped MERGE + SET, auto-commit transactions), and the query console passes raw MATCH...RETURN straight to the engine. Contradiction detection joins facts through shared entities via typed-edge traversals — the core graph-native payoff.",
  },
];

const CHOICE_ANSWERS = [
  { match: ["track"], pick: ["track 3", "agent memory"] },
  { match: ["team size"], pick: ["1"] },
];

// Required confirmation checkboxes on the final page — single "I agree"
// option each; click the first checkbox/radio in the block.
const CONFIRM_KEYWORDS = [
  "originality confirmation",
  "submission eligibility",
  "hydradb requirement",
  "link accessibility",
  "one submission rule",
  "final confirmation",
];

const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(FORM, { waitUntil: "networkidle", timeout: 30000 });
await p.waitForTimeout(2500);

// Page 1: email gate
await p.locator("input[type='email']").first().fill(EMAIL);
await p.locator("div[role='button']:has-text('Next')").first().click();
await p.waitForTimeout(2500);

let pageNum = 2;
let lastTitles = "";
for (;;) {
  const blocks = p.locator("div[role='listitem']");
  const count = await blocks.count();
  const titles = await blocks.allInnerTexts().catch(() => []);
  const sig = titles.join("|").slice(0, 300);
  console.log(`\n===== PAGE ${pageNum} (${count} questions) =====`);
  if (sig === lastTitles) {
    console.log("!! PAGE DID NOT ADVANCE — aborting before bad submit");
    break;
  }
  lastTitles = sig;
  const unfilled = [];

  for (let i = 0; i < count; i++) {
    const block = blocks.nth(i);
    const title = (await block.locator("[role='heading']").first().innerText().catch(() => "")) || "";
    const t = title.toLowerCase().trim();
    if (!t) continue;
    console.log(`Q: ${title.trim().replace(/\s+/g, " ").slice(0, 110)}`);

    let handled = false;
    for (const ca of CHOICE_ANSWERS) {
      if (ca.match.some((m) => t.includes(m))) {
        const opts = block.locator("[role='radio'], [role='checkbox']");
        const n = await opts.count();
        for (let j = 0; j < n; j++) {
          const opt = opts.nth(j);
          const label = (
            (await opt.getAttribute("aria-label").catch(() => null)) ||
            (await opt.innerText().catch(() => "")) ||
            ""
          ).toLowerCase();
          if (ca.pick.some((pk) => label.includes(pk))) {
            await opt.click();
            console.log(`   -> choice: ${label.trim()}`);
            handled = true;
            break;
          }
        }
        if (!handled) console.log(`   !! choice question NOT matched: ${ca.match[0]}`);
      }
    }
    if (handled) continue;

    if (CONFIRM_KEYWORDS.some((m) => t.includes(m))) {
      const box = block.locator("[role='checkbox'], [role='radio']").first();
      if ((await box.count()) > 0) {
        await box.click();
        console.log("   -> confirmed checkbox");
        handled = true;
      }
    }
    if (handled) continue;

    if (t.includes("anything else")) {
      const input = block.locator("textarea, input[type='text']").first();
      if ((await input.count()) > 0) {
        await input.fill(
          "The debugger runs against a self-hosted HydraDB — one-command quickstart in the README (docker compose up). The Vercel URL hosts the landing page; the demo video shows the full live stack end-to-end."
        );
        console.log("   -> note for judges");
        handled = true;
      }
    }
    if (handled) continue;

    for (const ta of TEXT_ANSWERS) {
      if (ta.match.some((m) => t.includes(m))) {
        const input = block.locator("input[type='text'], textarea, input:not([type])").first();
        if ((await input.count()) > 0) {
          await input.fill(ta.value);
          console.log(`   -> text: ${ta.value.slice(0, 60)}${ta.value.length > 60 ? "..." : ""}`);
          handled = true;
        }
        break;
      }
    }
    if (!handled) unfilled.push(title.trim());
  }

  if (unfilled.length) console.log("UNFILLED:", unfilled);

  const nextBtn = p.locator("div[role='button']:has-text('Next')").first();
  const submitBtn = p.locator("div[role='button']:has-text('Submit')").first();
  const hasSubmit = (await submitBtn.count()) > 0;

  await p.screenshot({ path: `/tmp/form-page${pageNum}.png` });

  if (hasSubmit) {
    if (DO_SUBMIT) {
      await submitBtn.click();
      await p.waitForTimeout(6000);
      await p.screenshot({ path: "/tmp/form-confirmation.png" });
      const body = await p.evaluate(() => document.body.innerText.slice(0, 400));
      console.log("\n===== CONFIRMATION =====\n", body);
    } else {
      console.log("\n[DRY RUN] Submit button reached — not clicking. Re-run with SUBMIT=1.");
    }
    break;
  }
  if ((await nextBtn.count()) === 0) {
    console.log("no next/submit — stopping");
    break;
  }
  await nextBtn.click();
  await p.waitForTimeout(2500);
  pageNum++;
}

await b.close();
