import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(process.argv[2], { waitUntil: "networkidle", timeout: 30000 });
await p.waitForTimeout(3000);
const h = await p.evaluate(() => document.body.scrollHeight);
const inners = await p.evaluate(() => [...document.querySelectorAll(".landing-section-inner")].map((el) => Math.round(el.getBoundingClientRect().width)));
console.log(JSON.stringify({ pageHeight: h, sectionWidths: inners }));
await b.close();
