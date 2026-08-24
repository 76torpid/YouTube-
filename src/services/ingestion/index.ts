import { NormalizedVideo, YouTubeService } from '../youtube';
import { ArticleGenerationService } from '../ai';
import { LineNotificationService } from '../line';

export interface SearchRuleRow {
  id: number;
  keyword: string;
  interval_minutes: number;
  enabled: number;
  published_within_hours: number;
  last_checked_at?: string;
}

export interface IngestionResult {
  ruleId: number;
  keyword: string;
  fetched: number;
  inserted: number;
  duplicates: number;
  aiGenerated: number;
  aiFailed: number;
  lineSent: number;
  lineFailed: number;
  lastAiError?: string;
}

export interface PipelineOptions {
  aiBinding?: Ai;
  lineAccessToken?: string;
  lineTargetId?: string;
  baseUrl?: string;
}

export class SharedIngestionPipeline {
  private db: D1Database;
  private youtube: YouTubeService;
  private options: PipelineOptions;

  constructor(db: D1Database, youtubeKey: string, options: PipelineOptions = {}) {
    this.db = db;
    this.youtube = new YouTubeService(youtubeKey);
    this.options = options;
  }

  async runSearchRule(ruleId: number): Promise<IngestionResult> {
    // 1. Fetch rule from D1
    const ruleRow = await this.db
      .prepare('SELECT * FROM search_rules WHERE id = ?')
      .bind(ruleId)
      .first<SearchRuleRow>();

    if (!ruleRow) {
      throw new Error(`Search rule with ID ${ruleId} not found`);
    }

    // 2. Calculate publishedAfter date limit
    const hours = ruleRow.published_within_hours || 24;
    const publishedAfterDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const publishedAfterIso = publishedAfterDate.toISOString();

    // 3. Search videos via YouTube API
    const videos: NormalizedVideo[] = await this.youtube.searchVideos(
      ruleRow.keyword,
      publishedAfterIso
    );

    let inserted = 0;
    let duplicates = 0;
    let aiGenerated = 0;
    let aiFailed = 0;
    let lineSent = 0;
    let lineFailed = 0;

    const baseUrl = this.options.baseUrl || 'https://news.akimu.org';
    const aiService = this.options.aiBinding ? new ArticleGenerationService(this.options.aiBinding) : null;
    const lineService = (this.options.lineAccessToken && this.options.lineTargetId)
      ? new LineNotificationService(this.db, this.options.lineAccessToken, this.options.lineTargetId)
      : null;

    let lastAiError: string | undefined;

    // 4. Ingest into D1 with video_id canonical deduplication
    for (const v of videos) {
      // Check if video_id already exists in D1 videos table
      const existingVideo = await this.db
        .prepare('SELECT video_id FROM videos WHERE video_id = ?')
        .bind(v.videoId)
        .first();

      if (existingVideo) {
        duplicates++;
        continue;
      }

      // Insert new video
      try {
        await this.db
          .prepare(
            `INSERT INTO videos (video_id, channel_id, channel_title, title, description, published_at, youtube_url, thumbnail_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            v.videoId,
            v.channelId,
            v.channelTitle,
            v.title,
            v.description,
            v.publishedAt,
            v.youtubeUrl,
            v.thumbnailUrl
          )
          .run();
        inserted++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('UNIQUE') || message.includes('PRIMARYKEY') || message.includes('PRIMARY KEY')) {
          duplicates++;
          continue;
        } else {
          throw err;
        }
      }

      // 5. Workers AI article generation if AI binding is available
      if (aiService) {
        try {
          // Check if article for this video_id already exists
          const existingArticle = await this.db
            .prepare('SELECT id FROM articles WHERE video_id = ?')
            .bind(v.videoId)
            .first();

          if (!existingArticle) {
            const articleData = await aiService.generateArticle({
              title: v.title,
              description: v.description,
              channelTitle: v.channelTitle,
              publishedAt: v.publishedAt
            });

            const bulletPointsJson = JSON.stringify(articleData.bulletPoints);
            const tagsJson = JSON.stringify(articleData.tags);

            const pref = articleData.location?.prefecture || null;
            const city = articleData.location?.city || null;
            const locName = articleData.location?.locationName || null;
            const addr = articleData.location?.address || null;
            const lat = articleData.location?.latitude || null;
            const lng = articleData.location?.longitude || null;
            const conf = articleData.location?.confidence || null;

            const res = await this.db
              .prepare(
                `INSERT INTO articles (
                  video_id, headline, summary, category, prefecture, city, location_name, address, latitude, longitude,
                  source_basis, ai_model, ai_confidence, bullet_points, tags, location_confidence, incident_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              )
              .bind(
                v.videoId,
                articleData.headline,
                articleData.summary,
                articleData.category,
                pref,
                city,
                locName,
                addr,
                lat,
                lng,
                'youtube_metadata',
                '@cf/meta/llama-3-8b-instruct',
                conf,
                bulletPointsJson,
                tagsJson,
                conf,
                articleData.incidentType
              )
              .run();

            aiGenerated++;

            const newArticleId = res.meta.last_row_id;

            // 6. Send LINE notification if lineService is available
            if (lineService && newArticleId) {
              const articleUrl = `${baseUrl}/n/${newArticleId}`;
              const lineRes = await lineService.notifyNewArticle(
                Number(newArticleId),
                articleData.headline,
                articleData.summary,
                v.channelTitle,
                articleUrl
              );
              if (lineRes.sent) lineSent++;
              if (lineRes.error) lineFailed++;
            }
          }
        } catch (aiErr) {
          lastAiError = aiErr instanceof Error ? (aiErr.stack || aiErr.message) : String(aiErr);
          console.error(`AI article generation failed for video ${v.videoId}:`, lastAiError);
          aiFailed++;
        }
      }
    }

    // 7. Update last_checked_at on search_rules
    const nowIso = new Date().toISOString();
    await this.db
      .prepare('UPDATE search_rules SET last_checked_at = ?, updated_at = ? WHERE id = ?')
      .bind(nowIso, nowIso, ruleId)
      .run();

    return {
      ruleId,
      keyword: ruleRow.keyword,
      fetched: videos.length,
      inserted,
      duplicates,
      aiGenerated,
      aiFailed,
      lineSent,
      lineFailed,
      lastAiError
    };
  }
}
