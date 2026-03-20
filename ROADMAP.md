# Cadence.ly - Project Roadmap

## Core Mission
To provide tempo/BPM (beats per minute) information to users who are trying to find music they can run or dance to based on a preferred rhythm. The ultimate goal is to allow users to parse through their own music libraries to curate the perfect, rhythm-matched tracklists for their activities.

## Current State
- ✅ Search for Songs, Artists, Albums, and Playlists (via YouTube Music API).
- ✅ Expand albums/playlists to lazily load and display tracklists.
- ✅ Fetch and display BPM for individual tracks upon expansion.
- ✅ Clean, responsive UI using Tailwind CSS and Flowbite React.

## Upcoming Milestones

### 1. User Library Integration (OAuth)
- Implement authentication (e.g., "Login with Spotify", "Login with YouTube Music").
- Allow users to pull their saved playlists, liked songs, and library directly into the app for parsing.

### 2. Advanced BPM Filtering (Next Up)
- Allow users to apply and unapply the min/max BPM filter dynamically to all table results.
- Enforce the global Min/Max BPM filter within Album and Playlist views.
- When a user inputs a target range (e.g., 120 - 130 BPM), the UI should filter out non-matching tracks or distinctly highlight the ones that fall into the "sweet spot".

### 3. API Optimization & Rate Limit Management
- Transition to or integrate `getsongbpm.com` API for highly accurate, dedicated BPM data.
- **Batching:** Optimize how we fetch BPM for a list of 50+ songs in a playlist to avoid rate-limiting.
- **Caching:** Implement a database layer to cache BPM results. Once a song's BPM is found, we should avoid redundant API calls. **Target: PostgreSQL** (e.g., Azure Database for PostgreSQL Flexible Server) with connection secrets in Key Vault / Container App secrets—see milestone **5** for schema and API details.

### 4. Quality of Life Features
- **Audio Previews:** Fetch and integrate short 30-second audio previews so users can test the rhythm directly from the table.
- **Pagination / Infinite Scroll:** Implement proper pagination for large search results or massive playlists to keep the UI snappy.
- **Exporting:** Allow users to save their newly filtered, tempo-matched tracklists back to their streaming service as a new playlist.

### 5. Client-Side BPM (Essentia.js) + PostgreSQL Persistence

When GetSongBPM (or other APIs) return no BPM, offer **in-browser** tempo estimation so users can still get a useful number. Persist results for reuse and analytics.

#### 5.1 Essentia.js integration (browser)

- **Spike:** Prove file → decode → Essentia WASM → BPM (and confidence if available) in a minimal flow (console or isolated page).
- **Lazy load:** Dynamic `import()` + WASM assets only when the user starts “Measure BPM” so the main bundle stays small.
- **Audio source:** User-provided audio via file input / drag-and-drop (`AudioContext.decodeAudioData`). *Streaming URLs (Spotify, YouTube, etc.) are not a reliable source* without licensed, CORS-accessible audio—plan around local files first.
- **UX:** In song results, when BPM is missing (“Not Found”), add **“Measure from file…”** (modal or panel): progress state → show **estimated BPM** (label clearly as estimated) + optional confidence.
- **Performance:** Run heavy work in a **Web Worker**; optionally analyze only the first **60–90s** (or downsample) for speed and mobile memory.
- **License check:** `essentia.js` is **AGPL-3.0**—confirm fit with Cadence.ly’s distribution model before shipping; consider legal review or an alternative if AGPL is a blocker.

#### 5.2 PostgreSQL schema & backend (Next.js)

- **Provision:** PostgreSQL (e.g., Azure Flexible Server); secure `DATABASE_URL` via secrets (same pattern as `GETSONGBPM_API_KEY`).
- **ORM:** Add **Drizzle** or **Prisma** + migrations.
- **Suggested table (e.g., `bpm_measurements`):** `id` (UUID), stable **`song_uri`** / external id when available, normalized **`title` / `artist` / `album`** fallback fields, **`bpm`**, nullable **`confidence`**, **`source`** (`getsongbpm` | `essentia`), **`created_at`** (`timestamptz`). Unique constraint strategy to dedupe (e.g., per `song_uri` or composite normalized identity + `source`).
- **API routes (example):** `POST /api/bpm-measurements` (save client-measured or API-sourced BPM + metadata only—**no raw audio** by default); `GET /api/bpm-measurements?uri=…` (cache lookup for prefetch on search).
- **Policy:** Define precedence when both API and cache exist (e.g., API wins, Essentia fills gaps only).
- **Hardening:** Validation, rate limiting; optional CAPTCHA if abuse appears.

#### 5.3 End-to-end flow (checklist)

1. Search → show API BPM or “Not Found”.
2. User chooses **Measure from file** → Essentia in browser → show estimated BPM.
3. Update row optimistically; **POST** measurement to Postgres with `source: essentia`.
4. Optional: on successful GetSongBPM responses, **POST** with `source: getsongbpm` to warm the cache.
5. Optional: **GET** cache by `uri` / normalized keys when rendering results to reduce empty BPM cells.

