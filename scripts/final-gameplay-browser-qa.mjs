import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Override when other QA runs share the machine, e.g. QA_APP_PORT=4196 QA_DEBUG_PORT=9396 npm run qa:browser
const appPort = Number(process.env.QA_APP_PORT ?? 4174)
const debugPort = Number(process.env.QA_DEBUG_PORT ?? 9333)
const appUrl = `http://127.0.0.1:${appPort}/`
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
// QA_OUT_DIR moves the Chrome profile and screenshots off the system temp drive (e.g. when it is full).
const qaParent = process.env.QA_OUT_DIR ?? tmpdir()
mkdirSync(qaParent, { recursive: true })
const qaDirectory = mkdtempSync(join(qaParent, 'aster-base-final-qa-'))
const chromeProfile = join(qaDirectory, 'chrome-profile')
mkdirSync(chromeProfile)

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean)
  const match = candidates.find((candidate) => existsSync(candidate))
  if (!match) throw new Error('Chrome/Edge was not found. Set CHROME_PATH and retry.')
  return match
}

async function waitForUrl(url, attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Server is still starting.
    }
    await wait(100)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

// Never test another process's server or attach to another run's browser.
for (const url of [appUrl, `http://127.0.0.1:${debugPort}/json/version`]) {
  const busy = await fetch(url).then(() => true, () => false)
  if (busy) throw new Error(`${url} is already in use (another QA run?). Set QA_APP_PORT / QA_DEBUG_PORT.`)
}

const viteCli = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js')
const server = spawn(process.execPath, [viteCli, '--host', '127.0.0.1', '--port', String(appPort), '--strictPort'], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
})

let chrome
let socket

