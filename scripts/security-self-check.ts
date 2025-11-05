#!/usr/bin/env tsx
/**
 * Security Self-Check Script — Hardonia
 * Comprehensive security validation for Supabase, Prisma, CI/CD, and infrastructure.
 * 
 * Usage:
 *   npm run security:check
 *   or
 *   tsx scripts/security-self-check.ts
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

// Load environment variables from .env file
config();

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
let exitCode = EXIT_SUCCESS;

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logWarning(message: string) {
  console.warn(`⚠️  ${message}`);
}

function logError(message: string) {
  console.error(`❌ ${message}`);
  exitCode = EXIT_FAILURE;
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

function logSection(title: string) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`📋 ${title}`);
  console.log("─".repeat(50) + "\n");
}

/**
 * Check environment variables with enhanced validation
 */
function checkEnv() {
  logSection("Environment Variables");
  
  const required = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY", 
    "DATABASE_URL"
  ];
  
  const requiredProduction = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "ENCRYPTION_KEY"
  ];
  
  const optional = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SENTRY_DSN",
    "REDIS_URL",
    "STRIPE_SECRET_KEY"
  ];
  
  const missing = required.filter((k) => !process.env[k]);
  
  if (missing.length) {
    logError(`Missing required environment variables: ${missing.join(", ")}`);
    logInfo("Set these in your .env file or environment");
  } else {
    logSuccess("Required environment variables are set");
  }
  
  // Check for weak/default secrets
  const weakSecrets = [
    { 
      key: "JWT_SECRET", 
      patterns: ["CHANGE_ME", "change_me", "secret", "default", "floyo"],
      minLength: 32
    },
    { 
      key: "ENCRYPTION_KEY", 
      patterns: ["CHANGE_ME", "change_me", "secret", "default"],
      minLength: 32
    },
    { 
      key: "DATABASE_URL", 
      patterns: ["USERNAME", "PASSWORD", "localhost"],
      minLength: 0
    },
    { 
      key: "SUPABASE_SERVICE_ROLE_KEY", 
      patterns: ["your-service-role-key", "example"],
      minLength: 50
    }
  ];
  
  weakSecrets.forEach(({ key, patterns, minLength }) => {
    const value = process.env[key];
    if (value) {
      const isWeak = patterns.some(pattern => 
        value.toLowerCase().includes(pattern.toLowerCase())
      ) || (minLength > 0 && value.length < minLength);
      
      if (isWeak) {
        logWarning(`${key} appears to be a default or weak value. Use a strong, random value in production.`);
      } else {
        logSuccess(`${key} appears to be configured`);
      }
    } else if (requiredProduction.includes(key)) {
      const env = process.env.NODE_ENV || process.env.ENVIRONMENT || "development";
      if (env === "production") {
        logError(`${key} is required in production but not set`);
      } else {
        logWarning(`${key} not set (required in production)`);
      }
    }
  });
  
  // Check database URL security
  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl && !dbUrl.includes("sslmode=require") && !dbUrl.includes("?ssl=true")) {
    logWarning("DATABASE_URL should use SSL/TLS (add ?sslmode=require or ?ssl=true)");
  } else if (dbUrl && (dbUrl.includes("sslmode=require") || dbUrl.includes("?ssl=true"))) {
    logSuccess("Database connection uses SSL/TLS");
  }
  
  // Check optional variables
  const missingOptional = optional.filter((k) => !process.env[k]);
  if (missingOptional.length) {
    logWarning(`Optional variables not set: ${missingOptional.join(", ")}`);
  }
}

/**
 * Enhanced CSP validation with strictness checks
 */
