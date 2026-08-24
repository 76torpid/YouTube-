import { Hono } from 'hono';

export interface Env {
  DB: D1Database;
  AI: Ai;
  YOUTUBE_API_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();

// API routes
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'newswatch-line'
  });
});

// GET /api/search-rules
app.get('/api/search-rules', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM search_rules ORDER BY id ASC').all();
  return c.json({ rules: results || [] });
});

// POST /api/admin/search-rules/:id/run
app.post('/api/admin/search-rules/:id/run', async (c) => {
  const ruleId = parseInt(c.req.param('id'), 10);
  const apiKey = c.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'YOUTUBE_API_KEY secret is not configured' }, 500);
  }

  try {
    const { SharedIngestionPipeline } = await import('./services/ingestion');
    const pipeline = new SharedIngestionPipeline(c.env.DB, apiKey);
    const result = await pipeline.runSearchRule(ruleId);
    return c.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? (err.stack || err.message) : String(err);
    return c.json({ error: `Pipeline Error: ${message}` }, 500);
  }
});

// GET /api/articles (Phase 2 Temporary adapter from videos)
app.get('/api/articles', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT video_id, channel_id, channel_title, title, description, published_at, youtube_url, thumbnail_url, discovered_at FROM videos ORDER BY published_at DESC LIMIT 50'
  ).all();

  const articles = (results || []).map((v: Record<string, unknown>) => ({
    id: String(v.video_id),
    title: String(v.title),
    channelTitle: String(v.channel_title),
    category: 'ニュース・政治',
    publishedAt: String(v.published_at).replace('T', ' ').substring(0, 16),
    summary: String(v.description) || 'YouTube動画メタデータ情報',
    bulletPoints: [
      `動画ID: ${v.video_id}`,
      `配信元: ${v.channel_title}`,
      `情報ソース: youtube_metadata`
    ],
    locationName: undefined,
    address: undefined,
    latitude: undefined,
    longitude: undefined,
    tags: ['YouTube', '最新ニュース', 'YouTubeMetadata'],
    thumbnailUrl: String(v.thumbnail_url),
    youtubeUrl: String(v.youtube_url)
  }));

  return c.json({ articles });
});

export { app };

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, _env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log(`Cron trigger fired at ${new Date(event.scheduledTime).toISOString()}`);
  }
};
