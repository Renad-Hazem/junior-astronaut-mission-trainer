#!/usr/bin/env node
// Real-browser audio QA for ASTER BASE (not bundled). Node >= 22 (global WebSocket).
//
//   npm run build && npx vite preview --port 4317 --strictPort
//   node src/audio/tools/browser-qa.mjs --url http://127.0.0.1:4317/ --out ../audio-qa-results
//
// Launches installed Chrome/Edge headless with --autoplay-policy=user-gesture-required
// and --mute-audio (nothing comes out of the speakers). Each scenario runs in its own
// isolated browser context, using only trusted input events (mouse, touch, keys) via
// the DevTools protocol. Evidence comes from:
//   - the app's opt-in debug hook (?audioDebug=1): snapshot + play/suppress counters
//   - an AnalyserNode tapped onto the master bus: RMS of the audio actually rendered
//   - an AudioContext constructor wrapper: when, and with which user activation, a context is created
//   - Network/console events
// It cannot judge how the sounds *sound* to a person. That still needs a human listener.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const BASE = (args.url ?? 'http://127.0.0.1:4317/').replace(/\/?$/, '/');
const OUT = resolve(args.out ?? 'audio-qa-results');
const PORT = Number(args.port ?? 9333);
const CHROME = [args.chrome, process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && existsSync(p));
if (!CHROME) throw new Error('No Chrome/Edge found; pass --chrome <path>');
mkdirSync(OUT, { recursive: true });
const PROFILE = join(OUT, 'chrome-profile');
rmSync(PROFILE, { recursive: true, force: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const consoleErrors = [];
let current = '';
function check(name, ok, detail) {
  results.push({ scenario: current, name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${current}] ${name}${detail !== undefined ? `  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
}

// ---------------------------------------------------------------------------
// Minimal CDP client (flattened sessions)
// ---------------------------------------------------------------------------
class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.handlers = [];
    this.ready = new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: ok, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message}`));
        else ok(msg.result);
      } else if (msg.method) {
        this.handlers.forEach((h) => h(msg));
      }
    };
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return new Promise((ok, reject) => this.pending.set(id, { resolve: ok, reject }));
  }
  on(fn) {
    this.handlers.push(fn);
  }
}

const INSTRUMENT = `(() => {
  window.__qa = { ctxCreated: [], mediaPlays: 0 };
  const Orig = window.AudioContext;
  if (Orig) {
    window.AudioContext = class extends Orig {
      constructor(...a) {
        super(...a);
        window.__qa.ctxCreated.push({ at: Math.round(performance.now()), state: this.state,
          userActivationActive: navigator.userActivation ? navigator.userActivation.isActive : null });
      }
    };
  }
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { window.__qa.mediaPlays += 1; return play.apply(this, arguments); };
})();`;

const NO_WEB_AUDIO = `delete window.AudioContext; delete window.webkitAudioContext;`;

async function openPage(browser, { mobile = false, preScripts = [], intercept = null } = {}) {
  const { browserContextId } = await browser.send('Target.createBrowserContext');
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (m, p) => browser.send(m, p, sessionId);
  const page = { send, sessionId, requests: [], mobile };
  browser.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Network.requestWillBeSent') page.requests.push({ url: msg.params.request.url, t: Date.now() });
    if (msg.method === 'Runtime.exceptionThrown') consoleErrors.push({ scenario: current, text: msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text });
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') consoleErrors.push({ scenario: current, text: msg.params.args.map((a) => a.value ?? a.description).join(' ') });
    if (msg.method === 'Fetch.requestPaused' && intercept) intercept(msg.params, send);
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  for (const s of [...preScripts, INSTRUMENT]) await send('Page.addScriptToEvaluateOnNewDocument', { source: s });
  if (intercept) await send('Fetch.enable', { patterns: [{ urlPattern: '*mars-wind-perseverance*' }] });
  if (mobile) {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  } else {
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
  }
  page.close = () => browser.send('Target.disposeBrowserContext', { browserContextId });
  return page;
}

async function evaluate(page, expression) {
  const r = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}

async function waitFor(page, expression, timeout = 10_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await evaluate(page, `Boolean(${expression})`).catch(() => false)) return true;
    await sleep(100);
  }
  return false;
}

async function navigate(page, url) {
  await page.send('Page.navigate', { url });
  await waitFor(page, `document.readyState === 'complete' && document.querySelector('#root > *')`, 20_000);
}

/** Center of the element returned by `finder` (a JS expression), scrolled into view. */
async function locate(page, finder) {
  return evaluate(page, `(() => { const el = (${finder}); if (!el) return null; el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })()`);
}

async function click(page, finder, times = 1) {
  const p = await locate(page, finder);
  if (!p) throw new Error(`Element not found: ${finder}`);
  if (page.mobile) {
    for (let i = 0; i < times; i += 1) {
      await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
  } else {
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    for (let i = 0; i < times; i += 1) {
      await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
      await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    }
  }
  return p;
}

const KEYS = {
  w: ['w', 'KeyW', 87, 'w'], a: ['a', 'KeyA', 65, 'a'], s: ['s', 'KeyS', 83, 's'], d: ['d', 'KeyD', 68, 'd'], e: ['e', 'KeyE', 69, 'e'],
  ArrowLeft: ['ArrowLeft', 'ArrowLeft', 37], Escape: ['Escape', 'Escape', 27],
  c: ['c', 'KeyC', 67, 'c'], ArrowRight: ['ArrowRight', 'ArrowRight', 39],
};
const keyDown = (page, name) => {
  const [k, code, vk, text] = KEYS[name];
  return page.send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, ...(text ? { text } : {}) });
};
const keyUp = (page, name) => {
  const [k, code, vk] = KEYS[name];
  return page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
};
async function key(page, name, { holdMs = 0 } = {}) {
  await keyDown(page, name);
  if (holdMs) await sleep(holdMs);
  await keyUp(page, name);
}

/** Press and hold an on-screen button with a real (emulated) touch, then lift. */
async function touchHold(page, finder, ms) {
  const p = await locate(page, finder);
  if (!p) throw new Error(`Element not found: ${finder}`);
  await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
  await sleep(ms);
  await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

// ---------------------------------------------------------------------------
// Scene model + path planning (uses the scene's own config and collision code)
// ---------------------------------------------------------------------------

/** Loads src/scene/sceneConfig.ts and sceneMath.ts through Vite, so planning uses the real obstacles. */
async function loadSceneModel() {
  const { createServer } = await import('vite');
  const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
  const server = await createServer({ root, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false } });
  try {
    return { cfg: await server.ssrLoadModule('/src/scene/sceneConfig.ts'), math: await server.ssrLoadModule('/src/scene/sceneMath.ts') };
  } finally {
    await server.close();
  }
}

