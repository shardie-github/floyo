#!/usr/bin/env node
/**
 * Update Systems Scorecard
 * Reads metrics history and updates scorecard.md with trends
 */

const fs = require('fs');
const path = require('path');

const historyDir = path.join(__dirname, '..', 'systems', 'history');
const scorecardFile = path.join(__dirname, '..', 'systems', 'scorecard.md');

function loadHistory() {
  const files = fs.readdirSync(historyDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, 4); // Last 4 weeks
  
  return files.map(file => {
    const content = fs.readFileSync(path.join(historyDir, file), 'utf-8');
    return {
      date: file.replace('.json', ''),
      ...JSON.parse(content),
    };
  });
}

function calculateTrend(values) {
  if (values.length < 2) return '→';
  
  const first = values[0];
  const last = values[values.length - 1];
  const change = ((last - first) / first) * 100;
  
  if (Math.abs(change) < 1) return '→';
  return change < 0 ? '🔽' : '🔼';
}

function getStatus(current, target, isLowerBetter = true) {
  const percentDiff = ((current - target) / target) * 100;
  
  if (isLowerBetter) {
    if (percentDiff <= -10) return '🟢';
    if (percentDiff <= 10) return '🟡';
    return '🔴';
  } else {
    if (percentDiff >= 10) return '🟢';
    if (percentDiff >= -10) return '🟡';
    return '🔴';
  }
}

function updateScorecard() {
  const history = loadHistory();
  
  if (history.length === 0) {
    console.log('⚠️  No history data found');
    return;
  }
  
  const latest = history[0];
  const metrics = latest.metrics || {};
  
  // Extract values for trend calculation
  const leadTimes = history.map(h => h.metrics?.lead_time?.value || 0).filter(v => v > 0);
  const cycleTimes = history.map(h => h.metrics?.cycle_time?.value || 0).filter(v => v > 0);
  const prQueues = history.map(h => h.metrics?.pr_queue_length?.value || 0);
  
  const scorecard = `# Systems Scorecard

**Last Updated:** ${new Date().toISOString().split('T')[0]}  
**Frequency:** Weekly (Monday 04:40 UTC)

## Metrics Overview

| Metric | Current | Target | Trend | Status |
|--------|---------|--------|-------|--------|
| **Lead Time** | ${metrics.lead_time?.value?.toFixed(1) || 'N/A'}h | <2h | ${calculateTrend(leadTimes)} | ${getStatus(metrics.lead_time?.value || 5.5, 2, true)} |
| **Cycle Time** | ${metrics.cycle_time?.value?.toFixed(1) || 'N/A'}h | <1.25h | ${calculateTrend(cycleTimes)} | ${getStatus(metrics.cycle_time?.value || 1.75, 1.25, true)} |
| **PR Queue Length** | ${metrics.pr_queue_length?.value || 'N/A'} | <1 | ${calculateTrend(prQueues)} | ${getStatus(metrics.pr_queue_length?.value || 2, 1, true)} |
| **CI Failure Rate** | ${metrics.ci_failure_rate?.value || 'N/A'} | <5% | → | ${getStatus(metrics.ci_failure_rate?.value || 10, 5, true)} |
| **MTTR** | ${metrics.mttr?.value || 'N/A'}min | <30min | → | ${getStatus(metrics.mttr?.value || 60, 30, true)} |
| **Rework %** | ${metrics.rework_percentage?.value || 'N/A'}% | <3.5% | → | ${getStatus(metrics.rework_percentage?.value || 8, 3.5, true)} |
| **Uptime** | ${metrics.uptime?.value || 'N/A'}% | 99.9% | → | ${getStatus(metrics.uptime?.value || 99.5, 99.9, false)} |
| **p95 Latency** | ${metrics.p95_latency?.value || 'N/A'}ms | <500ms | → | ${getStatus(metrics.p95_latency?.value || 750, 500, true)} |

**Legend:**
- 🟢 Green: On target
- 🟡 Amber: In progress, approaching target
- 🔴 Red: Needs improvement

## Trends (Last ${history.length} Weeks)

### Lead Time
${history.map((h, i) => `- Week ${history.length - i}: ${h.metrics?.lead_time?.value?.toFixed(1) || 'N/A'}h${i < history.length - 1 ? ` (${h.metrics?.lead_time?.value < history[i + 1]?.metrics?.lead_time?.value ? '↓' : '↑'} ${Math.abs(((h.metrics?.lead_time?.value || 0) - (history[i + 1]?.metrics?.lead_time?.value || 0)) / (history[i + 1]?.metrics?.lead_time?.value || 1) * 100).toFixed(0)}%)` : ''}`).join('\n')}

**Trend:** ${calculateTrend(leadTimes)} ${leadTimes.length > 0 ? (leadTimes[0] > leadTimes[leadTimes.length - 1] ? 'Improving' : 'Degrading') : 'Unknown'}

### Cycle Time
${history.map((h, i) => `- Week ${history.length - i}: ${h.metrics?.cycle_time?.value?.toFixed(1) || 'N/A'}h${i < history.length - 1 ? ` (${h.metrics?.cycle_time?.value < history[i + 1]?.metrics?.cycle_time?.value ? '↓' : '↑'} ${Math.abs(((h.metrics?.cycle_time?.value || 0) - (history[i + 1]?.metrics?.cycle_time?.value || 0)) / (history[i + 1]?.metrics?.cycle_time?.value || 1) * 100).toFixed(0)}%)` : ''}`).join('\n')}

**Trend:** ${calculateTrend(cycleTimes)} ${cycleTimes.length > 0 ? (cycleTimes[0] > cycleTimes[cycleTimes.length - 1] ? 'Improving' : 'Degrading') : 'Unknown'}

### PR Queue Length
${history.map((h, i) => `- Week ${history.length - i}: ${h.metrics?.pr_queue_length?.value || 'N/A'}`).join('\n')}

**Trend:** ${calculateTrend(prQueues)} ${prQueues.length > 0 ? (prQueues[0] > prQueues[prQueues.length - 1] ? 'Improving' : 'Degrading') : 'Unknown'}

## Key Actions This Week

1. ✅ Implemented error taxonomy
2. ✅ Created value stream map
3. ✅ Parallelize PR reviews (CODEOWNERS updated)
4. ✅ Pre-merge validation checks (workflow created)
5. ✅ CI concurrency tuning (workflow updated)

## Next Week Priorities

1. Monitor PR review time improvements
2. Track pre-merge check effectiveness
3. Review CI concurrency results
4. Analyze experiment results

---

**Status:** ✅ Scorecard active  
**Next Update:** Next Monday 04:40 UTC
`;

  fs.writeFileSync(scorecardFile, scorecard);
  console.log('✅ Scorecard updated');
}

if (require.main === module) {
  updateScorecard();
}

module.exports = { updateScorecard };
