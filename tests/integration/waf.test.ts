import { describe, it, expect } from 'vitest';
import axios from 'axios';

const BASE_URL = process.env.TEST_BASE_URL || 'https://dev.zivisaiah.com';

describe('Integration: Live Machine Endpoints & WAF Check', () => {
  it('ensures root and manifests return 200 to bot User-Agents', async () => {
    const res = await axios.get(BASE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)' },
      validateStatus: () => true
    });
    expect(res.status).toBe(200);
    expect(res.status).not.toBe(403);
  });
});
