import { Hono } from 'hono';

export interface Env {
  DB: D1Database;
  AI: Ai;
}

const app = new Hono<{ Bindings: Env }>();

// API routes
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'newswatch-line'
  });
});

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron trigger fired at ${new Date(event.scheduledTime).toISOString()}`);
  }
};
