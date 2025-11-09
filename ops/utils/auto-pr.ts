/**
 * Auto-PR Creator
 * Creates GitHub PRs for safe dependency upgrades and fixes
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface SafeFix {
  name: string;
  from: string;
  to: string;
  type: 'patch' | 'minor';
  service: string;
  changelog?: string;
}

export interface PRResult {
  created: number;
  skipped: number;
  errors: string[];
}

export async function createAutoPR(
  safeFixes: SafeFix[],
  config: { githubToken?: string }
): Promise<PRResult> {
  if (!config.githubToken) {
    return { created: 0, skipped: safeFixes.length, errors: ['GitHub token not configured'] };
  }

  const result: PRResult = { created: 0, skipped: 0, errors: [] };

  // Group fixes by service
  const fixesByService = new Map<string, SafeFix[]>();
  safeFixes.forEach(fix => {
    if (!fixesByService.has(fix.service)) {
      fixesByService.set(fix.service, []);
    }
    fixesByService.get(fix.service)!.push(fix);
  });

  for (const [service, fixes] of fixesByService.entries()) {
    try {
      const branchName = `chore/${service}-deps-${Date.now()}`;
      const prTitle = `chore(${service}): Auto-update dependencies (${fixes.length} packages)`;
      const prBody = generatePRBody(fixes, service);

      // Create branch and update package.json
      await createBranchAndUpdate(branchName, fixes, service);

      // Commit changes
      await commitChanges(branchName, fixes, service);

      // Create PR via GitHub CLI or API
      await createGitHubPR(branchName, prTitle, prBody, config.githubToken!);

      result.created++;
    } catch (error: any) {
      result.errors.push(`Failed to create PR for ${service}: ${error.message}`);
      result.skipped++;
    }
  }

  return result;
}

async function createBranchAndUpdate(
  branchName: string,
  fixes: SafeFix[],
  service: string
): Promise<void> {
  // Checkout new branch
  execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });

  // Update package.json
  const packageJsonPath = service === 'root'
    ? path.join(process.cwd(), 'package.json')
    : path.join(process.cwd(), service, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  fixes.forEach(fix => {
    if (deps[fix.name]) {
      deps[fix.name] = `^${fix.to}`;
    }
  });

  // Update package.json
  if (pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach(key => {
      if (deps[key]) pkg.dependencies[key] = deps[key];
    });
  }
  if (pkg.devDependencies) {
    Object.keys(pkg.devDependencies).forEach(key => {
      if (deps[key]) pkg.devDependencies[key] = deps[key];
    });
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
}

async function commitChanges(
  branchName: string,
  fixes: SafeFix[],
  service: string
): Promise<void> {
  const packageJsonPath = service === 'root'
    ? path.join(process.cwd(), 'package.json')
    : path.join(process.cwd(), service, 'package.json');

  const fixList = fixes.map(f => `- ${f.name}: ${f.from} → ${f.to}`).join('\n');

  execSync(`git add ${packageJsonPath}`, { stdio: 'pipe' });
  execSync(
    `git commit -m "chore(${service}): Auto-update dependencies\\n\\n${fixList}\\n\\n[skip ci]"`,
    { stdio: 'pipe' }
  );
}

async function createGitHubPR(
  branchName: string,
  title: string,
  body: string,
  token: string
): Promise<void> {
  // Use GitHub CLI if available, otherwise use API
  try {
    execSync(`gh pr create --title "${title}" --body "${body.replace(/"/g, '\\"')}" --label "security-auto"`, {
      stdio: 'pipe',
      env: { ...process.env, GITHUB_TOKEN: token },
    });
  } catch (e) {
    // Fallback to API (requires @octokit/rest)
    try {
      const { Octokit } = await import('@octokit/rest');
      const octokit = new Octokit({ auth: token });

      // Get repo info from git
      const remoteUrl = execSync('git config --get remote.origin.url', {
        encoding: 'utf-8',
      }).trim();
      const match = remoteUrl.match(/github\.com[:/](.+)\/(.+)\.git/);
      if (!match) throw new Error('Could not parse GitHub repo URL');

      const [owner, repo] = match.slice(1);

      await octokit.rest.pulls.create({
        owner,
        repo,
        title,
        body,
        head: branchName,
        base: 'main',
        labels: ['security-auto'],
      });
    } catch (apiError) {
      console.warn('Failed to create PR via API:', (apiError as Error).message);
      throw new Error('Could not create PR (install @octokit/rest or GitHub CLI)');
    }
  }
}

function generatePRBody(fixes: SafeFix[], service: string): string {
  const fixList = fixes.map(f => {
    return `- **${f.name}**: \`${f.from}\` → \`${f.to}\` (${f.type})`;
  }).join('\n');

  return `## Auto-Generated Dependency Updates

This PR automatically updates ${fixes.length} dependency(ies) in the \`${service}\` service.

### Updates

${fixList}

### Type
- **Patch/Minor updates only** (safe for auto-merge)
- All updates are backward-compatible

### Testing
- [ ] Run \`npm install\` or \`pnpm install\`
- [ ] Run tests: \`npm test\`
- [ ] Verify build: \`npm run build\`

### Changelog
${fixes.map(f => f.changelog ? `- ${f.name}: ${f.changelog}` : '').filter(Boolean).join('\n') || 'No changelog available'}

---

*This PR was automatically created by the Hardonia Reliability Orchestrator*
*Label: \`security-auto\`*
`;
}
