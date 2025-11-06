/**
 * Tool Registry - Progressive Discovery & Lazy Loading
 * Maintains lightweight manifest, loads modules on-demand
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { ToolSchema, ToolManifest } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ToolRegistry {
  private manifest: ToolManifest | null = null;
  private loadedModules: Map<string, any> = new Map();
  private manifestPath: string;

  constructor(manifestPath?: string) {
    this.manifestPath = manifestPath || path.join(__dirname, '../../tools/manifest.json');
  }

  /**
   * Load or create manifest (lightweight JSON)
   */
  async loadManifest(): Promise<ToolManifest> {
    if (this.manifest) return this.manifest;

    try {
      if (fs.existsSync(this.manifestPath)) {
        const content = fs.readFileSync(this.manifestPath, 'utf-8');
        this.manifest = JSON.parse(content);
        return this.manifest!;
      }
    } catch (error) {
      console.warn(`Failed to load manifest: ${error}`);
    }

    // Auto-discover tools if manifest doesn't exist
    this.manifest = await this.discoverTools();
    return this.manifest;
  }

  /**
   * Discover tools by scanning tools directory
   */
  private async discoverTools(): Promise<ToolManifest> {
    const toolsDir = path.join(__dirname, '../../tools');
    const tools: Record<string, ToolSchema> = {};

    if (!fs.existsSync(toolsDir)) {
      fs.mkdirSync(toolsDir, { recursive: true });
    }

    // Scan for tool modules
    const entries = fs.readdirSync(toolsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.includes('.spec.')) {
        const toolPath = path.join(toolsDir, entry.name);
        const toolName = entry.name.replace('.ts', '');
        
        try {
          const schema = await this.extractToolSchema(toolPath, toolName);
          if (schema) {
            tools[toolName] = schema;
          }
        } catch (error) {
          console.warn(`Failed to extract schema from ${toolPath}: ${error}`);
        }
      }
    }

    return {
      version: '1.0.0',
      tools,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Extract tool schema from module (reads exports)
   */
  private async extractToolSchema(
    filePath: string,
    toolName: string
  ): Promise<ToolSchema | null> {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Look for schema export or metadata comment
    const schemaMatch = content.match(/export\s+const\s+toolSchema\s*[:=]\s*({[\s\S]*?});/);
    const descMatch = content.match(/\/\*\*[\s\S]*?\*\s*@description\s+(.+?)\n/);
    const versionMatch = content.match(/@version\s+(\S+)/);
    const authorMatch = content.match(/@author\s+(.+?)\n/);

    if (!schemaMatch && !descMatch) return null;

    const schema = schemaMatch ? eval(`(${schemaMatch[1]})`) : {};
    
    return {
      name: toolName,
      version: versionMatch?.[1] || '1.0.0',
      author: authorMatch?.[1]?.trim(),
      description: descMatch?.[1]?.trim() || schema.description || `Tool: ${toolName}`,
      path: filePath,
      inputSchema: schema.inputSchema || {},
      outputSchema: schema.outputSchema || {},
      estimatedTokens: schema.estimatedTokens || 100,
      latencyMs: schema.latencyMs || 0,
    };
  }

  /**
   * Get tool schema without loading module
   */
  async getToolSchema(toolName: string): Promise<ToolSchema | null> {
    const manifest = await this.loadManifest();
    return manifest.tools[toolName] || null;
  }

  /**
   * List available tools (names only - token efficient)
   */
  async listTools(): Promise<string[]> {
    const manifest = await this.loadManifest();
    return Object.keys(manifest.tools);
  }

  /**
   * Search tools by name/description (progressive discovery)
   */
  async searchTools(query: string): Promise<ToolSchema[]> {
    const manifest = await this.loadManifest();
    const lowerQuery = query.toLowerCase();
    
    return Object.values(manifest.tools).filter(
      (tool) =>
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Lazy-load tool module (only when needed)
   */
  async loadTool(toolName: string): Promise<any> {
    // Check cache
    if (this.loadedModules.has(toolName)) {
      return this.loadedModules.get(toolName);
    }

    const schema = await this.getToolSchema(toolName);
    if (!schema) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Dynamic import
    const module = await import(schema.path);
    const toolModule = module.default || module[toolName] || module;

    this.loadedModules.set(toolName, toolModule);
    return toolModule;
  }

  /**
   * Unload tool to free memory
   */
  unloadTool(toolName: string): void {
    this.loadedModules.delete(toolName);
  }

  /**
   * Save manifest (after auto-discovery or updates)
   */
  async saveManifest(): Promise<void> {
    if (!this.manifest) return;
    
    fs.mkdirSync(path.dirname(this.manifestPath), { recursive: true });
    fs.writeFileSync(
      this.manifestPath,
      JSON.stringify(this.manifest, null, 2),
      'utf-8'
    );
  }

  /**
   * Get minimal tool info for model context (< 50 tokens)
   */
  async getToolSummary(toolName: string): Promise<{
    name: string;
    description: string;
    params: string[]; // Just param names
  } | null> {
    const schema = await this.getToolSchema(toolName);
    if (!schema) return null;

    return {
      name: schema.name,
      description: schema.description,
      params: Object.keys(schema.inputSchema.properties || {}),
    };
  }
}
