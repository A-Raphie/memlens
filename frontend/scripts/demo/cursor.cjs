// Visible pointer for Playwright recordVideo (no OS cursor in those files).
async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('__demo_cursor')) return;
    const el = document.createElement('div');
    el.id = '__demo_cursor';
    el.style.cssText =
      'position:fixed;left:40%;top:50%;width:18px;height:18px;z-index:2147483647;pointer-events:none;transform:translate(-2px,-1px);transition:none';
    el.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M3 2 L3 15 L7.2 11.2 L10.8 17 L13 15.8 L9.3 10 L15 10 Z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>' +
      '</svg>';
    document.documentElement.appendChild(el);
    window.__demoMove = (x, y) => {
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    };
    window.__demoClick = () => {
      el.style.filter = 'drop-shadow(0 0 0 #000)';
      const ring = document.createElement('div');
      ring.style.cssText =
        'position:fixed;left:' + el.style.left + ';top:' + el.style.top +
        ';width:10px;height:10px;margin:-4px 0 0 -4px;border:2px solid rgba(80,80,80,.7);border-radius:50%;pointer-events:none;z-index:2147483646';
      document.documentElement.appendChild(ring);
      setTimeout(() => ring.remove(), 280);
    };
  });
}

async function moveCursor(page, x, y, steps = 12) {
  const cur = await page.evaluate(() => {
    const el = document.getElementById('__demo_cursor');
    return el ? { x: parseFloat(el.style.left) || 400, y: parseFloat(el.style.top) || 400 } : { x: 400, y: 400 };
  });
  for (let i = 1; i <= steps; i++) {
    const nx = cur.x + ((x - cur.x) * i) / steps;
    const ny = cur.y + ((y - cur.y) * i) / steps;
    await page.mouse.move(nx, ny);
    await page.evaluate(({ nx, ny }) => window.__demoMove && window.__demoMove(nx, ny), { nx, ny });
  }
}

async function clickCursor(page, locator) {
  await locator.waitFor({ state: 'visible', timeout: 10000 });
  const box = await locator.boundingBox();
  if (!box) throw new Error('no box');
  const x = box.x + box.width * 0.5;
  const y = box.y + box.height * 0.5;
  await moveCursor(page, x, y, 16);
  await page.evaluate(() => window.__demoClick && window.__demoClick());
  await page.waitForTimeout(80);
  await locator.click({ timeout: 4000, force: true });
}

module.exports = { injectCursor, moveCursor, clickCursor };