function checkCSP() {
  logSection("Content Security Policy (CSP)");
  
  const cspPaths = [
    "./frontend/public/_headers",
    "./public/_headers",
    "./vercel.json",
    "./frontend/next.config.js",
    "./backend/security.py"
  ];
  
  let cspFound = false;
  let cspContent = "";
  
  for (const cspPath of cspPaths) {
    const fullPath = path.resolve(process.cwd(), cspPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      
      if (content.includes("Content-Security-Policy") || content.includes("content-security-policy")) {
        logSuccess(`CSP policy found in ${cspPath}`);
        cspFound = true;
        cspContent = content;
        
        // Extract CSP policy
        const cspMatch = content.match(/Content-Security-Policy[:\s]+([^;]+)/i);
        if (cspMatch) {
          const csp = cspMatch[1];
          
          // Check for unsafe directives
          const unsafePatterns = ["'unsafe-inline'", "'unsafe-eval'", "*"];
          const unsafeFound = unsafePatterns.filter(pattern => csp.includes(pattern));
          
          if (unsafeFound.length > 0) {
            logWarning(`CSP contains unsafe directives: ${unsafeFound.join(", ")}`);
          }
          
          // Check for essential directives
          const requiredDirectives = ["default-src", "script-src"];
          const missingDirectives = requiredDirectives.filter(dir => 
            !csp.toLowerCase().includes(dir.toLowerCase())
          );
          
          if (missingDirectives.length === 0) {
            logSuccess("CSP includes essential directives");
          } else {
            logWarning(`CSP may be missing directives: ${missingDirectives.join(", ")}`);
          }
          
          // Check for strict directives
          if (csp.includes("'self'") && !csp.includes("*")) {
            logSuccess("CSP uses 'self' directive (good practice)");
          }
        }
        break;
      }
    }
  }
  
  if (!cspFound) {
    logWarning("No CSP policy found. Add strict CSP to /frontend/public/_headers or vercel.json");
    logInfo("Example: Content-Security-Policy: default-src 'self'; script-src 'self';");
  }
  
  // Check security headers in security.py
  const securityPyPath = path.resolve(process.cwd(), "backend/security.py");
  if (fs.existsSync(securityPyPath)) {
    const content = fs.readFileSync(securityPyPath, "utf8");
    const securityHeaders = [
      "Strict-Transport-Security",
      "X-Frame-Options",
      "X-Content-Type-Options",
      "X-XSS-Protection",
      "Referrer-Policy",
      "Permissions-Policy"
    ];
    
    const foundHeaders = securityHeaders.filter(header => content.includes(header));
    if (foundHeaders.length === securityHeaders.length) {
      logSuccess("Security headers middleware configured");
    } else {
      logWarning(`Missing security headers: ${securityHeaders.filter(h => !foundHeaders.includes(h)).join(", ")}`);
    }
  }
}

/**
 * Check Supabase RLS policies in migrations
 */
function checkRLSPolicies() {
  logSection("Row Level Security (RLS) Policies");
  
  const migrationPaths = [
    "./supabase/migrations",
    "./database/schema.sql"
  ];
  
  let rlsFound = false;
  let policyCount = 0;
  
  for (const migrationPath of migrationPaths) {
    const fullPath = path.resolve(process.cwd(), migrationPath);
    
    if (fs.existsSync(fullPath)) {
      if (fs.statSync(fullPath).isDirectory()) {
        // Check all SQL files in migrations directory
        const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.sql'));
        for (const file of files) {
          const filePath = path.join(fullPath, file);
          const content = fs.readFileSync(filePath, "utf8");
          
          if (content.includes("ENABLE ROW LEVEL SECURITY") || content.includes("ENABLE RLS")) {
            rlsFound = true;
            const policies = (content.match(/CREATE POLICY/gi) || []).length;
            policyCount += policies;
            
            if (policies > 0) {
              logSuccess(`Found ${policies} RLS policies in ${file}`);
            }
          }
        }
      } else {
        const content = fs.readFileSync(fullPath, "utf8");
        if (content.includes("ENABLE ROW LEVEL SECURITY") || content.includes("ENABLE RLS")) {
          rlsFound = true;
          const policies = (content.match(/CREATE POLICY/gi) || []).length;
          policyCount += policies;
          
          if (policies > 0) {
            logSuccess(`Found ${policies} RLS policies in schema`);
          }
        }
      }
    }
  }
  
  if (rlsFound && policyCount > 0) {
    logSuccess(`RLS is enabled with ${policyCount} policies`);
  } else {
    logError("RLS policies not found in migrations. Ensure RLS is enabled on all tables.");
    logInfo("See supabase/migrations/20240101000000_initial_schema.sql for examples");
  }
  
  // Check for RLS validation queries
  const validationPath = path.resolve(process.cwd(), "supabase/migrations/20240101000001_validation_queries.sql");
  if (fs.existsSync(validationPath)) {
    logSuccess("RLS validation queries found");
  } else {
    logWarning("RLS validation queries not found. Consider adding validation queries.");
  }
}

