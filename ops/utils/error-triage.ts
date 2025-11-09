/**
 * Error Triage & Self-Healing System
 * Analyzes deployment logs and CI runs for recurring errors
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

export interface ErrorTriageReport {
  totalErrors: number;
  recurring: Array<{
    component: string;
    error: string;
    count: number;
    firstSeen: string;
    lastSeen: string;
    rootCause: string;
    fix?: string;
  }>;
  classifications: {
    build: number;
    api: number;
    auth: number;
    network: number;
    other: number;
  };
  autoFixable: number;
}

export async function triageErrors(
  supabase: SupabaseClient,
  config: { githubToken?: string }
): Promise<ErrorTriageReport> {
  // Collect errors from metrics_log
  const { data: errorMetrics } = await supabase
    .from('metrics_log')
    .select('metric, ts')
    .eq('metric->>type', 'error')
    .order('ts', { ascending: false })
    .limit(1000);

  // Group errors by pattern
  const errorGroups = new Map<string, Array<{ ts: string; metric: any }>>();

  (errorMetrics || []).forEach((entry: any) => {
    const errorMessage = entry.metric?.message || entry.metric?.error || 'unknown';
    const pattern = normalizeError(errorMessage);

    if (!errorGroups.has(pattern)) {
      errorGroups.set(pattern, []);
    }
    errorGroups.get(pattern)!.push({ ts: entry.ts, metric: entry.metric });
  });

  // Identify recurring errors (> 3 occurrences)
  const recurring: ErrorTriageReport['recurring'] = [];
  const classifications = {
    build: 0,
    api: 0,
    auth: 0,
    network: 0,
    other: 0,
  };

  errorGroups.forEach((occurrences, pattern) => {
    if (occurrences.length >= 3) {
      const first = occurrences[occurrences.length - 1];
      const last = occurrences[0];
      const component = classifyComponent(pattern);
      const rootCause = identifyRootCause(pattern);

      classifications[component]++;
      if (component === 'other') classifications.other++;

      recurring.push({
        component,
        error: pattern,
        count: occurrences.length,
        firstSeen: first.ts,
        lastSeen: last.ts,
        rootCause,
        fix: suggestFix(pattern, rootCause),
      });
    }
  });

  // Count auto-fixable errors
  const autoFixable = recurring.filter(r => r.fix && r.component !== 'other').length;

  // Create GitHub issues for recurring failures
  if (config.githubToken && recurring.length > 0) {
    await createGitHubIssues(recurring, config.githubToken);
  }

  return {
    totalErrors: errorMetrics?.length || 0,
    recurring,
    classifications,
    autoFixable,
  };
}

function normalizeError(error: string): string {
  // Normalize error messages by removing variable parts
  return error
    .replace(/\d+/g, '<NUMBER>')
    .replace(/['"]/g, '<QUOTE>')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200); // Limit length
}

function classifyComponent(error: string): 'build' | 'api' | 'auth' | 'network' | 'other' {
  const lower = error.toLowerCase();

  if (lower.includes('build') || lower.includes('compile') || lower.includes('webpack')) {
    return 'build';
  }
  if (lower.includes('api') || lower.includes('endpoint') || lower.includes('route')) {
    return 'api';
  }
  if (lower.includes('auth') || lower.includes('token') || lower.includes('unauthorized')) {
    return 'auth';
  }
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('connection')) {
    return 'network';
  }

  return 'other';
}

function identifyRootCause(error: string): string {
  const lower = error.toLowerCase();

  if (lower.includes('missing') || lower.includes('not found')) {
    return 'Missing dependency or configuration';
  }
  if (lower.includes('timeout')) {
    return 'Network or service timeout';
  }
  if (lower.includes('permission') || lower.includes('unauthorized')) {
    return 'Authentication or authorization issue';
  }
  if (lower.includes('syntax') || lower.includes('parse')) {
    return 'Code syntax or parsing error';
  }
  if (lower.includes('memory') || lower.includes('out of')) {
    return 'Resource exhaustion';
  }

  return 'Unknown root cause';
}

function suggestFix(error: string, rootCause: string): string | undefined {
  const lower = error.toLowerCase();

  if (lower.includes('missing') && lower.includes('package')) {
    return 'Run: npm install or pnpm install';
  }
  if (lower.includes('timeout')) {
    return 'Increase timeout or check network connectivity';
  }
  if (lower.includes('permission')) {
    return 'Check RLS policies or API permissions';
  }
  if (lower.includes('syntax')) {
    return 'Review code syntax and fix parsing errors';
  }
  if (lower.includes('memory')) {
    return 'Optimize memory usage or increase resources';
  }

  return undefined;
}

async function createGitHubIssues(
  recurring: ErrorTriageReport['recurring'],
  githubToken: string
): Promise<void> {
  // This would create GitHub issues via API
  // For now, just log the intent
  console.log(`Would create ${recurring.length} GitHub issue(s) for recurring failures`);

  // In production, use @octokit/rest to create issues
  // const { Octokit } = await import('@octokit/rest');
  // const octokit = new Octokit({ auth: githubToken });
  // ...
}
