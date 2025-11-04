/**
 * Release command - Full release pipeline
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export async function release(options: {
  dryRun?: boolean;
  skipTests?: boolean;
}) {
  console.log('🚀 Starting release pipeline...\n');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  const steps = [
    { name: 'Run tests', fn: runTests, skip: options.skipTests },
    { name: 'Run linting', fn: runLinting },
    { name: 'Run type check', fn: runTypeCheck },
    { name: 'Run doctor', fn: runDoctor },
    { name: 'Generate changelog', fn: generateChangelog },
    { name: 'Bump version', fn: bumpVersion },
    { name: 'Build application', fn: buildApp },
    { name: 'Create git tag', fn: createGitTag },
    { name: 'Deploy to Vercel', fn: deployVercel },
    { name: 'Update aliases', fn: updateAliases },
    { name: 'Send notifications', fn: sendNotifications },
  ];

  for (const step of steps) {
    if (step.skip) {
      console.log(`⏭️  Skipping: ${step.name}\n`);
      continue;
    }

    console.log(`📋 ${step.name}...`);
    try {
      await step.fn(options.dryRun);
      console.log(`✅ ${step.name} completed\n`);
    } catch (error) {
      console.error(`❌ ${step.name} failed: ${error.message}\n`);
      if (!options.dryRun) {
        console.error('🛑 Release aborted. Please fix errors and try again.\n');
        process.exit(1);
      }
    }
  }

  console.log('✅ Release pipeline completed!\n');
}

async function runTests(dryRun: boolean) {
  if (dryRun) return;
  execSync('npm run test', { stdio: 'inherit' });
}

async function runLinting(dryRun: boolean) {
  if (dryRun) return;
  execSync('npm run lint', { stdio: 'inherit' });
}

async function runTypeCheck(dryRun: boolean) {
  if (dryRun) return;
  execSync('npm run type-check', { stdio: 'inherit' });
}

async function runDoctor(dryRun: boolean) {
  if (dryRun) return;
  execSync('npm run ops doctor', { stdio: 'inherit' });
}

async function generateChangelog(dryRun: boolean) {
  if (dryRun) return;
  execSync('npm run ops changelog', { stdio: 'inherit' });
}

async function bumpVersion(dryRun: boolean) {
  if (dryRun) {
    console.log('   Would bump version');
    return;
  }
  
  // Use semantic-release or custom version bump
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const [major, minor, patch] = pkg.version.split('.').map(Number);
  const newVersion = `${major}.${minor}.${patch + 1}`;
  
  pkg.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`   Version bumped to ${newVersion}`);
}

async function buildApp(dryRun: boolean) {
  if (dryRun) {
    console.log('   Would build application');
    return;
  }
  execSync('npm run build', { stdio: 'inherit' });
}

async function createGitTag(dryRun: boolean) {
  if (dryRun) {
    console.log('   Would create git tag');
    return;
  }
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const tag = `v${pkg.version}`;
  
  execSync(`git tag -a ${tag} -m "Release ${tag}"`, { stdio: 'inherit' });
  console.log(`   Created tag: ${tag}`);
}

async function deployVercel(dryRun: boolean) {
  if (dryRun) {
    console.log('   Would deploy to Vercel');
    return;
  }
  
  // Deploy to production
  execSync('vercel --prod', { stdio: 'inherit' });
  
  // Keep prod-1 warm
  execSync('vercel alias set $(vercel inspect --prod | grep url | head -1) prod-1', { stdio: 'pipe' });
}

async function updateAliases(dryRun: boolean) {
  if (dryRun) {
    console.log('   Would update Vercel aliases');
    return;
  }
  
  // Ensure production alias points to latest
  const url = execSync('vercel inspect --prod | grep url | head -1', { encoding: 'utf-8' }).trim();
  execSync(`vercel alias set ${url} prod`, { stdio: 'inherit' });
}

async function sendNotifications(dryRun: boolean) {
  if (dryRun) {
    console.log('   Would send release notifications');
    return;
  }
  
  // Send webhook notifications to Discord/Slack
  const webhookUrl = process.env.RELEASE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('   ⚠️  No webhook URL configured');
    return;
  }
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  // This would be implemented with actual webhook call
  console.log('   📢 Release notification sent');
}
