#!/usr/bin/env node
import { runAgentReadinessAudit } from './engine';
import { TargetConfig, defaultConfig } from './config';

// Support CLI args: npx webmcpgate [url] [--gate <score>]
const args = process.argv.slice(2);
let targetUrl = process.env.TARGET_URL || defaultConfig.baseUrl;
let gateScore = defaultConfig.minPassingScore;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--gate' || args[i] === '-g') {
    if (args[i + 1]) {
      gateScore = parseFloat(args[i + 1]);
      i++;
    }
  } else if (!args[i].startsWith('-')) {
    targetUrl = args[i];
  }
}

const config: TargetConfig = {
  ...defaultConfig,
  baseUrl: targetUrl,
  minPassingScore: gateScore
};

runAgentReadinessAudit(config).then(({ passed, finalScore }) => {
  if (!passed || finalScore < gateScore) {
    console.error(`\n❌ [webmcpgate] Readiness score ${finalScore.toFixed(2)} is below the required gate threshold of ${gateScore}. Failing CI!`);
    process.exit(1);
  } else {
    console.log(`\n✅ [webmcpgate] Readiness score ${finalScore.toFixed(2)} meets or exceeds required gate threshold of ${gateScore}.`);
    process.exit(0);
  }
}).catch((err) => {
  console.error('\n❌ [webmcpgate] Execution error:', err);
  process.exit(1);
});
