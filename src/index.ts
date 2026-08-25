import { Hono } from 'hono';

export interface Env {
  DB: D1Database;
  AI: Ai;
  YOUTUBE_API_KEY?: string;
  LINE_CHANNEL_ACCESS_TOKEN?: string;
  LINE_TARGET_ID?: string;
}

const app = new Hono<{ Bindings: Env }>();

// API routes
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'newswatch-line'
  });
});

// GET /api/search-rules (public or admin)
app.get('/api/search-rules', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM search_rules ORDER BY id ASC').all();
  return c.json({ rules: results || [] });
});

// GET /api/admin/search-rules
app.get('/api/admin/search-rules', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM search_rules ORDER BY id ASC').all();
  return c.json({ rules: results || [] });
});

// POST /api/admin/search-rules (CREATE rule)
app.post('/api/admin/search-rules', async (c) => {
  try {
    const body = await c.req.json<{
      keyword: string;
      interval_minutes?: number;
      enabled?: boolean | number;
      published_within_hours?: number;
    }>();

    if (!body.keyword || typeof body.keyword !== 'string' || !body.keyword.trim()) {
      return c.json({ error: 'keyword is required' }, 400);
    }

    const intervalMinutes = body.interval_minutes || 15;
    const enabled = body.enabled === false || body.enabled === 0 ? 0 : 1;
    const publishedWithinHours = body.published_within_hours || 24;

    const res = await c.env.DB.prepare(
      `INSERT INTO search_rules (keyword, interval_minutes, enabled, published_within_hours)
       VALUES (?, ?, ?, ?)`
    )
      .bind(body.keyword.trim(), intervalMinutes, enabled, publishedWithinHours)
      .run();

    const newRule = await c.env.DB.prepare('SELECT * FROM search_rules WHERE id = ?')
      .bind(res.meta.last_row_id)
      .first();

    return c.json({ rule: newRule }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// PATCH /api/admin/search-rules/:id (UPDATE rule)
app.patch('/api/admin/search-rules/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json({ error: 'invalid rule id' }, 400);

  try {
    const body = await c.req.json<{
      keyword?: string;
      interval_minutes?: number;
      enabled?: boolean | number;
      published_within_hours?: number;
    }>();

    const existing = await c.env.DB.prepare('SELECT * FROM search_rules WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ error: 'rule not found' }, 404);
    }

    const keyword = body.keyword !== undefined ? body.keyword.trim() : existing.keyword;
    const intervalMinutes = body.interval_minutes !== undefined ? body.interval_minutes : existing.interval_minutes;
    const enabled = body.enabled !== undefined ? (body.enabled === false || body.enabled === 0 ? 0 : 1) : existing.enabled;
    const publishedWithinHours = body.published_within_hours !== undefined ? body.published_within_hours : existing.published_within_hours;
    const nowIso = new Date().toISOString();

    await c.env.DB.prepare(
      `UPDATE search_rules SET keyword = ?, interval_minutes = ?, enabled = ?, published_within_hours = ?, updated_at = ? WHERE id = ?`
    )
      .bind(keyword, intervalMinutes, enabled, publishedWithinHours, nowIso, id)
      .run();

    const updated = await c.env.DB.prepare('SELECT * FROM search_rules WHERE id = ?')
      .bind(id)
      .first();

    return c.json({ rule: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// DELETE /api/admin/search-rules/:id (DELETE rule)
app.delete('/api/admin/search-rules/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json({ error: 'invalid rule id' }, 400);

  try {
    const res = await c.env.DB.prepare('DELETE FROM search_rules WHERE id = ?')
      .bind(id)
      .run();

    if (res.meta.changes === 0) {
      return c.json({ error: 'rule not found' }, 404);
    }

    return c.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// POST /api/admin/search-rules/:id/run (MANUAL RUN)
app.post('/api/admin/search-rules/:id/run', async (c) => {
  const ruleId = parseInt(c.req.param('id'), 10);
  const apiKey = c.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'YOUTUBE_API_KEY secret is not configured' }, 500);
  }

  try {
    const { SharedIngestionPipeline } = await import('./services/ingestion');
    const pipeline = new SharedIngestionPipeline(c.env.DB, apiKey, {
      aiBinding: c.env.AI,
      lineAccessToken: c.env.LINE_CHANNEL_ACCESS_TOKEN,
      lineTargetId: c.env.LINE_TARGET_ID
    });
    const result = await pipeline.runSearchRule(ruleId);
    return c.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? (err.stack || err.message) : String(err);
    return c.json({ error: `Pipeline Error: ${message}` }, 500);
  }
});

// GET /api/articles (JOIN articles & videos with fallback to raw videos if no AI article generated yet)
app.get('/api/articles', async (c) => {
  // Query articles with joined video metadata
  const { results: articleResults } = await c.env.DB.prepare(`
    SELECT 
      a.id as article_id,
      a.video_id,
      a.headline,
      a.summary,
      a.category,
      a.prefecture,
      a.city,
      a.location_name,
      a.address,
      a.latitude,
      a.longitude,
      a.source_basis,
      a.bullet_points,
      a.tags,
      v.channel_title,
      v.title as video_title,
      v.description as video_description,
      v.published_at,
      v.youtube_url,
      v.thumbnail_url
    FROM articles a
    JOIN videos v ON a.video_id = v.video_id
    ORDER BY v.published_at DESC
    LIMIT 50
  `).all();

  if (articleResults && articleResults.length > 0) {
    const articles = articleResults.map((row: Record<string, unknown>) => {
      let bulletPoints: string[] = [];
      try {
        if (typeof row.bullet_points === 'string') {
          bulletPoints = JSON.parse(row.bullet_points);
        }
      } catch {
        bulletPoints = [];
      }

      let tags: string[] = [];
      try {
        if (typeof row.tags === 'string') {
          tags = JSON.parse(row.tags);
        }
      } catch {
        tags = ['YouTube', '最新ニュース'];
      }

      const hasLoc = Boolean(row.location_name || row.address || (row.latitude && row.longitude));

      return {
        id: String(row.article_id),
        videoId: String(row.video_id),
        title: String(row.headline || row.video_title),
        channelTitle: String(row.channel_title),
        category: String(row.category || 'politics'),
        publishedAt: String(row.published_at).replace('T', ' ').substring(0, 16),
        summary: String(row.summary),
        bulletPoints: bulletPoints.length > 0 ? bulletPoints : [
          `動画ID: ${row.video_id}`,
          `配信元: ${row.channel_title}`,
          `情報ソース: ${row.source_basis || 'youtube_metadata'}`
        ],
        locationName: hasLoc ? (row.location_name ? String(row.location_name) : (row.city ? String(row.city) : String(row.prefecture || ''))) : undefined,
        address: hasLoc && row.address ? String(row.address) : undefined,
        latitude: hasLoc && typeof row.latitude === 'number' ? row.latitude : undefined,
        longitude: hasLoc && typeof row.longitude === 'number' ? row.longitude : undefined,
        tags: tags.length > 0 ? tags : ['YouTube', '最新ニュース'],
        thumbnailUrl: String(row.thumbnail_url),
        youtubeUrl: String(row.youtube_url)
      };
    });

    return c.json({ articles });
  }

  // Fallback: if no articles table records yet, read from raw videos
  const { results: videoResults } = await c.env.DB.prepare(
    'SELECT video_id, channel_id, channel_title, title, description, published_at, youtube_url, thumbnail_url, discovered_at FROM videos ORDER BY published_at DESC LIMIT 50'
  ).all();

  const articles = (videoResults || []).map((v: Record<string, unknown>) => ({
    id: String(v.video_id),
    videoId: String(v.video_id),
    title: String(v.title),
    channelTitle: String(v.channel_title),
    category: 'politics',
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

// GET /api/articles/:id (Single article view)
app.get('/api/articles/:id', async (c) => {
  const idParam = c.req.param('id');
  
  // Try querying by articles.id first, then articles.video_id
  const isNumeric = /^\d+$/.test(idParam);
  let articleRow = null;

  if (isNumeric) {
    articleRow = await c.env.DB.prepare(`
      SELECT a.*, v.channel_title, v.title as video_title, v.description as video_description, v.published_at, v.youtube_url, v.thumbnail_url
      FROM articles a JOIN videos v ON a.video_id = v.video_id
      WHERE a.id = ?
    `).bind(parseInt(idParam, 10)).first();
  }

  if (!articleRow) {
    articleRow = await c.env.DB.prepare(`
      SELECT a.*, v.channel_title, v.title as video_title, v.description as video_description, v.published_at, v.youtube_url, v.thumbnail_url
      FROM articles a JOIN videos v ON a.video_id = v.video_id
      WHERE a.video_id = ?
    `).bind(idParam).first();
  }

  if (articleRow) {
    let bulletPoints: string[] = [];
    try { if (typeof articleRow.bullet_points === 'string') bulletPoints = JSON.parse(articleRow.bullet_points); } catch { bulletPoints = []; }
    let tags: string[] = [];
    try { if (typeof articleRow.tags === 'string') tags = JSON.parse(articleRow.tags); } catch { tags = []; }

    const hasLoc = Boolean(articleRow.location_name || articleRow.address || (articleRow.latitude && articleRow.longitude));

    return c.json({
      article: {
        id: String(articleRow.id),
        videoId: String(articleRow.video_id),
        title: String(articleRow.headline || articleRow.video_title),
        channelTitle: String(articleRow.channel_title),
        category: String(articleRow.category || 'politics'),
        publishedAt: String(articleRow.published_at).replace('T', ' ').substring(0, 16),
        summary: String(articleRow.summary),
        bulletPoints,
        locationName: hasLoc ? (articleRow.location_name ? String(articleRow.location_name) : String(articleRow.city || articleRow.prefecture || '')) : undefined,
        address: hasLoc && articleRow.address ? String(articleRow.address) : undefined,
        latitude: hasLoc && typeof articleRow.latitude === 'number' ? articleRow.latitude : undefined,
        longitude: hasLoc && typeof articleRow.longitude === 'number' ? articleRow.longitude : undefined,
        tags,
        thumbnailUrl: String(articleRow.thumbnail_url),
        youtubeUrl: String(articleRow.youtube_url)
      }
    });
  }

  // Fallback to raw video record
  const videoRow = await c.env.DB.prepare('SELECT * FROM videos WHERE video_id = ?').bind(idParam).first();
  if (videoRow) {
    return c.json({
      article: {
        id: String(videoRow.video_id),
        videoId: String(videoRow.video_id),
        title: String(videoRow.title),
        channelTitle: String(videoRow.channel_title),
        category: 'politics',
        publishedAt: String(videoRow.published_at).replace('T', ' ').substring(0, 16),
        summary: String(videoRow.description),
        bulletPoints: [`動画ID: ${videoRow.video_id}`, `配信元: ${videoRow.channel_title}`],
        locationName: undefined,
        address: undefined,
        latitude: undefined,
        longitude: undefined,
        tags: ['YouTube'],
        thumbnailUrl: String(videoRow.thumbnail_url),
        youtubeUrl: String(videoRow.youtube_url)
      }
    });
  }

  return c.json({ error: 'Article not found' }, 404);
});

// GET /n/* (Serve SPA HTML for article permalinks)
app.get('/n/*', async (c) => {
  return c.html(`<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>NewsWatch | YouTubeニュース現場マップ＆AI要約</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind = {
        config: {
          darkMode: 'class'
        }
      }
    </script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script type="module" src="/assets/index-DyGZ6qeB.js"></script>
    <link rel="stylesheet" href="/assets/index--JtZQWZH.css">
  </head>
  <body class="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-red-500 selection:text-white">
    <div id="root"></div>
  </body>
</html>`);
});

export { app };

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log(`Cron trigger fired at ${new Date(event.scheduledTime).toISOString()}`);
    
    if (!env.YOUTUBE_API_KEY) {
      console.warn('Cron skipped: YOUTUBE_API_KEY secret is not configured');
      return;
    }

    try {
      // 1. Fetch enabled search rules
      const { results: dueRules } = await env.DB.prepare(`
        SELECT * FROM search_rules 
        WHERE enabled = 1 
          AND (last_checked_at IS NULL OR (strftime('%s', 'now') - strftime('%s', last_checked_at)) >= (interval_minutes * 60))
      `).all();

      if (!dueRules || dueRules.length === 0) {
        console.log('Cron finished: No search rules due for execution');
        return;
      }

      const { SharedIngestionPipeline } = await import('./services/ingestion');
      const pipeline = new SharedIngestionPipeline(env.DB, env.YOUTUBE_API_KEY, {
        aiBinding: env.AI,
        lineAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
        lineTargetId: env.LINE_TARGET_ID
      });

      for (const rule of dueRules) {
        const ruleId = Number(rule.id);
        try {
          const res = await pipeline.runSearchRule(ruleId);
          console.log(`Cron executed rule ${ruleId} (${rule.keyword}): fetched=${res.fetched}, inserted=${res.inserted}, duplicates=${res.duplicates}, aiGenerated=${res.aiGenerated}, lineSent=${res.lineSent}`);
        } catch (ruleErr) {
          console.error(`Cron rule ${ruleId} failed:`, ruleErr);
        }
      }
    } catch (cronErr) {
      console.error('Cron scheduled execution error:', cronErr);
    }
  }
};
