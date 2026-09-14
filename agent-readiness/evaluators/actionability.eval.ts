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
    score += 0.5;
    details.push(`Resolved WebMCP manifest at ${config.actionability.manifestEndpoint}`);

    const hasResources = Array.isArray(manifest.resources) && manifest.resources.length > 0;
    const hasTools = Array.isArray(manifest.tools) && manifest.tools.length > 0;

    if (hasResources) {
      score += 0.5;
      details.push(`Manifest exposes ${manifest.resources.length} agent-readable resource(s)`);
    }

    if (hasTools) {
      details.push(`Manifest defines ${manifest.tools.length} executable MCP tool(s)`);

      let validSchemas = 0;
      let boundedDescriptions = 0;
      let annotatedTools = 0;

      manifest.tools.forEach((t: any) => {
        // Valid JSON Schema inputs
        if (t.name && t.description && t.inputSchema?.type === 'object') {
          validSchemas++;
        }
        // Token budget: descriptions <= 500 characters
        if (t.description && t.description.length <= 500) {
          boundedDescriptions++;
        }
        // Chrome WebMCP annotation hints (readOnlyHint / untrustedContentHint / scope)
        if (t.annotations?.readOnlyHint !== undefined || 
            t.annotations?.untrustedContentHint !== undefined ||
            t.readOnlyHint !== undefined ||
            t.scope !== undefined ||
            t.pageScope !== undefined) {
          annotatedTools++;
        }
      });

      if (validSchemas === manifest.tools.length) {
        score += 0.5;
        details.push('All tool parameters conform to valid JSON-Schema specs');
      } else {
        score += (validSchemas / manifest.tools.length) * 0.5;
      }

      if (boundedDescriptions === manifest.tools.length) {
        score += 0.5;
        details.push('All tool descriptions adhere to concise token budgets (<= 500 chars)');
      } else {
        score += (boundedDescriptions / manifest.tools.length) * 0.5;
      }

      if (annotatedTools > 0) {
        score += 0.5;
        details.push(`WebMCP security annotations / scoping detected on ${annotatedTools} tool(s)`);
      }
    }
  } catch (err: any) {
    details.push(`Actionability evaluation failed: ${err.message}`);
  }

  return { dimension: 'Tool Actionability', score: Math.min(maxScore, score), maxScore, details };
}
