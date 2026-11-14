# NASA Challenge Resource Map

**Project:** Junior Astronaut Mission Trainer · **Branch:** `research/nasa-bonus-mission` · **Researched:** 2026-11-14 (UTC)

This document separates three things that are easy to blur together:

1. Resources **officially linked** on the 2026 challenge page.
2. Resources from **our project brief** that the official page does **not** link.
3. **Global Offers**: optional partner tools, with their stated terms.

Every statement below comes from a page we actually retrieved on 2026-11-14. Quotes are verbatim.

---

## 1. Sources and how they were read

| Page | URL | Retrieved | Page metadata |
|---|---|---|---|
| Challenge (Resources tab) | https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=resources | 2026-11-14 ~10:35 UTC, HTTP 200 | `firstPublishedAt` 2026-09-17T14:22:28Z, `lastPublishedAt` **2026-11-13T03:48:49Z** |
| Global Offers | https://www.spaceappschallenge.org/2026/global-offers/ | 2026-11-14 ~10:35 UTC, HTTP 200 | — |

**How we got the content.** Both pages are Next.js App Router pages. The server HTML is only a shell, and the challenge text sits in the embedded React Server Components payload (`self.__next_f.push(...)`). We decoded that payload as data and executed no page code. The page says: *"More resources may be added before the hackathon begins."* Re-check it before submission.

