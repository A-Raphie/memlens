import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto("https://forms.gle/WEwqEmmN7Bkp4HyJ6", { waitUntil: "domcontentloaded", timeout: 30000 });
await p.waitForTimeout(4000);
console.log("URL:", p.url());
const items = await p.evaluate(() => {
  const roles = [...document.querySelectorAll('[role="heading"], [role="listitem"]')];
  return roles.slice(0, 30).map((el) => el.textContent.trim().replace(/\s+/g, " ").slice(0, 200));
});
console.log(items.join("\n---\n"));
await b.close();
