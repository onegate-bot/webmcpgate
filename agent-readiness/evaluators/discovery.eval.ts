import axios from 'axios';
import * as cheerio from 'cheerio';
import { TargetConfig } from '../config';

export async function evaluateDiscovery(config: TargetConfig) {
  let score = 0;
  const maxScore = 2.5;
  const details: string[] = [];

  try {
    const res = await axios.get(config.baseUrl, { timeout: config.waf.timeoutMs });
    const $ = cheerio.load(res.data);
    
    let relMatches = 0;
    config.discovery.htmlDiscoveryRelTags.forEach(rel => {
      if ($(`link[rel*="${rel}"]`).length > 0) {
        relMatches++;
        details.push(`Found <link rel="${rel}"> discovery tag`);
      }
    });
    score += (relMatches / config.discovery.htmlDiscoveryRelTags.length) * 1.0;
  } catch (err: any) {
    details.push(`Failed to fetch root page for head tags: ${err.message}`);
  }

  let endpointHits = 0;
  for (const ep of config.discovery.endpoints) {
    try {
      const res = await axios.get(`${config.baseUrl}${ep}`, {
        timeout: config.waf.timeoutMs,
        validateStatus: s => s < 400
      });
      if (res.status === 200) {
        endpointHits++;
        details.push(`Accessible discovery endpoint: ${ep}`);
      }
    } catch {}
  }
  score += Math.min(1.5, (endpointHits / config.discovery.endpoints.length) * 1.5);

  return { dimension: 'Machine Discovery', score: Math.min(maxScore, score), maxScore, details };
}
