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
exports.evaluateSemantics = evaluateSemantics;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
async function evaluateSemantics(config) {
    let score = 0;
    const maxScore = 2.5;
    const details = [];
    try {
        const res = await axios_1.default.get(config.baseUrl, { timeout: config.waf.timeoutMs });
        const $ = cheerio.load(res.data);
        const jsonLdTags = $('script[type="application/ld+json"]');
        if (jsonLdTags.length > 0) {
            score += 1.0;
            details.push(`Found ${jsonLdTags.length} JSON-LD script block(s)`);
            jsonLdTags.each((_, el) => {
                try {
                    const parsed = JSON.parse($(el).html() || '{}');
                    const graph = parsed['@graph'] || [parsed];
                    const foundTypes = graph.map((n) => n['@type']);
                    config.semantics.requiredJsonLdTypes.forEach(reqType => {
                        if (foundTypes.includes(reqType)) {
                            score += (1.0 / config.semantics.requiredJsonLdTypes.length);
                            details.push(`Matched required JSON-LD schema entity: @type="${reqType}"`);
                        }
                    });
                }
                catch {
                    details.push('Malformed JSON-LD payload detected');
                }
            });
        }
        else {
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
    }
    catch (err) {
        details.push(`Semantics probe failed: ${err.message}`);
    }
    return { dimension: 'Deterministic Semantics', score: Math.min(maxScore, score), maxScore, details };
}
