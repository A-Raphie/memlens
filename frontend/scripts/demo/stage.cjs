// Shared Jorqeth-style stage: wallpaper + floating Chrome + optional Rabby.
// Used by product recorders. No secrets.

function wallpaperCss() {
  return `
    html, body { margin:0; height:100%; overflow:hidden; }
    body {
      background:
        radial-gradient(1200px 700px at 20% 0%, #d7e8ff 0%, transparent 55%),
        radial-gradient(900px 600px at 90% 20%, #b9d4f5 0%, transparent 50%),
        linear-gradient(180deg, #c5d8ef 0%, #8eafd4 45%, #6b93c4 100%);
    }
    #__stage {
      position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    }
    #__win {
      width: min(1180px, 88vw);
      height: min(720px, 86vh);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 28px 80px rgba(20,40,70,.38), 0 2px 0 rgba(255,255,255,.12) inset;
      background: #202124;
      display: flex; flex-direction: column;
    }
    #__chrome {
      height: 78px; flex: none; color: #e8eaed;
      font: 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #2b2c2f;
    }
    #__tabs {
      height: 34px; display:flex; align-items:center; gap:8px; padding:0 10px;
      border-bottom: 1px solid #1c1d20;
    }
    .dot { width:11px; height:11px; border-radius:50%; }
    .r { background:#ff5f57 } .y { background:#febc2e } .g { background:#28c840 }
    #__tab {
      margin-left: 8px; background:#3c3d41; border-radius:8px 8px 0 0;
      padding:7px 14px; font-weight:600; max-width: 280px;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    #__omniwrap { height:44px; display:flex; align-items:center; padding:0 14px; }
    #__omni {
      flex:1; height:28px; border-radius:14px; background:#1c1d20;
      display:flex; align-items:center; padding:0 14px; color:#c7c8cc;
    }
    #__app {
      flex:1; border:0; width:100%; background:#0a0b0f;
    }
  `;
}

async function mountStage(page, { title, url }) {
  await page.setContent(`<!doctype html><html><head><style>${wallpaperCss()}</style></head>
  <body><div id="__stage"><div id="__win">
    <div id="__chrome">
      <div id="__tabs">
        <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        <div id="__tab"></div>
      </div>
      <div id="__omniwrap"><div id="__omni"></div></div>
    </div>
    <iframe id="__app"></iframe>
  </div></div></body></html>`);
  await page.evaluate(({ title, url }) => {
    document.getElementById('__tab').textContent = title;
    document.getElementById('__omni').textContent = url.replace(/^https?:\/\//, '');
    document.getElementById('__app').src = url;
  }, { title, url });
  const frame = page.frameLocator('#__app');
  return frame;
}

async function showRabby(page, opts) {
  const q = new URLSearchParams({
    mode: opts.mode || 'connect',
    site: opts.site || 'example.com',
    chain: opts.chain || 'Ethereum',
    mark: opts.mark || '•',
    account: opts.account || 'Account 1',
    addr: opts.addr || '0x…',
    gas: opts.gas || '<$0.0001',
    tx: opts.tx || '{ "to": "0x…" }',
  });
  const html = opts.html || require('fs').readFileSync(
    require('path').join(__dirname, 'rabby-popup.html'),
    'utf8',
  );
  await page.evaluate(({ html, q }) => {
    document.getElementById('__rabby_host')?.remove();
    const win = document.getElementById('__win');
    const host = document.createElement('div');
    host.id = '__rabby_host';
    host.style.cssText =
      'position:absolute;inset:78px 0 0 0;z-index:20;background:rgba(0,0,0,.28);display:flex;align-items:flex-start;justify-content:flex-end;padding:16px 18px 0 0';
    const frame = document.createElement('iframe');
    frame.id = '__rabby_frame';
    frame.style.cssText =
      'width:380px;height:620px;border:0;border-radius:12px;box-shadow:0 22px 70px rgba(0,0,0,.5);background:#f4f4f5';
    host.appendChild(frame);
    win.style.position = 'relative';
    win.appendChild(host);
    const doc = frame.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
    const u = new URLSearchParams(q);
    const script = doc.createElement('script');
    script.textContent = `location.hash = ${JSON.stringify('?' + u.toString())};`;
    // Re-apply params the popup script already read from location.search (empty on srcdoc).
    const mode = u.get('mode') || 'connect';
    doc.getElementById('connect')?.classList.toggle('hidden', mode !== 'connect');
    doc.getElementById('sign')?.classList.toggle('hidden', mode !== 'sign');
    const set = (id, v) => { const el = doc.getElementById(id); if (el && v != null) el.textContent = v; };
    set('connectUrl', u.get('site'));
    set('signUrl', u.get('site'));
    set('connectChain', u.get('chain'));
    set('signChain', u.get('chain'));
    set('netMark', u.get('mark'));
    set('signMark', u.get('mark'));
    set('acct', 'A  ' + (u.get('account') || 'Account 1') + ' ▾');
    set('acct2', (u.get('account') || 'Account 1') + '  ' + (u.get('addr') || ''));
    set('gasLine', '⛽ ' + (u.get('gas') || '<$0.0001'));
    set('txjson', u.get('tx') || '{ "to": "0x…" }');
    const btn = doc.getElementById('btnAction');
    if (btn) {
      btn.id = mode === 'sign' ? 'btnSign' : 'btnConnect';
      btn.textContent = mode === 'sign' ? 'Sign' : 'Connect';
      if (mode === 'connect') doc.getElementById('actions')?.classList.add('stack');
      btn.addEventListener('click', () => { btn.classList.add('done'); btn.textContent = 'Approved'; });
    }
  }, { html, q: q.toString() });
}

async function hideRabby(page) {
  await page.evaluate(() => document.getElementById('__rabby_host')?.remove());
}

module.exports = { mountStage, showRabby, hideRabby };