/**
 * Check Prisma schema and configuration
 */
function checkPrisma() {
  logSection("Prisma Configuration");
  
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  
  if (!fs.existsSync(schemaPath)) {
    logError("Prisma schema not found at prisma/schema.prisma");
    return;
  }
  
  logSuccess("Prisma schema file found");
  
  const schemaContent = fs.readFileSync(schemaPath, "utf8");
  
  // Check for sensitive fields that should be indexed
  const sensitiveFields = ["email", "password", "token", "userId"];
  const hasSensitiveFields = sensitiveFields.some(field => 
    schemaContent.toLowerCase().includes(field.toLowerCase())
  );
  
  if (hasSensitiveFields) {
    logInfo("Schema contains sensitive fields - ensure proper indexing and RLS policies");
  }
  
  // Check for indexes on foreign keys
  const foreignKeyPattern = /@@index\(\[.*userId.*\]\)/gi;
  if (foreignKeyPattern.test(schemaContent)) {
    logSuccess("Foreign key indexes found in schema");
  } else {
    logWarning("Consider adding indexes on foreign keys for performance");
  }
}

/**
 * Check rate limiting configuration
 */
function checkRateLimiting() {
  logSection("Rate Limiting Configuration");
  
  const rateLimitPath = path.resolve(process.cwd(), "backend/rate_limit.py");
  
  if (!fs.existsSync(rateLimitPath)) {
    logWarning("Rate limiting module not found");
    return;
  }
  
  logSuccess("Rate limiting module found");
  
  const content = fs.readFileSync(rateLimitPath, "utf8");
  
  // Check for rate limit configurations
  if (content.includes("RATE_LIMIT_PER_MINUTE") || content.includes("RATE_LIMIT_PER_HOUR")) {
    logSuccess("Rate limiting configuration found");
  }
  
  // Check for endpoint-specific limits
  if (content.includes("auth") && content.includes("login")) {
    logSuccess("Auth endpoint rate limits configured");
  }
  
  // Check for Redis usage
  if (content.includes("redis") || content.includes("Redis")) {
    logSuccess("Rate limiting uses Redis (production-ready)");
  } else {
    logWarning("Rate limiting may use in-memory storage (not recommended for production)");
  }
}

/**
 * Check CORS configuration
 */
function checkCORS() {
  logSection("CORS Configuration");
  
  const configPath = path.resolve(process.cwd(), "backend/config.py");
  
  if (!fs.existsSync(configPath)) {
    logWarning("Config file not found");
    return;
  }
  
  const content = fs.readFileSync(configPath, "utf8");
  
  // Check for CORS validation
  if (content.includes("cors_origins")) {
    logSuccess("CORS configuration found");
    
    // Check for wildcard in production
    if (content.includes("*") && content.includes("production")) {
      logError("CORS origins cannot be '*' in production");
    } else {
      logSuccess("CORS validation prevents wildcard in production");
    }
  } else {
    logWarning("CORS configuration not found");
  }
}

/**
 * Check MFA/2FA configuration
 */
function checkMFA() {
  logSection("Multi-Factor Authentication (MFA)");
  
  const securityPath = path.resolve(process.cwd(), "backend/security.py");
  
  if (!fs.existsSync(securityPath)) {
    logWarning("Security module not found");
    return;
  }
  
  const content = fs.readFileSync(securityPath, "utf8");
  
  if (content.includes("TwoFactorAuth") || content.includes("TOTP") || content.includes("MFA")) {
    logSuccess("MFA/2FA implementation found");
    
    if (content.includes("pyotp")) {
      logSuccess("TOTP implementation using pyotp");
    }
    
    if (content.includes("backup_codes")) {
      logSuccess("Backup codes implementation found");
    }
  } else {
    logWarning("MFA/2FA implementation not found");
  }
  
  // Check Prisma schema for MFA tables
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, "utf8");
    if (schemaContent.includes("mfaRequired") || schemaContent.includes("MfaEnforcedSession")) {
      logSuccess("MFA fields found in database schema");
    }
  }
}

/**
 * Check audit logging configuration
 */
