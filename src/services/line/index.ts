export interface LineNotificationResult {
  articleId: number;
  sent: boolean;
  skipped: boolean;
  error?: string;
}

export class LineNotificationService {
  private accessToken: string;
  private targetId: string;
  private db: D1Database;

  constructor(db: D1Database, accessToken: string, targetId: string) {
    this.db = db;
    this.accessToken = accessToken;
    this.targetId = targetId;
  }

  /**
   * Hash destination ID for storage (never store raw LINE IDs)
   */
  private hashDestination(destinationId: string): string {
    // Simple hash for destination_hash column
    let hash = 0;
    for (let i = 0; i < destinationId.length; i++) {
      const char = destinationId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `line_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Send LINE notification for a new article, with deduplication
   */
  async notifyNewArticle(
    articleId: number,
    headline: string,
    summary: string,
    channelTitle: string,
    articleUrl: string
  ): Promise<LineNotificationResult> {
    const destinationHash = this.hashDestination(this.targetId);

    // Check for duplicate notification
    const existing = await this.db
      .prepare(
        'SELECT id FROM notifications WHERE article_id = ? AND destination_type = ? AND destination_hash = ?'
      )
      .bind(articleId, 'line', destinationHash)
      .first();

    if (existing) {
      return { articleId, sent: false, skipped: true };
    }

    // Insert pending notification record
    await this.db
      .prepare(
        `INSERT INTO notifications (article_id, destination_type, destination_hash, status)
         VALUES (?, 'line', ?, 'pending')`
      )
      .bind(articleId, destinationHash)
      .run();

    // Build LINE message
    const summaryShort = summary.length > 100 ? summary.substring(0, 100) + '...' : summary;
    const messageText = [
      '📰 NewsWatch 新着記事',
      '',
      `📋 ${headline}`,
      '',
      summaryShort,
      '',
      `📺 ${channelTitle}`,
      '',
      `🔗 ${articleUrl}`
    ].join('\n');

    try {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          to: this.targetId,
          messages: [
            {
              type: 'text',
              text: messageText
            }
          ]
        })
      });

      if (res.ok) {
        await this.db
          .prepare(
            "UPDATE notifications SET status = 'sent', sent_at = ? WHERE article_id = ? AND destination_type = 'line' AND destination_hash = ?"
          )
          .bind(new Date().toISOString(), articleId, destinationHash)
          .run();
        return { articleId, sent: true, skipped: false };
      } else {
        const errBody = await res.text();
        const errorCode = `HTTP_${res.status}`;
        await this.db
          .prepare(
            "UPDATE notifications SET status = 'failed', error_code = ? WHERE article_id = ? AND destination_type = 'line' AND destination_hash = ?"
          )
          .bind(errorCode, articleId, destinationHash)
          .run();
        return { articleId, sent: false, skipped: false, error: `LINE API ${res.status}: ${errBody.substring(0, 200)}` };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.db
        .prepare(
          "UPDATE notifications SET status = 'failed', error_code = ? WHERE article_id = ? AND destination_type = 'line' AND destination_hash = ?"
        )
        .bind('NETWORK_ERROR', articleId, destinationHash)
        .run();
      return { articleId, sent: false, skipped: false, error: errorMsg };
    }
  }
}