const KEY_FOR = { up: 'w', down: 's', left: 'a', right: 'd' };

/**
 * Dijkstra over a 0.25-unit grid using the 8 directions the keyboard can produce
 * (direction vectors come from the scene's own readInputVector + screenToWorld).
 * Keeps 0.35 units of clearance from every obstacle so the replay never slides
 * along a collider. Returns key-hold segments, or null if no path exists.
 */
function planPath(model, goal) {
  const { cfg, math } = model;
  const CELL = 0.25;
  const CLEAR = 0.35;
  const N = Math.ceil(cfg.MAP_HALF_SIZE / CELL);
  const combos = [['up'], ['down'], ['left'], ['right'], ['up', 'right'], ['up', 'left'], ['down', 'right'], ['down', 'left']];
  const dirs = combos.map((dirsHeld) => {
    const input = math.createInputState();
    dirsHeld.forEach((d) => { input[d] = true; });
    const v = math.screenToWorld(math.readInputVector(input));
    return { keys: dirsHeld.map((d) => KEY_FOR[d]), di: Math.sign(Math.round(v.x * 100)), dj: Math.sign(Math.round(v.z * 100)) };
  });
  const B = cfg.PLAYER_BOUNDS;
  const free = (x, z) =>
    x >= B.minX + CLEAR && x <= B.maxX - CLEAR && z >= B.minZ + CLEAR && z <= B.maxZ - CLEAR &&
    cfg.OBSTACLES.every((o) => Math.hypot(x - o.x, z - o.z) >= o.radius + cfg.PLAYER_RADIUS + CLEAR);
  const id = (i, j) => (i + N) * (2 * N + 1) + (j + N);
  const si = Math.round(cfg.PLAYER_SPAWN.x / CELL);
  const sj = Math.round(cfg.PLAYER_SPAWN.z / CELL);
  const dist = new Map();
  const prev = new Map();
  // Binary min-heap on cost.
  const heap = [];
  const push = (item) => {
    heap.push(item);
    for (let n = heap.length - 1; n > 0; ) {
      const p = (n - 1) >> 1;
      if (heap[p][0] <= heap[n][0]) break;
      [heap[p], heap[n]] = [heap[n], heap[p]];
      n = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      for (let n = 0; ; ) {
        const l = 2 * n + 1;
        const r = l + 1;
        let m = n;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === n) break;
        [heap[m], heap[n]] = [heap[n], heap[m]];
        n = m;
      }
    }
    return top;
  };
  push([0, si, sj, -1]);
  dist.set(`${id(si, sj)}:-1`, 0);
  while (heap.length) {
    const [c, i, j, d] = pop();
    if (goal(i * CELL, j * CELL)) {
      const steps = [];
      let key = `${id(i, j)}:${d}`;
      let node = { i, j, d };
      while (prev.has(key)) {
        steps.unshift(node.d);
        node = prev.get(key);
        key = `${id(node.i, node.j)}:${node.d}`;
      }
      const segments = [];
      for (const s of steps) {
        const last = segments[segments.length - 1];
        if (last && last.d === s) last.n += 1;
        else segments.push({ d: s, n: 1 });
      }
      return {
        end: { x: i * CELL, z: j * CELL },
        segments: segments.map(({ d: k, n }) => {
          const len = n * CELL * Math.hypot(dirs[k].di, dirs[k].dj);
          return { keys: dirs[k].keys, ms: Math.round((len / cfg.PLAYER_SPEED) * 1000), units: +len.toFixed(2) };
        }),
      };
    }
    if (c > (dist.get(`${id(i, j)}:${d}`) ?? Infinity)) continue;
    dirs.forEach((dir, k) => {
      const ni = i + dir.di;
      const nj = j + dir.dj;
      if (Math.abs(ni) > N || Math.abs(nj) > N) return;
      const x = ni * CELL;
      const z = nj * CELL;
      if (!free(x, z) || !free((i * CELL + x) / 2, (j * CELL + z) / 2)) return;
      const nc = c + CELL * Math.hypot(dir.di, dir.dj) + (d !== -1 && d !== k ? 0.6 : 0);
      const nk = `${id(ni, nj)}:${k}`;
      if (nc < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nc);
        prev.set(nk, { i, j, d });
        push([nc, ni, nj, k]);
      }
    });
  }
  return null;
}

const nearbyAttr = `document.querySelector('[data-nearby-hotspot]')?.getAttribute('data-nearby-hotspot')`;

/** Replays a planned path with real key holds. */
async function walk(page, plan) {
  for (const seg of plan.segments) {
    for (const k of seg.keys) await keyDown(page, k);
    await sleep(seg.ms);
    for (const k of seg.keys) await keyUp(page, k);
    await sleep(40);
  }
}

/** Frames per second the page is actually rendering (movement is clamped to 0.1 s per frame). */
const measureFps = (page) =>
  evaluate(page, `new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n += 1; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else r(n); }; requestAnimationFrame(f); })`);

const steps = (page) => count(page, 'footstep');

const audio = (page) => evaluate(page, `({ snap: window.__asterAudio?.snapshot() ?? null, stats: window.__asterAudio?.stats() ?? null, qa: window.__qa })`);
const count = async (page, id) => ((await audio(page)).stats?.playCounts?.[id] ?? 0);

/** Max RMS of the master bus over `ms` (the analyser is tapped once per page). */
async function masterRms(page, ms = 600) {
  return evaluate(page, `(async () => {
    const m = window.__asterAudio?.manager; const ctx = m?.ctx; if (!ctx || !m.master) return null;
    if (!window.__qaAnalyser) { const a = ctx.createAnalyser(); a.fftSize = 2048; const sink = ctx.createGain(); sink.gain.value = 0;
      m.master.connect(a); a.connect(sink); sink.connect(ctx.destination); window.__qaAnalyser = a; }
    const a = window.__qaAnalyser; const buf = new Float32Array(a.fftSize); let max = 0; const end = performance.now() + ${ms};
    while (performance.now() < end) { a.getFloatTimeDomainData(buf); let s = 0; for (const v of buf) s += v * v; max = Math.max(max, Math.sqrt(s / buf.length)); await new Promise(r => setTimeout(r, 40)); }
    return max; })()`);
}

/**
 * Clicks Mute and measures how fast the master bus goes silent, with a short
 * 256-sample analyser (≈5 ms window) polled from the moment of the click.
 */
