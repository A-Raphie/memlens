import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(
  "https://docs.google.com/forms/d/e/1FAIpQLSdXpGqgsxPKRlaii1MXjlFCAfKYRBOxO8xa801LmT6z65IejA/viewform",
  { waitUntil: "networkidle", timeout: 30000 }
);
await p.waitForTimeout(2500);

// Fill the required email gate so Next is allowed
const email = p.locator("input[type='email']").first();
await email.fill("arnxto@gmail.com");
await p.waitForTimeout(400);

for (let page = 1; page <= 6; page++) {
  const text = await p.evaluate(() =>
    document.body.innerText.replace(/\n{2,}/g, "\n").slice(0, 2200)
  );
  console.log(`\n########## PAGE ${page} ##########\n${text}`);
  const btn = p.locator("div[role='button']:has-text('Next')").first();
  try {
    await btn.click({ timeout: 4000 });
    await p.waitForTimeout(2500);
  } catch {
    console.log("no next button — stopping");
    break;
  }
}
await b.close();
