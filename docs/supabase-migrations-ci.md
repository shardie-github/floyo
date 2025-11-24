# Supabase Migrations via GitHub Actions

This repository uses GitHub Actions to apply Supabase database migrations automatically. This workflow runs on `ubuntu-latest` runners, allowing migrations to be applied even if you cannot run the Supabase CLI locally (e.g., on Android/Termux where the CLI is not available for ARM64).

## What This Workflow Does

The `Supabase Migrations` workflow:

1. **Logs in to Supabase** using a personal access token stored in GitHub Secrets
2. **Links the repository** to Supabase project `ilspfaxjiquzreszitjm`
3. **Applies all pending migrations** from `supabase/migrations/` using `supabase migration up`
4. **Fails fast** if any step encounters an error

This workflow replaces the need to run `supabase db push` or `supabase migration up` locally.

## Prerequisites

- A Supabase account with access to project `ilspfaxjiquzreszitjm`
- Admin access to the GitHub repository to add secrets

## Setup Instructions

### 1. Create a Supabase Access Token

1. Log in to the [Supabase Dashboard](https://app.supabase.com)
2. Click on your profile icon (top right) → **Account Settings**
3. Navigate to **Access Tokens** (or **API Tokens**)
4. Click **Generate New Token**
5. Give it a descriptive name (e.g., "GitHub Actions Migrations")
6. Copy the token immediately — you won't be able to see it again

**Important:** The token needs permissions to manage migrations for your project. Personal access tokens typically have access to all projects you have access to.

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SUPABASE_ACCESS_TOKEN`
5. Value: Paste the token you copied from Supabase
6. Click **Add secret**

**Security Note:** Never commit the access token to the repository. Only store it in GitHub Secrets.

### 3. Verify the Secret is Set

You can verify the secret exists by checking:
- **Settings** → **Secrets and variables** → **Actions**
- You should see `SUPABASE_ACCESS_TOKEN` listed (the value will be hidden)

## How to Trigger the Workflow

### Automatic Trigger

The workflow runs automatically on:
- **Every push to the `main` branch** (if there are changes to `supabase/migrations/`)

### Manual Trigger

To run the workflow manually:

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Select **Supabase Migrations** from the workflow list
4. Click **Run workflow**
5. Select the branch (usually `main`)
6. Click **Run workflow**

The workflow will start immediately and you can watch the logs in real-time.

## Reading Workflow Logs

1. Go to **Actions** → **Supabase Migrations**
2. Click on the latest workflow run
3. Expand the **Apply Supabase Migrations** job
4. Review each step:
   - **Checkout repository**: Downloads the code
   - **Setup Node.js**: Installs Node.js 20
   - **Login to Supabase**: Authenticates with your token
   - **Link Supabase project**: Links to project `ilspfaxjiquzreszitjm`
   - **Apply migrations**: Runs `supabase migration up`

If any step fails, the logs will show the error message. Common issues:
- Missing or invalid `SUPABASE_ACCESS_TOKEN`
- Network issues connecting to Supabase
- Migration SQL syntax errors
- Migration conflicts (already applied migrations)

## Verifying Migrations Were Applied

### 1. Check Workflow Status

- Go to **Actions** → **Supabase Migrations**
- Look for a green checkmark ✅ on the latest run
- If it's red ❌, click to see error details

### 2. Verify in Supabase Dashboard

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select project `ilspfaxjiquzreszitjm`
3. Go to **Database** → **Migrations**
4. Check that your migrations appear as applied
5. Verify tables, views, and functions exist in **Database** → **Tables**

### 3. Check Migration History

The workflow logs will show which migrations were applied. Look for output like:

```
Applying migration 20240101000000_initial_schema.sql
Applying migration 20250101000000_performance_indexes.sql
```

## Troubleshooting

### Error: "SUPABASE_ACCESS_TOKEN secret is not set"

- Ensure you've added the secret in **Settings** → **Secrets and variables** → **Actions**
- The secret name must be exactly `SUPABASE_ACCESS_TOKEN`
- Try re-running the workflow after adding the secret

### Error: "Invalid access token"

- The token may have expired or been revoked
- Generate a new token in Supabase Dashboard
- Update the `SUPABASE_ACCESS_TOKEN` secret in GitHub

### Error: "Project not found" or "Permission denied"

- Verify you have access to project `ilspfaxjiquzreszitjm`
- Ensure your Supabase account has the correct permissions
- Check that the project reference is correct in the workflow file

### Error: "Migration already applied"

- This is usually harmless — the migration system tracks which migrations have been applied
- If you need to re-run a migration, you may need to manually reset it in Supabase
- Consider using `supabase migration repair` if migrations are out of sync

### Workflow Runs Concurrently

The workflow uses concurrency control to prevent overlapping runs on the same branch. If you trigger multiple runs:
- Only one will run at a time per branch
- Others will wait in queue
- Completed runs won't be cancelled

## Important Caveats

⚠️ **Production Environment**: Migrations are applied directly to the Supabase project (`ilspfaxjiquzreszitjm`). Any destructive changes (e.g., `DROP TABLE`, `ALTER TABLE`) will affect your production database.

**Recommendations:**
- Test migrations in a staging environment first
- Review migration SQL files before committing
- Use feature branches and test migrations before merging to `main`
- Consider using a separate Supabase project for staging/testing

## Workflow Configuration

The workflow file is located at `.github/workflows/supabase-migrate.yml`. Key settings:

- **Triggers**: Push to `main`, manual dispatch
- **Concurrency**: One run per branch at a time
- **Runner**: `ubuntu-latest`
- **Node Version**: 20
- **Project Reference**: `ilspfaxjiquzreszitjm` (hardcoded, not a secret)

To change the project reference, edit the `SUPABASE_PROJECT_REF` environment variable in the workflow file.

## Related Documentation

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
