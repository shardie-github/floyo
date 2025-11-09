/**
 * Microbenchmark Harness
 * Runs performance benchmarks and tracks trends over time
 */

import * as fs from 'fs';
import * as path from 'path';

export interface BenchmarkResult {
  name: string;
  duration: number; // milliseconds
  iterations: number;
  opsPerSecond: number;
  memory?: number; // bytes
  timestamp: string;
}

export interface BenchmarkSuite {
  name: string;
  benchmarks: BenchmarkResult[];
}

const resultsDir = path.join(process.cwd(), 'bench', 'results');
const historyFile = path.join(process.cwd(), 'bench', 'history.json');

// Ensure results directory exists
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

/**
 * Run a benchmark function multiple times and measure performance
 */
export async function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  options: {
    iterations?: number;
    warmup?: number;
    measureMemory?: boolean;
  } = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 1000,
    warmup = 10,
    measureMemory = false,
  } = options;

  // Warmup
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  // Measure
  const start = performance.now();
  const memBefore = measureMemory ? (process.memoryUsage().heapUsed) : 0;

  for (let i = 0; i < iterations; i++) {
    await fn();
  }

  const end = performance.now();
  const memAfter = measureMemory ? (process.memoryUsage().heapUsed) : 0;

  const duration = end - start;
  const opsPerSecond = (iterations / duration) * 1000;
  const memory = measureMemory ? (memAfter - memBefore) : undefined;

  const result: BenchmarkResult = {
    name,
    duration,
    iterations,
    opsPerSecond,
    memory,
    timestamp: new Date().toISOString(),
  };

  return result;
}

/**
 * Run a suite of benchmarks
 */
export async function runSuite(
  suiteName: string,
  benchmarks: Array<{ name: string; fn: () => void | Promise<void>; options?: any }>
): Promise<BenchmarkSuite> {
  console.log(`\n📊 Running benchmark suite: ${suiteName}\n`);

  const results: BenchmarkResult[] = [];

  for (const bench of benchmarks) {
    console.log(`  Running: ${bench.name}...`);
    const result = await benchmark(bench.name, bench.fn, bench.options);
    results.push(result);
    console.log(`    ✅ ${result.opsPerSecond.toFixed(2)} ops/sec (${result.duration.toFixed(2)}ms)`);
  }

  const suite: BenchmarkSuite = {
    name: suiteName,
    benchmarks: results,
  };

  // Save results
  await saveResults(suite);

  return suite;
}

/**
 * Save benchmark results to file
 */
async function saveResults(suite: BenchmarkSuite): Promise<void> {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = path.join(resultsDir, `${suite.name}-${timestamp}.json`);
  fs.writeFileSync(filename, JSON.stringify(suite, null, 2));

  // Update history
  await updateHistory(suite);
}

/**
 * Update benchmark history
 */
async function updateHistory(suite: BenchmarkSuite): Promise<void> {
  let history: Array<{ date: string; suites: BenchmarkSuite[] }> = [];

  if (fs.existsSync(historyFile)) {
    history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
  }

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = history.find(h => h.date === today);

  if (todayEntry) {
    todayEntry.suites.push(suite);
  } else {
    history.push({ date: today, suites: [suite] });
  }

  // Keep only last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  history = history.filter(h => new Date(h.date) >= cutoff);

  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

/**
 * Compare current results with previous run
 */
export function compareResults(
  current: BenchmarkResult[],
  previous: BenchmarkResult[]
): Array<{ name: string; change: number; percentChange: number }> {
  const comparisons: Array<{ name: string; change: number; percentChange: number }> = [];

  for (const curr of current) {
    const prev = previous.find(p => p.name === curr.name);
    if (prev) {
      const change = curr.opsPerSecond - prev.opsPerSecond;
      const percentChange = ((change / prev.opsPerSecond) * 100);
      comparisons.push({
        name: curr.name,
        change,
        percentChange,
      });
    }
  }

  return comparisons;
}

/**
 * Print benchmark summary
 */
export function printSummary(suite: BenchmarkSuite): void {
  console.log(`\n📈 Benchmark Summary: ${suite.name}\n`);
  console.log('Name'.padEnd(40), 'Ops/sec'.padEnd(15), 'Duration (ms)');
  console.log('-'.repeat(70));

  for (const bench of suite.benchmarks) {
    console.log(
      bench.name.padEnd(40),
      bench.opsPerSecond.toFixed(2).padStart(15),
      bench.duration.toFixed(2).padStart(15)
    );
  }

  console.log('');
}