try {
  await waitForUrl(appUrl)
  chrome = spawn(chromePath(), [
    '--headless',
    '--enable-unsafe-swiftshader',
    '--no-first-run',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${chromeProfile}`,
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true })

  await waitForUrl(`http://127.0.0.1:${debugPort}/json`)
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()
  const target = targets.find((candidate) => candidate.type === 'page')
  if (!target) throw new Error('Chrome did not expose a page target')

  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })

  let sequence = 0
  const pending = new Map()
  const exceptions = []
  const consoleErrors = []
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
    }
    if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text)
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(message.params.args.map((argument) => argument.value ?? argument.description).join(' '))
    }
  }
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++sequence
    pending.set(id, resolve)
    socket.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async (expression) => {
    const response = await send('Runtime.evaluate', {
      expression: `(async()=>(${expression}))()`,
      awaitPromise: true,
      returnByValue: true,
    })
    if (response.result.exceptionDetails) {
      throw new Error(response.result.exceptionDetails.exception?.description ?? response.result.exceptionDetails.text)
    }
    return response.result.result.value
  }
  const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)})?.click() ?? false`)
  const key = (type, keyValue, code) => send('Input.dispatchKeyEvent', { type, key: keyValue, code })
  const pressFor = async (keyValue, code, milliseconds) => {
    await key('keyDown', keyValue, code)
    await wait(milliseconds)
    await key('keyUp', keyValue, code)
    await wait(100)
  }
  const assert = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  const waitForSelector = async (selector, attempts = 60) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`)) return
      await wait(100)
    }
    throw new Error(`Timed out waiting for ${selector}`)
  }
  const reloadAndWait = async () => {
    const before = await evaluate('performance.timeOrigin')
    await send('Page.reload')
    for (let i = 0; i < 200; i += 1) {
      const now = await evaluate('performance.timeOrigin').catch(() => before)
      if (now !== before) break
      await wait(50)
    }
  }
  const nearbyHotspot = () => evaluate(`document.querySelector('.mars-scene')?.dataset.nearbyHotspot ?? ''`)
  const holdUntilNearby = async (hotspot, keyValue, code, timeout = 6000) => {
    await key('keyDown', keyValue, code)
    const started = Date.now()
    while (Date.now() - started < timeout) {
      await wait(80)
      if ((await nearbyHotspot()) === hotspot) {
        await key('keyUp', keyValue, code)
        await wait(80)
        return
      }
    }
    await key('keyUp', keyValue, code)
    throw new Error(`Timed out approaching ${hotspot}; nearby=${await nearbyHotspot()}`)
  }
  const lastBotReply = () => evaluate(`(()=>{
    const rows=[...document.querySelectorAll('.astro-message-row--bot')].filter((row)=>!row.querySelector('.astro-thinking-bubble'))
    const last=rows.at(-1)
    if (!last) return {text:'', sources:[]}
    return {
      text: last.querySelector('.astro-message-text')?.textContent ?? '',
      sources: [...last.querySelectorAll('.astro-source-link')].map((link)=>link.getAttribute('href')),
    }
  })()`)
  const askLibraryBot = async (question) => {
    if (!(await evaluate(`!!document.querySelector('.astro-chatbot-panel')`))) {
      await click('.library-ask-ai-btn')
      await waitForSelector('.astro-chatbot-panel')
    }
    await evaluate(`(()=>{
      const input=document.querySelector('.astro-chat-input')
      const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set
      setter.call(input, ${JSON.stringify(question)})
      input.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })()`)
    await click('.astro-chat-submit')
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const thinking = await evaluate(`!!document.querySelector('.astro-thinking-bubble')`)
      if (!thinking) break
      await wait(100)
    }
    await wait(80)
    return lastBotReply()
  }
  const screenshot = async (name) => {
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    const filePath = join(qaDirectory, `${name}.png`)
    writeFileSync(filePath, Buffer.from(result.result.data, 'base64'))
    return filePath
  }
  const enterLibrary = async () => {
    await click('.hero-cta')
    await waitForSelector('.avatar-picker')
    await click('.avatar-picker__actions .primary-button')
    await waitForSelector('.mission-grid')
  }
  const storeState = (projection) => evaluate(`(async()=>{const m=await import('/src/game/useGameStore.ts');const s=m.useGameStore.getState();return (${projection})})()`)
  const openCurrentDecision = async () => {
    await click('.task-prompt__action')
    await waitForSelector('.contextual-panel')
  }
  /** Real key press with key codes, so native defaults (Tab focus, Space/Enter on buttons) happen. */
  const KEYMAP = {
    Tab: ['Tab', 'Tab', 9], Escape: ['Escape', 'Escape', 27], Enter: ['Enter', 'Enter', 13, '\r'], Space: [' ', 'Space', 32, ' '],
    c: ['c', 'KeyC', 67, 'c'], ArrowRight: ['ArrowRight', 'ArrowRight', 39], ArrowDown: ['ArrowDown', 'ArrowDown', 40],
  }
  const press = async (name) => {
    const [keyValue, code, vk, text] = KEYMAP[name]
    await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key: keyValue, code, windowsVirtualKeyCode: vk, ...(text ? { text } : {}) })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyValue, code, windowsVirtualKeyCode: vk })
  }
  /** Everything a decision can change. Used to prove the rover activity changes none of it. */
  const gameState = () => storeState(`JSON.stringify({resources:s.resources,history:s.choiceHistory.length,event:s.currentEventIndex,resolved:!!s.resolvedChoiceForCurrentEvent,completed:s.completedLevelIds})`)
  /** Picks the optimal option (double click) and proves its effects were applied exactly once. */
  const decideOptimal = async () => {
    const before = await storeState(`({history:s.choiceHistory.length,event:s.currentEventIndex})`)
    const optimalIndex = await storeState(`s.currentLevel.events[s.currentEventIndex].choices.findIndex(choice=>choice.isOptimalHint)`)
    assert(optimalIndex >= 0, 'Current event has no optimal test choice')
    const expected = await storeState(`JSON.stringify((()=>{const ev=s.currentLevel.events[s.currentEventIndex];const ch=ev.choices[${optimalIndex}];const out={};for(const k of Object.keys(s.resources)){out[k]=Math.max(0,Math.min(100,Math.round(s.resources[k]+(ev.openingEffects?.[k]??0)+(ch.effects?.[k]??0))))}return out})())`)
    await evaluate(`(()=>{const button=document.querySelectorAll('.decision-option')[${optimalIndex}];button.click();button.click();return true})()`)
    await wait(80)
    const afterChoice = await storeState(`({history:s.choiceHistory.length,awaiting:!!s.resolvedChoiceForCurrentEvent,resources:JSON.stringify(s.resources)})`)
    assert(afterChoice.history === before.history + 1 && afterChoice.awaiting, 'Double decision applied more than once')
    assert(afterChoice.resources === expected, `Decision effects not applied exactly once: expected ${expected}, got ${afterChoice.resources}`)
  }
  const continueAfterDecision = async () => {
    await evaluate(`(()=>{const button=document.querySelector('.decision-continue');button.click();button.click();return true})()`)
    await wait(180)
  }
  const chooseOptimalAndContinue = async () => {
    await decideOptimal()
    await continueAfterDecision()
  }

  // Level 2 · optional remote cleaning-rover activity (Solar Panel Dust Rescue).
  const SOLAR_ROVER_EVENT = 'l2-e2-solar-cleanup'
  const roverPasses = () => evaluate(`Number(document.querySelector('.rover-activity-card')?.dataset.roverPasses ?? -1)`)
  const roverResultShown = () => evaluate(`!!document.querySelector('.rover-console .solar-result')`)
  const roverProgress = () => evaluate(`Number(document.querySelector('.rover-console .solar-stat-value')?.textContent.replace('%','') ?? -1)`)
  const openRoverConsole = async () => {
    // A rapid double click must still open exactly one console.
    await evaluate(`(()=>{const b=document.querySelector('.rover-activity-card__button');b.click();b.click();return true})()`)
    await waitForSelector('.rover-console .solar-cell')
    await wait(120)
    assert((await evaluate(`document.querySelectorAll('.rover-console').length`)) === 1, 'Double click opened more than one rover console')
    assert(await evaluate(`document.querySelector('.gameplay-page').inert === true`), 'Gameplay page is not inert behind the rover console')
  }
  /** Drags (mouse) or swipes (touch) across every cell, 4 strokes per cell, until the result card shows. */
  const sweepCells = async (kind) => {
    for (let pass = 0; pass < 6 && !(await roverResultShown()); pass += 1) {
      const cells = await evaluate(`[...document.querySelectorAll('.rover-console .solar-cell')].map(c=>{const r=c.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width}})`)
      const points = cells.flatMap((cell) => [-0.3, -0.1, 0.1, 0.3].map((f) => ({ x: cell.x + f * cell.w, y: cell.y })))
      const [first] = points
      const last = points.at(-1)
      if (kind === 'mouse') {
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: first.x, y: first.y })
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: first.x, y: first.y, button: 'left', buttons: 1, clickCount: 1 })
        for (const p of points) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, button: 'left', buttons: 1 })
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: last.x, y: last.y, button: 'left', buttons: 0, clickCount: 1 })
      } else {
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: first.x, y: first.y }] })
        for (const p of points) await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x, y: p.y }] })
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      }
      await wait(150)
    }
  }
  let roverEvidence = null
  const solarRoverFlow = async () => {
    const baseline = await gameState()
    const assertUnchanged = async (label) => {
      const now = await gameState()
      assert(now === baseline, `${label} changed resources, progress or decisions: ${baseline} → ${now}`)
    }
    assert((await roverPasses()) === 0, 'Rover activity did not start fresh for this objective')

    // A · open, movement lock, keyboard steering, focus trap, Escape = cancel
    await openRoverConsole()
    assert(await evaluate(`document.activeElement?.matches('.rover-console [data-cell-id]') ?? false`), 'Rover console did not focus the rover cell')
    const nearbyBefore = await nearbyHotspot()
    await key('keyDown', 'd', 'KeyD')
    await wait(800)
    await key('keyUp', 'd', 'KeyD')
    assert((await nearbyHotspot()) === nearbyBefore, 'Astronaut moved while the rover console was open')
    const startCell = await evaluate(`document.activeElement.dataset.cellId`)
    await press('ArrowRight')
    await press('ArrowDown')
    const steeredCell = await evaluate(`document.activeElement.dataset.cellId ?? ''`)
    assert(steeredCell && steeredCell !== startCell, 'Arrow keys did not steer the rover inside the console')
    for (let i = 0; i < 8; i += 1) await press('Tab')
    assert(await evaluate(`!!document.activeElement?.closest('.rover-console')`), 'Tab focus escaped the rover console')
    await press('Escape')
    await wait(150)
    assert(!(await evaluate(`!!document.querySelector('.rover-console')`)), 'Escape did not close the rover console')
    assert(await evaluate(`document.activeElement?.classList.contains('rover-activity-card__button') ?? false`), 'Focus did not return to Operate Cleaning Rover after cancel')
    assert((await roverPasses()) === 0 && /Nothing changed/.test(await evaluate(`document.querySelector('.rover-activity-card').textContent`)), 'Cancel status is wrong')
    assert((await evaluate(`document.querySelectorAll('.decision-option:not(:disabled)').length`)) === 3, 'Decision options are not all available after cancel')
    await assertUnchanged('Cancelling the rover console')

    // B · keyboard success (Space through the native button click, then C), exactly one completion
    await openRoverConsole()
    const consoleScreenshot = await screenshot('level-2-rover-console')
    await press('Space')
    await wait(60)
    assert((await roverProgress()) > 0, 'Space did not brush the focused cell')
    for (let i = 0; i < 60 && !(await roverResultShown()); i += 1) {
      for (let k = 0; k < 4; k += 1) await press('c')
      await press('ArrowRight')
    }
    assert(await roverResultShown(), 'Keyboard play did not finish the cleaning pass')
    await wait(200)
    assert((await roverPasses()) === 1, `Keyboard pass reported ${await roverPasses()} completions (expected exactly 1)`)
    assert(await evaluate(`document.activeElement?.textContent.includes('Back to mission decisions') ?? false`), 'Result card did not take keyboard focus')
    for (let k = 0; k < 6; k += 1) await press('c')
    assert((await roverPasses()) === 1, 'Input after completion reported another completion')
    const resultCopy = await evaluate(`document.querySelector('.solar-result').textContent`)
    assert(/does not change base resources/.test(resultCopy) && /InSight/.test(resultCopy) && /Opportunity/.test(resultCopy) && /not a real NASA machine/.test(resultCopy), 'Result card science or disclaimer copy is missing')
    const sourceLinks = await evaluate(`[...document.querySelectorAll('.solar-science-sources a')].map(a=>a.href)`)
    assert(sourceLinks.length === 2 && sourceLinks.every((href) => /^https:\/\/[^/]*nasa\.gov\//.test(href)), `Rover science links are not NASA https links: ${sourceLinks}`)
    await evaluate(`(document.querySelector('.solar-result').scrollIntoView({block:'start'}),true)`)
    const resultScreenshot = await screenshot('level-2-rover-result')
    await assertUnchanged('Completing the rover pass with the keyboard')

    // C · retry ("Clean Again") with a mouse drag: a new pass, a new single completion
    await evaluate(`([...document.querySelectorAll('.rover-console button')].find(b=>b.textContent.includes('Clean Again')).click(),true)`)
    await waitForSelector('.rover-console .solar-array-surface')
    await wait(100)
    assert((await roverProgress()) === 0, 'Retry did not reapply the dust')
    assert(await evaluate(`document.activeElement?.matches('.rover-console [data-cell-id]') ?? false`), 'Retry did not return keyboard focus to the rover cell')
    await sweepCells('mouse')
    assert(await roverResultShown(), 'Mouse drag did not finish the cleaning pass')
    await wait(200)
    assert((await roverPasses()) === 2, `Mouse retry reported ${await roverPasses()} total completions (expected 2)`)
    await press('Enter')
    await wait(200)
    assert(!(await evaluate(`!!document.querySelector('.rover-console')`)), '"Back to mission decisions" did not close the console')
    assert(await evaluate(`document.activeElement?.classList.contains('rover-activity-card__button') ?? false`), 'Focus did not return to Operate Cleaning Rover after success')
    assert(/Cleaning pass complete/.test(await evaluate(`document.querySelector('.rover-activity-card').textContent`)), 'Success status missing on the decision panel')
    await assertUnchanged('Mouse retry pass')

    // D · touch swipe, then leave with Exit
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
    await openRoverConsole()
    await sweepCells('touch')
    assert(await roverResultShown(), 'Touch swipe did not finish the cleaning pass')
    await wait(200)
    assert((await roverPasses()) === 3, `Touch pass reported ${await roverPasses()} total completions (expected 3)`)
    await evaluate(`(document.querySelector('.rover-console .solar-btn--cancel').click(),true)`)
    await wait(150)
    await send('Emulation.setTouchEmulationEnabled', { enabled: false })
    assert(!(await evaluate(`!!document.querySelector('.rover-console')`)), 'Exit did not close the console')
    assert((await roverPasses()) === 3, 'Exit after success changed the completion count')
    await assertUnchanged('Touch pass')
    return { passes: await roverPasses(), consoleScreenshot, resultScreenshot, sourceLinks }
  }

  const completeActiveMission = async (levelIndex) => {
    const eventCount = await storeState('s.currentLevel.events.length')
    for (let eventIndex = 0; eventIndex < eventCount; eventIndex += 1) {
      await openCurrentDecision()
      const focusInside = await evaluate(`document.querySelector('.contextual-panel').contains(document.activeElement)`)
      assert(focusInside, `Level ${levelIndex + 1}, event ${eventIndex + 1}: modal focus was not contained`)
      const eventId = await storeState('s.currentLevel.events[s.currentEventIndex].id')
      const hasRoverCard = await evaluate(`!!document.querySelector('.rover-activity-card')`)
      assert(hasRoverCard === (eventId === SOLAR_ROVER_EVENT), `${eventId}: the rover activity appears on the wrong event`)
      if (eventId === SOLAR_ROVER_EVENT) roverEvidence = await solarRoverFlow()
      await chooseOptimalAndContinue()
    }
    await waitForSelector('.brief-page')
    const timelineCount = await evaluate(`document.querySelectorAll('.report-timeline li').length`)
    const completedCount = await storeState('s.completedLevelIds.length')
    assert(timelineCount === eventCount, `Level ${levelIndex + 1}: Mission Brief history mismatch`)
    assert(completedCount === levelIndex + 1, `Level ${levelIndex + 1}: sequential completion mismatch`)
    return { level: levelIndex + 1, events: eventCount, completedCount }
  }

  await send('Runtime.enable')
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: appUrl })
  await waitForSelector('.hero-cta')
  await evaluate(`localStorage.clear()`)
  await reloadAndWait()
  await waitForSelector('.hero-cta')
  await enterLibrary()

  const freshLocks = await evaluate(`[...document.querySelectorAll('.card-button')].map(button=>button.disabled)`)
  assert(JSON.stringify(freshLocks) === JSON.stringify([false, true, true, true, false]), `Fresh unlock state is wrong: ${JSON.stringify(freshLocks)}`)
  let bonusGameplayScreenshot
  let bonusBriefScreenshot

  // Bonus 05 is available on a fresh save, completes five decisions, and never unlocks Level 2.
  await evaluate(`document.querySelectorAll('.card-button')[4].click()`)
  await waitForSelector('.mars-scene canvas')
  const bonusEventCount = await storeState('s.currentLevel.events.length')
  assert(bonusEventCount === 5, `Bonus mission event count is ${bonusEventCount}`)
  const bonusEvidenceMap = await evaluate(`(async()=>{const m=await import('/src/data/nasa/bonusMission05.ts');return m.BONUS_MISSION_05.eventEvidence})()`)
  // In bonus content, "live" may only appear negated ("not live …", "Not live data"). The resource
  // dashboard's own "LIVE SYSTEMS" heading labels the fictional game values, not NASA data, so it is out of scope.
  const unnegatedLiveClaims = (selector) => evaluate(`(()=>{const text=[...document.querySelectorAll(${JSON.stringify(selector)})].map(e=>e.textContent).join(' | ');return [...text.matchAll(/\\blive\\b/gi)].map(m=>text.slice(Math.max(0,m.index-12),m.index+16)).filter(ctx=>!/not\\s+live/i.test(ctx))})()`)
  const isNasaHttps = (href) => /^https:\/\/([a-z0-9-]+\.)*nasa\.gov\//i.test(href)
  const bonusEventIds = []
  const bonusEvidenceLinks = new Set()
  for (let eventIndex = 0; eventIndex < bonusEventCount; eventIndex += 1) {
    await openCurrentDecision()
    const eventId = await storeState('s.currentLevel.events[s.currentEventIndex].id')
    bonusEventIds.push(eventId)
    assert(!(await evaluate(`!!document.querySelector('.rover-activity-card')`)), 'Rover activity leaked into the bonus mission')
    await decideOptimal()
    assert((await storeState('s.choiceHistory.length')) === eventIndex + 1, `Bonus decision ${eventIndex + 1} applied more than once`)
    await waitForSelector('.contextual-panel .bonus-evidence-card')
    const evidence = await evaluate(`(()=>{const root=document.querySelector('.contextual-panel .bonus-evidence');const cards=[...root.querySelectorAll('.bonus-evidence-card')];return {count:cards.length,text:root.textContent,notLive:cards.filter(c=>/Not live data/.test(c.textContent)).length,links:cards.map(c=>c.querySelector('a')?.href ?? '')}})()`)
    const expectedCards = (bonusEvidenceMap[eventId] ?? []).length
    assert(expectedCards > 0 && evidence.count === expectedCards, `${eventId}: ${evidence.count} evidence cards, expected ${expectedCards}`)
    assert(/Historical replay/i.test(evidence.text) && /fictional training values/i.test(evidence.text), `${eventId}: bonus evidence provenance labels are missing`)
    assert(evidence.notLive === evidence.count, `${eventId}: an evidence card is missing its "Not live data" label`)
    assert(evidence.links.every(isNasaHttps), `${eventId}: evidence link is not a NASA https link: ${evidence.links}`)
    evidence.links.forEach((href) => bonusEvidenceLinks.add(href))
    const liveClaims = await unnegatedLiveClaims('.contextual-panel, .bonus-replay-badge')
    assert(liveClaims.length === 0, `${eventId}: historical data labelled live: ${liveClaims}`)
    if (eventIndex === 0) {
      await evaluate(`(document.querySelector('.bonus-evidence').scrollIntoView({block:'start'}),true)`)
      await wait(120)
      bonusGameplayScreenshot = await screenshot('bonus-05-event-evidence')
    }
    await continueAfterDecision()
  }
  await waitForSelector('.brief-page')
  await waitForSelector('.bonus-evidence-card')
  const bonusResult = await storeState(`({main:s.completedLevelIds,bonus:s.completedBonusMissionIds,history:s.choiceHistory.length})`)
  assert(bonusResult.history === 5, 'Bonus Mission Brief did not retain all five events')
  assert(bonusResult.main.length === 0 && bonusResult.bonus.length === 1, 'Bonus completion changed main progression')
  assert(await evaluate(`/not an official NASA Space Apps Challenge score/i.test(document.body.textContent)`), 'Storm Readiness disclaimer is missing')
  const uniqueBonusEvidence = new Set(bonusEventIds.flatMap((id) => bonusEvidenceMap[id] ?? [])).size
  const bonusBriefEvidence = await evaluate(`(()=>{const cards=[...document.querySelectorAll('.brief-page .bonus-evidence-card')];return {cards:cards.length,timeline:document.querySelectorAll('.report-timeline li').length,notLive:cards.filter(c=>/Not live data/.test(c.textContent)).length,links:cards.map(c=>c.querySelector('a')?.href ?? ''),heading:document.querySelector('.brief-page .bonus-evidence h3')?.textContent ?? ''}})()`)
  assert(bonusBriefEvidence.cards === uniqueBonusEvidence && bonusBriefEvidence.timeline === 5, `Brief evidence summary: ${bonusBriefEvidence.cards} cards (expected ${uniqueBonusEvidence}), ${bonusBriefEvidence.timeline} timeline rows`)
  assert(/five-event/i.test(bonusBriefEvidence.heading), 'Brief does not label the five-event evidence summary')
  assert(bonusBriefEvidence.notLive === bonusBriefEvidence.cards && bonusBriefEvidence.links.every(isNasaHttps), 'Brief evidence is missing "Not live data" labels or has non-NASA links')
  assert((await unnegatedLiveClaims('.brief-page .bonus-evidence, .brief-page .bonus-score-card, .brief-page .report-timeline')).length === 0, 'Bonus brief labels historical data as live')
  bonusBriefEvidence.links.forEach((href) => bonusEvidenceLinks.add(href))
  await evaluate(`(document.querySelector('.bonus-evidence').scrollIntoView({block:'start'}),true)`)
  await wait(120)
  bonusBriefScreenshot = await screenshot('bonus-05-mission-brief')

  // Replay the bonus from its brief, then refresh in the middle of the replay.
  await evaluate(`[...document.querySelectorAll('.brief-actions button')].find(button=>button.textContent.includes('Replay')).click()`)
  await waitForSelector('.gameplay-page')
  const bonusReplay = await storeState(`({level:s.selectedLevelId,event:s.currentEventIndex,history:s.choiceHistory.length,bonus:s.completedBonusMissionIds.length,main:s.completedLevelIds.length})`)
  assert(bonusReplay.level === 'bonus-05-solar-storm-watch' && bonusReplay.event === 0 && bonusReplay.history === 0 && bonusReplay.bonus === 1 && bonusReplay.main === 0, `Bonus replay did not restart cleanly: ${JSON.stringify(bonusReplay)}`)
  await openCurrentDecision()
  await chooseOptimalAndContinue()
  await reloadAndWait()
  await waitForSelector('.hero-cta')
  await enterLibrary()
  assert(await evaluate(`/Completed.*Replay available/i.test(document.querySelector('.mission-card--bonus').textContent)`), 'Bonus completion did not persist after refresh')
  const afterBonusRefreshLocks = await evaluate(`[...document.querySelectorAll('.card-button')].map(button=>button.disabled)`)
  assert(JSON.stringify(afterBonusRefreshLocks) === JSON.stringify([false, true, true, true, false]), `Bonus replay/refresh changed campaign unlocks: ${JSON.stringify(afterBonusRefreshLocks)}`)

  const startReply = await askLibraryBot('Start the mission')
  assert(/do not have enough source evidence/i.test(startReply.text), `Start/star false match: ${startReply.text}`)
  assert(startReply.sources.length === 0, 'Unsupported start query returned sources')
  const lifeSupportReply = await askLibraryBot('How does life support recycle water?')
  assert(/ECLSS|life-support|life support/i.test(lifeSupportReply.text), `Life support misrouted: ${lifeSupportReply.text}`)
  assert(!/exoplanet|Goldilocks Zone/i.test(lifeSupportReply.text), 'Life support incorrectly used astrobiology copy')
  assert(lifeSupportReply.sources.some((url) => /nasa\.gov/i.test(url)), 'Life support answer had no NASA source')
  const liveSunReply = await askLibraryBot('What is the Sun doing right now?')
  assert(/do not have live current telemetry/i.test(liveSunReply.text), `Live Sun claim was not disclaimed: ${liveSunReply.text}`)
  const unknownReply = await askLibraryBot('Can jazz hamsters repair purple time?')
  assert(/do not have enough source evidence/i.test(unknownReply.text), `Unknown query invented an answer: ${unknownReply.text}`)
  await click('.astro-chatbot-close')
  await wait(120)

  // Switching and persistence for all four standard avatars.
  const avatarIds = ['avatar-01', 'avatar-02', 'avatar-03', 'avatar-04']
  for (let index = 0; index < avatarIds.length; index += 1) {
    await click('.library-avatar-control .secondary-button')
    await waitForSelector('.avatar-picker')
    await evaluate(`document.querySelectorAll('.avatar-card')[${index}].click()`)
    await click('.avatar-picker__actions .primary-button')
    await waitForSelector('.mission-grid')
    const selected = await evaluate(`localStorage.getItem('mars-base:selected-avatar:v1')`)
    assert(selected === avatarIds[index], `Avatar persistence failed for ${avatarIds[index]}`)
  }

  await evaluate(`document.querySelectorAll('.card-button')[0].click()`)
  await waitForSelector('.mars-scene canvas')
  assert(!(await evaluate(`document.body.textContent.includes('Mars base preview unavailable')`)), 'WebGL fallback appeared unexpectedly')

  // WASD approaches habitat; arrows reverse movement; E inspects the nearby wrong target.
  await wait(500)
  await pressFor('d', 'KeyD', 340)
  assert((await evaluate(`document.querySelector('.mars-scene').dataset.nearbyHotspot`)) === 'habitat', 'WASD movement did not reach habitat proximity')
  await pressFor('ArrowLeft', 'ArrowLeft', 340)
  assert((await evaluate(`document.querySelector('.mars-scene').dataset.nearbyHotspot`)) === '', 'Arrow-key movement did not leave habitat proximity')
  await pressFor('d', 'KeyD', 340)
  await key('keyDown', 'e', 'KeyE')
  await key('keyUp', 'e', 'KeyE')
  await wait(80)
  const wrongMessage = await evaluate(`document.querySelector('.task-prompt__copy p').textContent`)
  assert(wrongMessage.includes('current objective is the oxygen system'), 'E did not report the nearby wrong hotspot')
  assert(!(await evaluate(`!!document.querySelector('.contextual-panel')`)), 'Wrong hotspot unlocked the decision')

  // A distant pointer click must not bypass proximity; the accessible Inspect control remains available.
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 1170, y: 260, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 1170, y: 260, button: 'left', clickCount: 1 })
  await wait(80)
  assert(!(await evaluate(`!!document.querySelector('.contextual-panel')`)), 'Distant pointer click bypassed proximity')

  await holdUntilNearby('oxygen', 'd', 'KeyD')
  await key('keyDown', 'e', 'KeyE')
  await key('keyUp', 'e', 'KeyE')
  await wait(80)
  await waitForSelector('.contextual-panel')
  const correctMessage = await evaluate(`document.querySelector('.task-prompt__copy p').textContent`)
  assert(/System identified/i.test(correctMessage), `Correct oxygen inspect failed: ${correctMessage}`)
  assert(await evaluate(`!!document.querySelector('.decision-option')`), 'Correct inspect did not open decision options')
  const nearbyBeforeLock = await evaluate(`document.querySelector('.mars-scene').dataset.nearbyHotspot`)
  await key('keyDown', 'd', 'KeyD')
  await wait(1100)
  const nearbyDuringLock = await evaluate(`document.querySelector('.mars-scene').dataset.nearbyHotspot`)
  await key('keyUp', 'd', 'KeyD')
  assert(nearbyDuringLock === nearbyBeforeLock, 'Held movement continued behind decision modal')
  await chooseOptimalAndContinue()

  // AstroBot must lock the scene too.
  await key('keyDown', 'd', 'KeyD')
  await wait(120)
  const nearbyBeforeChat = await evaluate(`document.querySelector('.mars-scene').dataset.nearbyHotspot`)
  await click('.astrobot-command-btn')
  await waitForSelector('.astro-chatbot-panel')
  await wait(1000)
  const nearbyDuringChat = await evaluate(`document.querySelector('.mars-scene').dataset.nearbyHotspot`)
  await key('keyUp', 'd', 'KeyD')
  assert(nearbyDuringChat === nearbyBeforeChat, 'Held movement continued behind AstroBot')
  await click('.astro-chatbot-close')

  // Finish Level 1 after its already-completed first event.
  for (let eventIndex = 1; eventIndex < 3; eventIndex += 1) {
    await openCurrentDecision()
    await chooseOptimalAndContinue()
  }
  await waitForSelector('.brief-page')
  const matrix = [{ level: 1, events: 3, completedCount: 1 }]

  // Replay preserves progress and navigation back to the library is safe.
  await evaluate(`[...document.querySelectorAll('.brief-actions button')].find(button=>button.textContent.includes('Replay')).click()`)
  await waitForSelector('.gameplay-page')
  assert((await storeState('s.completedLevelIds.length')) === 1, 'Replay deleted completed progress')
  await click('.gameplay-back-button')
  await waitForSelector('.mission-grid')

  // Browser refresh preserves Level 2 unlock.
  await reloadAndWait()
  await waitForSelector('.hero-cta')
  await enterLibrary()
  const afterRefreshLocks = await evaluate(`[...document.querySelectorAll('.card-button')].map(button=>button.disabled)`)
  assert(afterRefreshLocks[0] === false && afterRefreshLocks[1] === false && afterRefreshLocks[2] === true, 'Refresh did not preserve sequential unlocks')

  for (let levelIndex = 1; levelIndex < 4; levelIndex += 1) {
    await evaluate(`document.querySelectorAll('.card-button')[${levelIndex}].click()`)
    await waitForSelector('.gameplay-page')
    matrix.push(await completeActiveMission(levelIndex))
    if (levelIndex < 3) {
      await evaluate(`[...document.querySelectorAll('.brief-actions button')].find(button=>button.textContent.includes('Mission Library')).click()`)
      await waitForSelector('.mission-grid')
    }
  }
  assert(roverEvidence?.passes === 3, 'Level 2 rover activity flow did not run')

  // Level 2 replay: the rover activity starts fresh, and skipping it applies the decision exactly once.
  await evaluate(`[...document.querySelectorAll('.brief-actions button')].find(button=>button.textContent.includes('Mission Library')).click()`)
  await waitForSelector('.mission-grid')
  await evaluate(`document.querySelectorAll('.card-button')[1].click()`)
  await waitForSelector('.gameplay-page')
  await openCurrentDecision()
  await chooseOptimalAndContinue()
  await openCurrentDecision()
  assert((await storeState('s.currentLevel.events[s.currentEventIndex].id')) === SOLAR_ROVER_EVENT, 'Level 2 replay did not reach the solar cleanup event')
  const replayCardText = await evaluate(`document.querySelector('.rover-activity-card')?.textContent ?? ''`)
  assert((await roverPasses()) === 0 && !/Cleaning pass complete|Nothing changed/.test(replayCardText), 'Rover activity state leaked into the Level 2 replay')
  await chooseOptimalAndContinue() // skip: decide without operating the rover (exact effects are asserted)
  await click('.gameplay-back-button')
  await waitForSelector('.mission-grid')
  assert((await storeState('s.completedLevelIds.length')) === 4, 'Level 2 replay changed campaign progress')

  // Fresh-save early exhaustion must stabilize without unlocking Level 2.
  await evaluate(`localStorage.removeItem('mars-base:game-progress:v1')`)
  await send('Page.navigate', { url: appUrl })
  await waitForSelector('.hero-cta')
  await enterLibrary()
  await evaluate(`document.querySelectorAll('.card-button')[0].click()`)
  await waitForSelector('.gameplay-page')
  await storeState(`(m.useGameStore.setState(state=>({resources:{...state.resources,energy:1}})),true)`)
  const beforeInvalid = await storeState(`({resources:s.resources,history:s.choiceHistory.length})`)
  await storeState(`(s.chooseOption('invalid-choice'),true)`)
  const afterInvalid = await storeState(`({resources:s.resources,history:s.choiceHistory.length})`)
  assert(JSON.stringify(beforeInvalid) === JSON.stringify(afterInvalid), 'Invalid choice changed state')
  await openCurrentDecision()
  await evaluate(`document.querySelector('.decision-option').click()`)
  await wait(80)
  const stabilizationPending = await storeState(`({energy:s.resources.energy,history:s.choiceHistory.length,stabilizing:s.isStabilizationTriggered,complete:s.isMissionComplete})`)
  assert(stabilizationPending.energy === 0 && stabilizationPending.history === 1 && stabilizationPending.stabilizing && !stabilizationPending.complete, 'Stabilization pending state failed')
  await click('.decision-continue')
  await waitForSelector('.brief-page')
  const stabilizationDone = await storeState(`({completed:s.completedLevelIds,complete:s.isMissionComplete})`)
  assert(stabilizationDone.complete && stabilizationDone.completed.length === 0, 'Early stabilization unlocked progress')

  // Corrupt progress is rejected safely.
  await evaluate(`localStorage.setItem('mars-base:game-progress:v1','{broken-json')`)
  await send('Page.navigate', { url: appUrl })
  await waitForSelector('.hero-cta')
  await enterLibrary()
  const corruptLocks = await evaluate(`[...document.querySelectorAll('.card-button')].map(button=>button.disabled)`)
  assert(JSON.stringify(corruptLocks) === JSON.stringify([false, true, true, true, false]), 'Corrupt storage was not rejected safely')

  // Old v1 progress (saved before the bonus mission existed) migrates to v2 without losing unlocks.
  await evaluate(`localStorage.setItem('mars-base:game-progress:v1', JSON.stringify({state:{completedLevelIds:['level-1-first-day','level-2-power-crisis']},version:1}))`)
  await send('Page.navigate', { url: appUrl })
  await waitForSelector('.hero-cta')
  await enterLibrary()
  const migratedLocks = await evaluate(`[...document.querySelectorAll('.card-button')].map(button=>button.disabled)`)
  const migratedStore = JSON.parse(await evaluate(`localStorage.getItem('mars-base:game-progress:v1')`))
  assert(JSON.stringify(migratedLocks) === JSON.stringify([false, false, false, true, false]), `v1 migration lost unlocks: ${JSON.stringify(migratedLocks)}`)
  assert(migratedStore.version === 2 && JSON.stringify(migratedStore.state.completedLevelIds) === JSON.stringify(['level-1-first-day', 'level-2-power-crisis']) && migratedStore.state.completedBonusMissionIds.length === 0, `v1 migration stored ${JSON.stringify(migratedStore)}`)
  assert(await evaluate(`/Always available/.test(document.querySelector('.mission-card--bonus').textContent)`), 'v1 migration marked the bonus mission as completed')

  /** Gameplay header geometry: avatar vs "Exploring as", nothing off-screen, nothing covering the mission card. */
  const checkGameplayHeader = async (width, height) => {
    await evaluate(`document.querySelectorAll('.card-button')[0].click()`)
    await waitForSelector('.mars-scene canvas')
    await wait(600)
    const header = await evaluate(`(()=>{const box=(e)=>{if(!e)return null;const b=e.getBoundingClientRect();return {l:b.left,t:b.top,r:b.right,b:b.bottom}};
      const overlap=(a,b)=>!!a&&!!b&&a.l<b.r-0.5&&b.l<a.r-0.5&&a.t<b.b-0.5&&b.t<a.b-0.5;
      const parts=[...document.querySelectorAll('.gameplay-cadet .avatar-preview span')].map(s=>s.getBoundingClientRect()).filter(b=>b.width>0);
      const avatar={l:Math.min(...parts.map(b=>b.left)),r:Math.max(...parts.map(b=>b.right)),t:Math.min(...parts.map(b=>b.top)),b:Math.max(...parts.map(b=>b.bottom))};
      const copy=document.querySelector('.gameplay-cadet .avatar-identity__copy');
      const copyVisible=!!copy&&getComputedStyle(copy).display!=='none';
      const label=copyVisible?box(copy.querySelector('small')):null; const name=copyVisible?box(copy.querySelector('strong')):null;
      const controls=[...document.querySelectorAll('.gameplay-command-bar button, .gameplay-command-bar .avatar-identity')].filter(e=>e.getClientRects().length).map(box);
      const chip=box(document.querySelector('.gameplay-objective-hud .mission-chip')); const title=box(document.querySelector('.gameplay-objective-hud h1'));
      return {vw:document.documentElement.clientWidth,copyVisible,avatarOverLabel:overlap(avatar,label)||overlap(avatar,name),avatarOverMissionCard:overlap(avatar,chip)||overlap(avatar,title),
        controlsLeft:Math.round(Math.min(...controls.map(c=>c.l))),controlsRight:Math.round(Math.max(...controls.map(c=>c.r))),controlsBottom:Math.round(Math.max(...controls.map(c=>c.b))),chipTop:Math.round(chip.t),
        accessibleName:document.querySelector('.gameplay-cadet .avatar-identity').getAttribute('aria-label'),overflowX:document.documentElement.scrollWidth>document.documentElement.clientWidth}})()`)
    assert(!header.avatarOverLabel, `${width}px: avatar overlaps "Exploring as"`)
    assert(!header.avatarOverMissionCard, `${width}px: avatar covers the mission card text`)
    assert(header.controlsLeft >= 0 && header.controlsRight <= header.vw, `${width}px: header controls run off-screen (${header.controlsLeft}–${header.controlsRight} of ${header.vw})`)
    assert(header.controlsBottom <= header.chipTop, `${width}px: header controls (bottom ${header.controlsBottom}) cover the mission chip (top ${header.chipTop})`)
    assert(/^Exploring as: /.test(header.accessibleName ?? ''), `${width}px: avatar identity lost its accessible name`)
    assert(!header.overflowX, `${width}px gameplay has horizontal overflow`)
    const headerScreenshot = await screenshot(`${width}x${height}-gameplay-header`)
    await click('.gameplay-back-button')
    await waitForSelector('.mission-grid')
    return { ...header, headerScreenshot }
  }

  const desktopScreenshot = await screenshot('desktop-library')
  const headerEvidence = [{ width: 1366, ...(await checkGameplayHeader(1366, 768)) }]
  const viewportEvidence = []
  for (const [width, height] of [[768, 1024], [390, 844], [360, 800]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
    await send('Page.navigate', { url: appUrl })
    await waitForSelector('.hero-cta')
    const overflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth`)
    assert(!overflow, `${width}px layout has horizontal overflow`)
    const homeScreenshot = await screenshot(`${width}x${height}-home`)
    await enterLibrary()
    const libraryOverflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth`)
    assert(!libraryOverflow, `${width}px mission library has horizontal overflow`)
    viewportEvidence.push({ width, height, homeScreenshot, libraryScreenshot: await screenshot(`${width}x${height}-library`) })
    headerEvidence.push({ width, ...(await checkGameplayHeader(width, height)) })
  }

  assert(exceptions.length === 0, `Uncaught browser exceptions: ${exceptions.join('\n')}`)
  const actionableConsoleErrors = consoleErrors.filter((message) => !message.includes('Failed to load resource'))
  assert(actionableConsoleErrors.length === 0, `Browser console errors: ${actionableConsoleErrors.join('\n')}`)

  console.log(JSON.stringify({
    matrix,
    bonusGameplayScreenshot,
    bonusBriefScreenshot,
    bonusEvents: bonusEventIds,
    bonusBriefEvidence: { cards: bonusBriefEvidence.cards, timeline: bonusBriefEvidence.timeline },
    bonusEvidenceLinks: [...bonusEvidenceLinks],
    bonusReplay,
    afterBonusRefreshLocks,
    roverEvidence,
    migratedLocks,
    headerEvidence,
    freshLocks,
    afterRefreshLocks,
    stabilizationPending,
    stabilizationDone,
    corruptLocks,
    desktopScreenshot,
    viewportEvidence,
    exceptions,
    consoleErrors,
  }, null, 2))
} finally {
  socket?.close()
  chrome?.kill()
  server.kill()
}
