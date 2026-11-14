import { KNOWLEDGE, type KnowledgeDoc } from '../data/knowledge'
import type { Resources } from '../game/types'

export interface BotSource {
  title: string
  dataset?: string
  url: string
  score?: number
}

export interface BotResponse {
  answer: string
  grounded: boolean
  live: boolean
  sources: BotSource[]
  jargon: string[]
  backend: 'live-rag' | 'client-kb'
  unlockedBadgeId?: string
}

function detectBadgeForQuery(text: string): string | undefined {
  const lower = text.toLowerCase()
  if (lower.includes('black hole') || lower.includes('star') || lower.includes('galaxy') || lower.includes('supernova')) return 'deep-space'
  if (lower.includes('rocket') || lower.includes('launch') || lower.includes('engine') || lower.includes('thrust') || lower.includes('orbit')) return 'rocket-engineer'
  if (lower.includes('food') || lower.includes('sleep') || lower.includes('float') || lower.includes('astronaut') || lower.includes('suit') || lower.includes('spacewalk')) return 'astronaut-cadet'
  if (lower.includes('sun') || lower.includes('solar') || lower.includes('cme') || lower.includes('flare') || lower.includes('aurora')) return 'solar-physicist'
  if (lower.includes('telescope') || lower.includes('webb') || lower.includes('jwst') || lower.includes('hubble')) return 'cosmic-observer'
  if (lower.includes('planet') || lower.includes('mars') || lower.includes('jupiter') || lower.includes('saturn') || lower.includes('venus') || lower.includes('moon')) return 'planetary-scout'
  if (lower.includes('plant') || lower.includes('seed') || lower.includes('hydroponic') || lower.includes('alien') || lower.includes('life')) return 'space-biologist'
  if (lower.includes('oxygen') || lower.includes('water') || lower.includes('eclss') || lower.includes('radiation') || lower.includes('moxie') || lower.includes('regolith')) return 'life-support'
  return undefined
}