**Access problem worth knowing about.** `www.spaceappschallenge.org` serves a TLS chain ending at the legacy root **"Comodo AAA Certificate Services"**. Two clients on the test machine rejected it:
- Node 24 (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`)
- Windows Schannel/curl (`SEC_E_UNTRUSTED_ROOT`)

OpenSSL with Git for Windows' CA bundle accepted it (`Verify return code: 0`). We retrieved the pages with that bundle as an extra trust anchor. This doesn't affect normal browsers, but **scripts or CI that fetch the challenge page may fail** in the same way.

---

## 2. Officially linked resources (Resources tab)

The tab is headed by this disclaimer: *"NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. For non-U.S. Government websites, participants must comply with any data use parameters of that specific website."*

### 2.1 NASA Data & Resources

| # | Resource as named on the page | Official link | What the page says (abridged) | What we verified 2026-11-14 | Our use |
|---|---|---|---|---|---|
| 1 | **NASA Open APIs** | https://api.nasa.gov/ | Central portal incl. APOD, *"Mars Rover Photos"*, and DONKI; free API key with higher limits than the demo key | Catalog lists **16 APIs and no "Mars Rover Photos"**. The DONKI mirror needs a key: CME and notifications returned 200 with `DEMO_KEY`, but **FLR returned 404**. | **Do not use.** Call CCMC DONKI directly (no key). |
| 2 | **DONKI** (Space Weather Database Of Notifications, Knowledge, Information) | https://ccmc.gsfc.nasa.gov/tools/DONKI/ | *"Real, regularly updated data on solar flares, coronal mass ejections, and other space weather events that drive radiation risk"* | Public DONKI-API v2.0: no key, `Access-Control-Allow-Origin: *`, all event types 200 | **Use now**: Bonus Mission 05 replay + optional live "Sun now" panel |
| 3 | **NASA OSDR** (+ search API `…/osdr/data/search?term=KEYWORD`) | https://osdr.nasa.gov/bio/repo/ | Space biology and astronaut health archive, *"Searchable by keyword"* | Repository 200. Search API returns 200 JSON, but CORS is limited to `osdr.nasa.gov`, and `term=plant` gave 3,505 hits including external MG-RAST records | Curated study cards only |
| 4 | **RadLab** (OSDR Radiation Dosimetry Database) | https://visualization.osdr.nasa.gov/radlab/gui/data-api/ | *"Real radiation dose measurements recorded by dosimetry instruments aboard the International Space Station"* | The API also serves **Curiosity MSL-RAD on the Mars surface**, LRO CRaTER, TGO, and BioSentinel. No CORS header. | **Use now** (snapshot): Mars-surface spike of 2024-05-20 |
| 5 | **Mars Trek** | https://trek.nasa.gov/mars/ | Mars imagery, elevation and terrain portal | Page 200. API not tested (out of scope for this brief) | Later: possible real terrain reference |

### 2.2 Space Agency Partner Resources (CSA, non-U.S. Government)

| Resource | Link | Verified | Note |
|---|---|---|---|
| Space resources for STEM and youth organizations | https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp | 200 | Follow the CSA's own terms (see the disclaimer above). Already used in AstroBot's knowledge base. |
| Food production on the Moon and in remote areas | https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/ | 200 | Same. |

### 2.3 Not in the official list but in our brief

These are legitimate NASA services, but **the official challenge page does not link them**. Present them as "additional NASA data we chose", not as challenge requirements.

| Resource | Link | Relationship to official resources |
|---|---|---|
| DONKI API reference | https://ccmc.gsfc.nasa.gov/DONKI/api/ | Linked from the official DONKI tool page, not from the challenge page |
| OSDR Environmental Data App (EDA) | https://visualization.osdr.nasa.gov/eda/ | Part of OSDR (officially linked as a repository), but EDA itself is not linked |
| OSDR Biological Data API | https://visualization.osdr.nasa.gov/biodata/api/ | Same as EDA |

---

## 3. What the challenge text asks for (design-relevant quotes)

These come from the Details tab. They are guidance: the page introduces the list with *"You may (but are not required to) consider the following"*.

- Audience: *"kids ages 7–12"*. *"Favor plain language over jargon … briefly explain it in-context."*
- Real data: *"Grounding gameplay in real NASA open data, rather than invented statistics, is encouraged."*
- Honesty: *"If live API calls aren't feasible … a curated real dataset embedded directly into your tool is a reasonable and honest alternative—just don't present static data as live."*
- Attribution: *"Clearly attribute your data sources within the tool itself."*
- Trade-offs: *"Avoid designing a 'safe' choice that has no cost."*
- Complexity: *"two or three core resources—life support, power, shielding—are usually more effective than five or six."* **Note:** the game has six. This is optional guidance, but Bonus Mission 05 highlights four.
- Stand-out ideas: *"linking a radiation-shielding decision to actual current space weather data"*, *"Replayability"*, and *"a short explanation of which NASA datasets were used and why."*

**How this branch responds:**
- Bonus Mission 05 replays a real DONKI + RadLab event, labelled as historical.
- An optional live DONKI panel shows "the Sun now" and never back-fills old data as live.
- Every evidence card has a source, a date and an evidence type.
- `NASA_DATA_SOURCE_REGISTRY.md` is the dataset explanation judges can trace.

---

## 4. 2026 Global Offers (optional partner tools)

The page states: *"These offers are optional and are not required."* It also states: *"NASA in no way endorses any non-U.S. Government entity … NASA makes no representations regarding the accuracy of information regarding resources provided by non-U.S. Government entities or the validity of codes to access such resources. Participants are not required to use such resources in completing any challenge."*

**Nothing on the page links Global Offers to judging, scoring or awards.** We found no "bonus" for using them.

| Offer (provider) | Type | Stated terms (verbatim or near-verbatim) | Requirements stated | Relevance to this project |
|---|---|---|---|---|
| Microsoft Azure | Cloud | *"Eligible new Azure customers can start with a credit of $200 to use within 30 days."* Some services always free, others free for 12 months to new customers | *"A phone number, a non-prepaid credit or debit card, and a Microsoft or GitHub account may be required."* Pay-as-you-go after the credit | Could host a CORS proxy for EDA/OSDR. Not needed for DONKI. |
| Microsoft Planetary Computer | APIs / data | Data Catalog and STAC API *"publicly accessible without an account"*; *"Some data requests may require a free access token."* | — | Earth environmental data. Not relevant to Mars/space weather. |
| Microsoft Copilot | AI assistant | Free for individuals at copilot.com | Sign-in | Not a data source |
| GitHub Copilot | Coding assistant | Copilot Free: *"up to 2,000 code completions per month plus limited chat and agent usage"*; *"no credit card is required"* | GitHub account | Developer tool only |
| Microsoft Teams Free | Collaboration | 100 participants, 60-minute meetings, 5 GB storage per user | Microsoft account | Team logistics only |
| Google Cloud | Cloud | *"$300 in credit to spend over the next 90 days"*; *"no auto-charge after the free trial ends"* | Card used for verification; *"you won't be charged unless you manually upgrade"* | Could host a proxy (same as Azure) |
| Meteomatics Weather API | API | *"free access to 1,000 queries per day across all features"*; *"Access is active for the duration of the hackathon."* | Sign-up form → credentials | **Earth** weather. Not Mars, not space weather. |
| Miro Education Plan | Collaboration | Free for 2 years for students, free forever for educators | Application | Planning only |
| Miro Business Plan | Collaboration | 14-day free trial | *"enter your payment information"*; cancel before day 14 to avoid charges | Planning only (watch the auto-charge) |
| Miro Board Templates | Collaboration | Free hackathon templates | Sign-in | Planning only |
| Free Domain and Website Hosting (GoDaddy Registry via Porkbun) | Website | Free domain + one year of hosting + SSL for one year; *"free only for non-premium domains"* | Contact info + email verification | Possible custom domain. The game already deploys via `vercel.json`. |

**Limits of this check:**
- We did **not** sign up for or redeem any offer.
- We did not verify partner pages beyond the Space Apps text.
- We did not check country eligibility. The page doesn't state it; partners' own terms apply.
- Before relying on any offer, open its "Claim Offer" page.

**Recommendation:** none of the offers is needed to activate the NASA data layer. DONKI works directly from the browser. EDA, OSDR Biodata and RadLab are served from bundled snapshots. A proxy is needed only if the team later wants those three **live**. Even then, the free Azure/GCP credits require a payment card, so a serverless function on the existing host is simpler. We have not verified Vercel's pricing.

---

## 5. Sources we could not fully access

| Source | Problem on 2026-11-14 | Workaround |
|---|---|---|
| `www.spaceappschallenge.org` | Legacy TLS root rejected by Node 24 and Windows Schannel | Older CA bundle (OpenSSL-verified) |
| `www.nasa.gov` article pages | Node connections intermittently timed out (`UND_ERR_CONNECT_TIMEOUT`) | Read via a web fetcher. Link checks later returned 200. |
| `www.nasa.gov/hrp/hazard-space-radiation/` | Web fetcher "socket hang up" | Not cited. We cited NASA's "Real Martians" article instead. |
| `api.nasa.gov` | First attempt `ETIMEDOUT` after 633 ms (Node's 250 ms happy-eyeballs default) | Raised Node's connect-attempt timeout to 5 s |
