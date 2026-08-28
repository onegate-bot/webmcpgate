"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateActionability = evaluateActionability;
const axios_1 = __importDefault(require("axios"));
async function evaluateActionability(config) {
    let score = 0;
    const maxScore = 2.5;
    const details = [];
    try {
        const url = `${config.baseUrl}${config.actionability.manifestEndpoint}`;
        const res = await axios_1.default.get(url, {
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
            manifest.tools.forEach((t) => {
                if (t.name && t.description && t.inputSchema?.type === 'object') {
                    validSchemas++;
                }
            });
            if (validSchemas === manifest.tools.length) {
                score += 0.5;
                details.push('All tool parameters conform to valid JSON-Schema specs');
            }
        }
    }
    catch (err) {
        details.push(`Actionability evaluation failed: ${err.message}`);
    }
    return { dimension: 'Tool Actionability', score: Math.min(maxScore, score), maxScore, details };
}
