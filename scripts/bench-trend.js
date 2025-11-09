#!/usr/bin/env node
/**
 * Benchmark Trend Analysis
 * Analyzes benchmark history and identifies performance regressions
 */

const fs = require('fs');
const path = require('path');

const historyFile = path.join(__dirname, '..', 'bench', 'history.json');
const resultsDir = path.join(__dirname, '..', 'bench', 'results');

function loadHistory() {
  if (!fs.existsSync(historyFile)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
}

function analyzeTrends() {
  const history = loadHistory();
  
  if (history.length < 2) {
    console.log('⚠️  Not enough data for trend analysis (need at least 2 days)');
    return;
  }

  console.log('\n📊 Benchmark Trend Analysis\n');
  console.log('='.repeat(80));

  // Get all benchmark names
  const allBenchmarks = new Set();
  history.forEach(day => {
    day.suites.forEach(suite => {
      suite.benchmarks.forEach(bench => {
        allBenchmarks.add(bench.name);
      });
    });
  });

  // Analyze each benchmark
  for (const benchName of allBenchmarks) {
    const trends = [];
    
    for (let i = 1; i < history.length; i++) {
      const prev = findBenchmark(history[i - 1], benchName);
      const curr = findBenchmark(history[i], benchName);
      
      if (prev && curr) {
        const change = ((curr.opsPerSecond - prev.opsPerSecond) / prev.opsPerSecond) * 100;
        trends.push({
          date: history[i].date,
          change,
          current: curr.opsPerSecond,
          previous: prev.opsPerSecond,
        });
      }
    }

    if (trends.length > 0) {
      const avgChange = trends.reduce((sum, t) => sum + t.change, 0) / trends.length;
      const latest = trends[trends.length - 1];
      
      console.log(`\n${benchName}:`);
      console.log(`  Latest: ${latest.current.toFixed(2)} ops/sec`);
      console.log(`  Change: ${latest.change > 0 ? '+' : ''}${latest.change.toFixed(2)}%`);
      console.log(`  Avg Trend: ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(2)}%`);
      
      if (latest.change < -5) {
        console.log(`  ⚠️  Performance regression detected (>5% slower)`);
      } else if (latest.change > 5) {
        console.log(`  ✅ Performance improvement detected (>5% faster)`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
}

function findBenchmark(dayData, benchName) {
  for (const suite of dayData.suites) {
    const bench = suite.benchmarks.find(b => b.name === benchName);
    if (bench) return bench;
  }
  return null;
}

if (require.main === module) {
  analyzeTrends();
}

module.exports = { analyzeTrends, loadHistory };
