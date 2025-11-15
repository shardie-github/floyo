#!/usr/bin/env tsx
/**
 * Aurora Prime - Standalone Script
 * Can be run directly: tsx scripts/aurora-prime.ts
 */

import { auroraPrime } from '../ops/commands/aurora-prime.js';

const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose') || args.includes('-v'),
};

auroraPrime(options)
  .then((status) => {
    process.exit(
      status.supabase === 'Healthy' &&
      status.vercel === 'Healthy' &&
      status.expo === 'Healthy' &&
      status.githubActions === 'Healthy' &&
      status.secretsAlignment === 'Healthy' &&
      status.schemaDrift === 'None'
        ? 0
        : 1
    );
  })
  .catch((error) => {
    console.error('Aurora Prime failed:', error);
    process.exit(1);
  });