async function muteLatency(page) {
  const pending = evaluate(page, `(async () => {
    const m = window.__asterAudio.manager; const ctx = m.ctx;
    const a = ctx.createAnalyser(); a.fftSize = 256; const sink = ctx.createGain(); sink.gain.value = 0;
    m.master.connect(a); a.connect(sink); sink.connect(ctx.destination);
    const buf = new Float32Array(256);
    const rms = () => { a.getFloatTimeDomainData(buf); let s = 0; for (const v of buf) s += v * v; return Math.sqrt(s / buf.length); };
    let clickAt = null; window.addEventListener('pointerdown', () => { clickAt = performance.now(); }, { capture: true, once: true });
    const before = []; const t0 = performance.now();
    while (clickAt === null && performance.now() - t0 < 3000) { before.push(rms()); await new Promise(r => setTimeout(r, 4)); }
    let silentAfterMs = null; let maxRms50to400 = 0;
    while (clickAt !== null && performance.now() - clickAt < 400) {
      const v = rms(); const dt = performance.now() - clickAt;
      if (silentAfterMs === null && v < 1e-5) silentAfterMs = Math.round(dt);
      if (dt > 50) maxRms50to400 = Math.max(maxRms50to400, v);
      await new Promise(r => setTimeout(r, 2));
    }
    m.master.disconnect(a);
    return { preMuteRms: Math.max(...before.slice(-10)), silentAfterMs, maxRms50to400 };
  })()`);
  await sleep(200);
  await click(page, `document.querySelector('.audio-settings__mute')`);
  return pending;
}

const btnByText = (prefix) => `[...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(${JSON.stringify(prefix)}) && b.offsetParent !== null)`;
const byAria = (label) => `document.querySelector('[aria-label=${JSON.stringify(label)}]')`;
const TOGGLE = `document.querySelector('.audio-settings__toggle')`;

async function enterMission(page, missionTitle) {
  await click(page, `document.querySelector('.hero-cta')`);
  await waitFor(page, btnByText('Confirm'));
  await sleep(500); // human-like pause (a person reads the picker before confirming)
  await click(page, btnByText('Confirm'));
  await waitFor(page, byAria(`Start ${missionTitle}`), 10_000);
  await click(page, byAria(`Start ${missionTitle}`));
  return waitFor(page, `document.querySelector('.gameplay-page')`, 15_000);
}

/** Inspect, pick option `index`, continue. Returns false if a control is missing. */
async function playEvent(page, index, { rapidClicks = 1 } = {}) {
  await click(page, `document.querySelector('.task-prompt__action')`);
  if (!(await waitFor(page, `document.querySelectorAll('.decision-option:not([disabled])').length > ${index}`))) return false;
  await click(page, `document.querySelectorAll('.decision-option')[${index}]`, rapidClicks);
  if (!(await waitFor(page, `document.querySelector('.decision-continue:not([disabled])')`))) return false;
  await click(page, `document.querySelector('.decision-continue')`);
  await sleep(250);
  return true;
}

async function screenshot(page, name) {
  await sleep(350); // let the 140 ms panel fade-in finish so the capture shows the final state
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, 'base64'));
}

const PROGRESS_KEY = 'mars-base:game-progress:v1';
const progress = (ids) => `localStorage.setItem(${JSON.stringify(PROGRESS_KEY)}, ${JSON.stringify(JSON.stringify({ state: { completedLevelIds: ids }, version: 1 }))})`;

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------
async function desktopFlow(browser) {
  current = 'desktop-flow';
  const page = await openPage(browser);
  await navigate(page, `${BASE}?audioDebug=1`);
  await sleep(1500);
  let a = await audio(page);
  check('no AudioContext before any user gesture', a.qa.ctxCreated.length === 0, a.qa.ctxCreated);
  check('audio reports locked before gesture', a.snap?.unlocked === false && a.snap?.contextState === 'none', a.snap);
  check('wind asset not requested on the Home screen (lazy)', !page.requests.some((r) => r.url.includes('mars-wind')));

  await click(page, `document.querySelector('.hero-cta')`);
  await waitFor(page, `window.__asterAudio.snapshot().unlocked`, 3000);
  a = await audio(page);
  check('first click creates exactly one AudioContext during user activation', a.qa.ctxCreated.length === 1 && a.qa.ctxCreated[0].userActivationActive === true, a.qa.ctxCreated);
  check('context running after first gesture', a.snap.contextState === 'running', a.snap.contextState);
  check('startup confirmation played once', a.stats.playCounts['game-startup'] === 1, a.stats.playCounts);
  check('no HTMLMediaElement autoplay used', a.qa.mediaPlays === 0);

  await waitFor(page, btnByText('Confirm'));
  await sleep(500); // human-like pause before confirming
  await click(page, btnByText('Confirm'));
  await waitFor(page, byAria('Start First Day on Mars'));
  check('menu navigation tick on avatar confirm', (await count(page, 'menu-navigate')) >= 1, (await audio(page)).stats);
  const tStart = Date.now();
  await click(page, byAria('Start First Day on Mars'));
  await waitFor(page, `document.querySelector('.gameplay-page')`, 15_000);
  const loaded = await waitFor(page, `window.__asterAudio.snapshot().ambienceSource === 'nasa-recording'`, 8000);
  a = await audio(page);
  check('ambience uses the NASA Mars wind recording', loaded, a.snap.ambienceSource);
  const windReqs = page.requests.filter((r) => r.url.includes('mars-wind'));
  check('wind file requested once, only after gameplay started', windReqs.length === 1 && windReqs[0].t >= tStart, windReqs.map((r) => r.url));
  await sleep(2200);
  const rmsAmb = await masterRms(page);
  check('ambience produces signal on the master bus', rmsAmb > 0.0005, { rms: rmsAmb });

  await click(page, TOGGLE);
  await waitFor(page, `document.querySelector('.audio-settings__panel')`);
  const deskPanel = await evaluate(page, `(() => { const r = document.querySelector('.audio-settings__panel').getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })()`);
  check('desktop settings panel fits on screen', deskPanel.left >= 0 && deskPanel.right <= 1366 && deskPanel.bottom <= 900, deskPanel);
  await screenshot(page, 'desktop-gameplay-audio-panel');
  await evaluate(page, `document.querySelector('.audio-settings__slider input').focus()`);
  for (let i = 0; i < 3; i += 1) await key(page, 'ArrowLeft');
  await sleep(150);
  a = await audio(page);
  const stored = JSON.parse((await evaluate(page, `localStorage.getItem('aster-base:audio-settings:v1')`)) ?? '{}');
  check('keyboard on master slider changes volume and persists', Math.abs(a.snap.settings.master - 0.55) < 1e-9 && Math.abs(stored.master - 0.55) < 1e-9, { snap: a.snap.settings.master, stored });

  await key(page, 'w');
  await sleep(150);
  const afterW = await evaluate(page, `({ open: Boolean(document.querySelector('.audio-settings__panel')), focus: document.activeElement?.className })`);
  check('pressing W in the panel closes it and returns focus to the toggle (game keys work again)', !afterW.open && String(afterW.focus).includes('audio-settings__toggle'), afterW);

  await click(page, TOGGLE);
  await waitFor(page, `document.querySelector('.audio-settings__mute')`);
  const mute = await muteLatency(page);
  a = await audio(page);
  check('mute: audio was playing just before the click', mute.preMuteRms > 0.0005, mute);
  check('mute: master bus silent within 60 ms of the click and stays silent', mute.silentAfterMs !== null && mute.silentAfterMs <= 60 && mute.maxRms50to400 < 1e-5, mute);
  check('mute: no active voices, ambience torn down', a.stats.activeVoices === 0 && a.snap.ambienceSource === 'none', { voices: a.stats.activeVoices, amb: a.snap.ambienceSource });
  await click(page, `document.querySelector('.audio-settings__mute')`);
  await waitFor(page, `window.__asterAudio.snapshot().ambienceSource === 'nasa-recording'`, 5000);
  await sleep(1500);
  const rmsBack = await masterRms(page, 400);
  check('unmute restores ambience', rmsBack > 0.0005, { rms: rmsBack });
  await key(page, 'Escape');
  await sleep(100);
  check('Escape closes the panel', !(await evaluate(page, `Boolean(document.querySelector('.audio-settings__panel'))`)));

  const inspectBefore = await count(page, 'inspect-system');
  await click(page, `document.querySelector('.task-prompt__action')`);
  await waitFor(page, `document.querySelector('.contextual-panel')`);
  check('Inspect System plays the inspect sound', (await count(page, 'inspect-system')) === inspectBefore + 1);
  const decBefore = await count(page, 'decision-select');
  await click(page, `document.querySelectorAll('.decision-option')[0]`, 3); // rapid triple click
  await waitFor(page, `document.querySelector('.decision-continue:not([disabled])')`);
  check('rapid triple-click on a decision plays one decision sound', (await count(page, 'decision-select')) === decBefore + 1, (await audio(page)).stats);
  await click(page, `document.querySelector('.decision-continue')`);
  await sleep(300);
  check('decision modal closes after Continue', !(await evaluate(page, `Boolean(document.querySelector('.contextual-panel'))`)));
  await playEvent(page, 0);
  await playEvent(page, 0);
  await waitFor(page, `!document.querySelector('.gameplay-page')`, 5000);
  a = await audio(page);
  check('mission complete + brief open sounds', a.stats.playCounts['mission-complete'] === 1 && a.stats.playCounts['brief-open'] === 1, a.stats.playCounts);
  check('leaving gameplay stops the ambience', a.snap.ambienceMode === 'off' && a.snap.ambienceSource === 'none', a.snap);
  await sleep(1800);
  const rmsBrief = await masterRms(page, 500);
  check('silence on the brief once the completion sounds finish', rmsBrief < 1e-4, { rms: rmsBrief });

  await page.send('Page.reload');
  await waitFor(page, `document.readyState === 'complete' && window.__asterAudio`, 15_000);
  await sleep(800);
  a = await audio(page);
  check('volume setting survives refresh', Math.abs(a.snap.settings.master - 0.55) < 1e-9, a.snap.settings);
  check('no AudioContext after refresh until a new gesture', a.qa.ctxCreated.length === 0 && a.snap.unlocked === false);
  await page.close();
}

