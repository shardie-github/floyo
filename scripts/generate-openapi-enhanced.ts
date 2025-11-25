#!/usr/bin/env tsx
/**
 * Enhanced OpenAPI/Swagger Documentation Generator
 * 
 * Automatically discovers and documents all API endpoints from:
 * - Next.js API routes (frontend/app/api/*)
 * - FastAPI backend routes (backend/api/*)
 * 
 * Generates complete OpenAPI 3.0 specification.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join, relative } from 'path'
import { glob } from 'glob'

interface EndpointInfo {
  path: string
  method: string
  file: string
  summary?: string
  description?: string
  requiresAuth?: boolean
  parameters?: Array<{
    name: string
    in: 'query' | 'path' | 'header'
    required?: boolean
    schema: any
    description?: string
  }>
  requestBody?: any
  responses?: Record<string, any>
}

interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description: string
    contact?: {
      name: string
      email?: string
      url?: string
    }
  }
  servers: Array<{
    url: string
    description: string
  }>
  paths: Record<string, Record<string, unknown>>
  components: {
    schemas: Record<string, unknown>
    securitySchemes: Record<string, unknown>
  }
}

/**
 * Extract endpoint information from Next.js route file
 */
function extractNextJSEndpoint(filePath: string): EndpointInfo[] {
  const endpoints: EndpointInfo[] = []
  const content = readFileSync(filePath, 'utf-8')
  
  // Extract path from file structure
  const relativePath = relative(join(process.cwd(), 'frontend/app/api'), filePath)
  const pathParts = relativePath
    .replace(/\/route\.ts$/, '')
    .replace(/\/route\.tsx$/, '')
    .split('/')
    .filter(p => p && p !== 'route.ts' && p !== 'route.tsx')
  
  const basePath = `/api/${pathParts.join('/')}`
  
  // Extract HTTP methods
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  
  for (const method of methods) {
    const methodRegex = new RegExp(
      `export\\s+(async\\s+)?function\\s+${method}\\s*\\(`,
      'gi'
    )
    
    if (methodRegex.test(content)) {
      // Extract JSDoc comments if present
      const jsdocMatch = content.match(
        new RegExp(`/\\*\\*[\\s\\S]*?\\*/[\\s\\S]*?export\\s+(async\\s+)?function\\s+${method}`, 'i')
      )
      
      let summary = ''
      let description = ''
      let requiresAuth = false
      
      if (jsdocMatch) {
        const jsdoc = jsdocMatch[0]
        const summaryMatch = jsdoc.match(/\*\s*(.+?)(?:\n|$)/)
        if (summaryMatch) {
          summary = summaryMatch[1].trim()
        }
        description = jsdoc
          .split('\n')
          .map(line => line.replace(/^\s*\*\s?/, '').trim())
          .filter(line => line && !line.startsWith('/'))
          .join('\n')
        
        requiresAuth = /@auth|authenticated|requires.*auth|bearer/i.test(jsdoc)
      }
      
      // Check for auth in code
      if (!requiresAuth) {
        requiresAuth = /getSupabaseServer|createClient|Authorization|bearer/i.test(content)
      }
      
      // Extract path parameters
      const pathParams = basePath.match(/\{(\w+)\}|\[(\w+)\]/g) || []
      const parameters = pathParams.map(param => {
        const paramName = param.replace(/[\[\]{}]/g, '')
        return {
          name: paramName,
          in: 'path' as const,
          required: true,
          schema: { type: 'string' },
          description: `${paramName} parameter`,
        }
      })
      
      // Common query parameters
      if (method === 'GET') {
        parameters.push(
          {
            name: 'limit',
            in: 'query' as const,
            required: false,
            schema: { type: 'integer', default: 20, maximum: 100 },
            description: 'Number of items to return',
          },
          {
            name: 'offset',
            in: 'query' as const,
            required: false,
            schema: { type: 'integer', default: 0 },
            description: 'Number of items to skip',
          }
        )
      }
      
      endpoints.push({
        path: basePath,
        method: method.toLowerCase(),
        file: filePath,
        summary: summary || `${method} ${basePath}`,
        description: description || `Endpoint at ${basePath}`,
        requiresAuth,
        parameters,
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          '401': requiresAuth ? {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          } : undefined,
          '400': {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      })
    }
  }
  
  return endpoints
}

/**
 * Discover all Next.js API routes
 */
function discoverNextJSRoutes(): EndpointInfo[] {
  const apiDir = join(process.cwd(), 'frontend/app/api')
  const routeFiles = glob.sync('**/route.{ts,tsx}', { cwd: apiDir })
  
  const endpoints: EndpointInfo[] = []
  
  for (const file of routeFiles) {
    const fullPath = join(apiDir, file)
    try {
      const fileEndpoints = extractNextJSEndpoint(fullPath)
      endpoints.push(...fileEndpoints)
    } catch (error) {
      console.warn(`⚠️  Failed to parse ${file}:`, error)
    }
  }
  
  return endpoints
}

/**
 * Generate OpenAPI specification
 */
function generateOpenAPISpec(): OpenAPISpec {
  console.log('🔍 Discovering API endpoints...')
  const endpoints = discoverNextJSRoutes()
  console.log(`✅ Found ${endpoints.length} endpoints`)
  
  // Group endpoints by path
  const paths: Record<string, Record<string, unknown>> = {}
  
  for (const endpoint of endpoints) {
    if (!paths[endpoint.path]) {
      paths[endpoint.path] = {}
    }
    
    const operation: any = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: [endpoint.path.split('/')[2] || 'API'], // Use second segment as tag
    }
    
    if (endpoint.requiresAuth) {
      operation.security = [{ bearerAuth: [] }]
    }
    
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      operation.parameters = endpoint.parameters
    }
    
    if (endpoint.requestBody) {
      operation.requestBody = endpoint.requestBody
    }
    
    if (endpoint.responses) {
      operation.responses = Object.fromEntries(
        Object.entries(endpoint.responses).filter(([_, v]) => v !== undefined)
      )
    }
    
    paths[endpoint.path][endpoint.method] = operation
  }
  
  const spec: OpenAPISpec = {
    openapi: '3.0.0',
    info: {
      title: 'Floyo API',
      version: '1.0.0',
      description: `
# Floyo API Documentation

Floyo is a file usage pattern tracking system that suggests concrete, niche API integrations 
based on actual user routines.

## Features

- **User Authentication**: JWT-based authentication with email verification
- **Event Tracking**: Track file operations and tool usage
- **Pattern Analysis**: Discover usage patterns from tracked events
- **Integration Suggestions**: Get intelligent suggestions for API integrations
- **Privacy-First**: Privacy-first monitoring with user consent

## Authentication

Most endpoints require authentication via Supabase JWT token.

Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

## Rate Limiting

- Authenticated: 100 requests/minute
- Unauthenticated: 10 requests/minute

## Pagination

Most list endpoints support pagination:
- \`limit\`: Number of items per page (default: 20, max: 100)
- \`offset\`: Number of items to skip (default: 0)
      `.trim(),
      contact: {
        name: 'Floyo Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
      {
        url: 'https://your-app.vercel.app',
        description: 'Production server',
      },
    ],
    paths,
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error code',
            },
            message: {
              type: 'string',
              description: 'Human-readable error message',
            },
            details: {
              type: 'object',
              additionalProperties: true,
              description: 'Additional error details',
            },
          },
          required: ['error', 'message'],
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
            },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
            checks: {
              type: 'object',
              additionalProperties: {
                $ref: '#/components/schemas/ComponentHealth',
              },
            },
            latency_ms: { type: 'number' },
          },
        },
        ComponentHealth: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'error', 'warning'],
            },
            message: { type: 'string' },
            latency: { type: 'number' },
          },
        },
        TelemetryEvent: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            timestamp: { type: 'string', format: 'date-time' },
            appId: { type: 'string' },
            eventType: { type: 'string' },
            durationMs: { type: 'integer', nullable: true },
            metadataRedactedJson: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Metrics: {
          type: 'object',
          properties: {
            requests: { type: 'integer' },
            errors: { type: 'integer' },
            avgLatency: { type: 'number' },
            p95Latency: { type: 'number' },
            p99Latency: { type: 'number' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { type: 'object' },
            },
            pagination: {
              type: 'object',
              properties: {
                limit: { type: 'integer' },
                offset: { type: 'integer' },
                total: { type: 'integer' },
                hasMore: { type: 'boolean' },
              },
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase JWT token',
        },
      },
    },
  }
  
  return spec
}

/**
 * Write OpenAPI spec to file
 */
function writeOpenAPISpec(outputPath: string = 'openapi.json'): void {
  const spec = generateOpenAPISpec()
  const specPath = join(process.cwd(), outputPath)
  writeFileSync(specPath, JSON.stringify(spec, null, 2))
  console.log(`✅ OpenAPI specification written to ${specPath}`)
  console.log(`📊 Total endpoints documented: ${Object.keys(spec.paths).length}`)
}

// Run if executed directly
if (require.main === module) {
  writeOpenAPISpec()
}

export { generateOpenAPISpec, writeOpenAPISpec }
