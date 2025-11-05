#!/usr/bin/env tsx
/**
 * Security Self-Check Script — Hardonia
 * Runs common integrity and configuration checks for Supabase, Prisma, and CI.
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

/**
 * Check environment variables
 */
function checkEnv() {
  console.log("\n📋 Checking environment variables...\n");
  
  const required = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY", 
    "DATABASE_URL"
  ];
  
  const optional = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "ENCRYPTION_KEY"
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
    { key: "JWT_SECRET", patterns: ["CHANGE_ME", "change_me", "secret", "default"] },
    { key: "ENCRYPTION_KEY", patterns: ["CHANGE_ME", "change_me", "secret", "default"] },
    { key: "DATABASE_URL", patterns: ["localhost", "USERNAME", "PASSWORD"] }
  ];
  
  weakSecrets.forEach(({ key, patterns }) => {
    const value = process.env[key];
    if (value) {
      const isWeak = patterns.some(pattern => 
        value.toLowerCase().includes(pattern.toLowerCase())
      ) || (key.includes("SECRET") && value.length < 32);
      
      if (isWeak) {
        logWarning(`${key} appears to be a default or weak value. Use a strong, random value in production.`);
      }
    }
  });
  
  // Check optional variables
  const missingOptional = optional.filter((k) => !process.env[k]);
  if (missingOptional.length) {
    logWarning(`Optional variables not set: ${missingOptional.join(", ")}`);
  }
}

/**
 * Check Content Security Policy (CSP)
 */
function checkCSP() {
  console.log("\n🛡️  Checking Content Security Policy...\n");
  
  const cspPaths = [
    "./frontend/public/_headers",
    "./public/_headers",
    "./vercel.json",
    "./frontend/next.config.js"
  ];
  
  let cspFound = false;
  
  for (const cspPath of cspPaths) {
    const fullPath = path.resolve(process.cwd(), cspPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      
      if (content.includes("Content-Security-Policy") || content.includes("content-security-policy")) {
        logSuccess(`CSP policy found in ${cspPath}`);
        cspFound = true;
        
        // Check for basic CSP directives
        const requiredDirectives = ["default-src", "script-src"];
        const missingDirectives = requiredDirectives.filter(dir => 
          !content.toLowerCase().includes(dir.toLowerCase())
        );
        
        if (missingDirectives.length === 0) {
          logSuccess("CSP includes essential directives");
        } else {
          logWarning(`CSP may be missing directives: ${missingDirectives.join(", ")}`);
        }
        break;
      }
    }
  }
  
  if (!cspFound) {
    logWarning("No CSP policy found. Add strict CSP to /frontend/public/_headers or vercel.json");
    logInfo("Example: Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline';");
  }
}

/**
 * Check Prisma schema and configuration
 */
function checkPrisma() {
  console.log("\n🗄️  Checking Prisma configuration...\n");
  
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  
  if (!fs.existsSync(schemaPath)) {
    logError("Prisma schema not found at prisma/schema.prisma");
    return;
  }
  
  logSuccess("Prisma schema file found");
  
  // Check schema for security-related configurations
  const schemaContent = fs.readFileSync(schemaPath, "utf8");
  
  // Check for Row Level Security (RLS) mentions or patterns
  if (schemaContent.includes("RLS") || schemaContent.includes("row level security")) {
    logSuccess("Schema mentions Row Level Security");
  } else {
    logWarning("Consider documenting RLS policies in schema comments");
  }
  
  // Check for sensitive fields that should be indexed
  const sensitiveFields = ["email", "password", "token"];
  const hasSensitiveFields = sensitiveFields.some(field => 
    schemaContent.toLowerCase().includes(field)
  );
  
  if (hasSensitiveFields) {
    logInfo("Schema contains sensitive fields - ensure proper indexing and RLS policies");
  }
}

/**
 * Run Prisma validation commands
 */
function runPrismaChecks() {
  console.log("\n🔍 Running Prisma validation...\n");
  
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
        cwd: process.cwd()
      });
      
      // Show first few lines of output
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
  console.log("\n🔐 Checking security configurations...\n");
  
  const securityFiles = [
    { path: ".env.example", required: true, description: "Environment variables template" },
    { path: "SECURITY.md", required: false, description: "Security documentation" },
    { path: "backend/security.py", required: false, description: "Security module" },
    { path: "backend/rbac.py", required: false, description: "RBAC implementation" },
    { path: "backend/audit.py", required: false, description: "Audit logging" }
  ];
  
  for (const { path: filePath, required, description } of securityFiles) {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      logSuccess(`${description} found`);
    } else if (required) {
      logWarning(`${description} not found at ${filePath}`);
    }
  }
  
  // Check for .gitignore excluding sensitive files
  const gitignorePath = path.resolve(process.cwd(), ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    const sensitivePatterns = [".env", ".env.local", "*.key", "*.pem"];
    const missingPatterns = sensitivePatterns.filter(pattern => 
      !gitignoreContent.includes(pattern.replace("*", ""))
    );
    
    if (missingPatterns.length === 0) {
      logSuccess(".gitignore excludes sensitive files");
    } else {
      logWarning(`Consider adding to .gitignore: ${missingPatterns.join(", ")}`);
    }
  }
}

/**
 * Check CI/CD configuration
 */
function checkCICD() {
  console.log("\n🚀 Checking CI/CD configuration...\n");
  
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
  console.log("🔒 Hardonia Security Self-Check\n");
  console.log("================================\n");
  
  try {
    checkEnv();
    checkCSP();
    checkPrisma();
    checkSecurityFiles();
    checkCICD();
    runPrismaChecks();
    
    console.log("\n" + "=".repeat(32));
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