export const GENERAL_SPACE_KNOWLEDGE: {
  keywords: string[]
  badgeId: string
  title: string
  answer: string
  source: string
  url: string
  jargon: string[]
}[] = [
  {
    keywords: ['black hole', 'singularity', 'event horizon', 'spaghettification', 'wormhole'],
    badgeId: 'deep-space',
    title: 'Black Holes & The Fabric of Spacetime',
    answer:
      'A black hole is a region in space where gravity is so intense that nothing—not even light—can escape! At the boundary called the "event horizon," escape velocity exceeds light speed. In the center sits a supermassive point called a singularity. If an astronaut got too close, gravity would stretch them into a long noodle, a fun scientific term called "spaghettification"!',
    source: 'NASA Astrophysics & Chandra X-ray Observatory',
    url: 'https://science.nasa.gov/astrophysics/focus-areas/black-holes/',
    jargon: ['EVENT HORIZON: The boundary of a black hole where light cannot escape.', 'SPAGHETTIFICATION: The vertical stretching of an object caused by extreme tidal gravitational forces.'],
  },
  {
    keywords: ['rocket', 'launch', 'propulsion', 'sls', 'engine', 'thrust', 'escape velocity', 'orbit'],
    badgeId: 'rocket-engineer',
    title: 'How Space Rockets Reach Orbit',
    answer:
      'Rockets work by Newton’s Third Law: for every action, there is an equal and opposite reaction! Rocket engines burn liquid fuel and oxidizer to blast hot gas downward at hypersonic speeds, pushing the rocket upward into space. To leave Earth’s gravitational pull, a rocket must accelerate to escape velocity—about 40,000 km/h (25,000 mph)!',
    source: 'NASA Space Launch System (SLS) & Rocket Propulsion Basics',
    url: 'https://www.nasa.gov/humans-in-space/space-launch-system/',
    jargon: ['ESCAPE VELOCITY: The speed needed to break free from a planet’s gravitational field (11.2 km/s on Earth).', 'THRUST: The forward pushing force produced by a rocket engine.'],
  },
  {
    keywords: ['food', 'eat', 'sleep', 'toilet', 'shower', 'float', 'microgravity', 'astronaut life', 'exercise', 'weightless'],
    badgeId: 'astronaut-cadet',
    title: 'How Astronauts Live and Work in Space',
    answer:
      'In microgravity, astronauts float everywhere! They sleep strapped inside sleeping bags fastened to cabin walls so they don’t drift away. Space food is freeze-dried or vacuum-sealed—astronauts inject hot water into pouches to eat macaroni or stew. Because muscles and bones weaken when floating, every astronaut must exercise on a specialized treadmill and bike for 2 hours every single day!',
    source: 'NASA Human Research Program — Living in Space',
    url: 'https://www.nasa.gov/hrp/',
    jargon: ['MICROGRAVITY: The near-weightless environment experienced while in free-fall orbit around Earth.', 'BONE DENSITY LOSS: The reduction of bone mass in space that astronauts prevent with daily exercise.'],
  },
  {
    keywords: ['sun', 'solar storm', 'solar flare', 'cme', 'aurora', 'northern lights', 'magnetic field', 'corona'],
    badgeId: 'solar-physicist',
    title: 'The Sun & Space Weather',
    answer:
      'The Sun is a giant ball of glowing plasma powered by nuclear fusion, fusing 600 million tons of hydrogen into helium every second! It frequently erupts with Solar Flares and Coronal Mass Ejections (CMEs)—giant magnetic plasma bubbles traveling millions of miles per hour. When solar particles hit Earth’s magnetic field, they create the colorful glowing Aurora (Northern Lights)!',
    source: 'NASA Heliophysics & Space Weather Database (DONKI)',
    url: 'https://science.nasa.gov/heliophysics/',
    jargon: ['CORONAL MASS EJECTION (CME): A colossal burst of solar wind and magnetic fields shot from the Sun.', 'AURORA: Beautiful dancing light displays in polar skies created when solar particles collide with Earth’s atmosphere.'],
  },
  {
    keywords: ['telescope', 'james webb', 'jwst', 'hubble', 'deep field', 'infrared', 'lens'],
    badgeId: 'cosmic-observer',
    title: 'Deep Space Eyes: James Webb & Hubble Telescopes',
    answer:
      'The James Webb Space Telescope (JWST) is the largest and most powerful space telescope ever built! It orbits 1.5 million kilometers from Earth at Lagrange Point 2. Equipped with a giant tennis-court-sized sunshield and gold-coated beryllium mirrors, Webb detects invisible infrared light to see the very first stars and galaxies born over 13.5 billion years ago!',
    source: 'NASA James Webb Space Telescope Mission',
    url: 'https://webb.nasa.gov/',
    jargon: ['INFRARED ASTRONOMY: Observing light with wavelengths longer than visible red light to peer through cosmic dust.', 'LAGRANGE POINT (L2): A gravitationally balanced parking spot in space 1.5 million km behind Earth.'],
  },
  {
    keywords: ['planet', 'jupiter', 'saturn', 'venus', 'mercury', 'neptune', 'uranus', 'solar system', 'pluto', 'rings'],
    badgeId: 'planetary-scout',
    title: 'Wonders of Our Solar System',
    answer:
      'Our Solar System has 8 major planets! Mercury is closest and fastest; Venus is the hottest due to a runaway greenhouse effect; Mars has the tallest volcano (Olympus Mons, 3x Mount Everest!); Jupiter is a gas giant so huge that over 1,300 Earths could fit inside; Saturn features glorious icy rings; and Uranus spins sideways like a rolling ball!',
    source: 'NASA Planetary Science & Solar System Exploration',
    url: 'https://science.nasa.gov/solar-system/planets/',
    jargon: ['GAS GIANT: A large planet composed mostly of hydrogen and helium without a solid surface, like Jupiter and Saturn.', 'RETROGRADE ROTATION: When a planet spins in the opposite direction of most planets, such as Venus.'],
  },
  {
    keywords: ['star', 'supernova', 'galaxy', 'milky way', 'nebula', 'andromeda', 'light year'],
    badgeId: 'deep-space',
    title: 'Stars, Supernovas & The Milky Way Galaxy',
    answer:
      'Stars are cosmic nuclear factories born inside swirling clouds of gas and dust called nebulae. When giant stars run out of fuel, they collapse and detonate in catastrophic explosions called Supernovas, scattering elements like iron, calcium, and gold across the universe. Our solar system belongs to the Milky Way galaxy, which contains over 100 billion stars!',
    source: 'NASA Universe Exploration & Hubble Heritage',
    url: 'https://science.nasa.gov/universe/stars/',
    jargon: ['SUPERNOVA: The titanic explosion of a massive dying star that outshines entire galaxies.', 'LIGHT-YEAR: The distance light travels in one Earth year—about 9.46 trillion kilometers (5.88 trillion miles)!'],
  },
  {
    keywords: ['alien', 'life', 'extraterrestrial', 'exoplanet', 'goldilocks', 'europa', 'enceladus', 'habitable'],
    badgeId: 'space-biologist',
    title: 'Astrobiology & Hunting for Habitable Worlds',
    answer:
      'Astrobiology is the search for life beyond Earth! Astronomers search for "exoplanets" orbiting distant stars in the "Goldilocks Zone" where liquid water can exist. In our own solar system, moons like Jupiter’s Europa and Saturn’s Enceladus hide warm, salty oceans beneath their thick outer ice shells—promising spots where microbial space life might thrive!',
    source: 'NASA Astrobiology & Exoplanet Exploration',
    url: 'https://exoplanets.nasa.gov/',
    jargon: ['GOLDILOCKS ZONE: The habitable zone around a star where temperatures are just right for liquid surface water.', 'EXOPLANET: Any planet orbiting a star outside our solar system.'],
  },
]

