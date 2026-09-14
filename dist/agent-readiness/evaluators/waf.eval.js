"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateWAF = evaluateWAF;
const axios_1 = __importDefault(require("axios"));
async function evaluateWAF(config) {
    const maxScore = 2.5;
    const details = [];
    const testEndpoints = [config.baseUrl, `${config.baseUrl}${config.actionability.manifestEndpoint}`];
    const corsEndpoints = [
        `${config.baseUrl}${config.actionability.manifestEndpoint}`,
        `${config.baseUrl}/openapi.json`,
        `${config.baseUrl}/.well-known/ai-plugin.json`
    ];
    let totalProbes = 0;
    let passedProbes = 0;
    for (const ua of config.waf.botUserAgents) {
        for (const ep of testEndpoints) {
            totalProbes++;
            try {
                const res = await axios_1.default.get(ep, {
                    headers: { 'User-Agent': ua },
                    timeout: config.waf.timeoutMs,
                    validateStatus: () => true
                });
                if (res.status === 200) {
                    passedProbes++;
                }
                else if ([401, 403, 429, 503].includes(res.status)) {
                    details.push(`WAF/Bot block [HTTP ${res.status}] against UA: ${ua.slice(0, 30)}... on ${ep}`);
                }
            }
            catch (err) {
                details.push(`Connection failed for UA ${ua.slice(0, 30)}: ${err.message}`);
            }
        }
    }
    // Evaluate CORS specifically on machine-readable discovery/API endpoints
    let corsPasses = 0;
    let corsChecked = 0;
    for (const ep of corsEndpoints) {
        corsChecked++;
        try {
            const res = await axios_1.default.get(ep, {
                headers: { 'User-Agent': 'ModelContextProtocol-Client/1.0.0' },
                timeout: config.waf.timeoutMs,
                validateStatus: () => true
            });
            const cors = res.headers['access-control-allow-origin'];
            if (cors === '*' || typeof cors === 'string') {
                corsPasses++;
                details.push(`CORS allowed (${cors}) on ${ep.replace(config.baseUrl, '')}`);
            }
        }
        catch { }
    }
    const availabilityRatio = totalProbes > 0 ? passedProbes / totalProbes : 0;
    const corsRatio = corsChecked > 0 ? corsPasses / corsChecked : 0;
    const score = (availabilityRatio * 2.0) + (corsRatio * 0.5);
    details.push(`Bot accessibility pass rate: ${(availabilityRatio * 100).toFixed(1)}%`);
    details.push(`Machine discovery CORS compliance: ${(corsRatio * 100).toFixed(1)}%`);
    return { dimension: 'WAF & Bot Resiliency', score: Math.min(maxScore, score), maxScore, details };
}
