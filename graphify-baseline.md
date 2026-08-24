# NewsWatch Graphify Baseline

## 1. Project Contract
- **Project**: `NewsWatch`
- **Repository**: `newswatch-line`
- **Local Directory**: `i:/マイドライブ/news_akimu/newswatch-line`
- **Production Domain**: `news.akimu.org` (Production URL: `https://news.akimu.org`)
- **Cloudflare Worker**: `newswatch-line`
- **Cloudflare D1**: `newswatch-line-db`
- **Forbidden Legacy Domain Notice**: Legacy domain references are strictly forbidden. Production domain is news.akimu.org only.

## 2. System Architecture
```
GitHub
  ↓ (Cloudflare Git Integration)
Cloudflare Workers (newswatch-line)
  ├─ Static Assets / React Frontend (Vite + Tailwind CSS)
  ├─ API Server (Hono)
  ├─ Cron Scheduler (Cloudflare Cron Triggers */5 * * * *)
  ├─ Storage (Cloudflare D1: newswatch-line-db)
  └─ AI (Cloudflare Workers AI)

External Services:
  - YouTube Data API v3 (Japanese News search)
  - LINE Messaging API (Push Notifications)
  - Google Maps (Location links)
```

## 3. Canonical Data Model & Flow
```
search_rules (keyword, interval_minutes, enabled, published_within_hours, last_checked_at)
  ↓ [YouTube Search]
videos (video_id [PRIMARY KEY], channel_id, channel_title, title, description, published_at, youtube_url, thumbnail_url, raw_metadata_json)
  ↓ [Workers AI Summary & Location Extraction]
articles (id, video_id [FK->videos], headline, summary, category, prefecture, city, location_name, address, latitude, longitude, source_basis='youtube_metadata', ai_model, ai_confidence)
  ↓ [LINE Notification Engine]
notifications (id, article_id [FK->articles], destination_type='line', sent_at, status='pending'|'sent'|'failed', error_code)
  ↓ [LINE Messaging API]
LINE Channel Subscriber
```

## 4. Deduplication Rules
- **Primary Canonical Duplicate Key**: `YouTube videoId`
- `videos.video_id` MUST have UNIQUE / PRIMARY KEY constraint in D1.
- Duplicate `videoId` found during ingestion MUST be skipped without further AI processing or notification.
- Notifications MUST check `notifications` table per article to prevent re-sending the same article.

## 5. AI Source Boundary & Hallucination Guard
- **Source Basis**: `youtube_metadata` ONLY. Input to AI is restricted to `title`, `description`, `channelTitle`, `publishedAt`.
- AI MUST NOT be treated as having watched the video.
- **Hallucination Prevention**: If information (address, prefecture, city, location_name, latitude, longitude) does not exist in the source metadata, AI MUST return `null`. Guessing addresses or details is STRICTLY FORBIDDEN.

## 6. Location & Google Maps Contract
- Position data (`address`, `location_name`, `city`, `prefecture`) can only be used if backed by source metadata.
- If location data is `null`, the Google Maps button on the article page MUST be hidden.

## 7. Scheduler Contract
- Common Cron Trigger (`*/5 * * * *`) fires the Worker scheduled handler.
- Scheduled handler queries `enabled` search rules where `last_checked_at + interval_minutes <= current_time`.
- Keyword-specific Cron Triggers are FORBIDDEN.

## 8. Admin Security & Secrets Boundary
- `/admin` and `/api/admin/*` paths MUST be protected via Cloudflare Access in Production.
- Secrets (`YOUTUBE_API_KEY`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_TARGET_ID`) MUST NEVER be committed to Git or written to source files or logs.
- Secrets MUST be managed via Cloudflare Secrets.

## 9. Development Lifecycle Policy
- **Graphify First Rule**: Baseline knowledge graph MUST be checked/established BEFORE scaffolding or writing any code.
- Verification steps (lint -> typecheck -> test -> build -> local runtime -> browser -> production deploy -> graphify final validation) MUST be executed sequentially.

## 10. Phase 1 Verified Implementation Facts
- **Actual Folder Structure**: `src/index.ts` (Worker), `web/` (React SPA), `migrations/0000_init.sql` (D1), `scripts/graphify/` (Graphify pipeline), `graphify-out/graph.json` (Artifact).
- **Actual Worker Entrypoint**: `src/index.ts` exporting Hono app (`/api/health`) and `scheduled` cron handler.
- **Actual Static Assets Config**: `assets.directory = "./dist"` configured in `wrangler.jsonc`.
- **Actual D1 Binding**: `d1_databases[0].binding = "DB"`, `database_name = "newswatch-line-db"`.
- **Actual Workers AI Binding**: `ai.binding = "AI"`.
- **Actual Cron Trigger**: `triggers.crons = ["*/5 * * * *"]`.
- **Actual Migration File**: `migrations/0000_init.sql` defining `search_rules`, `videos`, `articles`, `notifications` (`UNIQUE(article_id, destination_type, destination_hash)`), `app_settings`.
- **Actual Graphify Check Command**: `npm run graphify:check`.

## 11. Phase 2 Verified Implementation Facts
- **Verified News & Politics Category ID**: `25` (`videoCategories.list` with `regionCode=JP`, `hl=ja` confirmed ID `25` as `ニュースと政治`).
- **Actual YouTube Query Contract**: `part=snippet`, `type=video`, `order=date`, `regionCode=JP`, `relevanceLanguage=ja`, `videoCategoryId=25`, `q=<keyword>`, `publishedAfter=<iso_date>`.
- **Actual Metadata Mapping**: `videoId` (Primary Key), `channelId`, `channelTitle`, `title`, `description`, `publishedAt`, `youtubeUrl` (`https://www.youtube.com/watch?v={videoId}`), `thumbnailUrl`.
- **Actual Application Deduplication**: `video_id` query check prior to D1 insertion in `SharedIngestionPipeline` (`src/services/ingestion/index.ts`).
- **Actual Ingestion Route**: `POST /api/admin/search-rules/:id/run` executing shared `SharedIngestionPipeline.runSearchRule(ruleId)`.
- **Actual Source Basis Contract**: `youtube_metadata` for raw YouTube metadata projection prior to Workers AI generation.


