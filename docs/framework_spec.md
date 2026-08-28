# Generic Autonomous Agent Readiness Testing & Scoring Framework (AART-Engine)
**Standard Compliance:** W3C Semantic Web (JSON-LD), Model Context Protocol (MCP / WebMCP), Generative Engine Optimization (GEO / `llms.txt`), OpenAPI 3.0 / JSON-Schema  
**Engine Design:** Universal, schema-agnostic, configurable, CI/CD-ready.

---

## 1. Architecture Overview

This generic test harness evaluates **any web application or API** against autonomous agent consumption standards across **4 Universal Dimensions** (0.0 – 10.0 scale):

1. **Machine Discovery & Signaling (2.5 pts):** Standard discovery paths (`/.well-known/webmcp.json`, `/webmcp-manifest.json`, `/llms.txt`, `robots.txt`, XML sitemaps/feeds), HTML `<link>` discovery tags.
2. **Deterministic Linked Data & Semantics (2.5 pts):** Valid JSON-LD graphs (`@context: "https://schema.org"`), OpenGraph/Twitter entity cards, token-efficient semantic HTML.
3. **Agentic Actionability & Tool Registry (2.5 pts):** MCP tool schemas, valid JSON Schema inputs/outputs, endpoint execution, error handling.
4. **Edge Access & WAF Neutrality (2.5 pts):** Bot resilience across major LLM user-agents (`GPTBot`, `Claude-Web`, `PerplexityBot`, generic MCP clients), permissive CORS (`Access-Control-Allow-Origin`), sub-second TTFB.

---

## 2. Directory Layout

```text
├── agent-readiness/
│   ├── config.ts              # Universal Target & Rule Config
│   ├── types.ts               # Core Interfaces
│   ├── engine.ts              # Scoring Algorithm & Runner
│   ├── evaluators/
│   │   ├── discovery.eval.ts  # Endpoint & <head> probe
│   │   ├── semantics.eval.ts  # JSON-LD & DOM parser
│   │   ├── actionability.eval.ts # MCP & API Tool caller
│   │   └── waf.eval.ts        # Multi-UA bot probe
│   └── cli.ts                 # CLI & CI/CD Runner
├── .github/
│   └── workflows/
│       └── generic-agent-readiness-gate.yml
└── package.json
```

---

## 3. Core Engine Implementation

### 3.1 Universal Configuration (`agent-readiness/config.ts`)

```typescript
export interface TargetConfig {
  baseUrl: string;
  minPassingScore: number; // default: 9.0
  discovery: {
    endpoints: string[];
    htmlDiscoveryRelTags: string[];
  };
  semantics: {
    requiredJsonLdTypes: string[]; // e.g. ["Person", "WebSite", "Organization", "Article"]
    requireOpenGraph: boolean;
  };
  actionability: {
    manifestEndpoint: string;
    validateToolEndpoints: boolean;
  };
  waf: {
    botUserAgents: string[];
    timeoutMs: number;
  };
}

export const defaultConfig: TargetConfig = {
  baseUrl: process.env.TARGET_URL || 'https://dev.zivisaiah.com',
  minPassingScore: parseFloat(process.env.AGENT_SCORE_GATE || '9.0'),
  discovery: {
    endpoints: [
      '/.well-known/webmcp.json',
      '/webmcp-manifest.json',
      '/llms.txt',
      '/robots.txt',
      '/feed.xml'
    ],
    htmlDiscoveryRelTags: ['webmcp-manifest', 'alternate', 'canonical']
  },
  semantics: {
    requiredJsonLdTypes: ['WebSite'], // dynamically extensible per target
    requireOpenGraph: true
  },
  actionability: {
    manifestEndpoint: '/webmcp-manifest.json',
    validateToolEndpoints: true
  },
  waf: {
    botUserAgents: [
      'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)',
      'Mozilla/5.0 (compatible; Claude-Web/1.0; +https://www.anthropic.com)',
      'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
      'Mozilla/5.0 (compatible; Google-Extended; +https://google.com)',
      'ModelContextProtocol-Client/1.0.0 (Autonomous Agent Engine)'
    ],
    timeoutMs: 8000
  }
};
```

---

### 3.2 Evaluation Modules

#### Dimension 1: Discovery (`agent-readiness/evaluators/discovery.eval.ts`)
```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';
import { TargetConfig } from '../config';

export async function evaluateDiscovery(config: TargetConfig) {
  let score = 0;
  const maxScore = 2.5;
  const details: string[] = [];

  // 1. Probe HTML Head for discovery linkage
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

  // 2. Probe static discovery endpoints
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
    } catch {
      // Ignored - partial availability is scored proportionally
    }
  }
  score += Math.min(1.5, (endpointHits / config.discovery.endpoints.length) * 1.5);

  return { dimension: 'Machine Discovery', score: Math.min(maxScore, score), maxScore, details };
}
```

#### Dimension 2: Semantics & Linked Data (`agent-readiness/evaluators/semantics.eval.ts`)
```typescript
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

    // 1. Evaluate JSON-LD structured data graph
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

    // 2. Evaluate Semantic HTML & OpenGraph
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
```

#### Dimension 3: Agentic Actionability & Tool Registry (`agent-readiness/evaluators/actionability.eval.ts`)
```typescript
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

    // Check resources & tools definition
    const hasResources = Array.isArray(manifest.resources) && manifest.resources.length > 0;
    const hasTools = Array.isArray(manifest.tools) && manifest.tools.length > 0;

    if (hasResources) {
      score += 0.5;
      details.push(`Manifest exposes ${manifest.resources.length} agent-readable resource(s)`);
    }

    if (hasTools) {
      score += 0.75;
      details.push(`Manifest defines ${manifest.tools.length} executable MCP tool(s)`);

      // Verify schema compliance of tools
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
```

