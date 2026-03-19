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
- **Caching:** Implement a database layer (e.g., Supabase, Vercel KV, PostgreSQL) to cache BPM results. Once a song's BPM is found, we should never have to spend an API call to look it up again.

### 4. Quality of Life Features
- **Audio Previews:** Fetch and integrate short 30-second audio previews so users can test the rhythm directly from the table.
- **Pagination / Infinite Scroll:** Implement proper pagination for large search results or massive playlists to keep the UI snappy.
- **Exporting:** Allow users to save their newly filtered, tempo-matched tracklists back to their streaming service as a new playlist.
