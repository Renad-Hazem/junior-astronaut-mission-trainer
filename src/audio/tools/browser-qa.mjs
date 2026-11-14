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
  w: ['w', 'KeyW', 87, 'w'], d: ['d', 'KeyD', 68, 'd'], e: ['e', 'KeyE', 69, 'e'],
  ArrowLeft: ['ArrowLeft', 'ArrowLeft', 37], Escape: ['Escape', 'Escape', 27],
};
async function key(page, name, { holdMs = 0 } = {}) {
  const [k, code, vk, text] = KEYS[name];
  await page.send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, ...(text ? { text } : {}) });
  if (holdMs) await sleep(holdMs);
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
}

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

  await key(page, 'd', { holdMs: 1200 });
  a = await audio(page);
  check('holding a movement key plays no footsteps (no keyboard inference; scene signal not wired yet)', (a.stats.playCounts.footstep ?? 0) === 0);

  const decBefore = a.stats.playCounts['decision-select'] ?? 0;
  for (let i = 0; i < 3; i += 1) await playEvent(page, 0);
  await click(page, `document.querySelector('.task-prompt__action')`);
  await waitFor(page, `document.querySelectorAll('.decision-option:not([disabled])').length > 0`);
  await click(page, `document.querySelectorAll('.decision-option')[0]`);
  await sleep(500);
  a = await audio(page);
  check('final exhausting decision plays stabilization (not decision/warning)', a.stats.playCounts.stabilization === 1 && a.stats.playCounts['decision-select'] === decBefore + 3, a.stats.playCounts);
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
  for (const scenario of [desktopFlow, warningScenario, stabilizationAndAstroBot, (b) => assetFailure(b, 404), (b) => assetFailure(b, 'format'), noWebAudio, mobileFlow]) {
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
