import axios from 'axios';
import * as cheerio from 'cheerio';
import { TargetConfig } from '../config';

export async function evaluateSemantics(config: TargetConfig) {
  let score = 0;
  const maxScore = 2.5;
  const details: string[] = [];

  try {
    const res = await axios.get(config.baseUrl, { timeout: config.waf.timeoutMs });
    const $ = cheerio.load(res.data);

    const jsonLdTags = $('script[type="application/ld+json"]');
    if (jsonLdTags.length > 0) {
      score += 1.0;
      details.push(`Found ${jsonLdTags.length} JSON-LD script block(s)`);

      jsonLdTags.each((_, el) => {
        try {
          const parsed = JSON.parse($(el).html() || '{}');
          const graph = parsed['@graph'] || [parsed];
          const foundTypes = graph.map((n: any) => n['@type']);

          config.semantics.requiredJsonLdTypes.forEach(reqType => {
            if (foundTypes.includes(reqType)) {
              score += (1.0 / config.semantics.requiredJsonLdTypes.length);
              details.push(`Matched required JSON-LD schema entity: @type="${reqType}"`);
            }
          });
        } catch {
          details.push('Malformed JSON-LD payload detected');
        }
      });
    } else {
      details.push('Missing JSON-LD structured data');
    }

    if ($('main').length > 0 && $('h1').length > 0) {
      score += 0.25;
      details.push('Valid semantic landmark tags (<main>, <h1>) found');
    }
    if ($('meta[property^="og:"]').length >= 3) {
      score += 0.25;
      details.push('Rich OpenGraph metadata present');
    }
  } catch (err: any) {
    details.push(`Semantics probe failed: ${err.message}`);
  }

  return { dimension: 'Deterministic Semantics', score: Math.min(maxScore, score), maxScore, details };
}
