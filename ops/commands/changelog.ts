/**
 * Changelog command - Generate CHANGELOG from commits
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export async function changelog(options: { since?: string }) {
  console.log('📝 Generating CHANGELOG...\n');

  try {
    const since = options.since || 'HEAD~10';
    
    // Get git commits
    const commits = execSync(`git log ${since}..HEAD --format="%s"`, { encoding: 'utf-8' })
      .split('\n')
      .filter(line => line.trim());

    // Categorize commits
    const features: string[] = [];
    const fixes: string[] = [];
    const docs: string[] = [];
    const chore: string[] = [];

    commits.forEach(commit => {
      const lower = commit.toLowerCase();
      if (lower.startsWith('feat:') || lower.includes('feature')) {
        features.push(commit);
      } else if (lower.startsWith('fix:') || lower.includes('bug')) {
        fixes.push(commit);
      } else if (lower.startsWith('docs:')) {
        docs.push(commit);
      } else {
        chore.push(commit);
      }
    });

    // Generate changelog
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    let changelogContent = '';

    if (fs.existsSync(changelogPath)) {
      changelogContent = fs.readFileSync(changelogPath, 'utf-8');
    }

    const version = getVersion();
    const date = new Date().toISOString().split('T')[0];
    
    const newSection = `## [${version}] - ${date}

### Added
${features.map(f => `- ${f}`).join('\n') || '- No new features'}

### Fixed
${fixes.map(f => `- ${f}`).join('\n') || '- No fixes'}

### Documentation
${docs.map(d => `- ${d}`).join('\n') || '- No documentation changes'}

### Changed
${chore.map(c => `- ${c}`).join('\n') || '- No changes'}

`;

    // Prepend to existing changelog
    const updated = newSection + '\n' + changelogContent;
    fs.writeFileSync(changelogPath, updated);

    console.log(`✅ CHANGELOG updated: ${changelogPath}\n`);
  } catch (error) {
    console.error(`❌ CHANGELOG generation failed: ${error.message}\n`);
    process.exit(1);
  }
}

function getVersion(): string {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}
