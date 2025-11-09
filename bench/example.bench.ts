/**
 * Example Benchmark Suite
 * Demonstrates how to write benchmarks
 */

import { runSuite, printSummary } from './runner';

async function main() {
  // Example: String operations
  const stringSuite = await runSuite('string-operations', [
    {
      name: 'string-concat',
      fn: () => {
        let str = '';
        for (let i = 0; i < 100; i++) {
          str += `item-${i}`;
        }
      },
      options: { iterations: 1000 },
    },
    {
      name: 'array-join',
      fn: () => {
        const arr: string[] = [];
        for (let i = 0; i < 100; i++) {
          arr.push(`item-${i}`);
        }
        arr.join('');
      },
      options: { iterations: 1000 },
    },
  ]);

  printSummary(stringSuite);

  // Example: Object operations
  const objectSuite = await runSuite('object-operations', [
    {
      name: 'object-create',
      fn: () => {
        const obj = { a: 1, b: 2, c: 3 };
        obj.d = 4;
      },
      options: { iterations: 10000 },
    },
    {
      name: 'object-spread',
      fn: () => {
        const obj = { a: 1, b: 2 };
        const newObj = { ...obj, c: 3 };
      },
      options: { iterations: 10000 },
    },
  ]);

  printSummary(objectSuite);
}

if (require.main === module) {
  main().catch(console.error);
}
