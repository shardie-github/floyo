import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { z, ZodType, ZodTypeAny } from 'zod';

import {
  recordLatency,
  recordMetric
} from '../utils/observability.js';

const MANIFEST_DEFAULT_PATH = path.join(process.cwd(), 'ops', 'mcp', 'tools.json');
const SCHEMA_CACHE_DIR = path.join(process.cwd(), '.cache', 'mcp');

const manifestSchema = z.object({
  version: z.string().default('0.1.0'),
  tools: z
    .array(
      z.object({
        name: z.string(),
        modulePath: z.string(),
        schemaPath: z.string().optional(),
        version: z.string().default('0.1.0'),
        author: z.string().default('unknown'),
        description: z.string().default(''),
        runtime: z.enum(['node', 'python', 'shell']).default('node'),
        tags: z.array(z.string()).optional()
      })
    )
    .default([])
});

export interface ToolManifestEntry {
  name: string;
  modulePath: string;
  schemaPath?: string;
  version: string;
  author: string;
  description: string;
  runtime: 'node' | 'python' | 'shell';
  tags?: string[];
}

export interface ToolExecutionResult<T = unknown> {
  data: T;
  tokensUsed?: number;
  latencyMs?: number;
  summary?: string;
  insights?: string[];
}

export interface ToolInvocationMetrics {
  latencyMs: number;
  tokensUsed: number;
  cacheHit: boolean;
  fallbackTriggered: boolean;
  timestamp: string;
}

export interface WorkflowReport {
  json: {
    tool: string;
    version: string;
    latencyMs: number;
    tokensUsed: number;
    costEstimateUsd: number;
    cacheHit: boolean;
    sanitizedPreview: string;
  };
  narrative: string;
}

export interface ToolInvocationResult<T = unknown> {
  result: ToolExecutionResult<T>;
  metrics: ToolInvocationMetrics;
  report: WorkflowReport;
}

export interface ToolContext {
  traceId: string;
  tokenBudget?: number;
  signal?: AbortSignal;
  sanitize: <T>(payload: T) => T;
  emitLog: (record: SanitizedLogRecord) => void;
}

export interface SanitizedLogRecord {
  tool: string;
  timestamp: string;
  tokenUsed: number;
  latencyMs: number;
  status: 'success' | 'failed';
  cacheHit: boolean;
  fallback?: string;
}

export interface InvocationOptions {
  traceId?: string;
  fallbackTools?: string[];
  tokenBudget?: number;
  signal?: AbortSignal;
}

interface ToolModule {
  run: (input: unknown, context: ToolContext) => Promise<ToolExecutionResult>;
  summarize?: (result: ToolExecutionResult) => ToolExecutionResult['summary'];
  schema?: z.ZodTypeAny;
}

export class ToolRegistry {
  private readonly projectRoot: string;
  private readonly manifestPath: string;
  private manifest: Map<string, ToolManifestEntry> = new Map();
  private manifestVersion = '0.1.0';
  private readonly moduleCache = new Map<string, ToolModule>();
  private readonly schemaCache = new Map<string, z.ZodTypeAny>();

  constructor(options?: { manifestPath?: string; projectRoot?: string }) {
    this.projectRoot = options?.projectRoot ?? process.cwd();
    this.manifestPath = options?.manifestPath ?? MANIFEST_DEFAULT_PATH;
    this.loadManifest();
    this.ensureCacheDir();
  }

  listTools(): ToolManifestEntry[] {
    return Array.from(this.manifest.values());
  }

