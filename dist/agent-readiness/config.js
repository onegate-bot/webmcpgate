"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.defaultConfig = {
    baseUrl: process.env.TARGET_URL || 'https://www.zivisaiah.com',
    minPassingScore: parseFloat(process.env.AGENT_SCORE_GATE || '9.5'),
    discovery: {
        endpoints: [
            '/.well-known/webmcp.json',
            '/webmcp-manifest.json',
            '/openapi.json',
            '/.well-known/ai-plugin.json',
            '/llms.txt',
            '/robots.txt',
            '/feed.xml',
            '/api/mcp'
        ],
        htmlDiscoveryRelTags: ['webmcp-manifest', 'service-desc', 'alternate', 'canonical']
    },
    semantics: {
        requiredJsonLdTypes: ['WebSite', 'Person'],
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
