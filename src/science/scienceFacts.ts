import type { ScienceFact } from '../game/types';

export const SIMULATION_DISCLAIMER =
  'In-game resource bars (0–100) are normalized educational indicators designed to show cause and effect, not physical measurements in kilograms or Celsius.';

export const SCIENCE_FACTS: Record<string, ScienceFact> = {
  'NASA-OXYGEN': {
    id: 'NASA-OXYGEN',
    title: 'Making Breathable Oxygen on Mars (MOXIE)',
    summary:
      'Mars has a thin atmosphere made of about 95% carbon dioxide (CO₂), which humans cannot breathe. NASA’s MOXIE experiment on the Perseverance rover demonstrated how electricity and heat can split CO₂ molecules to produce pure breathable oxygen on Mars.',
    sourceLabel: 'NASA Mars Exploration — MOXIE Oxygen Experiment',
    url: 'https://science.nasa.gov/mission/mars-2020-perseverance/moxie/',
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
  'NASA-ECLSS': {
    id: 'NASA-ECLSS',
    title: 'Closed-Loop Air & Water Recycling (ECLSS)',
    summary:
      'Because resupply from Earth takes months, space habitats rely on Environmental Control and Life Support Systems (ECLSS) to monitor cabin pressure, scrub exhaled CO₂, and recycle ~98% of wastewater back into clean drinking water.',
    sourceLabel: 'NASA Environmental Control and Life Support System (ECLSS)',
    url: 'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/',
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
  'NASA-DUST': {
    id: 'NASA-DUST',
    title: 'Martian Dust Storms & Solar Power',
    summary:
      'Regional and global dust storms on Mars lift fine iron-oxide dust high into the atmosphere, blocking sunlight from reaching solar panels for weeks—as experienced by NASA’s Opportunity rover and InSight lander.',
    sourceLabel: 'NASA Mars Exploration — Dust Storms & Solar Power',
    url: 'https://science.nasa.gov/planetary-science/focus-areas/mars/',
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
  'NASA-RADIATION': {
    id: 'NASA-RADIATION',
    title: 'Space Radiation Beyond Earth’s Magnetic Shield',
    summary:
      'Mars lacks a global magnetic field and thick atmosphere to block Galactic Cosmic Rays and Solar Particle Events. Astronauts rely on storm shelters, Martian soil (regolith), and hydrogen-rich shielding materials to stay safe.',
    sourceLabel: 'NASA Space Radiation Analysis & Mars RAD Findings',
    url: 'https://www.nasa.gov/hrp/radiation/',
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
  'NASA-THERMAL': {
    id: 'NASA-THERMAL',
    title: 'Extreme Martian Temperature Swings & Habitat Thermal Control',
    summary:
      'Surface temperatures on Mars can range from roughly 20°C at the equator during midday to below -70°C at night. Spacecraft and habitats balance insulation, heaters, and external radiators to keep internal conditions stable.',
    sourceLabel: 'NASA Mars Facts — Planetary Atmosphere & Climate',
    url: 'https://science.nasa.gov/mars/facts/',
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
  'NASA-PLANTS': {
    id: 'NASA-PLANTS',
    title: 'Growing Food in Space Habitats',
    summary:
      'Space crop systems use controlled LED lighting and closed-loop water delivery to grow fresh food while plants absorb carbon dioxide and release oxygen—requiring careful balance of water and electrical energy.',
    sourceLabel: 'NASA Veggie & Space Crop Production Research',
    url: 'https://www.nasa.gov/missions/station/iss-research/veggie-plant-growth-system-on-international-space-station/',
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
};

export function resolveScienceFacts(factIds: string[]): ScienceFact[] {
  const uniqueIds = Array.from(new Set(factIds));
  return uniqueIds
    .map((id) => SCIENCE_FACTS[id])
    .filter((fact): fact is ScienceFact => Boolean(fact));
}