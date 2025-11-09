/**
 * Repository Context Detection
 * Identifies project type and sets dynamic operating modes
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export type RepoType = 'webapp' | 'mobile' | 'backend' | 'library' | 'monorepo';
export type OperatingMode = 'webapp' | 'mobile' | 'backend' | 'library';

export interface RepoContext {
  type: RepoType;
  modes: OperatingMode[];
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'poetry' | 'cargo';
  frameworks: string[];
  databases: string[];
  cloudProviders: string[];
  hasFrontend: boolean;
  hasBackend: boolean;
  hasMobile: boolean;
}

export class RepoContextDetector {
  private workspacePath: string;

  constructor(workspacePath: string = process.cwd()) {
    this.workspacePath = workspacePath;
  }

  /**
   * Detect repository context from manifests
   */
  detect(): RepoContext {
    const context: RepoContext = {
      type: 'monorepo',
      modes: [],
      packageManager: 'npm',
      frameworks: [],
      databases: [],
      cloudProviders: [],
      hasFrontend: false,
      hasBackend: false,
      hasMobile: false,
    };

    // Check for package.json (Node.js/TypeScript)
    const packageJsonPath = join(this.workspacePath, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        
        // Detect frameworks
        if (pkg.dependencies?.['next'] || pkg.devDependencies?.['next']) {
          context.frameworks.push('nextjs');
          context.hasFrontend = true;
          context.modes.push('webapp');
        }
        if (pkg.dependencies?.['react-native'] || pkg.dependencies?.['expo']) {
          context.frameworks.push('expo');
          context.hasMobile = true;
          context.modes.push('mobile');
        }
        if (pkg.dependencies?.['@supabase/supabase-js']) {
          context.cloudProviders.push('supabase');
        }
        if (pkg.dependencies?.['vercel'] || pkg.devDependencies?.['vercel']) {
          context.cloudProviders.push('vercel');
        }

        // Detect package manager
        if (existsSync(join(this.workspacePath, 'yarn.lock'))) {
          context.packageManager = 'yarn';
        } else if (existsSync(join(this.workspacePath, 'pnpm-lock.yaml'))) {
          context.packageManager = 'pnpm';
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Check for pyproject.toml or requirements.txt (Python)
    const pyprojectPath = join(this.workspacePath, 'pyproject.toml');
    const requirementsPath = join(this.workspacePath, 'requirements.txt');
    if (existsSync(pyprojectPath) || existsSync(requirementsPath)) {
      context.hasBackend = true;
      context.modes.push('backend');
      
      if (existsSync(pyprojectPath)) {
        try {
          const content = readFileSync(pyprojectPath, 'utf-8');
          if (content.includes('fastapi')) {
            context.frameworks.push('fastapi');
          }
          if (content.includes('flask')) {
            context.frameworks.push('flask');
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    // Check for Cargo.toml (Rust)
    const cargoPath = join(this.workspacePath, 'Cargo.toml');
    if (existsSync(cargoPath)) {
      context.packageManager = 'cargo';
      context.modes.push('library');
    }

    // Check for Prisma schema
    const prismaPath = join(this.workspacePath, 'prisma', 'schema.prisma');
    if (existsSync(prismaPath)) {
      context.databases.push('postgresql');
    }

    // Check for Supabase
    const supabasePath = join(this.workspacePath, 'supabase');
    if (existsSync(supabasePath)) {
      context.databases.push('postgresql');
      context.cloudProviders.push('supabase');
    }

    // Determine repo type
    if (context.hasFrontend && context.hasBackend && context.hasMobile) {
      context.type = 'monorepo';
    } else if (context.hasMobile && !context.hasFrontend && !context.hasBackend) {
      context.type = 'mobile';
    } else if (context.hasFrontend && !context.hasBackend) {
      context.type = 'webapp';
    } else if (context.hasBackend && !context.hasFrontend) {
      context.type = 'backend';
    } else if (context.modes.length === 1 && context.modes[0] === 'library') {
      context.type = 'library';
    }

    return context;
  }

  /**
   * Get operating mode recommendations based on context
   */
  getOperatingModes(context: RepoContext): OperatingMode[] {
    return context.modes.length > 0 ? context.modes : ['webapp'];
  }
}
