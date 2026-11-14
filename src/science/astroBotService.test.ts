import { afterEach, describe, expect, it, vi } from 'vitest'
import { askAstroBot } from './astroBotService'
import { SCIENCE_FACTS } from './scienceFacts'

afterEach(() => {
  vi.unstubAllGlobals()
})

function useOfflineBackend(): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
}

describe('AstroBot evidence routing', () => {
  it('does not confuse start with star or invent an answer', async () => {
    useOfflineBackend()
    const response = await askAstroBot('Start the mission')

    expect(response.sources).toEqual([])
    expect(response.unlockedBadgeId).toBeUndefined()
    expect(response.answer).toMatch(/do not have enough source evidence/i)
  })

  it('routes space weather to heliophysics with an explicit source', async () => {
    useOfflineBackend()
    const response = await askAstroBot('What is space weather?')

    expect(response.unlockedBadgeId).toBe('solar-physicist')
    expect(response.sources[0]?.url).toMatch(/^https:\/\//)
    expect(response.answer).toMatch(/Sun|solar/i)
  })

  it('routes life support to ECLSS instead of astrobiology', async () => {
    useOfflineBackend()
    const response = await askAstroBot('How does life support recycle water?')

    expect(response.unlockedBadgeId).toBe('life-support')
    expect(response.answer).toMatch(/ECLSS|life-support/i)
    expect(response.sources[0]?.url).toContain('environmental-control-and-life-support')
  })

  it('acknowledges uncertainty for unsupported questions', async () => {
    useOfflineBackend()
    const response = await askAstroBot('Can jazz hamsters repair purple time?')

    expect(response.sources).toEqual([])
    expect(response.answer).toMatch(/do not have enough source evidence/i)
  })

  it('rejects connected answers that provide no usable sources', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ answer: 'An unsupported confident answer.', sources: [] }),
    }))

    const response = await askAstroBot('Start the mission')
    expect(response.backend).toBe('client-kb')
    expect(response.sources).toEqual([])
  })

  it('does not present saved snapshots as live current Sun data', async () => {
    useOfflineBackend()
    const response = await askAstroBot('What is the Sun doing right now?')

    expect(response.answer).toMatch(/do not have live current telemetry/i)
    expect(response.answer).not.toMatch(/right now NASA/i)
    expect(response.unlockedBadgeId).toBe('solar-physicist')
    expect(response.sources[0]?.url).toMatch(/^https:\/\//)
  })

  it('still routes Europa habitability questions to astrobiology', async () => {
    useOfflineBackend()
    const response = await askAstroBot('Could life exist on moons like Europa?')

    expect(response.unlockedBadgeId).toBe('space-biologist')
    expect(response.answer).toMatch(/Europa|astrobiology|Goldilocks/i)
  })
})

describe('science fact links', () => {
  it('uses the verified current NASA pages for MOXIE, Mars dust and Veggie', () => {
    expect(SCIENCE_FACTS['NASA-OXYGEN'].url).toContain('nasa.gov/space-technology-mission-directorate')
    expect(SCIENCE_FACTS['NASA-DUST'].url).toContain('science.nasa.gov/helio-and-you')
    expect(SCIENCE_FACTS['NASA-PLANTS'].url).toBe('https://science.nasa.gov/mission/veggie/')
  })
})
