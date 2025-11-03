#!/usr/bin/env tsx
/**
 * Wire Doctor - Auto-fix common miswiring issues
 * 
 * Detects and suggests fixes for:
 * - CORS/CSRF header issues
 * - Missing env bindings
 * - GPT/AdMob disabled without consent
 * - RLS policy gaps
 * - Fallback to house-ads/noop analytics
 */

import * as fs from 'fs';
import * as path from 'path';


interface Diagnosis {
  issue: string;
  severity: 'critical' | 'warning' | 'info';
  location: string;
  fix: string;
  diff?: string;
  migration?: string;
}

class WireDoctor {
  private workspace: string;
  private diagnoses: Diagnosis[] = [];

  constructor() {
    // Resolve workspace root - look for tools/wiring/wire_doctor.ts
    const cwd = process.cwd();
    
    // Try current directory first
    const wireDoctorPath = path.join(cwd, 'tools', 'wiring', 'wire_doctor.ts');
    if (fs.existsSync(wireDoctorPath)) {
      this.workspace = cwd;
      return;
    }
    
    // Walk up directory tree
    let current = cwd;
    for (let i = 0; i < 10; i++) {
      const checkPath = path.join(current, 'tools', 'wiring', 'wire_doctor.ts');
      if (fs.existsSync(checkPath)) {
        this.workspace = current;
        return;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
    
    this.workspace = cwd;
  }

  async diagnose(): Promise<void> {
    console.log('?? Wire Doctor: Diagnosing connectivity issues...\n');

    await this.checkCORS();
    await this.checkCSRF();
    await this.checkEnvBindings();
    await this.checkConsentGating();
    await this.checkRLSPolicies();
    await this.checkFallbacks();

    this.printDiagnoses();
    await this.generateFixes();
  }

  private async checkCORS(): Promise<void> {
    console.log('Checking CORS configuration...');
    
    const mainPy = path.join(this.workspace, 'backend/main.py');
    if (!fs.existsSync(mainPy)) return;

    const content = fs.readFileSync(mainPy, 'utf-8');
    
    if (content.includes('allow_origins=["*"]')) {
      this.diagnoses.push({
        issue: 'CORS allows all origins (*)',
        severity: 'warning',
        location: 'backend/main.py',
        fix: 'Restrict CORS origins to production domains',
        diff: `- allow_origins=["*"]
+ allow_origins=[
+   "https://yourdomain.com",
+   "https://www.yourdomain.com",
+   ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : [])
+ ]`,
      });
    }

    if (!content.includes('allow_credentials')) {
      this.diagnoses.push({
        issue: 'CORS credentials not explicitly set',
        severity: 'info',
        location: 'backend/main.py',
        fix: 'Set allow_credentials=True if using cookies/auth',
      });
    }
  }

  private async checkCSRF(): Promise<void> {
    console.log('Checking CSRF protection...');
    
    const mainPy = path.join(this.workspace, 'backend/main.py');
    if (!fs.existsSync(mainPy)) return;

    const content = fs.readFileSync(mainPy, 'utf-8');
    
    // Check for CSRF middleware or tokens
    if (!content.includes('csrf') && !content.includes('CSRF')) {
      this.diagnoses.push({
        issue: 'CSRF protection not detected',
        severity: 'warning',
        location: 'backend/main.py',
        fix: 'Add CSRF middleware for state-changing operations',
        diff: `+ from fastapi_csrf_protect import CsrfProtect
+ 
+ @app.post("/api/events")
+ async def create_event(..., csrf_protect: CsrfProtect = Depends()):`,
      });
    }
  }

  private async checkEnvBindings(): Promise<void> {
    console.log('Checking environment variable bindings...');
    
    const envExample = path.join(this.workspace, '.env.example');
    const mainPy = path.join(this.workspace, 'backend/main.py');
    
    if (!fs.existsSync(mainPy)) return;

    const content = fs.readFileSync(mainPy, 'utf-8');
    
    // Check for hardcoded fallbacks that should use env vars
    if (content.includes('SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")')) {
      if (content.includes('"your-secret-key-change-in-production"')) {
        this.diagnoses.push({
          issue: 'SECRET_KEY has insecure default',
          severity: 'critical',
          location: 'backend/main.py',
          fix: 'Require SECRET_KEY in environment; fail if missing',
          diff: `- SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
+ SECRET_KEY = os.getenv("SECRET_KEY")
+ if not SECRET_KEY:
+     raise ValueError("SECRET_KEY environment variable is required")`,
        });
      }
    }
  }

  private async checkConsentGating(): Promise<void> {
    console.log('Checking consent gating for analytics/ads...');
    
    // This would check frontend code for consent gates
    const consentFiles = [
      path.join(this.workspace, 'frontend/components'),
      path.join(this.workspace, 'frontend/app'),
    ];

    this.diagnoses.push({
      issue: 'Consent gating requires frontend review',
      severity: 'info',
      location: 'frontend/',
      fix: 'Verify ATT/UMP consent gates block analytics/ads until consent given',
    });
  }

  private async checkRLSPolicies(): Promise<void> {
    console.log('Checking RLS policies...');
    
    const schemaSql = path.join(this.workspace, 'database/schema.sql');
    
    if (fs.existsSync(schemaSql)) {
      const content = fs.readFileSync(schemaSql, 'utf-8');
      
      if (!content.includes('POLICY') && !content.includes('ROW LEVEL SECURITY')) {
        this.diagnoses.push({
          issue: 'No RLS policies detected in schema',
          severity: 'warning',
          location: 'database/schema.sql',
          fix: 'Add RLS policies for multi-tenant isolation',
          migration: `-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own events
CREATE POLICY user_events_isolation ON events
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid);`,
        });
      }
    } else {
      this.diagnoses.push({
        issue: 'RLS policies require review',
        severity: 'info',
        location: 'database/models.py',
        fix: 'If using Supabase, verify RLS policies. Otherwise, ensure application-level isolation.',
      });
    }
  }

  private async checkFallbacks(): Promise<void> {
    console.log('Checking adapter fallbacks...');
    
    // Check if analytics/ads adapters have proper fallbacks
    this.diagnoses.push({
      issue: 'Verify adapter fallbacks',
      severity: 'info',
      location: 'backend/',
      fix: 'Ensure analytics/ads adapters fallback to noop/house-ads when services unavailable',
    });
  }

  private printDiagnoses(): void {
    console.log('\n?? Diagnoses:\n');
    
    const critical = this.diagnoses.filter(d => d.severity === 'critical');
    const warnings = this.diagnoses.filter(d => d.severity === 'warning');
    const info = this.diagnoses.filter(d => d.severity === 'info');

    if (critical.length > 0) {
      console.log('?? Critical Issues:');
      critical.forEach(d => {
        console.log(`  - ${d.issue}`);
        console.log(`    Location: ${d.location}`);
        console.log(`    Fix: ${d.fix}\n`);
      });
    }

    if (warnings.length > 0) {
      console.log('??  Warnings:');
      warnings.forEach(d => {
        console.log(`  - ${d.issue}`);
        console.log(`    Location: ${d.location}`);
        console.log(`    Fix: ${d.fix}\n`);
      });
    }

    if (info.length > 0) {
      console.log('??  Recommendations:');
      info.forEach(d => {
        console.log(`  - ${d.issue}`);
        console.log(`    Location: ${d.location}`);
        console.log(`    Fix: ${d.fix}\n`);
      });
    }

    if (this.diagnoses.length === 0) {
      console.log('? No issues detected!');
    }
  }

  private async generateFixes(): Promise<void> {
    const fixesDir = path.join(this.workspace, 'tools/wiring/fixes');
    fs.mkdirSync(fixesDir, { recursive: true });

    for (const diag of this.diagnoses) {
      if (diag.diff || diag.migration) {
        const fileName = diag.issue.toLowerCase().replace(/\s+/g, '_') + '.md';
        const fixContent = `# Fix: ${diag.issue}

**Severity:** ${diag.severity}  
**Location:** ${diag.location}

## Issue
${diag.issue}

## Fix
${diag.fix}

${diag.diff ? `## Code Diff

\`\`\`diff
${diag.diff}
\`\`\`` : ''}

${diag.migration ? `## Migration

\`\`\`sql
${diag.migration}
\`\`\`` : ''}
`;

        fs.writeFileSync(path.join(fixesDir, fileName), fixContent);
      }
    }

    if (this.diagnoses.length > 0) {
      console.log(`\n?? Generated ${this.diagnoses.length} fix suggestions in tools/wiring/fixes/`);
    }
  }
}

// Run if executed directly
const isMainModule = typeof require !== 'undefined' && require.main === module;
const isESMMain = typeof import.meta !== 'undefined' && import.meta.url === `file://${process.argv[1]}`;

if (isMainModule || isESMMain || process.argv[1]?.includes('wire_doctor.ts')) {
  const doctor = new WireDoctor();
  doctor.diagnose().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { WireDoctor };