async function warningScenario(browser) {
  current = 'resource-warning';
  const page = await openPage(browser);
  await navigate(page, `${BASE}?audioDebug=1`);
  await evaluate(page, progress(['level-1-first-day']));
  await page.send('Page.reload');
  await waitFor(page, `window.__asterAudio`, 15_000);
  check('entered Level 2 (Power Crisis)', await enterMission(page, 'Power Crisis'));
  // Level 2 event 1 uses sceneStatus "dust": NASA wind + synthesized gust layer.
  await waitFor(page, `window.__asterAudio.snapshot().ambienceSource === 'nasa-recording'`, 8000);
  const storm = await evaluate(page, `({ snap: window.__asterAudio.snapshot(), dustLayer: Boolean(window.__asterAudio.manager.ambience?.dust), baseLayer: Boolean(window.__asterAudio.manager.ambience?.base) })`);
  await sleep(2200);
  const stormRms = await masterRms(page, 500);
  check('dust-storm event: NASA wind plus synthesized gust layer, audible', storm.snap.ambienceMode === 'dust' && storm.snap.ambienceSource === 'nasa-recording' && storm.dustLayer && storm.baseLayer && stormRms > 0.0005, { mode: storm.snap.ambienceMode, source: storm.snap.ambienceSource, dustLayer: storm.dustLayer, rms: stormRms });
  await click(page, `document.querySelector('.task-prompt__action')`);
  await waitFor(page, `document.querySelectorAll('.decision-option').length > 1`);
  await click(page, `document.querySelectorAll('.decision-option')[1]`); // "Keep greenhouse at full power" → energy < 30
  await sleep(600);
  const a = await audio(page);
  check('decision dropping Energy below 30 plays decision + resource warning', a.stats.playCounts['decision-select'] === 1 && a.stats.playCounts['resource-warning'] === 1, a.stats.playCounts);
  await page.close();
}

async function stabilizationAndAstroBot(browser) {
  current = 'stabilization+astrobot+movement';
  const page = await openPage(browser);
  await navigate(page, `${BASE}?audioDebug=1`);
  await evaluate(page, progress(['level-1-first-day', 'level-2-power-crisis', 'level-3-oxygen-emergency']));
  await page.send('Page.reload');
  await waitFor(page, `window.__asterAudio`, 15_000);
  check('entered Level 4 (Mars Survival Challenge)', await enterMission(page, 'Mars Survival Challenge'));

  await click(page, btnByText('💡 Ask AstroBot'));
  const answered = await waitFor(page, `[...document.querySelectorAll('.astro-message-row--bot')].filter(r => !r.querySelector('.astro-thinking-bubble')).length >= 2`, 15_000);
  await sleep(300);
  let a = await audio(page);
  check('AstroBot answer arrives and plays one notification', answered && a.stats.playCounts['astrobot-message'] === 1, a.stats.playCounts);
  await click(page, `document.querySelector('.astro-chatbot-close')`);
  await sleep(200);

  // Formerly asserted "no footsteps" (scene signal not wired). Now: real walking steps, which stop on release.
  const stepsIdle = await steps(page);
  await key(page, 'd', { holdMs: 1200 });
  const stepsWalked = await steps(page);
  await sleep(900);
  const stepsAfter = await steps(page);
  check('walking with D plays footsteps; they stop after release', stepsIdle === 0 && stepsWalked - stepsIdle >= 2 && stepsAfter === stepsWalked, { stepsIdle, stepsWalked, stepsAfter });
  a = await audio(page);

  const decBefore = a.stats.playCounts['decision-select'] ?? 0;
  for (let i = 0; i < 3; i += 1) await playEvent(page, 0);
  await click(page, `document.querySelector('.task-prompt__action')`);
  await waitFor(page, `document.querySelectorAll('.decision-option:not([disabled])').length > 0`);
  await click(page, `document.querySelectorAll('.decision-option')[0]`);
  await sleep(500);
  a = await audio(page);
  check('final exhausting decision plays stabilization (not decision/warning)', a.stats.playCounts.stabilization === 1 && a.stats.playCounts['decision-select'] === decBefore + 3, { plays: a.stats.playCounts, suppressed: a.stats.suppressedCounts, decBefore });
  await click(page, `document.querySelector('.decision-continue')`);
  await waitFor(page, `!document.querySelector('.gameplay-page')`, 5000);
  a = await audio(page);
  check('stabilized brief: brief-open only, no mission-complete fanfare', a.stats.playCounts['brief-open'] === 1 && !a.stats.playCounts['mission-complete'], a.stats.playCounts);
  await page.close();
}