  async invoke<T = unknown>(
    toolName: string,
    input: unknown,
    options: InvocationOptions = {}
  ): Promise<ToolInvocationResult<T>> {
    const traceId = options.traceId ?? this.generateTraceId(toolName);

    const toolEntry = this.manifest.get(toolName);
    if (!toolEntry) {
      throw new Error(`Tool "${toolName}" not found in manifest`);
    }

    const start = performance.now();
    let cacheHit = false;
    let fallbackTriggered = false;
    let tokensUsed = 0;
    let lastError: unknown;

    const emitLog = (record: SanitizedLogRecord) => {
      this.persistTelemetry(record);
    };

    const sanitize = <T>(payload: T): T => tokenizePII(payload);

    const ctx: ToolContext = {
      traceId,
      tokenBudget: options.tokenBudget,
      signal: options.signal,
      sanitize,
      emitLog
    };

    const candidates = [toolName, ...(options.fallbackTools ?? [])];

    for (const candidate of candidates) {
      const entry = this.manifest.get(candidate);
      if (!entry) {
        continue;
      }

      cacheHit = this.moduleCache.has(entry.name);

      try {
        const module = await this.loadToolModule(entry);
        const schema = await this.loadSchema(entry, module);

        if (schema) {
          schema.parse(input);
        }

        const runStart = performance.now();
        const result = await module.run(input, ctx);
        const latency = performance.now() - runStart;
        const estimatedTokens =
          typeof result.tokensUsed === 'number'
            ? result.tokensUsed
            : estimateTokens(result.data);
        tokensUsed = estimatedTokens;

        const metrics: ToolInvocationMetrics = {
          latencyMs: latency,
          tokensUsed: estimatedTokens,
          cacheHit,
          fallbackTriggered,
          timestamp: new Date().toISOString()
        };

        this.emitObservability(entry.name, metrics);

        const sanitizedPreview = JSON.stringify(
          sanitize(previewPayload(result.data)),
          null,
          2
        ).slice(0, 400);

        const report: WorkflowReport = {
          json: {
            tool: entry.name,
            version: entry.version,
            latencyMs: latency,
            tokensUsed: estimatedTokens,
            costEstimateUsd: estimateCost(estimatedTokens),
            cacheHit,
            sanitizedPreview
          },
          narrative: createNarrative(entry.name, latency, estimatedTokens, result)
        };

        emitLog({
          tool: entry.name,
          timestamp: metrics.timestamp,
          tokenUsed: estimatedTokens,
          latencyMs: latency,
          status: 'success',
          cacheHit,
          fallback: fallbackTriggered ? toolName : undefined
        });

        return {
          result: result as ToolExecutionResult<T>,
          metrics,
          report
        };
      } catch (error) {
        lastError = error;
        fallbackTriggered = candidate !== toolName;
        emitLog({
          tool: entry.name,
          timestamp: new Date().toISOString(),
          tokenUsed: tokensUsed,
          latencyMs: performance.now() - start,
          status: 'failed',
          cacheHit,
          fallback: fallbackTriggered ? toolName : undefined
        });
      }
    }

    throw new Error(
      `All tool candidates failed for "${toolName}": ${(lastError as Error)?.message ?? 'unknown error'}`
    );
  }

  private loadManifest(): void {
    if (!existsSync(this.manifestPath)) {
      this.bootstrapManifest();
    }

    const raw = readFileSync(this.manifestPath, 'utf-8');
    const parsed = manifestSchema.parse(JSON.parse(raw));
    this.manifestVersion = parsed.version;
    this.manifest = new Map(parsed.tools.map((tool) => [tool.name, tool]));
  }

  private bootstrapManifest(): void {
    const initial = {
      version: '0.1.0',
      tools: []
    };

    mkdirSync(path.dirname(this.manifestPath), { recursive: true });
    writeFileSync(this.manifestPath, JSON.stringify(initial, null, 2));
  }

  private ensureCacheDir(): void {
    mkdirSync(SCHEMA_CACHE_DIR, { recursive: true });
  }

