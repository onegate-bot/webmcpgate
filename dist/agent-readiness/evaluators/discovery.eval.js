"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateDiscovery = evaluateDiscovery;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
async function evaluateDiscovery(config) {
    let score = 0;
    const maxScore = 2.5;
    const details = [];
    try {
        const res = await axios_1.default.get(config.baseUrl, { timeout: config.waf.timeoutMs });
        const $ = cheerio.load(res.data);
        let relMatches = 0;
        config.discovery.htmlDiscoveryRelTags.forEach(rel => {
            if ($(`link[rel*="${rel}"]`).length > 0) {
                relMatches++;
                details.push(`Found <link rel="${rel}"> discovery tag`);
            }
        });
        score += (relMatches / config.discovery.htmlDiscoveryRelTags.length) * 1.0;
    }
    catch (err) {
        details.push(`Failed to fetch root page for head tags: ${err.message}`);
    }
    let endpointHits = 0;
    for (const ep of config.discovery.endpoints) {
        try {
            const res = await axios_1.default.get(`${config.baseUrl}${ep}`, {
                timeout: config.waf.timeoutMs,
                validateStatus: s => s < 400
            });
            if (res.status === 200) {
                endpointHits++;
                details.push(`Accessible discovery endpoint: ${ep}`);
            }
        }
        catch { }
    }
    score += Math.min(1.5, (endpointHits / config.discovery.endpoints.length) * 1.5);
    return { dimension: 'Machine Discovery', score: Math.min(maxScore, score), maxScore, details };
}
