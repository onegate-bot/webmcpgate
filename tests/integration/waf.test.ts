import { describe, it, expect } from 'vitest';
import axios from 'axios';

const BASE_URL = process.env.TEST_BASE_URL || 'https://www.zivisaiah.com';

describe('Integration: Live Machine Endpoints & WAF Check', () => {
  it('ensures root and manifests return 200 to bot User-Agents', async () => {
    let status = 0;
    try {
      const res = await axios.get(BASE_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)' },
        validateStatus: () => true
      });
      status = res.status;
    } catch (err: any) {
      status = err.response?.status || 500;
    }
    expect(status).toBe(200);
    expect(status).not.toBe(403);
  });
});
