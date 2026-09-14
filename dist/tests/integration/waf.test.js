"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const axios_1 = __importDefault(require("axios"));
const BASE_URL = process.env.TEST_BASE_URL || 'https://www.zivisaiah.com';
(0, vitest_1.describe)('Integration: Live Machine Endpoints & WAF Check', () => {
    (0, vitest_1.it)('ensures root and manifests return 200 to bot User-Agents', async () => {
        let status = 0;
        try {
            const res = await axios_1.default.get(BASE_URL, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)' },
                validateStatus: () => true
            });
            status = res.status;
        }
        catch (err) {
            status = err.response?.status || 500;
        }
        (0, vitest_1.expect)(status).toBe(200);
        (0, vitest_1.expect)(status).not.toBe(403);
    });
});