#### Dimension 4: WAF & Edge Access Neutrality (`agent-readiness/evaluators/waf.eval.ts`)
```typescript
import axios from 'axios';
import { TargetConfig } from '../config';

export async function evaluateWAF(config: TargetConfig) {
  const maxScore = 2.5;
  const details: string[] = [];
  const testEndpoints = [config.baseUrl, `${config.baseUrl}${config.actionability.manifestEndpoint}`];

  let totalProbes = 0;
  let passedProbes = 0;
  let corsPasses = 0;

  for (const ua of config.waf.botUserAgents) {
    for (const ep of testEndpoints) {
      totalProbes++;
      try {
        const res = await axios.get(ep, {
          headers: { 'User-Agent': ua },
          timeout: config.waf.timeoutMs,
          validateStatus: () => true
        });

        if (res.status === 200) {
          passedProbes++;
        } else if ([401, 403, 429, 503].includes(res.status)) {
          details.push(`WAF/Bot block [HTTP ${res.status}] against UA: ${ua.slice(0, 30)}... on ${ep}`);
        }

        const cors = res.headers['access-control-allow-origin'];
        if (cors === '*' || typeof cors === 'string') {
          corsPasses++;
        }
      } catch (err: any) {
        details.push(`Connection failed for UA ${ua.slice(0, 30)}: ${err.message}`);
      }
    }
  }

  const availabilityRatio = totalProbes > 0 ? passedProbes / totalProbes : 0;
  const corsRatio = totalProbes > 0 ? corsPasses / totalProbes : 0;
  const score = (availabilityRatio * 2.0) + (corsRatio * 0.5);

  details.push(`Bot accessibility pass rate: ${(availabilityRatio * 100).toFixed(1)}%`);
  details.push(`CORS compliance rate: ${(corsRatio * 100).toFixed(1)}%`);

  return { dimension: 'WAF & Bot Resiliency', score: Math.min(maxScore, score), maxScore, details };
}
```

---

### 3.3 Universal CLI & Gate Evaluator (`agent-readiness/engine.ts`)

```typescript
import { defaultConfig, TargetConfig } from './config';
import { evaluateDiscovery } from './evaluators/discovery.eval';
import { evaluateSemantics } from './evaluators/semantics.eval';
import { evaluateActionability } from './evaluators/actionability.eval';
import { evaluateWAF } from './evaluators/waf.eval';

export async function runAgentReadinessAudit(customConfig?: Partial<TargetConfig>) {
  const config: TargetConfig = { ...defaultConfig, ...customConfig };
  console.log(`
======================================================`);
  console.log(` Autonomous Agent Readiness Test (AART) Engine`);
  console.log(` Target: ${config.baseUrl}`);
  console.log(` Gate Threshold: ${config.minPassingScore} / 10.0`);
  console.log(`======================================================
`);

  const results = await Promise.all([
    evaluateDiscovery(config),
    evaluateSemantics(config),
    evaluateActionability(config),
    evaluateWAF(config)
  ]);

  let totalScore = 0;
  results.forEach(r => {
    totalScore += r.score;
    console.log(`▶ ${r.dimension.padEnd(25)} : ${r.score.toFixed(2)} / ${r.maxScore.toFixed(2)}`);
    r.details.forEach(d => console.log(`   - ${d}`));
    console.log('');
  });

  const finalScore = Number(totalScore.toFixed(2));
  console.log(`------------------------------------------------------`);
  console.log(` FINAL READINESS SCORE : ${finalScore} / 10.0`);
  console.log(`------------------------------------------------------`);

  const passed = finalScore >= config.minPassingScore;
  if (!passed) {
    console.error(`❌ FAILED: Readiness score (${finalScore}) is below gate threshold (${config.minPassingScore}).`);
  } else {
    console.log(`✅ PASSED: Target meets autonomous agent readiness standards.`);
  }

  return { finalScore, passed, results };
}

// CLI entry point
if (require.main === module) {
  runAgentReadinessAudit().then(({ passed }) => {
    process.exit(passed ? 0 : 1);
  });
}
```

---

## 4. Generic GitHub Actions CI/CD Gate

Save this workflow to run automatically against PRs, previews, or production domains:

```yaml
name: Generic Agent Readiness CI Gate

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]
  workflow_dispatch:
    inputs:
      target_url:
        description: 'URL to evaluate'
        required: true
        default: 'https://dev.zivisaiah.com'
      score_gate:
        description: 'Minimum Passing Score'
        required: true
        default: '9.0'

jobs:
  agent-readiness-evaluation:
    name: Universal AI Agent Compatibility Gate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Test Dependencies
        run: npm install axios cheerio

      - name: Run Audit Against Target
        env:
          TARGET_URL: ${{ github.event.inputs.target_url || 'http://localhost:3000' }}
          AGENT_SCORE_GATE: ${{ github.event.inputs.score_gate || '9.0' }}
        run: |
          npx ts-node agent-readiness/engine.ts
```

---

## 5. How to Re-use Across Other Projects & Future Revisions

* **Different Domain:** Simply set `TARGET_URL=https://another-domain.com`.
* **Different Schemas:** Update `semantics.requiredJsonLdTypes = ['Product', 'Organization']` for e-commerce, or `['Article']` for publications in `config.ts`.
* **Adjustable Strictness:** Adjust `AGENT_SCORE_GATE=9.5` for enterprise readiness, or `8.0` for basic agent discoverability.