# SCIENCE FACTS, COPY RULES & NASA SOURCE REFERENCES
**Version 1.0 | Official source-backed lesson cards for Mars Base: Mission Control**

## 1. Scientific integrity contract
This is a **fictional educational simulation**, not a certified Mars habitat simulator. Resource scores (0–100), event magnitudes, exact repair outcomes and Mars base characters are invented game mechanics. Real science facts should be drawn from the official NASA articles below; link to the original URLs in every related Mission Brief. NASA has not been stated to sponsor, validate or endorse the game.

The full-viewport physical tasks in [`10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md`](10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md)—including scanning, carrying, installing, operating and repairing—are simplified learning interactions, not claims of real astronaut procedures. Keep authored task feedback and fictional resource effects clearly separated from sourced facts.

Do not invent live API endpoints, claim real-time Mars weather data, or copy article text at length. Paraphrase each fact using original, child-friendly language. Add concise `Learn more at NASA` links.

## 2. Verified source index
| Fact ID | NASA source | Official URL | Lesson use |
|---|---|---|---|
| NASA-OXYGEN | Is There Oxygen on Mars? We Asked a NASA Technologist | https://www.nasa.gov/solar-system/is-there-oxygen-on-mars-we-asked-a-nasa-technologist-episode-7/ | Very little breathable oxygen available at Mars surface; oxygen production is a technology challenge |
| NASA-DUST | The Fact and Fiction of Martian Dust Storms | https://www.nasa.gov/solar-system/the-fact-and-fiction-of-martian-dust-storms/ | Atmospheric dust and deposits can reduce solar energy |
| NASA-MARS-FACTS | Mars: Facts | https://science.nasa.gov/mars/facts/ | Thin atmosphere, carbon dioxide-rich air, cold and water ice |
| NASA-ECLSS | Environmental Control and Life Support Systems | https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/ | Air revitalization, water recovery and oxygen generation interact |
| NASA-RADIATION | Hazard: Space Radiation | https://www.nasa.gov/hrp/hazard-space-radiation/ | Energetic solar particles/cosmic radiation require human protection |
| NASA-MARS-ICE | Mars: Facts (water section) | https://science.nasa.gov/mars/facts/ | Mars has water ice, not freely available drinking water |
| NASA-SOL | Mars24 Technical Notes on Mars Solar Time | https://www.giss.nasa.gov/tools/mars24/help/notes.html | A Martian sol is about 24 h 39 min |
| NASA-HEAT | Temperatures Across Our Solar System | https://science.nasa.gov/solar-system/temperatures-across-our-solar-system/ | Mars is generally cold and has a thin atmosphere |
| NASA-SPACE-POWER | What Powers a Spacecraft? (NASA Space Place) | https://spaceplace.nasa.gov/what-powers-a-spacecraft/en/ | Solar panels produce less power when dusty |

**Citation IDs** in `01_GAME_DESIGN_DOCUMENT.md` correspond to this list. The implementation uses the exact official URLs, not internal web retrieval references.

## 3. Ready-to-use learning card text

### NASA-OXYGEN — Why do astronauts need oxygen systems?
**For children (7–10):** "Mars has an atmosphere, but it does not have enough oxygen for people to breathe. A space base needs special equipment to keep the air safe."  
**For older children (11–15):** "Mars has a very thin atmosphere dominated by carbon dioxide. Future habitats would need sealed air systems and oxygen generation, rather than relying on outside air."  
**Game connection:** choosing oxygen production can consume energy and water in the fictional resource model.  
**Caution:** Do not say Mars has *no* oxygen at all. NASA explains that there is a small amount.

### NASA-DUST — How can a dust storm affect power?
**For children:** "Dust can block some sunlight from reaching solar panels. Less sunlight can mean less electricity for a Mars base."  
**For older children:** "Airborne dust during storms and deposited dust on panels can reduce solar energy availability. Batteries and power priorities become important when generation falls."  
**Game connection:** the dust warning decreases the abstract Energy bar and players decide which systems to support.  
**Caution:** Martian dust storms should NOT be depicted as super-strong Earth-style winds blowing heavy habitats away. The key credible risk in this scenario is reduced solar availability.

