import { defaultConfig, TargetConfig } from './config';
import { evaluateDiscovery } from './evaluators/discovery.eval';
import { evaluateSemantics } from './evaluators/semantics.eval';
import { evaluateActionability } from './evaluators/actionability.eval';
import { evaluateWAF } from './evaluators/waf.eval';

export async function runAgentReadinessAudit(customConfig?: Partial<TargetConfig>) {
  const config: TargetConfig = { ...defaultConfig, ...customConfig };
  console.log(`\n======================================================`);
  console.log(` Autonomous Agent Readiness Test (AART) Engine`);
  console.log(` Target: ${config.baseUrl}`);
  console.log(` Gate Threshold: ${config.minPassingScore} / 10.0`);
  console.log(`======================================================\n`);

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
