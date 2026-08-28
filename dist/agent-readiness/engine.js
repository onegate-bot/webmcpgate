"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgentReadinessAudit = runAgentReadinessAudit;
const config_1 = require("./config");
const discovery_eval_1 = require("./evaluators/discovery.eval");
const semantics_eval_1 = require("./evaluators/semantics.eval");
const actionability_eval_1 = require("./evaluators/actionability.eval");
const waf_eval_1 = require("./evaluators/waf.eval");
async function runAgentReadinessAudit(customConfig) {
    const config = { ...config_1.defaultConfig, ...customConfig };
    console.log(`\n======================================================`);
    console.log(` Autonomous Agent Readiness Test (AART) Engine`);
    console.log(` Target: ${config.baseUrl}`);
    console.log(` Gate Threshold: ${config.minPassingScore} / 10.0`);
    console.log(`======================================================\n`);
    const results = await Promise.all([
        (0, discovery_eval_1.evaluateDiscovery)(config),
        (0, semantics_eval_1.evaluateSemantics)(config),
        (0, actionability_eval_1.evaluateActionability)(config),
        (0, waf_eval_1.evaluateWAF)(config)
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
    }
    else {
        console.log(`✅ PASSED: Target meets autonomous agent readiness standards.`);
    }
    return { finalScore, passed, results };
}