### NASA-ECLSS — Why are water, air and power connected?
**For children:** "Space crews cannot simply open a tap or a window. Life-support machines clean air and recycle water so the crew has what it needs."  
**For older children:** "NASA life-support technology includes water recovery, air revitalization and oxygen generation. These subsystems require equipment, maintenance and electrical power."  
**Game connection:** water purification and air production help one resource while consuming other resources in abstract units.  
**Caution:** Do not imply that water recycling directly creates oxygen automatically; explain distinct air, water, and electrolysis systems.

### NASA-RADIATION — Why use protective shelter?
**For children:** "Some space radiation is invisible. Astronauts need protection, especially when the Sun sends energetic particles into space."  
**For older children:** "Outside much of Earth's protective environment, crews need to reduce radiation exposure from solar energetic particles and galactic cosmic rays. Monitoring, sheltering and spacecraft design matter."  
**Game connection:** `Radiation Protection` represents a fictional protection effectiveness index; it is not a real radiation dose or medical safety rating.  
**Caution:** Don't say simply pressing a button creates perfect protection. A shield-mode button is a teaching abstraction.

### NASA-MARS-ICE — Why manage water carefully?
**For children:** "Scientists have found water ice on Mars. Ice is useful, but a crew still needs a safe way to collect and clean water."  
**For older children:** "Water ice exists on Mars, but gathering, processing and purifying water would require engineering and power. Recycling helps reduce resupply needs."  
**Game connection:** water recovery can improve stored water but cost energy.

### NASA-HEAT — Why does the base need temperature control?
**For children:** "Mars is often very cold. A base needs temperature-control systems to keep the inside comfortable."  
**For older children:** "Mars' thin atmosphere allows significant temperature changes. Controlled habitats depend on insulation, heaters and monitoring."  
**Game connection:** `Temperature Control 70/100` means a *fictional stable-habitat score*, not 70°C.

### NASA-SOL — What is a Martian day?
**For children:** "A day on Mars is a little longer than a day on Earth."  
**For older children:** "A Martian solar day, called a sol, lasts about 24 hours and 39 minutes. Scientists use 'sol' when talking about activity on Mars."  
**Game connection:** the first level is one fictional shift on the crew's first sol.

## 4. Suggested fact placement by level
**Level 1:** NASA-OXYGEN, NASA-ECLSS, NASA-SOL, NASA-MARS-FACTS.  
**Level 2:** NASA-DUST, NASA-SPACE-POWER, NASA-HEAT.  
**Level 3:** NASA-OXYGEN, NASA-ECLSS.  
**Level 4:** NASA-RADIATION, NASA-ECLSS, NASA-DUST, NASA-MARS-ICE.

## 5. Words to use and avoid
Use: `Mission Brief`, `Crew Stabilized`, `Let's try a new strategy`, `What changed?`, `Science behind this choice`, `Protected systems`.  
Avoid: `You died`, `You failed`, `Kill the enemy`, `NASA's real-time measurements` unless actually and lawfully integrated, `This Mars base is exactly how NASA builds them`, `The optimal decision is always ...`.

## 6. Authored content data model and review
Every displayed educational fact must have `id`, short original text, age-extension text and direct `sourceUrl`. Every gameplay choice includes a science fact ID from this file. During content QA, Malak checks that no fact makes an ungrounded precise numerical claim about Martian conditions. Keep the source links in the product and documentation. Before publish, open the URLs and ensure links work.

## 7. Provenance and licensing note
Official NASA web links are educational references. Credit NASA as the source of facts, not the builder of this game. Avoid using NASA logos, branded mission patches or NASA photography without checking usage guidance. The hackathon event or a NASA reference does not alone grant endorsement. Prefer original graphics and primitive geometry in the MVP.
