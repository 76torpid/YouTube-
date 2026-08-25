# NewsWatch Graphify Baseline

## 1. Project Contract
- **Project**: `NewsWatch`
- **Repository**: `newswatch-line`
- **Local Directory**: `i:/マイドライブ/news_akimu/newswatch-line`
- **Production Domain**: `news.akimu.org` (Production URL: `https://news.akimu.org`)
- **Cloudflare Worker**: `newswatch-line`
- **Cloudflare D1 Database**: `newswatch-line-db` (`d6f1b2b9-8c1e-4ec8-b31d-ed93f30c4094`)
- **Forbidden Legacy Domain Notice**: Legacy domain references are strictly forbidden. Production domain is news.akimu.org only.

## 2. System Architecture
```
GitHub
  ↓ (Cloudflare Git Integration / Wrangler Deploy)
Cloudflare Workers (newswatch-line)
  ├─ Static Assets / React Frontend (Vite + Tailwind CSS + Leaflet)
  ├─ API Server (Hono)
  ├─ Cron Scheduler (Cloudflare Cron Triggers */5 * * * *)
  ├─ Storage (Cloudflare D1: newswatch-line-db)
  └─ AI (Cloudflare Workers AI @cf/meta/llama-3.1-8b-instruct-fast)

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
articles (id, video_id [FK->videos], headline, summary, category, prefecture, city, location_name, address, latitude, longitude, source_basis='youtube_metadata', ai_model, ai_confidence, bullet_points, tags, location_confidence, incident_type)
  ↓ [LINE Notification Engine]
notifications (id, article_id [FK->articles], destination_type='line', destination_hash, sent_at, status='pending'|'sent'|'failed', error_code)
  ↓ [LINE Messaging API]
LINE Channel Subscriber
```

## 4. Deduplication Rules
- **Primary Canonical Duplicate Key**: `YouTube videoId`
- `videos.video_id` MUST have UNIQUE / PRIMARY KEY constraint in D1.
- Duplicate `videoId` found during ingestion MUST be skipped without further AI processing or notification.
- Notifications MUST check `notifications` table per `article_id + destination_type + destination_hash` to prevent re-sending the same article to the same destination. Verified in production pipeline (`fetched: 10, inserted: 0, duplicates: 10`).

## 5. AI Source Boundary & Hallucination Guard
- **Source Basis**: `youtube_metadata` ONLY. Input to AI is restricted to `title`, `description`, `channelTitle`, `publishedAt`.
- AI MUST NOT be treated as having watched the video.
- **Hallucination Prevention**: If information (address, prefecture, city, location_name, latitude, longitude) does not exist in the source metadata, AI MUST return `null`. Guessing addresses or details is STRICTLY FORBIDDEN.
- **Model**: Canonical model is `@cf/meta/llama-3.1-8b-instruct-fast`.

## 6. Location & Google Maps Contract
- Position data (`address`, `location_name`, `city`, `prefecture`) can only be used if backed by source metadata.
- If location data is `null`, the Google Maps button on the article page MUST be hidden.

## 7. Scheduler Contract
- Common Cron Trigger (`*/5 * * * *`) fires the Worker scheduled handler.
- Scheduled handler queries `enabled` search rules where `last_checked_at + interval_minutes <= current_time`.
- Keyword-specific Cron Triggers are FORBIDDEN.

## 8. Admin Security & Secrets Boundary
- `/admin` and `/api/admin/*` paths MUST be protected via Cloudflare Access in Production.
- Cloudflare Access authentication end-to-end verified for protected routes while public routes (`/`, `/n/*`, `/api/health`, `/api/articles`) remain publicly accessible.
- Secrets (`YOUTUBE_API_KEY`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_TARGET_ID`) MUST NEVER be committed to Git or written to source files or logs. Verified Cloudflare Secrets stored remotely.

## 9. Development Lifecycle Policy
- **Graphify First Rule**: Baseline knowledge graph MUST be checked/established BEFORE scaffolding or writing any code.
- Verification steps (lint -> typecheck -> test -> build -> local runtime -> browser -> production deploy -> graphify final validation) MUST be executed sequentially.

## 10. Phase 1 Verified Implementation Facts
- **Actual Folder Structure**: `src/index.ts` (Worker), `web/` (React SPA), `migrations/0000_init.sql` (D1), `scripts/graphify/` (Graphify pipeline), `graphify-out/graph.json` (Artifact).
- **Actual Worker Entrypoint**: `src/index.ts` exporting Hono app (`/api/health`) and `scheduled` cron handler.
- **Actual Static Assets Config**: `assets.directory = "./dist"`, `assets.not_found_handling = "single-page-application"` configured in `wrangler.jsonc`.
- **Actual D1 Binding**: `d1_databases[0].binding = "DB"`, `database_name = "newswatch-line-db"`, `database_id = "d6f1b2b9-8c1e-4ec8-b31d-ed93f30c4094"`.
- **Actual Workers AI Binding**: `ai.binding = "AI"`.
- **Actual Cron Trigger**: `triggers.crons = ["*/5 * * * *"]`.
- **Actual Migration Files**: `migrations/0000_init.sql` and `migrations/0001_articles_enhance.sql` (Both executed and verified on production D1).
- **Actual Graphify Check Command**: `npm run graphify:check`.

## 11. Full Production Architecture Verified Implementation Facts
- **Verified News & Politics Category ID**: `25` (`videoCategories.list` with `regionCode=JP`, `hl=ja` confirmed ID `25` as `ニュースと政治`).
- **Actual YouTube Query Contract**: `part=snippet`, `type=video`, `order=date`, `regionCode=JP`, `relevanceLanguage=ja`, `videoCategoryId=25`, `q=<keyword>`, `publishedAfter=<iso_date>`.
- **Actual Metadata Mapping**: `videoId` (Primary Key), `channelId`, `channelTitle`, `title`, `description`, `publishedAt`, `youtubeUrl` (`https://www.youtube.com/watch?v={videoId}`), `thumbnailUrl`.
- **Actual Application Deduplication**: `video_id` query check prior to D1 insertion in `SharedIngestionPipeline` (`src/services/ingestion/index.ts`).
- **Actual Search Rules CRUD Routes**: `GET /api/admin/search-rules`, `POST /api/admin/search-rules`, `PATCH /api/admin/search-rules/:id`, `DELETE /api/admin/search-rules/:id`, `POST /api/admin/search-rules/:id/run`.
- **Actual Articles API Routes**: `GET /api/articles` (JOIN `articles` & `videos`), `GET /api/articles/:id`.
- **Actual Workers AI Service**: `ArticleGenerationService` (`src/services/ai/index.ts`) generating structured JSON using `@cf/meta/llama-3.1-8b-instruct-fast`.
- **Actual LINE Service**: `LineNotificationService` (`src/services/line/index.ts`) with `notifications` table deduplication via `destination_hash`.
- **Actual Production Deployment**: Deployed to Cloudflare Workers (`newswatch-line`) with custom domain `news.akimu.org`, D1 remote database migrated, Secrets uploaded, E2E ingestion verified (`fetched: 10, inserted: 10, aiGenerated: 10, lineSent: 10`).
- **Actual Cloudflare Access Application**: Self-hosted application `NewsWatch Admin` protecting `news.akimu.org/admin` and `news.akimu.org/api/admin`.
