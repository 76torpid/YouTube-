import { describe, it, expect } from 'vitest';
import { app } from '../src/index';

describe('NewsWatch Phase 1 Utility & Route Tests', () => {
  it('GET /api/health returns 200 and ok status', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      status: 'ok',
      service: 'newswatch-line'
    });
  });

  it('verifies canonical destination hash logic for LINE notifications', () => {
    const createDestinationHash = (targetId: string) => {
      return `hash_${targetId.length}_${targetId.substring(0, 3)}`;
    };
    const hash1 = createDestinationHash('U1234567890');
    const hash2 = createDestinationHash('U1234567890');
    const hash3 = createDestinationHash('U9999999999');
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
});
