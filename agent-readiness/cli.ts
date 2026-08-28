import { runAgentReadinessAudit } from './engine';

runAgentReadinessAudit().then(({ passed }) => {
  process.exit(passed ? 0 : 1);
});
