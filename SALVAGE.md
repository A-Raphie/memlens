# SALVAGE — reusable machinery in this repo

What MemLens leaves behind, extracted while warm (Aug 20). Lift these into
the next project's scaffold at Step 0 instead of rebuilding.

## Demo machinery (most expensive to rebuild — reuse whole)
- `frontend/scripts/demo/` — recorder.mjs + stage.cjs + cursor.cjs:
  composite Jorqeth stage (wallpaper + floating Chrome + product iframe),
  drawn cursor with click rings, marker log for ffmpeg cutting.
  Config-driven: APP/API URLs + scene list at the top; scenes gate on an
  audio timeline (`at(i)` waits until paragraph i starts).
- `demo-video/STORYBOARD.md` — the scene table format that doubles as the
  VO script source (Say-lines) and the mux alignment spec.
- Audio-driven recording: measure the TTS wav with
  `ffmpeg silencedetect` + word-rate alignment → paragraph boundaries →
  re-record video gated to audio → mux with `adelay=HEAD`. Verified
  scene-per-paragraph sync on the first try.
- `frontend/scripts/shot.mjs / text.mjs / fullshot.mjs / layout-audit.mjs`
  — playwright-core + system Chrome: screenshot, visible-text dump,
  full-page capture, DOM-geometry balance audit (centroid / section
  alignment). text.mjs beats vision models for UI verification.

## Form automation
- `frontend/scripts/form-submit.mjs` — Google Forms filler that walks
  required-gated pages (fill → Next advances), radios by aria-label
  (innerText is empty), checkboxes by accessible name, stuck-detector.
  Dry-run mode default; SUBMIT=1 to fire.

## Backend patterns (HydraDB / limited-engine databases)
- `backend/ingest.py` — pipeline for an engine with a narrow query subset:
  stable int-id hashing from string keys (`hid()`), edge-shaped
  MERGE + separate MATCH/SET property writes, app-side search and joins.
- Probe-first method: empirically map the engine's supported surface with
  a scripted probe list before writing one line of pipeline
  (see memory: reference-hydradb-query-limits).
- `main.py /api/stats` — telemetry endpoint pattern (503 on DB down) that
  feeds honest OFFLINE states in the UI.

## Frontend design system
- `frontend/src/tokens.js` + `App.css :root` — sponsor-palette token
  ladder (verified from the sponsor's production CSS) shared by CSS and
  JS (Cytoscape styles import tokens.js — no drift).
- winsznx-style landing: `01 /` numbered sections, mono telemetry strip,
  code block as hero, live stats panel with honest OFFLINE fallback,
  dot-grid canvas, density rules (64px sections / 1120px container).
- Debugger shell: mono status strip with LIVE dot + self-healing 15s
  refresh loop (mount-only fetch = dead canvas after a backend restart).