function checkAuditLogging() {
  logSection("Audit Logging");
  
  const auditPath = path.resolve(process.cwd(), "backend/audit.py");
  
  if (!fs.existsSync(auditPath)) {
    logWarning("Audit logging module not found");
    return;
  }
  
  logSuccess("Audit logging module found");
  
  const content = fs.readFileSync(auditPath, "utf8");
  
  // Check for IP address and user agent logging
  if (content.includes("ip_address") && content.includes("user_agent")) {
    logSuccess("Audit logs include IP address and user agent");
  }
  
  // Check Prisma schema for audit logs table
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, "utf8");
    if (schemaContent.includes("AuditLog") || schemaContent.includes("audit_logs")) {
      logSuccess("Audit logs table found in schema");
    }
  }
}

/**
 * Check data retention policies
 */
function checkDataRetention() {
  logSection("Data Retention Policies");
  
  const retentionPath = path.resolve(process.cwd(), "backend/data_retention.py");
  
  if (!fs.existsSync(retentionPath)) {
    logWarning("Data retention module not found");
    return;
  }
  
  logSuccess("Data retention module found");
  
  const content = fs.readFileSync(retentionPath, "utf8");
  
  // Check for retention policy configuration
  if (content.includes("DataRetentionPolicy") || content.includes("retention_days")) {
    logSuccess("Data retention policies configured");
    
    // Check for compliance retention (7 years for audit logs)
    if (content.includes("2555") || content.includes("7 years")) {
      logSuccess("Audit logs retention set for compliance (7 years)");
    }
  }
  
  // Check Prisma schema for retention policies table
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, "utf8");
    if (schemaContent.includes("RetentionPolicy") || schemaContent.includes("retention_policies")) {
      logSuccess("Retention policies table found in schema");
    }
  }
}

/**
 * Check session security
 */
function checkSessionSecurity() {
  logSection("Session Security");
  
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  
  if (!fs.existsSync(schemaPath)) {
    return;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, "utf8");
  
  // Check for session expiration
  if (schemaContent.includes("expiresAt") || schemaContent.includes("expires_at")) {
    logSuccess("Session expiration found in schema");
  }
  
  // Check for secure session token storage
  if (schemaContent.includes("token") && schemaContent.includes("unique")) {
    logSuccess("Session tokens are unique");
  }
  
  // Check for session cleanup
  const retentionPath = path.resolve(process.cwd(), "backend/data_retention.py");
  if (fs.existsSync(retentionPath)) {
    const content = fs.readFileSync(retentionPath, "utf8");
    if (content.includes("cleanup_old_sessions")) {
      logSuccess("Session cleanup function found");
    }
  }
}

/**
 * Check for dependency vulnerabilities
 */
function checkDependencies() {
  logSection("Dependency Security");
  
  // Check npm audit
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      logInfo("Running npm audit...");
      const output = execSync("npm audit --json", { 
        stdio: "pipe",
        encoding: "utf-8",
        cwd: process.cwd(),
        timeout: 30000
      });
      
      const audit = JSON.parse(output);
      const vulnerabilities = audit.vulnerabilities || {};
      const criticalCount = Object.values(vulnerabilities).filter((v: any) => v.severity === "critical").length;
      const highCount = Object.values(vulnerabilities).filter((v: any) => v.severity === "high").length;
      
      if (criticalCount > 0) {
        logError(`Found ${criticalCount} critical vulnerabilities`);
      } else if (highCount > 0) {
        logWarning(`Found ${highCount} high severity vulnerabilities`);
      } else {
        logSuccess("No critical or high severity vulnerabilities found");
      }
    } catch (error: any) {
      // npm audit might fail if there are vulnerabilities
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          const vulnerabilities = audit.vulnerabilities || {};
          const criticalCount = Object.values(vulnerabilities).filter((v: any) => v.severity === "critical").length;
          if (criticalCount > 0) {
            logError(`Found ${criticalCount} critical vulnerabilities`);
          }
        } catch {
          logWarning("Could not parse npm audit output");
        }
      } else {
        logWarning("npm audit not available or failed");
      }
    }
  }
  
  // Check Python dependencies if requirements.txt exists
  const requirementsPath = path.resolve(process.cwd(), "requirements.txt");
  if (fs.existsSync(requirementsPath)) {
    logInfo("Python dependencies found (consider running: pip-audit or safety check)");
  }
}