async function assetFailure(browser, kind) {
  current = kind === 404 ? 'missing-asset' : 'unsupported-format';
  const intercept = (params, send) =>
    kind === 404
      ? send('Fetch.fulfillRequest', { requestId: params.requestId, responseCode: 404, body: Buffer.from('Not found').toString('base64') })
      : send('Fetch.fulfillRequest', { requestId: params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'audio/wav' }], body: Buffer.from('this is not audio data at all'.repeat(40)).toString('base64') });
  const page = await openPage(browser, { intercept });
  await navigate(page, `${BASE}?audioDebug=1`);
  check('entered Level 1', await enterMission(page, 'First Day on Mars'));
  const fell = await waitFor(page, `window.__asterAudio.snapshot().ambienceSource === 'synthesized-fallback'`, 8000);
  const a = await audio(page);
  check('falls back to synthesized wind', fell, { source: a.snap.ambienceSource, assetError: a.stats.assetError });
  await sleep(2200);
  const rms = await masterRms(page, 500);
  check('fallback ambience is audible on the master bus', rms > 0.0005, { rms });
  check('gameplay still works (inspect opens decisions)', await (async () => { await click(page, `document.querySelector('.task-prompt__action')`); return waitFor(page, `document.querySelector('.contextual-panel')`); })());
  await page.close();
}

async function noWebAudio(browser) {
  current = 'no-web-audio';
  const page = await openPage(browser, { preScripts: [NO_WEB_AUDIO] });
  await navigate(page, `${BASE}?audioDebug=1`);
  check('entered Level 1 without Web Audio', await enterMission(page, 'First Day on Mars'));
  const a = await audio(page);
  check('audio reports unsupported, no crash', a.snap.supported === false, a.snap);
  await click(page, TOGGLE);
  const ui = await evaluate(page, `({ status: document.querySelector('.audio-settings__status')?.textContent, muteDisabled: document.querySelector('.audio-settings__mute')?.disabled, sliderDisabled: document.querySelector('.audio-settings__slider input')?.disabled })`);
  check('settings explain sound is unavailable and controls are disabled', /isn.t available/.test(ui.status) && ui.muteDisabled && ui.sliderDisabled, ui);
  await key(page, 'Escape');
  check('mission still playable (decision recorded)', await playEvent(page, 0));
  await page.close();
}

async function mobileFlow(browser) {
  current = 'mobile-touch';
  const page = await openPage(browser, { mobile: true });
  await navigate(page, `${BASE}?audioDebug=1`);
  await sleep(800);
  check('no AudioContext before first tap', (await audio(page)).qa.ctxCreated.length === 0);
  check('entered Level 1 with taps', await enterMission(page, 'First Day on Mars'));
  let a = await audio(page);
  check('touch unlocked audio (context running)', a.snap.unlocked && a.snap.contextState === 'running', a.snap);
  const dpad = await locate(page, byAria('Move down'));
  check('touch d-pad is shown on the touch device', Boolean(dpad), dpad);
  await screenshot(page, 'mobile-gameplay');
  if (dpad) {
    const before = await steps(page);
    await touchHold(page, byAria('Move down'), 1300);
    const walked = await steps(page);
    await sleep(900);
    const after = await steps(page);
    check('touch walking (held d-pad) plays footsteps; they stop when the finger lifts', walked - before >= 2 && after === walked, { before, walked, after });
  }
  const toggle = await locate(page, TOGGLE);
  check('sound button visible inside the 390px viewport, ≥ 44px', toggle && toggle.left >= 0 && toggle.right <= 390 && toggle.top >= 0 && toggle.w >= 44 && toggle.h >= 44, toggle);
  await click(page, TOGGLE);
  await waitFor(page, `document.querySelector('.audio-settings__panel')`);
  const panel = await evaluate(page, `(() => { const r = document.querySelector('.audio-settings__panel').getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })()`);
  check('settings panel fits on screen', panel.left >= 0 && panel.right <= 390 && panel.bottom <= 844, panel);
  const toggleRect = await locate(page, TOGGLE);
  check('mobile panel opens below the sound button (does not cover it)', panel.top >= toggleRect.bottom, { panelTop: panel.top, buttonBottom: toggleRect.bottom });
  check('focus moves into the panel when it opens', await evaluate(page, `Boolean(document.activeElement?.closest('.audio-settings__panel'))`));
  await screenshot(page, 'mobile-gameplay-audio-panel');
  await click(page, `document.querySelector('.audio-settings__mute')`);
  a = await audio(page);
  check('tap mute works on mobile', a.snap.settings.muted === true);
  await page.close();
}

/**
 * Footsteps follow MarsScene's onMovementChange (real displacement), so they must start
 * only while the astronaut moves and stop on release, collision, decision lock,
 * AstroBot, unmount and mission restart.
 */
