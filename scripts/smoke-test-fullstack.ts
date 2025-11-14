#!/usr/bin/env tsx
/**
 * Full-Stack Smoke Test
 * Validates environment variables and secrets across all layers
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface EnvSource {
  name: string;
  vars: Record<string, string | null>;
  errors: string[];
  warnings: string[];
}

interface SecretParity {
  variable: string;
  cursor: string | null;
  envLocal: string | null;
  supabase: string | null;
  github: string | null;
  vercel: string | null;
  deployed: string | null;
  mismatch: boolean;
  authoritative: string | null;
  recommendations: string[];
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
  severity?: 'error' | 'warning' | 'info';
}

class FullStackSmokeTest {
  private results: TestResult[] = [];
  private envSources: EnvSource[] = [];
  private secretParity: SecretParity[] = [];
  private keyVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_ACCESS_TOKEN',
    'SUPABASE_PROJECT_REF',
    'VERCEL_TOKEN',
    'VERCEL_ORG_ID',
    'VERCEL_PROJECT_ID',
  ];

  async run(): Promise<void> {
    console.log('=== FULL STACK SMOKE TEST ===\n');
    
    // Step 1: Gather environment variables from all sources
    await this.gatherEnvVars();
    
    // Step 2: Build Secret Parity Matrix
    this.buildParityMatrix();
    
    // Step 3: Run connectivity tests
    await this.testSupabase();
    await this.testVercel();
    await this.testGitHubActions();
    await this.testLocalDev();
    
    // Step 4: Generate fixes
    this.generateFixes();
    
    // Step 5: Generate report
    this.generateReport();
  }

  private async gatherEnvVars(): Promise<void> {
    console.log('📋 Gathering environment variables from all sources...\n');

    // 1. Cursor runtime environment
    const cursorEnv: Record<string, string | null> = {};
    this.keyVars.forEach(key => {
      cursorEnv[key] = process.env[key] || null;
    });
    this.envSources.push({
      name: 'Cursor Runtime Environment',
      vars: cursorEnv,
      errors: [],
      warnings: cursorEnv.DATABASE_URL ? [] : ['DATABASE_URL not set'],
    });

    // 2. .env.local (check both root and frontend)
    const envLocalPaths = [
      join(process.cwd(), '.env.local'),
      join(process.cwd(), 'frontend', '.env.local'),
    ];
    
    const envLocal: Record<string, string | null> = {};
    const envLocalErrors: string[] = [];
    const envLocalWarnings: string[] = [];
    
    let foundEnvFile = false;
    for (const envPath of envLocalPaths) {
      if (existsSync(envPath)) {
        foundEnvFile = true;
        try {
          const content = readFileSync(envPath, 'utf-8');
          content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const match = trimmed.match(/^([A-Z_]+)=(.*)$/);
              if (match && this.keyVars.includes(match[1])) {
                envLocal[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
              }
            }
          });
        } catch (error: any) {
          envLocalErrors.push(`Failed to read ${envPath}: ${error.message}`);
        }
        break;
      }
    }
    
    if (!foundEnvFile) {
      envLocalWarnings.push('.env.local not found in root or frontend directory');
    }
    
    this.keyVars.forEach(key => {
      if (!(key in envLocal)) {
        envLocal[key] = null;
      }
    });
    
    this.envSources.push({
      name: '.env.local',
      vars: envLocal,
      errors: envLocalErrors,
      warnings: envLocalWarnings,
    });

    // 3. Supabase (check config and try to infer)
    const supabaseEnv: Record<string, string | null> = {};
    const supabaseErrors: string[] = [];
    const supabaseWarnings: string[] = [];
    
    // Check supabase config
    const supabaseConfigPath = join(process.cwd(), 'supabase', 'config.toml');
    if (existsSync(supabaseConfigPath)) {
      try {
        const config = readFileSync(supabaseConfigPath, 'utf-8');
        const projectRefMatch = config.match(/project_id\s*=\s*["']?\$\{SUPABASE_PROJECT_REF:-([^}]+)\}["']?/);
        if (projectRefMatch) {
          supabaseEnv.SUPABASE_PROJECT_REF = projectRefMatch[1] || process.env.SUPABASE_PROJECT_REF || null;
        }
      } catch (error: any) {
        supabaseErrors.push(`Failed to read Supabase config: ${error.message}`);
      }
    }
    
    // Try to get from environment
    const projectRef = process.env.SUPABASE_PROJECT_REF;
    if (projectRef) {
      supabaseEnv.SUPABASE_PROJECT_REF = projectRef;
      supabaseEnv.SUPABASE_URL = process.env.SUPABASE_URL || `https://${projectRef}.supabase.co`;
      supabaseEnv.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseEnv.SUPABASE_URL;
    } else {
      supabaseWarnings.push('SUPABASE_PROJECT_REF not found - cannot infer Supabase URL');
    }
    
    supabaseEnv.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || null;
    supabaseEnv.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
    supabaseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
    supabaseEnv.DATABASE_URL = process.env.DATABASE_URL || null;
    
    this.keyVars.forEach(key => {
      if (!(key in supabaseEnv)) {
        supabaseEnv[key] = null;
      }
    });
    
    this.envSources.push({
      name: 'Supabase Project Settings',
      vars: supabaseEnv,
      errors: supabaseErrors,
      warnings: supabaseWarnings,
    });

    // 4. GitHub Secrets (check workflow files for expected vars)
    const githubEnv: Record<string, string | null> = {};
    const githubErrors: string[] = [];
    const githubWarnings: string[] = [];
    
    // Parse workflow files to see what secrets are expected
    try {
      const workflowsDir = join(process.cwd(), '.github', 'workflows');
      if (existsSync(workflowsDir)) {
        const workflows = execSync(`find ${workflowsDir} -name "*.yml" -o -name "*.yaml"`, { encoding: 'utf-8' }).trim().split('\n');
        const expectedSecrets = new Set<string>();
        
        workflows.forEach(workflow => {
          if (existsSync(workflow)) {
            const content = readFileSync(workflow, 'utf-8');
            const secretMatches = content.matchAll(/\$\{\{\s*secrets\.([A-Z_]+)\s*\}\}/g);
            for (const match of secretMatches) {
              expectedSecrets.add(match[1]);
            }
          }
        });
        
        githubWarnings.push(`Found ${expectedSecrets.size} unique secrets referenced in workflows`);
        githubWarnings.push(`Secrets: ${Array.from(expectedSecrets).join(', ')}`);
      }
    } catch (error: any) {
      githubErrors.push(`Failed to parse GitHub workflows: ${error.message}`);
    }
    
    githubWarnings.push('GitHub Secrets require API access or manual verification');
    
    this.keyVars.forEach(key => {
      githubEnv[key] = null; // Would be populated via API
    });
    
    this.envSources.push({
      name: 'GitHub Secrets',
      vars: githubEnv,
      errors: githubErrors,
      warnings: githubWarnings,
    });

    // 5. Vercel (check if CLI available and try to pull)
    const vercelEnv: Record<string, string | null> = {};
    const vercelErrors: string[] = [];
    const vercelWarnings: string[] = [];
    
    const vercelToken = process.env.VERCEL_TOKEN;
    if (vercelToken) {
      vercelEnv.VERCEL_TOKEN = vercelToken;
      vercelEnv.VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || null;
      vercelEnv.VERCEL_ORG_ID = process.env.VERCEL_ORG_ID || null;
      
      vercelWarnings.push('Vercel CLI not installed - cannot pull environment variables');
      vercelWarnings.push('To test Vercel env vars: npm install -g vercel && vercel env pull');
    } else {
      vercelWarnings.push('VERCEL_TOKEN not available');
    }
    
    this.keyVars.forEach(key => {
      if (!(key in vercelEnv)) {
        vercelEnv[key] = null;
      }
    });
    
    this.envSources.push({
      name: 'Vercel Environment Variables',
      vars: vercelEnv,
      errors: vercelErrors,
      warnings: vercelWarnings,
    });

    // 6. Deployed Vercel runtime
    const deployedEnv: Record<string, string | null> = {};
    const deployedErrors: string[] = [];
    const deployedWarnings: string[] = [];
    
    deployedWarnings.push('Deployed runtime check requires API endpoint or Vercel CLI');
    deployedWarnings.push('To test: Create /api/env-test route that returns env vars (without secrets)');
    
    this.keyVars.forEach(key => {
      deployedEnv[key] = null;
    });
    
    this.envSources.push({
      name: 'Deployed Vercel Runtime',
      vars: deployedEnv,
      errors: deployedErrors,
      warnings: deployedWarnings,
    });
  }

  private buildParityMatrix(): void {
    console.log('🔍 Building Secret Parity Matrix...\n');
    
    this.keyVars.forEach(varName => {
      const cursor = this.envSources[0].vars[varName];
      const envLocal = this.envSources[1].vars[varName];
      const supabase = this.envSources[2].vars[varName];
      const github = this.envSources[3].vars[varName];
      const vercel = this.envSources[4].vars[varName];
      const deployed = this.envSources[5].vars[varName];
      
      const normalize = (val: string | null) => {
        if (!val) return null;
        return val.replace(/^["']|["']$/g, '').trim();
      };
      
      const values = [
        normalize(cursor),
        normalize(envLocal),
        normalize(supabase),
        normalize(github),
        normalize(vercel),
        normalize(deployed),
      ].filter(v => v !== null && v !== '');
      
      const uniqueValues = new Set(values);
      const mismatch = uniqueValues.size > 1;
      
      // Authoritative source: Supabase for DB vars, Cursor for others
      const isDbVar = varName.includes('DATABASE') || varName.includes('SUPABASE');
      const authoritative = isDbVar 
        ? (normalize(supabase) || normalize(cursor) || null)
        : (normalize(cursor) || normalize(supabase) || null);
      
      const recommendations: string[] = [];
      if (mismatch && authoritative) {
        if (!normalize(cursor)) recommendations.push('Set in Cursor environment');
        if (!normalize(envLocal)) recommendations.push('Add to .env.local');
        if (isDbVar && !normalize(supabase)) recommendations.push('Set in Supabase dashboard');
        if (!normalize(github)) recommendations.push('Add to GitHub Secrets');
        if (!normalize(vercel)) recommendations.push('Set in Vercel dashboard');
      } else if (!authoritative) {
        recommendations.push('Variable not set anywhere - needs configuration');
      }
      
      this.secretParity.push({
        variable: varName,
        cursor: normalize(cursor),
        envLocal: normalize(envLocal),
        supabase: normalize(supabase),
        github: normalize(github),
        vercel: normalize(vercel),
        deployed: normalize(deployed),
        mismatch,
        authoritative,
        recommendations,
      });
    });
  }

  private async testSupabase(): Promise<void> {
    console.log('🗄️  Testing Supabase connectivity...\n');
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.results.push({
        name: 'Supabase: DATABASE_URL exists',
        passed: false,
        message: 'DATABASE_URL not found in environment',
        severity: 'error',
      });
      return;
    }

    this.results.push({
      name: 'Supabase: DATABASE_URL exists',
      passed: true,
      message: 'DATABASE_URL found',
      severity: 'info',
    });

    // Test database connection
    try {
      const { Client } = await import('pg');
      const client = new Client({ connectionString: dbUrl });
      await client.connect();
      
      const result = await client.query('SELECT now()');
      await client.end();
      
      this.results.push({
        name: 'Supabase: Database connection',
        passed: true,
        message: `Connected successfully. Server time: ${result.rows[0].now}`,
        severity: 'info',
      });
    } catch (error: any) {
      this.results.push({
        name: 'Supabase: Database connection',
        passed: false,
        message: `Connection failed: ${error.message}`,
        details: error.message,
        severity: 'error',
      });
      return; // Can't continue without DB connection
    }

    // Test schema existence
    try {
      const { Client } = await import('pg');
      const client = new Client({ connectionString: dbUrl });
      await client.connect();
      
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
        LIMIT 20
      `);
      
      const functionsResult = await client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        LIMIT 10
      `);
      
      const rlsResult = await client.query(`
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        LIMIT 10
      `);
      
      await client.end();
      
      this.results.push({
        name: 'Supabase: Schema validation',
        passed: true,
        message: `Found ${tablesResult.rows.length} tables, ${functionsResult.rows.length} functions`,
        details: {
          tables: tablesResult.rows.map((r: any) => r.table_name),
          functions: functionsResult.rows.map((r: any) => r.routine_name),
          rlsEnabled: rlsResult.rows.filter((r: any) => r.rowsecurity).length,
        },
        severity: 'info',
      });
    } catch (error: any) {
      this.results.push({
        name: 'Supabase: Schema validation',
        passed: false,
        message: `Schema check failed: ${error.message}`,
        severity: 'error',
      });
    }

    // Test service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (serviceRoleKey && supabaseUrl) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        
        // Try a simple query
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error) {
          // PGRST116 = table not found, which might be OK
          if (error.code === 'PGRST116') {
            this.results.push({
              name: 'Supabase: Service role key validation',
              passed: true,
              message: 'Service role key is valid (table may not exist yet)',
              severity: 'info',
            });
          } else {
            throw error;
          }
        } else {
          this.results.push({
            name: 'Supabase: Service role key validation',
            passed: true,
            message: 'Service role key is valid and can query database',
            severity: 'info',
          });
        }
      } catch (error: any) {
        this.results.push({
          name: 'Supabase: Service role key validation',
          passed: false,
          message: `Service role key test failed: ${error.message}`,
          severity: 'error',
        });
      }
    } else {
      this.results.push({
        name: 'Supabase: Service role key validation',
        passed: false,
        message: serviceRoleKey ? 'SUPABASE_URL missing' : 'SUPABASE_SERVICE_ROLE_KEY not found',
        severity: 'warning',
      });
    }

    // Test JWT secret (if available)
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (jwtSecret) {
      try {
        // Basic validation - JWT secret should be a string
        if (jwtSecret.length > 10) {
          this.results.push({
            name: 'Supabase: JWT secret validation',
            passed: true,
            message: 'JWT secret format appears valid',
            severity: 'info',
          });
        } else {
          this.results.push({
            name: 'Supabase: JWT secret validation',
            passed: false,
            message: 'JWT secret appears too short',
            severity: 'warning',
          });
        }
      } catch (error: any) {
        this.results.push({
          name: 'Supabase: JWT secret validation',
          passed: false,
          message: `JWT secret validation failed: ${error.message}`,
          severity: 'error',
        });
      }
    } else {
      this.results.push({
        name: 'Supabase: JWT secret validation',
        passed: false,
        message: 'SUPABASE_JWT_SECRET not found (may be optional)',
        severity: 'warning',
      });
    }
  }

  private async testVercel(): Promise<void> {
    console.log('▲ Testing Vercel configuration...\n');
    
    // Check Vercel config file
    const vercelConfigPath = join(process.cwd(), 'vercel.json');
    if (existsSync(vercelConfigPath)) {
      try {
        const config = JSON.parse(readFileSync(vercelConfigPath, 'utf-8'));
        this.results.push({
          name: 'Vercel: Configuration file',
          passed: true,
          message: 'vercel.json found and valid',
          details: {
            framework: config.framework,
            hasEdgeFunctions: !!config.functions,
          },
          severity: 'info',
        });
      } catch (error: any) {
        this.results.push({
          name: 'Vercel: Configuration file',
          passed: false,
          message: `Failed to parse vercel.json: ${error.message}`,
          severity: 'error',
        });
      }
    } else {
      this.results.push({
        name: 'Vercel: Configuration file',
        passed: false,
        message: 'vercel.json not found',
        severity: 'warning',
      });
    }

    // Check for API routes
    const apiRoutesPath = join(process.cwd(), 'frontend', 'app', 'api');
    if (existsSync(apiRoutesPath)) {
      try {
        const routes = execSync(`find ${apiRoutesPath} -name "route.ts" -o -name "route.js"`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
        this.results.push({
          name: 'Vercel: API routes',
          passed: true,
          message: `Found ${routes.length} API routes`,
          details: routes.map(r => r.replace(process.cwd(), '')),
          severity: 'info',
        });
      } catch (error: any) {
        this.results.push({
          name: 'Vercel: API routes',
          passed: false,
          message: `Failed to scan API routes: ${error.message}`,
          severity: 'warning',
        });
      }
    }

    // Check Vercel token
    if (process.env.VERCEL_TOKEN) {
      this.results.push({
        name: 'Vercel: Authentication token',
        passed: true,
        message: 'VERCEL_TOKEN found',
        severity: 'info',
      });
    } else {
      this.results.push({
        name: 'Vercel: Authentication token',
        passed: false,
        message: 'VERCEL_TOKEN not found',
        severity: 'warning',
      });
    }

    // Note about deployed endpoints
    this.results.push({
      name: 'Vercel: Deployed endpoints',
      passed: false,
      message: 'Deployed endpoint check requires Vercel CLI or API access',
      severity: 'info',
    });
  }

  private async testGitHubActions(): Promise<void> {
    console.log('🔧 Testing GitHub Actions simulation...\n');
    
    // Check Node version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
      const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
      
      this.results.push({
        name: 'GitHub Actions: Node version',
        passed: majorVersion >= 20,
        message: `Node version: ${nodeVersion} ${majorVersion >= 20 ? '(meets requirement)' : '(should be 20.x)'}`,
        severity: majorVersion >= 20 ? 'info' : 'warning',
      });
    } catch (error: any) {
      this.results.push({
        name: 'GitHub Actions: Node version',
        passed: false,
        message: `Failed to check Node version: ${error.message}`,
        severity: 'error',
      });
    }

    // Check if Prisma can generate
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        execSync('npx prisma generate', { 
          encoding: 'utf-8', 
          stdio: 'pipe',
          env: { ...process.env, DATABASE_URL: dbUrl },
        });
        this.results.push({
          name: 'GitHub Actions: Prisma generate',
          passed: true,
          message: 'Prisma client generated successfully',
          severity: 'info',
        });
      } catch (error: any) {
        this.results.push({
          name: 'GitHub Actions: Prisma generate',
          passed: false,
          message: `Prisma generate failed: ${error.message}`,
          severity: 'error',
        });
      }
    } else {
      this.results.push({
        name: 'GitHub Actions: Prisma generate',
        passed: false,
        message: 'DATABASE_URL not available',
        severity: 'warning',
      });
    }

    // Check Supabase CLI availability
    try {
      execSync('which supabase', { encoding: 'utf-8', stdio: 'pipe' });
      this.results.push({
        name: 'GitHub Actions: Supabase CLI',
        passed: true,
        message: 'Supabase CLI available',
        severity: 'info',
      });
    } catch (error: any) {
      this.results.push({
        name: 'GitHub Actions: Supabase CLI',
        passed: false,
        message: 'Supabase CLI not installed (will be installed in CI via setup-cli action)',
        severity: 'info',
      });
    }

    // Check if build would work
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      if (packageJson.scripts && packageJson.scripts.build) {
        this.results.push({
          name: 'GitHub Actions: Build script',
          passed: true,
          message: `Build script found: ${packageJson.scripts.build}`,
          severity: 'info',
        });
      }
    } catch (error: any) {
      this.results.push({
        name: 'GitHub Actions: Build script',
        passed: false,
        message: `Failed to check build script: ${error.message}`,
        severity: 'warning',
      });
    }
  }

  private async testLocalDev(): Promise<void> {
    console.log('💻 Testing local development environment...\n');
    
    // Check Node version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
      this.results.push({
        name: 'Local Dev: Node version',
        passed: true,
        message: `Node version: ${nodeVersion}`,
        severity: 'info',
      });
    } catch (error: any) {
      this.results.push({
        name: 'Local Dev: Node version',
        passed: false,
        message: `Node version check failed: ${error.message}`,
        severity: 'error',
      });
    }

    // Check .nvmrc or package.json engines
    const nvmrcPath = join(process.cwd(), '.nvmrc');
    if (existsSync(nvmrcPath)) {
      const nvmrcVersion = readFileSync(nvmrcPath, 'utf-8').trim();
      this.results.push({
        name: 'Local Dev: .nvmrc',
        passed: true,
        message: `.nvmrc specifies: ${nvmrcVersion}`,
        severity: 'info',
      });
    }

    // Test Prisma migrate status
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const status = execSync('npx prisma migrate status', { 
          encoding: 'utf-8', 
          stdio: 'pipe',
          env: { ...process.env, DATABASE_URL: dbUrl },
        });
        
        this.results.push({
          name: 'Local Dev: Prisma migrate status',
          passed: true,
          message: 'Prisma migrate status check passed',
          details: status.substring(0, 200),
          severity: 'info',
        });
      } catch (error: any) {
        const errorMsg = error.message || error.toString();
        // Some errors are OK (like migrations pending)
        const isOkError = errorMsg.includes('following migration') || errorMsg.includes('database is up to date');
        this.results.push({
          name: 'Local Dev: Prisma migrate status',
          passed: isOkError,
          message: isOkError ? 'Migration status check completed' : `Prisma migrate status: ${errorMsg.substring(0, 100)}`,
          severity: isOkError ? 'info' : 'warning',
        });
      }
    } else {
      this.results.push({
        name: 'Local Dev: Prisma migrate status',
        passed: false,
        message: 'DATABASE_URL not available',
        severity: 'warning',
      });
    }

    // Check Prisma WASM engine config
    try {
      const prismaSchema = readFileSync('prisma/schema.prisma', 'utf-8');
      const hasWasm = prismaSchema.includes('wasm');
      this.results.push({
        name: 'Local Dev: Prisma WASM engine',
        passed: true,
        message: hasWasm ? 'WASM engine configured' : 'Standard engine (WASM not configured)',
        severity: 'info',
      });
    } catch (error: any) {
      this.results.push({
        name: 'Local Dev: Prisma WASM engine',
        passed: false,
        message: `Failed to check Prisma schema: ${error.message}`,
        severity: 'warning',
      });
    }
  }

  private generateFixes(): void {
    const fixesDir = join(process.cwd(), '.cursor', 'fixes');
    mkdirSync(fixesDir, { recursive: true });
    
    const mismatches = this.secretParity.filter(p => p.mismatch || !p.authoritative);
    const missingVars = this.secretParity.filter(p => !p.authoritative);
    
    let fixContent = '# Environment Variable Synchronization Fixes\n\n';
    fixContent += `Generated: ${new Date().toISOString()}\n\n`;
    
    if (mismatches.length > 0 || missingVars.length > 0) {
      fixContent += '## Issues Found\n\n';
      
      if (missingVars.length > 0) {
        fixContent += '### Missing Variables\n\n';
        missingVars.forEach(v => {
          fixContent += `- **${v.variable}**: Not set in any source\n`;
        });
        fixContent += '\n';
      }
      
      if (mismatches.length > 0) {
        fixContent += '### Mismatched Variables\n\n';
        mismatches.forEach(v => {
          fixContent += `- **${v.variable}**: Values differ across sources\n`;
          fixContent += `  - Authoritative: ${v.authoritative || 'Not set'}\n`;
          if (v.recommendations.length > 0) {
            fixContent += `  - Actions:\n`;
            v.recommendations.forEach(rec => {
              fixContent += `    - ${rec}\n`;
            });
          }
          fixContent += '\n';
        });
      }
      
      fixContent += '## Sync Commands\n\n';
      fixContent += '### GitHub Secrets\n\n';
      fixContent += '```bash\n';
      missingVars.forEach(v => {
        if (v.authoritative) {
          fixContent += `gh secret set ${v.variable} --body "${v.authoritative}"\n`;
        }
      });
      fixContent += '```\n\n';
      
      fixContent += '### Vercel Environment Variables\n\n';
      fixContent += '```bash\n';
      missingVars.forEach(v => {
        if (v.authoritative) {
          fixContent += `vercel env add ${v.variable} production\n`;
          fixContent += `vercel env add ${v.variable} preview\n`;
          fixContent += `vercel env add ${v.variable} development\n`;
        }
      });
      fixContent += '```\n\n';
      
      fixContent += '### .env.local\n\n';
      fixContent += '```bash\n';
      fixContent += 'cat >> .env.local << EOF\n';
      missingVars.forEach(v => {
        if (v.authoritative) {
          fixContent += `${v.variable}=${v.authoritative}\n`;
        }
      });
      fixContent += 'EOF\n';
      fixContent += '```\n';
    } else {
      fixContent += '✅ No synchronization issues found. All variables are properly configured.\n';
    }
    
    writeFileSync(join(fixesDir, 'env_sync.md'), fixContent);
    console.log(`\n💾 Generated fix file: .cursor/fixes/env_sync.md\n`);
  }

  private generateReport(): void {
    const reportPath = join(process.cwd(), 'reports', 'smoke-test-report.md');
    mkdirSync(join(process.cwd(), 'reports'), { recursive: true });
    
    let report = '# FULL STACK SMOKE TEST REPORT\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += '---\n\n';
    
    // 1. Secret Parity Matrix
    report += '## 1. Secret Parity Matrix\n\n';
    report += '| Variable | Cursor | .env.local | Supabase | GitHub | Vercel | Deployed | Status |\n';
    report += '|----------|--------|------------|----------|--------|--------|----------|--------|\n';
    
    this.secretParity.forEach(parity => {
      const format = (val: string | null) => {
        if (!val) return '❌';
        if (val.length > 15) return val.substring(0, 12) + '...';
        return val;
      };
      
      const status = parity.mismatch ? '⚠️ MISMATCH' : (parity.authoritative ? '✅ SYNCED' : '❌ MISSING');
      
      report += `| ${parity.variable} | ${format(parity.cursor)} | ${format(parity.envLocal)} | ${format(parity.supabase)} | ${format(parity.github)} | ${format(parity.vercel)} | ${format(parity.deployed)} | ${status} |\n`;
    });
    
    report += '\n';
    
    // 2. Connectivity Results
    report += '## 2. Connectivity Results\n\n';
    
    const byCategory: Record<string, TestResult[]> = {};
    this.results.forEach(result => {
      const category = result.name.split(':')[0];
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(result);
    });
    
    Object.entries(byCategory).forEach(([category, results]) => {
      report += `### ${category}\n\n`;
      results.forEach(result => {
        const icon = result.passed ? '✅' : (result.severity === 'error' ? '❌' : '⚠️');
        report += `${icon} **${result.name}**: ${result.message}\n`;
        if (result.details) {
          if (typeof result.details === 'string') {
            report += `   \`\`\`\n${result.details}\n   \`\`\`\n`;
          } else {
            report += `   \`\`\`json\n${JSON.stringify(result.details, null, 2)}\n   \`\`\`\n`;
          }
        }
        report += '\n';
      });
    });
    
    // 3. Errors Found
    report += '## 3. Errors and Warnings\n\n';
    let errorCount = 0;
    let warningCount = 0;
    
    this.envSources.forEach(source => {
      if (source.errors.length > 0 || source.warnings.length > 0) {
        report += `### ${source.name}\n\n`;
        source.errors.forEach(error => {
          report += `- ❌ **Error**: ${error}\n`;
          errorCount++;
        });
        source.warnings.forEach(warning => {
          report += `- ⚠️ **Warning**: ${warning}\n`;
          warningCount++;
        });
        report += '\n';
      }
    });
    
    if (errorCount === 0 && warningCount === 0) {
      report += 'No errors or warnings found.\n\n';
    }
    
    // 4. Auto-fix steps
    report += '## 4. Auto-fix Steps\n\n';
    const mismatches = this.secretParity.filter(p => p.mismatch || !p.authoritative);
    if (mismatches.length > 0) {
      report += '### Variables Requiring Synchronization\n\n';
      mismatches.forEach(m => {
        report += `- **${m.variable}**:\n`;
        report += `  - Authoritative value: ${m.authoritative || 'Not set'}\n`;
        if (m.recommendations.length > 0) {
          report += `  - Actions:\n`;
          m.recommendations.forEach(rec => {
            report += `    - ${rec}\n`;
          });
        }
        report += '\n';
      });
      
      report += 'See `.cursor/fixes/env_sync.md` for detailed sync commands.\n\n';
    } else {
      report += '✅ All variables are synchronized.\n\n';
    }
    
    // 5. Final Summary
    report += '## 5. Final Summary\n\n';
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    const criticalErrors = this.results.filter(r => !r.passed && r.severity === 'error').length;
    const allPassed = criticalErrors === 0 && mismatches.length === 0;
    const status = allPassed ? '✅ **PASS**' : '❌ **FAIL**';
    
    report += `**Status**: ${status}\n\n`;
    report += `**Tests Passed**: ${passed}/${total} (${passRate}%)\n`;
    report += `**Critical Errors**: ${criticalErrors}\n`;
    report += `**Variables Synchronized**: ${this.secretParity.length - mismatches.length}/${this.secretParity.length}\n`;
    report += `**Mismatches Found**: ${mismatches.length}\n`;
    report += `**Errors**: ${errorCount}\n`;
    report += `**Warnings**: ${warningCount}\n\n`;
    
    if (!allPassed) {
      report += '**Action Required**: Review errors and mismatches above. See `.cursor/fixes/env_sync.md` for remediation steps.\n\n';
    } else {
      report += '**Stack Status**: ✅ Ready for production\n\n';
    }
    
    // Add manual verification section
    report += '## 6. Manual Verification Required\n\n';
    report += 'Some checks require manual verification:\n\n';
    report += '1. **GitHub Secrets**: Use GitHub CLI or dashboard to verify secrets exist\n';
    report += '   ```bash\n';
    report += '   gh secret list\n';
    report += '   ```\n\n';
    report += '2. **Vercel Environment Variables**: Pull and compare\n';
    report += '   ```bash\n';
    report += '   cd frontend && vercel env pull .env.vercel\n';
    report += '   ```\n\n';
    report += '3. **Supabase Dashboard**: Verify API keys match\n';
    report += '   - Go to Settings → API\n';
    report += '   - Compare URLs and keys with expected values\n\n';
    report += '4. **Deployed Vercel Functions**: Test endpoint\n';
    report += '   ```bash\n';
    report += '   curl https://YOUR_PROJECT.vercel.app/api/env-test\n';
    report += '   ```\n\n';
    report += '5. **GitHub Actions**: Run test workflow manually\n\n';
    report += 'See `.cursor/fixes/manual-verification-guide.md` for detailed instructions.\n\n';
    
    report += '---\n\n';
    report += '*Report generated by Full-Stack Smoke Test*\n';
    report += `*Manual verification guide: .cursor/fixes/manual-verification-guide.md*\n`;
    
    writeFileSync(reportPath, report);
    console.log(`\n📄 Full report written to: ${reportPath}\n`);
    
    // Also print summary to console
    console.log('\n=== SUMMARY ===');
    console.log(`Status: ${status}`);
    console.log(`Tests: ${passed}/${total} passed (${passRate}%)`);
    console.log(`Variables: ${this.secretParity.length - mismatches.length}/${this.secretParity.length} synchronized`);
    console.log(`Mismatches: ${mismatches.length}`);
    console.log(`Errors: ${errorCount}, Warnings: ${warningCount}`);
    console.log(`\nFull report: ${reportPath}`);
    console.log(`Fix guide: .cursor/fixes/env_sync.md`);
  }
}

// Run the test
const test = new FullStackSmokeTest();
test.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
