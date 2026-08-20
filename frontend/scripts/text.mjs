import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(process.argv[2], { waitUntil: "networkidle", timeout: 30000 });
await p.waitForTimeout(parseInt(process.argv[3] || "4000", 10));
const text = await p.evaluate(() => document.body.innerText.replace(/\n{2,}/g, "\n"));
console.log(text.slice(0, 2200));
await b.close();
