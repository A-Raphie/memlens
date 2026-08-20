import { chromium } from "playwright-core";

const url = process.argv[2];
const out = process.argv[3] || "/tmp/shot.png";
const wait = parseInt(process.argv[4] || "5000", 10);

const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("console", (m) => {
  const t = m.type();
  if (t === "error" || t === "warning") console.log("CON", t, m.text().slice(0, 300));
});
p.on("pageerror", (e) => console.log("PAGEERROR", String(e).slice(0, 400)));
p.on("requestfailed", (r) => console.log("REQFAIL", r.url().slice(0, 120), r.failure()?.errorText));

await p.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch((e) => console.log("GOTO", String(e).slice(0, 200)));
await p.waitForTimeout(wait);
const len = await p.evaluate(() => document.getElementById("root")?.innerHTML.length ?? -1);
console.log("ROOT_LEN", len);
await p.screenshot({ path: out });
console.log("SAVED", out);
await b.close();