async function walkingFootsteps(browser) {
  current = 'walking-footsteps';
  const page = await openPage(browser);
  await navigate(page, `${BASE}?audioDebug=1`);
  check('entered Level 1', await enterMission(page, 'First Day on Mars'));
  await sleep(800);
  const fps = await measureFps(page);
  check('scene renders ≥ 10 fps (movement is clamped at 0.1 s per frame)', fps >= 10, { fps });
  const s0 = await steps(page);
  await sleep(1000);
  check('standing still: no footsteps', s0 === 0 && (await steps(page)) === 0, { s0 });

  await keyDown(page, 's');
  await sleep(600);
  const sMid = await steps(page);
  await sleep(700);
  await keyUp(page, 's');
  const sRel = await steps(page);
  await sleep(900);
  const sAfter = await steps(page);
  check('steps start as soon as the astronaut moves and repeat while walking', sMid >= 1 && sRel >= 3, { sMid, sRel });
  check('steps stop on key release', sAfter === sRel, { sRel, sAfter });

  // Keep walking toward the +x/+z corner until the map edge pins the astronaut, key still held.
  await keyDown(page, 's');
  await sleep(6000);
  const pinA = await steps(page);
  await sleep(1500);
  const pinB = await steps(page);
  await keyUp(page, 's');
  check('steps stop when the astronaut is blocked (pinned at the map edge, key still held)', pinA > sAfter && pinB === pinA, { sAfter, pinA, pinB });

  await keyDown(page, 'w');
  await sleep(700);
  const sW = await steps(page);
  await click(page, `document.querySelector('.task-prompt__action')`);
  await waitFor(page, `document.querySelector('.contextual-panel')`);
  const lockA = await steps(page);
  await sleep(1200);
  const lockB = await steps(page);
  await keyUp(page, 'w');
  await key(page, 'd', { holdMs: 800 });
  const lockC = await steps(page);
  check('decision panel locks movement: steps stop, keys pressed during it make none', sW > pinB && lockB === lockA && lockC === lockA, { sW, lockA, lockB, lockC });
  await click(page, `document.querySelectorAll('.decision-option')[0]`);
  await waitFor(page, `document.querySelector('.decision-continue:not([disabled])')`);
  await click(page, `document.querySelector('.decision-continue')`);
  await sleep(300);

  await keyDown(page, 'w');
  await sleep(700);
  const sB = await steps(page);
  await click(page, btnByText('💡 Ask AstroBot'));
  await waitFor(page, `document.querySelector('.astro-chatbot-panel')`);
  const botA = await steps(page);
  await sleep(1200);
  const botB = await steps(page);
  await keyUp(page, 'w');
  check('opening AstroBot stops footsteps while the key is still held', sB > lockC && botB === botA, { sB, botA, botB });
  await click(page, `document.querySelector('.astro-chatbot-close')`);
  await sleep(300);

  await keyDown(page, 'w');
  await sleep(700);
  const sU = await steps(page);
  await click(page, `document.querySelector('.gameplay-back-button')`);
  await waitFor(page, `!document.querySelector('.gameplay-page')`, 5000);
  const goneA = await steps(page);
  await sleep(1200);
  const goneB = await steps(page);
  await keyUp(page, 'w');
  check('leaving the mission (unmount) stops footsteps', sU > botB && goneB === goneA, { sU, goneA, goneB });

  await click(page, byAria('Start First Day on Mars'));
  await waitFor(page, `document.querySelector('.gameplay-page')`, 15_000);
  const newA = await steps(page);
  await sleep(1200);
  check('mission restarted: no footsteps until the astronaut moves', (await steps(page)) === newA, { newA });
  await page.close();
}

async function level3AndAvatar(browser) {
  current = 'level-3+avatar+brief';
  const page = await openPage(browser);
  await navigate(page, `${BASE}?audioDebug=1`);
  await evaluate(page, progress(['level-1-first-day', 'level-2-power-crisis']));
  await page.send('Page.reload');
  await waitFor(page, `window.__asterAudio`, 15_000);
  await click(page, `document.querySelector('.hero-cta')`);
  await waitFor(page, `document.querySelectorAll('.avatar-picker__grid button').length > 2`);
  const name = await evaluate(page, `document.querySelectorAll('.avatar-picker__grid button')[2].querySelector('.avatar-card__copy strong')?.textContent.trim()`);
  await click(page, `document.querySelectorAll('.avatar-picker__grid button')[2]`);
  await sleep(500);
  check('picking a different avatar updates the Confirm button', Boolean(name) && (await evaluate(page, `${btnByText('Confirm')}?.textContent.includes(${JSON.stringify(name ?? '')})`)), { name });
  await click(page, btnByText('Confirm'));
  await waitFor(page, byAria('Start Oxygen Emergency'));
  await click(page, byAria('Start Oxygen Emergency'));
  await waitFor(page, `document.querySelector('.gameplay-page')`, 15_000);
  check('chosen avatar shown in the mission HUD', await evaluate(page, `document.querySelector('.gameplay-cadet')?.textContent.includes(${JSON.stringify(name ?? '')})`), { name });
  check('Level 3 renders the 3D scene (no WebGL fallback)', await evaluate(page, `Boolean(document.querySelector('.gameplay-page canvas')) && !document.body.textContent.includes('preview unavailable')`));
  await screenshot(page, 'desktop-level3-avatar');
  for (let i = 0; i < 3; i += 1) await playEvent(page, 0);
  const done = await waitFor(page, `!document.querySelector('.gameplay-page')`, 5000);
  const a = await audio(page);
  check('Level 3 completes: mission-complete + brief-open, ambience stopped', done && a.stats.playCounts['mission-complete'] === 1 && a.stats.playCounts['brief-open'] === 1 && a.snap.ambienceSource === 'none', a.stats.playCounts);
  await screenshot(page, 'desktop-mission-brief');
  await page.close();
}

async function hotspotsAndRocket(browser, model) {
  current = 'hotspots+rocket';
  const page = await openPage(browser);
  await navigate(page, `${BASE}?audioDebug=1`);
  check('entered Level 1', await enterMission(page, 'First Day on Mars'));
  await sleep(600);
  await screenshot(page, 'desktop-spawn-terrain');
  const restart = async () => {
    await click(page, `document.querySelector('.gameplay-back-button')`);
    await waitFor(page, byAria('Start First Day on Mars'));
    await click(page, byAria('Start First Day on Mars'));
    await waitFor(page, `document.querySelector('.gameplay-page [data-nearby-hotspot]')`, 15_000);
    await sleep(500);
  };
  let firstRun = true;
  for (const h of model.cfg.HOTSPOTS) {
    if (!firstRun) await restart();
    firstRun = false;
    const plan = planPath(model, (x, z) => model.math.findNearestInteractable({ x, z }, model.cfg.HOTSPOTS) === h.id && Math.hypot(x - h.x, z - h.z) <= h.interactRadius - 0.5);
    if (!plan) {
      check(`path exists to ${h.id}`, false, 'planner found no path');
      continue;
    }
    const before = (await audio(page)).stats.playCounts;
    await walk(page, plan);
    const reached = await waitFor(page, `${nearbyAttr} === ${JSON.stringify(h.id)}`, 2000);
    const after = (await audio(page)).stats.playCounts;
    const seconds = plan.segments.reduce((t, s) => t + s.ms, 0) / 1000;
    check(`walked to "${h.id}" with real key holds; the scene reports it nearby`, reached, { got: await evaluate(page, nearbyAttr), segments: plan.segments.length, seconds });
    check(`proximity ping and footsteps on the way to "${h.id}"`, (after['proximity-scanner'] ?? 0) > (before['proximity-scanner'] ?? 0) && (after.footstep ?? 0) > (before.footstep ?? 0), { ping: [before['proximity-scanner'] ?? 0, after['proximity-scanner'] ?? 0], steps: [before.footstep ?? 0, after.footstep ?? 0] });
  }
  await restart();
  const rocket = model.cfg.DECORATIVE_OBSTACLES?.[0];
  const rocketPlan = rocket && planPath(model, (x, z) => Math.hypot(x - rocket.x, z - rocket.z) <= 2.6);
  check('rocket exists in the scene config and is reachable', Boolean(rocketPlan), rocket);
  if (rocketPlan) {
    await walk(page, rocketPlan);
    await sleep(400);
    await screenshot(page, 'desktop-rocket-landing-zone');
  }
  await page.close();
}

