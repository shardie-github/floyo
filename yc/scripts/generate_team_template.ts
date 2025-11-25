#!/usr/bin/env tsx
/**
 * Generate team information template with auto-detected data
 * 
 * Usage:
 *   tsx yc/scripts/generate_team_template.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface GitContributor {
  name: string;
  email: string;
  commits: number;
}

function getGitContributors(): GitContributor[] {
  try {
    const output = execSync('git shortlog -sn --email', { encoding: 'utf-8' });
    const contributors: GitContributor[] = [];
    
    const lines = output.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const match = line.match(/^\s*(\d+)\s+(.+?)\s+<(.+?)>$/);
      if (match) {
        contributors.push({
          commits: parseInt(match[1]),
          name: match[2],
          email: match[3],
        });
      }
    }
    
    return contributors;
  } catch (error) {
    console.warn('⚠️  Could not get git contributors:', error);
    return [];
  }
}

function getPackageJsonInfo() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    return {
      name: packageJson.name,
      description: packageJson.description,
      version: packageJson.version,
    };
  } catch (error) {
    return null;
  }
}

function generateTeamTemplate() {
  const contributors = getGitContributors();
  const packageInfo = getPackageJsonInfo();

  let template = readFileSync(join(process.cwd(), 'yc', 'YC_TEAM_NOTES.md'), 'utf-8');

  // Add detected information
  const detectedInfo = `
## Auto-Detected Information

### Git Contributors (Top Contributors)
${contributors.slice(0, 5).map((c, i) => `
**Contributor ${i + 1}:**
- **Name:** ${c.name}
- **Email:** ${c.email}
- **Commits:** ${c.commits}
- **Likely Role:** ${i === 0 ? 'Primary Founder/Lead Developer' : 'Co-founder/Contributor'}
`).join('\n')}

### Repository Information
- **Project Name:** ${packageInfo?.name || 'floyo-monorepo'}
- **Description:** ${packageInfo?.description || 'File usage pattern tracking and integration suggestions'}
- **Version:** ${packageInfo?.version || '1.0.0'}

### Inferred Team Size
Based on git history: **${contributors.length}** contributor(s)

### Suggested Founder Roles
${contributors.slice(0, 3).map((c, i) => {
  const roles = ['CEO/CTO', 'CTO/CPO', 'CPO/Head of Product'];
  return `- **${c.name}:** ${roles[i] || 'Co-founder'} (${c.commits} commits)`;
}).join('\n')}

---

`;

  // Insert detected info after "Team Information from Repository" section
  const insertIndex = template.indexOf('## Team Information from Repository');
  if (insertIndex !== -1) {
    const nextSectionIndex = template.indexOf('##', insertIndex + 1);
    if (nextSectionIndex !== -1) {
      template = template.substring(0, nextSectionIndex) + detectedInfo + template.substring(nextSectionIndex);
    }
  }

  writeFileSync(join(process.cwd(), 'yc', 'YC_TEAM_NOTES.md'), template);
  console.log('✅ Updated YC_TEAM_NOTES.md with auto-detected information');
  console.log(`   Found ${contributors.length} contributors`);
}

generateTeamTemplate();