export interface SpaceBadge {
  id: string
  name: string
  icon: string
  description: string
  category: string
}

export const SPACE_BADGES: SpaceBadge[] = [
  { id: 'planetary-scout', name: 'Planetary Scout', icon: '🪐', description: 'Explored Mars, planets & moons across the Solar System.', category: 'Planets' },
  { id: 'rocket-engineer', name: 'Rocket Engineer', icon: '🚀', description: 'Learned how propulsion, thrust & orbital escape work.', category: 'Engineering' },
  { id: 'astronaut-cadet', name: 'Astronaut Cadet', icon: '🧑‍🚀', description: 'Discovered spacesuits, microgravity & astronaut training.', category: 'Astronauts' },
  { id: 'solar-physicist', name: 'Solar Physicist', icon: '☀️', description: 'Studied the Sun, solar flares, and space weather.', category: 'Heliophysics' },
  { id: 'deep-space', name: 'Deep Space Explorer', icon: '🌌', description: 'Investigated black holes, supernovas & distant galaxies.', category: 'Astrophysics' },
  { id: 'cosmic-observer', name: 'Cosmic Observer', icon: '🔭', description: 'Explored deep space telescopes like James Webb & Hubble.', category: 'Observatories' },
  { id: 'space-biologist', name: 'Space Biologist', icon: '🧬', description: 'Studied hydroponics, space farming & the search for life.', category: 'Biology' },
  { id: 'life-support', name: 'Life Support Tech', icon: '🛡️', description: 'Mastered oxygen generation, water recycling & radiation shields.', category: 'Life Support' },
]

export const SPACE_GLOSSARY: Record<string, string> = {
  cme: 'Coronal Mass Ejection: A giant bubble of hot gas shot from the Sun.',
  'solar flare': 'A sudden bright burst of electromagnetic energy on the Sun.',
  radiation: 'High-energy cosmic particles and solar wind that can damage living cells.',
  regolith: 'The powdery dust and broken rock covering the Moon or Mars.',
  moxie: 'Mars Oxygen In-Situ Resource Utilization Experiment that creates oxygen from CO₂.',
  eclss: 'Environmental Control and Life Support System that scrubs air and recycles water.',
  tau: 'Measurement of atmospheric opacity (how thick the dust is in the sky).',
  microgravity: 'The condition of near-weightlessness experienced in orbit.',
  hydroponics: 'Growing plants in mineral-rich water without soil.',
  perchlorates: 'Toxic chemical salts found naturally in Martian soil.',
  radioisotope: 'A heat and power source using decaying space-grade isotopes.',
}

/**
 * Client-side BM25-style keyword search over the 92 exported NASA documents.
 */
function searchClientKnowledge(query: string, maxResults = 3): { doc: KnowledgeDoc; score: number }[] {
  const queryTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 2)

  if (queryTokens.length === 0) return []

  const scored = KNOWLEDGE.map((doc) => {
    let score = 0
    const titleLower = doc.title.toLowerCase()
    const textLower = doc.text.toLowerCase()

    for (const token of queryTokens) {
      if (titleLower.includes(token)) score += 3.5
      const matches = (textLower.match(new RegExp(token, 'g')) || []).length
      score += Math.min(matches, 5) * 0.8
    }

    return { doc, score }
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, maxResults)
}

function extractRelevantJargon(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const [term, def] of Object.entries(SPACE_GLOSSARY)) {
    if (lower.includes(term)) {
      found.push(`${term.toUpperCase()}: ${def}`)
    }
  }
  return found.slice(0, 3)
}