// Level 2 · optional remote cleaning-rover activity (Solar Panel Dust Rescue)
const ROVER_BUTTON = `document.querySelector('.rover-activity-card__button')`;
const roverResult = `document.querySelector('.rover-console .solar-result')`;
const resourceHud = (page) => evaluate(page, `document.querySelector('.gameplay-resource-hud')?.textContent ?? ''`);
const openDecisions = (page) => evaluate(page, `document.querySelectorAll('.decision-option:not(:disabled)').length`);

/** Enters Level 2 from an old v1 save (Level 1 done) and decides its first event. */
async function enterLevel2AtSolarEvent(page) {
  await navigate(page, `${BASE}?audioDebug=1`);
  await evaluate(page, progress(['level-1-first-day']));
  await page.send('Page.reload');
  await waitFor(page, `window.__asterAudio`, 15_000);
  check('Level 2 unlocked from a v1 save and entered', await enterMission(page, 'Power Crisis'));
  await sleep(600);
  check('Level 2 event 1 decided', await playEvent(page, 0));
}

/** Swipes (touch) across every cell, 4 strokes per cell, until the result card shows. */
async function swipeCells(page) {
  for (let pass = 0; pass < 6 && !(await evaluate(page, `Boolean(${roverResult})`)); pass += 1) {
    const cells = await evaluate(page, `[...document.querySelectorAll('.rover-console .solar-cell')].map(c => { const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; })`);
    const pts = cells.flatMap((c) => [-0.3, -0.1, 0.1, 0.3].map((f) => ({ x: c.x + f * c.w, y: c.y })));
    await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pts[0]] });
    for (const p of pts) await page.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [p] });
    await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(150);
  }
}

async function solarRoverConsole(browser, model) {
  current = 'level-2-rover-console';
  const page = await openPage(browser);
  await enterLevel2AtSolarEvent(page);

  // Walk to the solar array with real key holds, then inspect it with E.
  const solar = model.cfg.HOTSPOTS.find((h) => h.id === 'solar');
  const plan = solar && planPath(model, (x, z) => model.math.findNearestInteractable({ x, z }, model.cfg.HOTSPOTS) === 'solar' && Math.hypot(x - solar.x, z - solar.z) <= solar.interactRadius - 0.5);
  const walkStart = await steps(page);
  if (plan) await walk(page, plan);
  const reached = await waitFor(page, `${nearbyAttr} === 'solar'`, 2000);
  check('walked to the solar array with real keys; footsteps on the way', reached && (await steps(page)) > walkStart, { reached, steps: [walkStart, await steps(page)] });
  await key(page, 'e');
  check('E at the solar array opens its decision with the optional rover button', await waitFor(page, ROVER_BUTTON));

  const counts = async () => (await audio(page)).stats.playCounts;
  const hudBefore = await resourceHud(page);
  await click(page, ROVER_BUTTON);
  check('"Operate Cleaning Rover" opens the console and focuses the rover cell', await waitFor(page, `document.activeElement?.matches('.rover-console [data-cell-id]')`));
  await screenshot(page, 'desktop-rover-console');

  // Held movement keys while the console is open: no footsteps, the astronaut stays put.
  const lockA = await steps(page);
  await key(page, 'w', { holdMs: 1200 });
  await key(page, 'd', { holdMs: 600 });
  const lockB = await steps(page);
  check('console open: held W/D make no footsteps and do not move the astronaut', lockB === lockA && (await evaluate(page, nearbyAttr)) === 'solar', { lockA, lockB, nearby: await evaluate(page, nearbyAttr) });

  // Keyboard play to completion.
  const c1 = await counts();
  let presses = 0;
  for (let i = 0; i < 60 && !(await evaluate(page, `Boolean(${roverResult})`)); i += 1) {
    for (let k = 0; k < 4; k += 1) { await key(page, 'c'); presses += 1; }
    await key(page, 'ArrowRight');
  }
  await sleep(400);
  const c2 = await counts();
  const d = (a, b, id) => (b[id] ?? 0) - (a[id] ?? 0);
  check('keyboard play (arrows steer, C brushes) completes the cleaning pass', await evaluate(page, `Boolean(${roverResult})`), { presses });
  check('success plays the existing "card opens" cue exactly once', d(c1, c2, 'brief-open') === 1, { briefOpen: d(c1, c2, 'brief-open') });
  check('brush strokes give quiet, rate-limited ticks', d(c1, c2, 'menu-navigate') >= 1 && d(c1, c2, 'menu-navigate') < presses, { ticks: d(c1, c2, 'menu-navigate'), presses });
  check('no decision cue and all three decisions still open (no automatic decision)', d(c1, c2, 'decision-select') === 0 && (await openDecisions(page)) === 3);
  check('no footsteps during the activity; resources unchanged', d(c1, c2, 'footstep') === 0 && (await resourceHud(page)) === hudBefore);

  // Retry: a new pass with the existing scan cue; extra keys after success add no completion cue.
  for (let k = 0; k < 4; k += 1) await key(page, 'c');
  const c3 = await counts();
  check('input after success plays no second completion cue', d(c2, c3, 'brief-open') === 0);
  await click(page, btnByText('Clean Again'));
  await sleep(250);
  const c4 = await counts();
  check('"Clean Again" reapplies the dust and plays the existing scan cue once', d(c3, c4, 'inspect-system') === 1 && (await evaluate(page, `document.querySelector('.rover-console .solar-stat-value')?.textContent`)) === '0%');

  // Escape cancels mid-pass; focus returns; nothing changed.
  await key(page, 'Escape');
  await sleep(200);
  check('Escape closes the console and returns focus to "Operate Cleaning Rover"', (await evaluate(page, `!document.querySelector('.rover-console') && document.activeElement?.classList.contains('rover-activity-card__button')`)) === true);
  check('cancel changed no resources and left the decisions open', (await resourceHud(page)) === hudBefore && (await openDecisions(page)) === 3);

  // The real decision still works exactly once, then walking makes footsteps again.
  const c5 = await counts();
  await click(page, `document.querySelectorAll('.decision-option')[0]`);
  await waitFor(page, `document.querySelector('.decision-continue:not([disabled])')`);
  check('the mission decision plays its cue once and changes resources', d(c5, await counts(), 'decision-select') === 1 && (await resourceHud(page)) !== hudBefore);
  await click(page, `document.querySelector('.decision-continue')`);
  await sleep(300);
  const r0 = await steps(page);
  await key(page, 's', { holdMs: 900 });
  check('after the console and the decision, walking makes footsteps again', (await steps(page)) > r0, { r0, r1: await steps(page) });
  await page.close();
}

