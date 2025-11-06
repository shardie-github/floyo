# How to Get Your Vercel Token

## Quick Steps

### Method 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Make sure you're logged in

2. **Navigate to Settings**
   - Click your profile icon (top right corner)
   - Select **Settings** from the dropdown

3. **Go to Tokens Section**
   - In the left sidebar, click **Tokens**
   - You'll see a list of existing tokens (if any)

4. **Create New Token**
   - Click the **Create Token** button
   - Enter a descriptive name:
     - Example: `floyo-github-actions` or `floyo-ci-cd`
   - Select expiration:
     - **No expiration** (recommended for CI/CD)
     - Or set a custom expiration date
   - Click **Create**

5. **Copy the Token**
   - **⚠️ IMPORTANT**: The token will be displayed only once!
   - Copy it immediately and store it securely
   - Format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

6. **Use the Token**
   - Add it to GitHub Secrets as `VERCEL_TOKEN`
   - Or use it in your local `.env` file for CLI commands

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# This will open your browser for authentication
# After login, you can use vercel commands without a token
```

However, for CI/CD, you still need a token (Method 1 is better for GitHub Actions).

## Where to Use the Token

### GitHub Actions Secrets
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `VERCEL_TOKEN`
5. Value: Paste your token
6. Click **Add secret**

### Local Environment Variables
Add to your `.env` file:
```env
VERCEL_TOKEN=your-token-here
```

### Vercel CLI
```bash
# Use token directly
vercel --token your-token-here

# Or set as environment variable
export VERCEL_TOKEN=your-token-here
vercel deploy
```

## Getting Other Vercel IDs

### VERCEL_ORG_ID (Organization ID)

1. Go to your Vercel project
2. Navigate to **Settings** → **General**
3. Find **Organization ID**
   - Format: `team_xxxxxxxxxxxxx`
   - Example: `team_abc123def456`

**Alternative method:**
- Check your project URL: `https://vercel.com/your-org/your-project`
- The org name is in the URL

### VERCEL_PROJECT_ID (Project ID)

1. Go to your Vercel project
2. Navigate to **Settings** → **General**
3. Find **Project ID**
   - Format: `prj_xxxxxxxxxxxxx`
   - Example: `prj_xyz789uvw012`

**Alternative method via CLI:**
```bash
cd frontend
vercel link
# This will show your Project ID and Organization ID
```

## Security Best Practices

1. **Never commit tokens to git**
   - Add `.env` to `.gitignore`
   - Use GitHub Secrets for CI/CD

2. **Use different tokens for different purposes**
   - One token for GitHub Actions
   - Separate token for local development (optional)

3. **Set expiration dates**
   - For production: Use long expiration or "No expiration"
   - For testing: Use short expiration dates

4. **Rotate tokens regularly**
   - Delete old tokens when creating new ones
   - Update GitHub Secrets when rotating

5. **Use least privilege**
   - Tokens inherit your account permissions
   - Only grant access to necessary projects

## Troubleshooting

### Token Not Working
- Verify the token was copied correctly (no extra spaces)
- Check if token has expired
- Ensure token has necessary permissions
- Try creating a new token

### Can't Find Project ID
- Make sure you're in the correct project
- Check if you have access to the project
- Try using `vercel link` command

### Permission Denied
- Verify your account has access to the project
- Check if you're using the correct organization
- Ensure token has not been revoked

## Quick Reference

```bash
# Required tokens/IDs for Floyo setup:
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_ORG_ID=team_xxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx

# Add to GitHub Secrets:
# - VERCEL_TOKEN
# - VERCEL_ORG_ID  
# - VERCEL_PROJECT_ID
```

## Next Steps

After getting your Vercel token:
1. Add it to GitHub Secrets (see `VERCEL_SUPABASE_MIGRATION.md`)
2. Test it with: `npm run vercel:login`
3. Continue with project setup following the migration guide

For complete setup instructions, see `VERCEL_SUPABASE_MIGRATION.md`.
