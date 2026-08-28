import axios from 'axios';
import { TargetConfig } from '../config';

export async function evaluateActionability(config: TargetConfig) {
  let score = 0;
  const maxScore = 2.5;
  const details: string[] = [];

  try {
    const url = `${config.baseUrl}${config.actionability.manifestEndpoint}`;
    const res = await axios.get(url, {
      timeout: config.waf.timeoutMs,
      validateStatus: s => s === 200
    });

    const manifest = res.data;
    score += 0.75;
    details.push(`Resolved WebMCP manifest at ${config.actionability.manifestEndpoint}`);

    const hasResources = Array.isArray(manifest.resources) && manifest.resources.length > 0;
    const hasTools = Array.isArray(manifest.tools) && manifest.tools.length > 0;

    if (hasResources) {
      score += 0.5;
      details.push(`Manifest exposes ${manifest.resources.length} agent-readable resource(s)`);
    }

    if (hasTools) {
      score += 0.75;
      details.push(`Manifest defines ${manifest.tools.length} executable MCP tool(s)`);

      let validSchemas = 0;
      manifest.tools.forEach((t: any) => {
        if (t.name && t.description && t.inputSchema?.type === 'object') {
          validSchemas++;
        }
      });

      if (validSchemas === manifest.tools.length) {
        score += 0.5;
        details.push('All tool parameters conform to valid JSON-Schema specs');
      }
    }
  } catch (err: any) {
    details.push(`Actionability evaluation failed: ${err.message}`);
  }

  return { dimension: 'Tool Actionability', score: Math.min(maxScore, score), maxScore, details };
}