/**
 * Check for hardcoded secrets
 */
function checkSecrets() {
  logSection("Secrets Scanning");
  
  const secretPatterns = [
    /password\s*=\s*["'][^"']{8,}["']/gi,
    /secret\s*=\s*["'][^"']{8,}["']/gi,
    /api[_-]?key\s*=\s*["'][^"']{8,}["']/gi,
    /token\s*=\s*["'][^"']{8,}["']/gi,
    /sk_live_[a-zA-Z0-9]{32,}/gi,
    /sk_test_[a-zA-Z0-9]{32,}/gi,
    /AIza[0-9A-Za-z\\-_]{35}/gi, // Google API key
  ];
  
  const codePaths = [
    "./backend",
    "./frontend/app",
    "./scripts"
  ];
  
  let secretsFound = false;
  
  for (const codePath of codePaths) {
    const fullPath = path.resolve(process.cwd(), codePath);
    if (!fs.existsSync(fullPath)) continue;
    
    const files = getAllFiles(fullPath, [".py", ".ts", ".tsx", ".js", ".jsx"]);
    
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          // Skip if it's clearly a placeholder or example
          if (!content.includes("CHANGE_ME") && 
              !content.includes("your-") && 
              !content.includes("example") &&
              !content.includes("TODO")) {
            logWarning(`Potential hardcoded secret found in ${path.relative(process.cwd(), file)}`);
            secretsFound = true;
            break;
          }
        }
      }
    }
  }
  
  if (!secretsFound) {
    logSuccess("No obvious hardcoded secrets found");
  }
}

/**
 * Helper: Get all files recursively
 */
function getAllFiles(dirPath: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dirPath)) return files;
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    
    // Skip node_modules and other common exclusions
    if (item === "node_modules" || item === ".git" || item === ".next" || item === "__pycache__") {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, extensions));
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Check Docker security
 */
function checkDockerSecurity() {
  logSection("Docker Security");
  
  const dockerfiles = [
    "./Dockerfile.backend",
    "./Dockerfile.frontend"
  ];
  
  for (const dockerfile of dockerfiles) {
    const fullPath = path.resolve(process.cwd(), dockerfile);
    
    if (!fs.existsSync(fullPath)) continue;
    
    logInfo(`Checking ${dockerfile}...`);
    const content = fs.readFileSync(fullPath, "utf8");
    
    // Check for non-root user
    if (content.includes("USER ") && !content.includes("USER root")) {
      logSuccess(`${dockerfile} uses non-root user`);
    } else {
      logWarning(`${dockerfile} should use non-root user`);
    }
    
    // Check for .dockerignore
    const dockerignorePath = path.resolve(process.cwd(), ".dockerignore");
    if (fs.existsSync(dockerignorePath)) {
      logSuccess(".dockerignore found");
    } else {
      logWarning(".dockerignore not found (should exclude .env, .git, etc.)");
    }
    
    // Check for multi-stage builds
    if ((content.match(/^FROM/gi) || []).length > 1) {
      logSuccess(`${dockerfile} uses multi-stage build`);
    }
    
    // Check for apt-get cleanup
    if (content.includes("apt-get") && content.includes("rm -rf")) {
      logSuccess(`${dockerfile} cleans up apt cache`);
    }
  }
}

/**
 * Check Git security
 */
function checkGitSecurity() {
  logSection("Git Security");
  
  // Check .gitignore
  const gitignorePath = path.resolve(process.cwd(), ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    const sensitivePatterns = [".env", ".env.local", ".key", ".pem", ".p12", "*.key", "*.pem"];
    const missingPatterns = sensitivePatterns.filter(pattern => 
      !gitignoreContent.includes(pattern.replace("*", ""))
    );
    
    if (missingPatterns.length === 0) {
      logSuccess(".gitignore excludes sensitive files");
    } else {
      logWarning(`Consider adding to .gitignore: ${missingPatterns.join(", ")}`);
    }
  }
  
  // Check for pre-commit hooks
  const preCommitPath = path.resolve(process.cwd(), ".git/hooks/pre-commit");
  if (fs.existsSync(preCommitPath)) {
    logSuccess("Pre-commit hooks found");
  } else {
    logInfo("Pre-commit hooks not found (consider adding husky or similar)");
  }
  
  // Check for .env files in git
  try {
    const gitFiles = execSync("git ls-files | grep -E '\\.env$|\\.env\\.'", { 
      stdio: "pipe",
      encoding: "utf-8",
      cwd: process.cwd()
    }).toString().trim();
    
    if (gitFiles) {
      logError("Environment files found in git repository:");
      gitFiles.split("\n").forEach(file => logError(`  - ${file}`));
    } else {
      logSuccess("No .env files tracked in git");
    }
  } catch {
    // Git command failed, might not be a git repo or git not available
    logInfo("Could not check git tracked files");
  }
}

