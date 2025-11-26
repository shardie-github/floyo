#!/usr/bin/env tsx
/**
 * Check if required GitHub Secrets are configured
 * 
 * Usage:
 *   tsx scripts/check-github-secrets.ts
 * 
 * Note: This script cannot access actual secret values (GitHub doesn't allow that),
 * but it can verify if secrets are referenced in workflows and provide a checklist.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface SecretCheck {
  name: string;
  required: boolean;
  foundInWorkflows: boolean;
  description: string;
  howToGet: string;
}

const requiredSecrets: SecretCheck[] = [
  {
    name: 'VERCEL_TOKEN',
    required: true,
    foundInWorkflows: false,
    description: 'Vercel deployment token for CI/CD',
    howToGet: 'Get from https://vercel.com/account/tokens → Create Token',
  },
  {
    name: 'VERCEL_ORG_ID',
    required: true,
    foundInWorkflows: false,
    description: 'Vercel organization ID',
    howToGet: 'Get from Vercel Dashboard → Organization Settings → General',
  },
  {
    name: 'VERCEL_PROJECT_ID',
    required: true,
    foundInWorkflows: false,
    description: 'Vercel project ID',
    howToGet: 'Get from Vercel Dashboard → Project Settings → General',
  },
  {
    name: 'SUPABASE_ACCESS_TOKEN',
    required: true,
    foundInWorkflows: false,
    description: 'Supabase access token for migrations',
    howToGet: 'Get from https://supabase.com/dashboard/account/tokens → Generate New Token',
  },
  {
    name: 'SUPABASE_PROJECT_REF',
    required: true,
    foundInWorkflows: false,
    description: 'Supabase project reference ID',
    howToGet: 'Get from Supabase Dashboard → Settings → General → Reference ID',
  },
];

function checkWorkflowsForSecrets() {
  const workflowFiles = glob.sync('.github/workflows/**/*.yml');
  
  workflowFiles.forEach(file => {
    try {
      const content = readFileSync(file, 'utf-8');
      requiredSecrets.forEach(secret => {
        if (content.includes(`$${{ secrets.${secret.name} }}`) || 
            content.includes(`${{ secrets.${secret.name} }}`) ||
            content.includes(`secrets.${secret.name}`)) {
          secret.foundInWorkflows = true;
        }
      });
    } catch (error) {
      // Skip if file doesn't exist
    }
  });
}

function generateChecklist() {
  const checklist = `# GitHub Secrets Verification Checklist

**Generated:** ${new Date().toLocaleDateString()}

## Required Secrets

${requiredSecrets.map((secret, i) => `
### ${i + 1}. ${secret.name}

- **Required:** ${secret.required ? '✅ YES' : '⚠️ Optional'}
- **Found in Workflows:** ${secret.foundInWorkflows ? '✅ YES' : '❌ NO'}
- **Description:** ${secret.description}
- **How to Get:** ${secret.howToGet}
- **Status:** [ ] Not Set | [ ] Set | [ ] Verified

**To Set:**
1. Go to GitHub → Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: \`${secret.name}\`
4. Value: [Get from instructions above]
5. Click "Add secret"

`).join('')}

## Verification Steps

1. [ ] Go to GitHub → Repository → Settings → Secrets and variables → Actions
2. [ ] Verify all required secrets are listed (values will be hidden)
3. [ ] For each secret:
   - [ ] Verify name matches exactly (case-sensitive)
   - [ ] Verify value is correct (you can't see it, but you can update it)
   - [ ] Test deployment to ensure secrets work

## Testing Secrets

After setting secrets, test by:
1. Creating a test PR (should trigger preview deployment)
2. Merging to main (should trigger production deployment)
3. Check GitHub Actions logs for any secret-related errors

## Troubleshooting

**If deployment fails:**
- Check GitHub Actions logs for specific error
- Verify secret names match exactly (case-sensitive)
- Verify secret values are correct (re-create if needed)
- Check that workflows reference secrets correctly

**If migrations fail:**
- Verify SUPABASE_ACCESS_TOKEN has correct permissions
- Verify SUPABASE_PROJECT_REF matches your project
- Check Supabase Dashboard → Database → Migrations for errors

---

**Status:** ⚠️ Manual verification required (GitHub doesn't allow programmatic access to secrets)

**Next Steps:**
1. Review this checklist
2. Manually verify secrets in GitHub Settings
3. Test deployments to ensure secrets work
4. Update this checklist with verification status

`;

  return checklist;
}

function main() {
  console.log('🔍 Checking GitHub Secrets configuration...\n');

  checkWorkflowsForSecrets();

  console.log('📋 Secret Status:\n');
  
  let allFound = true;
  requiredSecrets.forEach(secret => {
    const status = secret.foundInWorkflows ? '✅' : '❌';
    const required = secret.required ? '(REQUIRED)' : '(OPTIONAL)';
    console.log(`${status} ${secret.name} ${required}`);
    if (secret.required && !secret.foundInWorkflows) {
      allFound = false;
    }
  });

  console.log('\n');

  if (allFound) {
    console.log('✅ All required secrets are referenced in workflows');
    console.log('⚠️  However, you still need to manually verify they are set in GitHub Settings');
  } else {
    console.log('⚠️  Some required secrets are not found in workflows');
    console.log('   This might be okay if workflows use different variable names');
  }

  // Generate checklist
  const checklistPath = join(process.cwd(), 'docs', 'GITHUB_SECRETS_CHECKLIST.md');
  const checklist = generateChecklist();
  writeFileSync(checklistPath, checklist);
  console.log(`\n✅ Generated checklist: ${checklistPath}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Review docs/GITHUB_SECRETS_CHECKLIST.md');
  console.log('   2. Go to GitHub → Settings → Secrets and verify each secret');
  console.log('   3. Test deployments to ensure secrets work');
}

main();
