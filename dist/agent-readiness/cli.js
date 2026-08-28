#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engine_1 = require("./engine");
const config_1 = require("./config");
// Support CLI args: npx webmcpgate [url] [--gate <score>]
const args = process.argv.slice(2);
let targetUrl = process.env.TARGET_URL || config_1.defaultConfig.baseUrl;
let gateScore = config_1.defaultConfig.minPassingScore;
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--gate' || args[i] === '-g') {
        if (args[i + 1]) {
            gateScore = parseFloat(args[i + 1]);
            i++;
        }
    }
    else if (!args[i].startsWith('-')) {
        targetUrl = args[i];
    }
}
const config = {
    ...config_1.defaultConfig,
    baseUrl: targetUrl,
    minPassingScore: gateScore
};
(0, engine_1.runAgentReadinessAudit)(config).then(({ passed, finalScore }) => {
    if (!passed || finalScore < gateScore) {
        console.error(`\n❌ [webmcpgate] Readiness score ${finalScore.toFixed(2)} is below the required gate threshold of ${gateScore}. Failing CI!`);
        process.exit(1);
    }
    else {
        console.log(`\n✅ [webmcpgate] Readiness score ${finalScore.toFixed(2)} meets or exceeds required gate threshold of ${gateScore}.`);
        process.exit(0);
    }
}).catch((err) => {
    console.error('\n❌ [webmcpgate] Execution error:', err);
    process.exit(1);
});