/**
 * Check API route security
 */
function checkAPIRouteSecurity() {
  logSection("API Route Security");
  
  const apiPaths = [
    "./frontend/app/api",
    "./backend/api_v1.py"
  ];
  
  let routesChecked = 0;
  let routesWithAuth = 0;
  
  for (const apiPath of apiPaths) {
    const fullPath = path.resolve(process.cwd(), apiPath);
    
    if (!fs.existsSync(fullPath)) continue;
    
    const files = getAllFiles(fullPath, [".ts", ".tsx", ".py"]);
    
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      
      // Skip test files
      if (file.includes(".test.") || file.includes(".spec.")) continue;
      
      routesChecked++;
      
      // Check for authentication
      const authPatterns = [
        /get_current_user/gi,
        /Depends\(get_current_user\)/gi,
        /require.*auth/gi,
        /isAuthenticated/gi,
        /@.*auth/gi
      ];
      
      const hasAuth = authPatterns.some(pattern => pattern.test(content));
      
      if (hasAuth) {
        routesWithAuth++;
      } else {
        // Check if it's a public route (like health check)
        const publicPatterns = [
          /health/gi,
          /status/gi,
          /public/gi
        ];
        
        const isPublic = publicPatterns.some(pattern => pattern.test(content));
        
        if (!isPublic) {
          logWarning(`API route may be missing authentication: ${path.relative(process.cwd(), file)}`);
        }
      }
    }
  }
  
  if (routesChecked > 0) {
    const authPercentage = Math.round((routesWithAuth / routesChecked) * 100);
    if (authPercentage >= 80) {
      logSuccess(`${authPercentage}% of API routes have authentication`);
    } else {
      logWarning(`Only ${authPercentage}% of API routes have authentication`);
    }
  }
}

/**
 * Check privacy compliance
 */
function checkPrivacyCompliance() {
  logSection("Privacy Compliance");
  
  // Check for privacy policy
  const privacyPaths = [
    "./docs/privacy/monitoring-policy.md",
    "./frontend/app/privacy/policy/page.tsx"
  ];
  
  let privacyFound = false;
  for (const privacyPath of privacyPaths) {
    if (fs.existsSync(path.resolve(process.cwd(), privacyPath))) {
      logSuccess(`Privacy policy found: ${privacyPath}`);
      privacyFound = true;
    }
  }
  
  if (!privacyFound) {
    logWarning("Privacy policy not found");
  }
  
  // Check for consent management
  const consentPath = path.resolve(process.cwd(), "frontend/app/api/privacy/consent/route.ts");
  if (fs.existsSync(consentPath)) {
    logSuccess("Consent management API found");
  } else {
    logWarning("Consent management API not found");
  }
  
  // Check for data export/deletion
  const exportPath = path.resolve(process.cwd(), "frontend/app/api/privacy/export/route.ts");
  const deletePath = path.resolve(process.cwd(), "frontend/app/api/privacy/delete/route.ts");
  
  if (fs.existsSync(exportPath)) {
    logSuccess("Data export API found (GDPR compliance)");
  } else {
    logWarning("Data export API not found (required for GDPR)");
  }
  
  if (fs.existsSync(deletePath)) {
    logSuccess("Data deletion API found (GDPR compliance)");
  } else {
    logWarning("Data deletion API not found (required for GDPR)");
  }
}

/**
 * Run Prisma validation commands
 */
