/**
 * Dependency Health Checker
 * Analyzes outdated packages, vulnerabilities, and lockfile consistency
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface DependencyReport {
  outdated: Array<{
    name: string;
    current: string;
    wanted: string;
    latest: string;
    type: 'patch' | 'minor' | 'major';
    service: string;
  }>;
  vulnerabilities: Array<{
    name: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    title: string;
    service: string;
  }>;
  safeFixes: Array<{
    name: string;
    from: string;
    to: string;
    type: 'patch' | 'minor';
    service: string;
    changelog?: string;
  }>;
  lockfileIssues: Array<{
    service: string;
    issue: string;
  }>;
}

export async function checkDependencyHealth(): Promise<DependencyReport> {
  const report: DependencyReport = {
    outdated: [],
    vulnerabilities: [],
    safeFixes: [],
    lockfileIssues: [],
  };

  // Check root package.json
  await checkNpmDependencies('root', report);

  // Check frontend package.json
  if (fs.existsSync(path.join(process.cwd(), 'frontend', 'package.json'))) {
    await checkNpmDependencies('frontend', report, 'frontend');
  }

  // Check expo doctor (if applicable)
  await checkExpoDoctor(report);

  // Validate lockfiles
  await validateLockfiles(report);

  return report;
}

async function checkNpmDependencies(
  service: string,
  report: DependencyReport,
  cwd?: string
): Promise<void> {
  const workDir = cwd ? path.join(process.cwd(), cwd) : process.cwd();

  try {
    // Check outdated packages
    try {
      const outdatedOutput = execSync('pnpm outdated --json || npm outdated --json', {
        cwd: workDir,
        stdio: 'pipe',
        encoding: 'utf-8',
      });

      const outdated = JSON.parse(outdatedOutput);
      for (const [name, info] of Object.entries(outdated as Record<string, any>)) {
        if (info.current !== info.wanted || info.current !== info.latest) {
          const type = determineUpdateType(info.current, info.wanted, info.latest);
          report.outdated.push({
            name,
            current: info.current,
            wanted: info.wanted,
            latest: info.latest,
            type,
            service,
          });

          // Mark patch/minor as safe fixes
          if (type === 'patch' || type === 'minor') {
            report.safeFixes.push({
              name,
              from: info.current,
              to: info.latest,
              type,
              service,
            });
          }
        }
      }
    } catch (e) {
      // pnpm/npm outdated may exit with non-zero if packages are outdated
      // Try to parse output anyway
    }

    // Check vulnerabilities
    try {
      const auditOutput = execSync('npm audit --json', {
        cwd: workDir,
        stdio: 'pipe',
        encoding: 'utf-8',
      });

      const audit = JSON.parse(auditOutput);
      const vulnerabilities = audit.vulnerabilities || {};

      for (const [name, vuln] of Object.entries(vulnerabilities as Record<string, any>)) {
        report.vulnerabilities.push({
          name,
          severity: vuln.severity || 'moderate',
          title: vuln.title || vuln.name,
          service,
        });
      }
    } catch (e) {
      // npm audit may exit with non-zero if vulnerabilities exist
      try {
        const errorOutput = (e as any).stdout?.toString() || '';
        const audit = JSON.parse(errorOutput);
        const vulnerabilities = audit.vulnerabilities || {};

        for (const [name, vuln] of Object.entries(vulnerabilities as Record<string, any>)) {
          report.vulnerabilities.push({
            name,
            severity: vuln.severity || 'moderate',
            title: vuln.title || vuln.name,
            service,
          });
        }
      } catch {
        // Ignore parse errors
      }
    }
  } catch (error) {
    console.warn(`Failed to check dependencies for ${service}:`, (error as Error).message);
  }
}

async function checkExpoDoctor(report: DependencyReport): Promise<void> {
  try {
    const expoOutput = execSync('npx expo doctor --json', {
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    const doctor = JSON.parse(expoOutput);
    if (doctor.errors && doctor.errors.length > 0) {
      doctor.errors.forEach((error: string) => {
        report.lockfileIssues.push({
          service: 'expo',
          issue: error,
        });
      });
    }
  } catch (e) {
    // Expo doctor may not be available or may report issues
  }
}

async function validateLockfiles(report: DependencyReport): Promise<void> {
  const lockfiles = [
    { path: 'pnpm-lock.yaml', service: 'root' },
    { path: 'package-lock.json', service: 'root' },
    { path: 'frontend/pnpm-lock.yaml', service: 'frontend' },
    { path: 'frontend/package-lock.json', service: 'frontend' },
  ];

  for (const lockfile of lockfiles) {
    const fullPath = path.join(process.cwd(), lockfile.path);
    if (fs.existsSync(fullPath)) {
      try {
        // Check if lockfile is consistent with package.json
        const packageJsonPath = lockfile.path.includes('frontend')
          ? path.join(process.cwd(), 'frontend', 'package.json')
          : path.join(process.cwd(), 'package.json');

        if (fs.existsSync(packageJsonPath)) {
          // Basic validation - check if lockfile is recent
          const lockfileStat = fs.statSync(fullPath);
          const packageStat = fs.statSync(packageJsonPath);

          if (lockfileStat.mtime < packageStat.mtime) {
            report.lockfileIssues.push({
              service: lockfile.service,
              issue: `Lockfile ${lockfile.path} is older than package.json`,
            });
          }
        }
      } catch (error) {
        report.lockfileIssues.push({
          service: lockfile.service,
          issue: `Failed to validate ${lockfile.path}`,
        });
      }
    }
  }
}

function determineUpdateType(
  current: string,
  wanted: string,
  latest: string
): 'patch' | 'minor' | 'major' {
  const currentParts = parseVersion(current);
  const wantedParts = parseVersion(wanted);
  const latestParts = parseVersion(latest);

  if (currentParts.major !== latestParts.major) return 'major';
  if (currentParts.minor !== latestParts.minor) return 'minor';
  return 'patch';
}

function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return { major: 0, minor: 0, patch: 0 };
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}
