import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const appPort = 4174
const debugPort = 9333
const appUrl = `http://127.0.0.1:${appPort}/`
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const qaDirectory = mkdtempSync(join(tmpdir(), 'aster-base-final-qa-'))
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
  const chooseOptimalAndContinue = async () => {
    const before = await storeState(`({history:s.choiceHistory.length,event:s.currentEventIndex})`)
    const optimalIndex = await storeState(`s.currentLevel.events[s.currentEventIndex].choices.findIndex(choice=>choice.isOptimalHint)`) 
    assert(optimalIndex >= 0, 'Current event has no optimal test choice')
    await evaluate(`(()=>{const button=document.querySelectorAll('.decision-option')[${optimalIndex}];button.click();button.click();return true})()`)
    await wait(80)
    const afterChoice = await storeState(`({history:s.choiceHistory.length,awaiting:!!s.resolvedChoiceForCurrentEvent})`)
    assert(afterChoice.history === before.history + 1 && afterChoice.awaiting, 'Double decision applied more than once')
    await evaluate(`(()=>{const button=document.querySelector('.decision-continue');button.click();button.click();return true})()`)
    await wait(180)
  }
  const completeActiveMission = async (levelIndex) => {
    const eventCount = await storeState('s.currentLevel.events.length')
    for (let eventIndex = 0; eventIndex < eventCount; eventIndex += 1) {
      await openCurrentDecision()
      const focusInside = await evaluate(`document.querySelector('.contextual-panel').contains(document.activeElement)`)
      assert(focusInside, `Level ${levelIndex + 1}, event ${eventIndex + 1}: modal focus was not contained`)
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
  await send('Page.reload')
  await waitForSelector('.hero-cta')
  await enterLibrary()

  const freshLocks = await evaluate(`[...document.querySelectorAll('.card-button')].map(button=>button.disabled)`)
  assert(JSON.stringify(freshLocks) === JSON.stringify([false, true, true, true]), `Fresh unlock state is wrong: ${JSON.stringify(freshLocks)}`)

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
  await send('Page.reload')
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
  assert(JSON.stringify(corruptLocks) === JSON.stringify([false, true, true, true]), 'Corrupt storage was not rejected safely')

  const desktopScreenshot = await screenshot('desktop-library')
  const viewportEvidence = []
  for (const [width, height] of [[768, 1024], [390, 844], [360, 800]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
    await send('Page.navigate', { url: appUrl })
    await waitForSelector('.hero-cta')
    const overflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth`)
    assert(!overflow, `${width}px layout has horizontal overflow`)
    viewportEvidence.push({ width, height, screenshot: await screenshot(`${width}x${height}-home`) })
  }

  assert(exceptions.length === 0, `Uncaught browser exceptions: ${exceptions.join('\n')}`)
  const actionableConsoleErrors = consoleErrors.filter((message) => !message.includes('Failed to load resource'))
  assert(actionableConsoleErrors.length === 0, `Browser console errors: ${actionableConsoleErrors.join('\n')}`)

  console.log(JSON.stringify({
    matrix,
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