async function solarRoverTouch(browser) {
  current = 'level-2-rover-touch';
  const page = await openPage(browser, { mobile: true });
  await enterLevel2AtSolarEvent(page);
  await click(page, `document.querySelector('.task-prompt__action')`);
  check('tapping Inspect System shows the optional rover button', await waitFor(page, ROVER_BUTTON));
  const hudBefore = await resourceHud(page);
  await click(page, ROVER_BUTTON);
  check('tap opens the rover console', await waitFor(page, `document.querySelector('.rover-console .solar-cell')`));
  const fits = await evaluate(page, `document.documentElement.clientWidth >= Math.max(...[...document.querySelectorAll('.rover-console .solar-cell')].map(c => c.getBoundingClientRect().right))`);
  check('console fits the 390 px screen (no cell off-screen)', fits);
  await screenshot(page, 'mobile-rover-console');
  const c1 = (await audio(page)).stats.playCounts;
  await swipeCells(page);
  await sleep(400);
  const c2 = (await audio(page)).stats.playCounts;
  check('finger swipes finish the cleaning pass', await evaluate(page, `Boolean(${roverResult})`));
  const touchStats = (await audio(page)).stats;
  const touchCue = (c2['brief-open'] ?? 0) - (c1['brief-open'] ?? 0);
  const touchOpen = await openDecisions(page);
  const touchHudSame = (await resourceHud(page)) === hudBefore;
  check('touch success: one completion cue, no decision, resources unchanged', touchCue === 1 && touchOpen === 3 && touchHudSame, { touchCue, touchOpen, touchHudSame, suppressed: touchStats.suppressedCounts });
  await screenshot(page, 'mobile-rover-result');
  await click(page, btnByText('Back to mission decisions'));
  await sleep(250);
  check('"Back to mission decisions" returns to the three decisions', (await evaluate(page, `!document.querySelector('.rover-console')`)) && (await openDecisions(page)) === 3);
  await page.close();
}

/** Replays a plan through the scene's own physics at 60 fps (as PlayerRig does) and returns where it ends. */
function simulatePlan(model, plan) {
  const { cfg, math } = model;
  let pos = { ...cfg.PLAYER_SPAWN };
  const DIR_OF = { w: 'up', s: 'down', a: 'left', d: 'right' };
  for (const seg of plan.segments) {
    const input = math.createInputState();
    seg.keys.forEach((k) => { input[DIR_OF[k]] = true; });
    const dir = math.screenToWorld(math.readInputVector(input));
    const frames = Math.round((seg.ms / 1000) * 60);
    for (let f = 0; f < frames; f += 1) {
      pos = math.resolveCollisions(math.stepPosition(pos, dir, cfg.PLAYER_SPEED, 1 / 60), cfg.OBSTACLES, cfg.PLAYER_RADIUS, cfg.PLAYER_BOUNDS);
    }
  }
  return { pos, nearby: math.findNearestInteractable(pos, cfg.HOTSPOTS) };
}

if ('plan-only' in args) {
  const model = await loadSceneModel();
  let ok = true;
  for (const h of model.cfg.HOTSPOTS) {
    const plan = planPath(model, (x, z) => model.math.findNearestInteractable({ x, z }, model.cfg.HOTSPOTS) === h.id && Math.hypot(x - h.x, z - h.z) <= h.interactRadius - 0.5);
    const sim = plan && simulatePlan(model, plan);
    ok &&= Boolean(sim && sim.nearby === h.id);
    console.log(`${sim?.nearby === h.id ? 'OK  ' : 'FAIL'} ${h.id.padEnd(15)} ${plan ? `${plan.segments.length} segments, ${(plan.segments.reduce((t, s) => t + s.ms, 0) / 1000).toFixed(1)} s → sim ends (${sim.pos.x.toFixed(2)}, ${sim.pos.z.toFixed(2)}) nearby=${sim.nearby}` : 'NO PATH'}`);
  }
  console.log(`obstacles: ${model.cfg.OBSTACLES.length}, rocket: ${JSON.stringify(model.cfg.DECORATIVE_OBSTACLES)}`);
  process.exit(ok ? 0 : 1);
}

// ---------------------------------------------------------------------------
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  '--autoplay-policy=user-gesture-required', '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: 'ignore' });

try {
  let version = null;
  for (let i = 0; i < 50 && !version; i += 1) {
    version = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).catch(() => null);
    if (!version) await sleep(200);
  }
  if (!version) throw new Error('Chrome DevTools endpoint did not start');
  console.log(`Browser: ${version.Browser}  ·  App: ${BASE}\n`);
  const browser = new CDP(version.webSocketDebuggerUrl);
  await browser.ready;
  const model = await loadSceneModel().catch((e) => {
    console.log(`Scene model unavailable (${e.message}); hotspot walks skipped.`);
    return null;
  });
  const all = {
    desktopFlow, warningScenario, stabilizationAndAstroBot, walkingFootsteps, level3AndAvatar,
    ...(model ? { hotspotsAndRocket: (b) => hotspotsAndRocket(b, model), solarRoverConsole: (b) => solarRoverConsole(b, model) } : {}),
    missingAsset: (b) => assetFailure(b, 404), unsupportedFormat: (b) => assetFailure(b, 'format'), noWebAudio, mobileFlow, solarRoverTouch,
  };
  // --only name1,name2 runs a subset (for debugging); default: everything.
  const wanted = args.only ? new Set(String(args.only).split(',')) : null;
  const scenarios = Object.entries(all).filter(([name]) => !wanted || wanted.has(name)).map(([, fn]) => fn);
  for (const scenario of scenarios) {
    try {
      await scenario(browser);
    } catch (e) {
      check('scenario completed without harness error', false, e.message);
    }
  }
  const failed = results.filter((r) => !r.ok);
  writeFileSync(join(OUT, 'audio-qa-results.json'), JSON.stringify({ browser: version.Browser, app: BASE, ranAt: new Date().toISOString(), results, consoleErrors }, null, 2));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed; ${consoleErrors.length} console error(s) captured.`);
  consoleErrors.forEach((e) => console.log(`  console [${e.scenario}]: ${e.text}`));
  process.exitCode = failed.length ? 1 : 0;
} finally {
  chrome.kill();
}