  private async loadToolModule(entry: ToolManifestEntry): Promise<ToolModule> {
    const cached = this.moduleCache.get(entry.name);
    if (cached) {
      return cached;
    }

    const candidates = this.resolveModuleCandidates(entry.modulePath);
    let lastError: unknown;

    for (const candidate of candidates) {
      try {
        const url = pathToFileURL(candidate).href;
        const mod = await import(url);
        const defaultExport = mod?.default ?? {};

        const runExport =
          typeof mod.run === 'function'
            ? mod.run
            : typeof defaultExport === 'function'
            ? defaultExport
            : typeof defaultExport.run === 'function'
            ? defaultExport.run.bind(defaultExport)
            : undefined;

        if (typeof runExport !== 'function') {
          throw new Error(`Tool module ${candidate} is missing required "run" export`);
        }

        const moduleInstance: ToolModule = {
          run: runExport,
          summarize:
            typeof mod.summarize === 'function'
              ? mod.summarize
              : typeof defaultExport.summarize === 'function'
              ? defaultExport.summarize.bind(defaultExport)
              : undefined,
          schema:
            mod.schema instanceof ZodType
              ? (mod.schema as ZodTypeAny)
              : defaultExport.schema instanceof ZodType
              ? (defaultExport.schema as ZodTypeAny)
              : undefined
        };

        this.moduleCache.set(entry.name, moduleInstance);
        return moduleInstance;
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `Failed to import tool module for "${entry.name}". Last error: ${(lastError as Error)?.message ?? 'unknown error'}`
    );
  }

  private resolveModuleCandidates(modulePath: string): string[] {
    const basePath = path.isAbsolute(modulePath)
      ? modulePath
      : path.join(this.projectRoot, modulePath);

    const candidates = new Set<string>();

    const possibilities = [
      basePath,
      `${basePath}.ts`,
      `${basePath}.js`,
      path.join(basePath, 'index.ts'),
      path.join(basePath, 'index.js')
    ];

    for (const candidate of possibilities) {
      if (existsSync(candidate)) {
        candidates.add(candidate);
      }
    }

    if (candidates.size === 0) {
      candidates.add(basePath);
    }

    return Array.from(candidates);
  }

  private async loadSchema(
    entry: ToolManifestEntry,
    moduleInstance: ToolModule
  ): Promise<z.ZodTypeAny | undefined> {
    if (this.schemaCache.has(entry.name)) {
      return this.schemaCache.get(entry.name);
    }

    if (moduleInstance.schema) {
      this.schemaCache.set(entry.name, moduleInstance.schema);
      return moduleInstance.schema;
    }

    if (!entry.schemaPath) {
      return undefined;
    }

    const schemaAbsolute = path.isAbsolute(entry.schemaPath)
      ? entry.schemaPath
      : path.join(this.projectRoot, entry.schemaPath);

    if (!existsSync(schemaAbsolute)) {
      return undefined;
    }

    const rawSchema = JSON.parse(readFileSync(schemaAbsolute, 'utf-8'));
    const cacheKey = crypto
      .createHash('sha256')
      .update(JSON.stringify(rawSchema))
      .digest('hex');
    const cacheFilePath = path.join(SCHEMA_CACHE_DIR, `${cacheKey}.json`);

    if (!existsSync(cacheFilePath)) {
      writeFileSync(cacheFilePath, JSON.stringify({ source: entry.schemaPath, hash: cacheKey }));
    }

    const schema = jsonSchemaToZod(rawSchema);
    this.schemaCache.set(entry.name, schema);
    return schema;
  }

  private persistTelemetry(record: SanitizedLogRecord): void {
    recordLatency(`tool:${record.tool}`, record.latencyMs);
    recordMetric('token_used', record.tokenUsed, { tool: record.tool });
  }

  private emitObservability(tool: string, metrics: ToolInvocationMetrics): void {
    recordLatency(`workflow:${tool}`, metrics.latencyMs);
    recordMetric('token_used', metrics.tokensUsed, { tool });
  }

  private generateTraceId(source: string): string {
    return `${source}-${crypto.randomBytes(6).toString('hex')}`;
  }

  private computeFileHash(filePath: string): string {
    if (!existsSync(filePath)) {
      return crypto.randomBytes(6).toString('hex');
    }

    const file = readFileSync(filePath);
    return crypto.createHash('sha256').update(file).digest('hex');
  }
}

function estimateTokens(payload: unknown): number {
  const str = JSON.stringify(payload ?? '');
  return Math.max(1, Math.ceil(str.length / 4));
}

function estimateCost(tokens: number): number {
  const COST_PER_TOKEN_USD = 0.000002;
  return Number((tokens * COST_PER_TOKEN_USD).toFixed(6));
}

function createNarrative(
  tool: string,
  latencyMs: number,
  tokens: number,
  result: ToolExecutionResult
): string {
  const base = `${tool} completed in ${latencyMs.toFixed(1)}ms using ~${tokens} tokens.`;

  if (result.summary) {
    return `${base} ${result.summary}`;
  }

  if (Array.isArray(result.insights) && result.insights.length > 0) {
    return `${base} Key insight: ${result.insights[0]}`;
  }

  return `${base} Output sanitized for privacy.`;
}

function previewPayload(payload: unknown): unknown {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.slice(0, 3).map((item) => previewPayload(item));
  }