function runPrismaChecks() {
  logSection("Prisma Validation");
  
  const commands = [
    { cmd: "npx prisma validate", description: "Validate Prisma schema" },
    { cmd: "npx prisma generate", description: "Generate Prisma client" }
  ];
  
  // Only run db pull if DATABASE_URL is set
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("USERNAME")) {
    commands.push({ cmd: "npx prisma db pull --force", description: "Pull database schema" });
  } else {
    logWarning("Skipping 'prisma db pull' - DATABASE_URL not properly configured");
  }
  
  for (const { cmd, description } of commands) {
    try {
      logInfo(`Running: ${description}`);
      const output = execSync(cmd, { 
        stdio: "pipe",
        encoding: "utf-8",
        cwd: process.cwd(),
        timeout: 30000
      });
      
      const outputLines = output.split("\n").filter(line => line.trim());
      if (outputLines.length > 0) {
        const preview = outputLines.slice(0, 5).join("\n");
        if (preview.length < 200) {
          console.log(preview);
        }
      }
      
      logSuccess(`${description} completed`);
    } catch (error: any) {
      logError(`${description} failed`);
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
      if (errorOutput) {
        console.error(errorOutput.split("\n").slice(0, 10).join("\n"));
      }
    }
  }
}

/**
 * Check for security-related files and configurations
 */
function checkSecurityFiles() {
  logSection("Security Files & Documentation");
  
  const securityFiles = [
    { path: ".env.example", required: true, description: "Environment variables template" },
    { path: "SECURITY.md", required: false, description: "Security documentation" },
    { path: "backend/security.py", required: false, description: "Security module" },
    { path: "backend/rbac.py", required: false, description: "RBAC implementation" },
    { path: "backend/audit.py", required: false, description: "Audit logging" },
    { path: "backend/rate_limit.py", required: false, description: "Rate limiting" },
    { path: "backend/data_retention.py", required: false, description: "Data retention" }
  ];
  
  for (const { path: filePath, required, description } of securityFiles) {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      logSuccess(`${description} found`);
    } else if (required) {
      logWarning(`${description} not found at ${filePath}`);
    }
  }
}

/**
 * Check CI/CD configuration
 */
function checkCICD() {
  logSection("CI/CD Configuration");
  
  const cicdPaths = [
    ".github/workflows",
    ".gitlab-ci.yml",
    "vercel.json"
  ];
  
  let cicdFound = false;
  
  for (const cicdPath of cicdPaths) {
    const fullPath = path.resolve(process.cwd(), cicdPath);
    if (fs.existsSync(fullPath)) {
      if (fs.statSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        if (files.length > 0) {
          logSuccess(`CI/CD configuration found in ${cicdPath}`);
          cicdFound = true;
          
          // Check for security checks in workflows
          const workflowFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
          for (const workflowFile of workflowFiles) {
            const workflowPath = path.join(fullPath, workflowFile);
            const content = fs.readFileSync(workflowPath, "utf8");
            if (content.includes("security") || content.includes("audit") || content.includes("lint")) {
              logSuccess(`Security checks found in ${workflowFile}`);
            }
          }
        }
      } else {
        logSuccess(`CI/CD configuration found: ${cicdPath}`);
        cicdFound = true;
      }
    }
  }
  
  if (!cicdFound) {
    logWarning("No CI/CD configuration detected. Consider adding GitHub Actions or GitLab CI");
  }
}

/**
 * Main execution
 */
function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🔒 Hardonia Security Self-Check — Comprehensive Validation");
  console.log("=".repeat(60) + "\n");
  
  try {
    checkEnv();
    checkCSP();
    checkRLSPolicies();
    checkPrisma();
    checkRateLimiting();
    checkCORS();
    checkMFA();
    checkAuditLogging();
    checkDataRetention();
    checkSessionSecurity();
    checkDependencies();
    checkSecrets();
    checkDockerSecurity();
    checkGitSecurity();
    checkAPIRouteSecurity();
    checkPrivacyCompliance();
    checkSecurityFiles();
    checkCICD();
    runPrismaChecks();
    
    console.log("\n" + "=".repeat(60));
    if (exitCode === EXIT_SUCCESS) {
      logSuccess("Security self-check completed successfully");
      console.log("\n");
    } else {
      logError("Security self-check completed with errors");
      console.log("\n");
      process.exit(EXIT_FAILURE);
    }
  } catch (error: any) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(EXIT_FAILURE);
  }
}

// Run main function
main();