/**
 * Ask AstroBot with seamless fallback:
 * 1. Tries the FastAPI backend at /api/v1/ask-astro-bot
 * 2. If offline, runs in-browser grounded retrieval against the 92 NASA documents
 */
export async function askAstroBot(
  question: string,
  missionContext: string = 'Mars Base Aster Alpha'
): Promise<BotResponse> {
  // 1. Try Live RAG Backend
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2600)

    const res = await fetch('/api/v1/ask-astro-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        current_mission_context: missionContext,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      const detectedBadge = detectBadgeForQuery(`${question} ${data.answer || ''}`)
      return {
        answer: data.answer || 'AstroBot received telemetry from Aster Base.',
        grounded: Boolean(data.grounded),
        live: Boolean(data.live),
        sources: Array.isArray(data.sources) ? data.sources : [],
        jargon: Array.isArray(data.jargon) ? data.jargon : [],
        backend: 'live-rag',
        unlockedBadgeId: detectedBadge,
      }
    }
  } catch {
    // Backend offline or timeout — fall through to client NASA knowledge engine
  }

  // 2. Client-side Grounded RAG & AstroSpace Encyclopedia Fallback
  const qLower = question.toLowerCase()

  // First check broad AstroSpace encyclopedia for general space questions
  const generalMatch = GENERAL_SPACE_KNOWLEDGE.find((item) =>
    item.keywords.some((kw) => qLower.includes(kw))
  )

  if (generalMatch) {
    return {
      answer: generalMatch.answer,
      grounded: true,
      live: false,
      sources: [
        {
          title: generalMatch.title,
          dataset: generalMatch.source,
          url: generalMatch.url,
          score: 0.95,
        },
      ],
      jargon: generalMatch.jargon,
      backend: 'client-kb',
      unlockedBadgeId: generalMatch.badgeId,
    }
  }

  // Next check 92 exported NASA mission documents
  const searchResults = searchClientKnowledge(question)

  if (searchResults.length > 0) {
    const top = searchResults[0].doc
    const jargon = extractRelevantJargon(`${question} ${top.text}`)
    const detectedBadge = detectBadgeForQuery(`${question} ${top.text}`)

    const cleanSentences = top.text
      .split(/(?<=[.!?])\s+/)
      .slice(0, 3)
      .join(' ')

    return {
      answer: `${cleanSentences} (Cadet Tip: Grounded in official ${top.source} documentation.)`,
      grounded: true,
      live: false,
      sources: searchResults.map((r) => ({
        title: r.doc.title,
        dataset: r.doc.source,
        url: r.doc.url,
        score: Math.min(0.95, 0.5 + r.score * 0.1),
      })),
      jargon,
      backend: 'client-kb',
      unlockedBadgeId: detectedBadge,
    }
  }

  // Open-ended general space guidance for any custom curiosity
  const detectedBadge = detectBadgeForQuery(question)
  return {
    answer:
      `Welcome to Space Academy, Cadet! The cosmos is full of secrets waiting to be unlocked. You can ask me anything about how rockets launch, black holes, the James Webb telescope, what astronauts eat in microgravity, or how humanity will live on Mars. What mystery of the universe would you like to explore next?`,
    grounded: true,
    live: false,
    sources: [
      {
        title: 'NASA Space Science & Human Spaceflight Academy',
        dataset: 'NASA Science & Space Apps Challenge',
        url: 'https://science.nasa.gov/',
      },
    ],
    jargon: extractRelevantJargon(question),
    backend: 'client-kb',
    unlockedBadgeId: detectedBadge,
  }
}

/**
 * Generate a contextual tactical hint for the current in-game crisis/task.
 */
export function generateContextualHint(
  levelTitle: string,
  eventHeadline: string,
  eventPrompt: string,
  targetHotspot: string,
  resources: Resources | Record<string, number>
): string {
  const lowResources = Object.entries(resources as Record<string, number>)
    .filter(([, val]) => typeof val === 'number' && val < 40)
    .map(([key, val]) => `${key} (${val}%)`)

  let resourceWarning = ''
  if (lowResources.length > 0) {
    resourceWarning = ` ⚠️ Note: Base telemetry shows critical levels in: ${lowResources.join(', ')}!`
  }

  return `Mission Context: "${levelTitle} - ${eventHeadline}". Your target is the ${targetHotspot.replace('_', ' ')} system. ${eventPrompt}${resourceWarning} What is the best engineering response to protect the crew?`
}
