import { NormalizedVideo, YouTubeService } from '../youtube';

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
}

export class SharedIngestionPipeline {
  private db: D1Database;
  private youtube: YouTubeService;

  constructor(db: D1Database, youtubeKey: string) {
    this.db = db;
    this.youtube = new YouTubeService(youtubeKey);
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

    // 4. Ingest into D1 with video_id canonical deduplication
    for (const v of videos) {
      // Check if video_id already exists in D1
      const existing = await this.db
        .prepare('SELECT video_id FROM videos WHERE video_id = ?')
        .bind(v.videoId)
        .first();

      if (existing) {
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
        // Handle DB constraint failure gracefully if race condition occurs
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('UNIQUE') || message.includes('PRIMARYKEY')) {
          duplicates++;
        } else {
          throw err;
        }
      }
    }

    // 5. Update last_checked_at on search_rules
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
      duplicates
    };
  }
}
