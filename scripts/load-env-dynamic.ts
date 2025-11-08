#!/usr/bin/env tsx
/**
 * Dynamic Environment Variable Loader
 * 
 * Loads environment variables from multiple sources in priority order:
 * 1. Process environment (already loaded)
 * 2. GitHub Secrets (via GITHUB_TOKEN)
 * 3. Vercel Environment Variables (via VERCEL_TOKEN)
 * 4. Supabase Environment Variables (via SUPABASE_ACCESS_TOKEN)
 * 5. Local .env file
 * 
 * This ensures all configuration is pulled dynamically at runtime.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EnvSource {
  name: string;
  load: () => Promise<Record<string, string>>;
}

/**
 * Load from local .env file
 */
async function loadFromEnvFile(): Promise<Record<string, string>> {
  const envPath = path.join(__dirname, '..', '.env');
  const env: Record<string, string> = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          env[key.trim()] = value.trim();
        }
      }
    }
  }
  
  return env;
}

/**
 * Load from GitHub Secrets (requires GITHUB_TOKEN)
 */
async function loadFromGitHub(): Promise<Record<string, string>> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY || process.env.GITHUB_REPO;
  
  if (!token || !repo) {
    return {};
  }
  
  try {
    // GitHub Secrets API requires GitHub Actions context
    // For local/CI use, we'll rely on environment variables being set
    // This is a placeholder for the concept
    console.log('  📦 GitHub Secrets: Available via GITHUB_TOKEN');
    return {};
  } catch (error) {
    console.warn('  ⚠️  Could not load GitHub Secrets:', error);
    return {};
  }
}

/**
 * Load from Vercel Environment Variables (requires VERCEL_TOKEN)
 */
async function loadFromVercel(): Promise<Record<string, string>> {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  
  if (!token) {
    return {};
  }
  
  try {
    // Vercel API to fetch environment variables
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };
    
    let url = 'https://api.vercel.com/v9/projects';
    if (projectId) {
      url += `/${projectId}/env`;
    } else {
      url += `/${process.env.VERCEL_PROJECT_NAME || 'floyo'}/env`;
    }
    
    if (teamId) {
      url += `?teamId=${teamId}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (response.ok) {
      const data = await response.json();
      const env: Record<string, string> = {};
      
      if (data.envs && Array.isArray(data.envs)) {
        for (const envVar of data.envs) {
          if (envVar.key && envVar.value) {
            env[envVar.key] = envVar.value;
          }
        }
      }
      
      console.log(`  ✅ Loaded ${Object.keys(env).length} variables from Vercel`);
      return env;
    }
  } catch (error) {
    console.warn('  ⚠️  Could not load Vercel env vars:', error);
  }
  
  return {};
}

/**
 * Load from Supabase Environment Variables
 */
async function loadFromSupabase(): Promise<Record<string, string>> {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  
  if (!accessToken || !projectRef) {
    return {};
  }
  
  try {
    // Supabase Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/env`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const env: Record<string, string> = {};
      
      // Supabase returns env vars in a specific format
      if (data.env && typeof data.env === 'object') {
        Object.assign(env, data.env);
      }
      
      console.log(`  ✅ Loaded ${Object.keys(env).length} variables from Supabase`);
      return env;
    }
  } catch (error) {
    console.warn('  ⚠️  Could not load Supabase env vars:', error);
  }
  
  return {};
}

/**
 * Load all environment variables from all sources
 */
export async function loadEnvironmentVariables(): Promise<Record<string, string>> {
  console.log('🔍 Loading environment variables from multiple sources...\n');
  
  const sources: EnvSource[] = [
    { name: 'Process Environment', load: async () => ({ ...process.env }) },
    { name: 'GitHub Secrets', load: loadFromGitHub },
    { name: 'Vercel Environment', load: loadFromVercel },
    { name: 'Supabase Environment', load: loadFromSupabase },
    { name: 'Local .env File', load: loadFromEnvFile },
  ];
  
  const allEnv: Record<string, string> = {};
  
  // Load in reverse order so earlier sources override later ones
  for (let i = sources.length - 1; i >= 0; i--) {
    const source = sources[i];
    console.log(`📦 Loading from ${source.name}...`);
    
    try {
      const env = await source.load();
      Object.assign(allEnv, env);
    } catch (error: any) {
      console.warn(`  ⚠️  Error loading from ${source.name}:`, error.message);
    }
  }
  
  // Set in process.env for runtime use
  for (const [key, value] of Object.entries(allEnv)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  
  console.log(`\n✅ Loaded ${Object.keys(allEnv).length} total environment variables`);
  
  return allEnv;
}

/**
 * Get a specific environment variable from all sources
 */
export async function getEnvVar(
  key: string,
  defaultValue?: string
): Promise<string> {
  await loadEnvironmentVariables();
  return process.env[key] || defaultValue || '';
}

/**
 * Validate required environment variables
 */
export async function validateRequiredEnvVars(
  required: string[]
): Promise<{ valid: boolean; missing: string[] }> {
  await loadEnvironmentVariables();
  
  const missing: string[] = [];
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnvironmentVariables()
    .then((env) => {
      console.log('\n📋 Environment Variables Summary:');
      console.log('='.repeat(60));
      
      const keys = Object.keys(env).sort();
      for (const key of keys) {
        const value = env[key];
        const displayValue = key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')
          ? '*'.repeat(Math.min(value.length, 20))
          : value;
        console.log(`${key}=${displayValue}`);
      }
      
      console.log('='.repeat(60));
    })
    .catch((error) => {
      console.error('❌ Error loading environment variables:', error);
      process.exit(1);
    });
}

export { loadFromEnvFile, loadFromGitHub, loadFromVercel, loadFromSupabase };