  if (typeof payload === 'object') {
    const entries = Object.entries(payload as Record<string, unknown>)
      .slice(0, 5)
      .map(([key, value]) => [key, previewPayload(value)]);
    return Object.fromEntries(entries);
  }

  return payload;
}

function tokenizePII<T>(payload: T): T {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (typeof payload === 'string') {
    return payload
      .replace(/([\w.-]+)@([\w.-]+)\.(\w+)/g, (_, user, domain, tld) => {
        const hash = crypto.createHash('sha1').update(`${user}@${domain}.${tld}`).digest('hex').slice(0, 8);
        return `user_${hash}@anon.${tld}`;
      })
      .replace(/(\b\d{1,3}(?:\.\d{1,3}){3}\b)/g, (ip) => {
        const hash = crypto.createHash('sha1').update(ip).digest('hex').slice(0, 6);
        return `ip_${hash}`;
      }) as T;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => tokenizePII(item)) as T;
  }

  if (typeof payload === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      sanitized[key] = tokenizePII(value);
    }
    return sanitized as T;
  }

  return payload;
}

function jsonSchemaToZod(schema: unknown): ZodTypeAny {
  if (!schema || typeof schema !== 'object') {
    return z.any();
  }

  const typed = schema as Record<string, unknown>;

  if (Array.isArray(typed.enum) && typed.enum.every((value) => typeof value === 'string')) {
    const enumValues = typed.enum as string[];
    if (enumValues.length === 0) {
      return z.string();
    }
    const [first, ...rest] = enumValues;
    return z.enum([first, ...rest] as [string, ...string[]]);
  }

  switch (typed.type) {
    case 'string': {
      let schema = z.string();
      if (typed.format === 'date-time') {
        schema = schema.transform((value) => new Date(value).toISOString());
      }
      return schema;
    }
    case 'number':
      return z.number();
    case 'integer':
      return z.number().int();
    case 'boolean':
      return z.boolean();
    case 'null':
      return z.null();
    case 'array': {
      const itemSchema = jsonSchemaToZod(typed.items ?? {});
      let arraySchema = z.array(itemSchema);
      if (typeof typed.minItems === 'number') {
        arraySchema = arraySchema.min(typed.minItems);
      }
      if (typeof typed.maxItems === 'number') {
        arraySchema = arraySchema.max(typed.maxItems);
      }
      return arraySchema;
    }
    case 'object': {
      const properties = (typed.properties as Record<string, unknown>) ?? {};
      const required = new Set<string>(Array.isArray(typed.required) ? (typed.required as string[]) : []);
      const shape: Record<string, ZodTypeAny> = {};

      for (const [key, value] of Object.entries(properties)) {
        const child = jsonSchemaToZod(value);
        shape[key] = required.has(key) ? child : child.optional();
      }

      const objectSchema = z.object(shape).passthrough();
      if (typed.additionalProperties === false) {
        return objectSchema.strict();
      }
      return objectSchema;
    }
    default: {
      if (Array.isArray(typed.type)) {
        const uniqueVariants = [...new Set(typed.type as unknown[])];
        if (uniqueVariants.length === 0) {
          return z.any();
        }
        if (uniqueVariants.length === 1) {
          return jsonSchemaToZod({ ...schema, type: uniqueVariants[0] });
        }
        const variants = uniqueVariants.map((variant) => jsonSchemaToZod({ ...schema, type: variant }));
        return z.union(variants as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]);
      }
      return z.any();
    }
  }
}

export async function validateManifest(manifestPath = MANIFEST_DEFAULT_PATH): Promise<void> {
  const raw = readFileSync(manifestPath, 'utf-8');
  const parsed = manifestSchema.parse(JSON.parse(raw));

  for (const tool of parsed.tools) {
    const basePath = path.isAbsolute(tool.modulePath)
      ? tool.modulePath
      : path.join(process.cwd(), tool.modulePath);

    const candidates = [
      basePath,
      `${basePath}.ts`,
      `${basePath}.js`,
      path.join(basePath, 'index.ts'),
      path.join(basePath, 'index.js')
    ];

    const exists = candidates.some((candidate) => existsSync(candidate));

    if (!exists) {
      throw new Error(`Tool module path missing: ${tool.modulePath}`);
    }
  }
}

export const toolRegistry = new ToolRegistry();
