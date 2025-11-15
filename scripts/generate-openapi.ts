/**
 * OpenAPI/Swagger Documentation Generator
 * 
 * Generates OpenAPI 3.0 specification from FastAPI backend and Next.js API routes.
 * Combines both backend and frontend API documentation.
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

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
 * Generate OpenAPI specification
 */
export function generateOpenAPISpec(): OpenAPISpec {
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
      `.trim(),
      contact: {
        name: 'Floyo Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Local development server',
      },
      {
        url: 'https://your-app.vercel.app',
        description: 'Production server',
      },
    ],
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          description: 'Check application health status',
          tags: ['Health'],
          responses: {
            '200': {
              description: 'Application is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/health/comprehensive': {
        get: {
          summary: 'Comprehensive health check',
          description: 'Detailed health status for all system components',
          tags: ['Health'],
          responses: {
            '200': {
              description: 'Health status',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthStatus',
                  },
                },
              },
            },
            '503': {
              description: 'Service unhealthy',
            },
          },
        },
      },
      '/api/telemetry': {
        get: {
          summary: 'Get telemetry events',
          description: 'Retrieve telemetry events for the authenticated user',
          tags: ['Telemetry'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 100 },
              description: 'Maximum number of events to return',
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0 },
              description: 'Number of events to skip',
            },
          ],
          responses: {
            '200': {
              description: 'Telemetry events',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TelemetryEvent' },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
            },
          },
        },
        post: {
          summary: 'Create telemetry event',
          description: 'Create a new telemetry event',
          tags: ['Telemetry'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateTelemetryEvent' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Event created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TelemetryEvent' },
                },
              },
            },
            '400': {
              description: 'Invalid request',
            },
            '401': {
              description: 'Unauthorized',
            },
          },
        },
      },
      '/api/metrics': {
        get: {
          summary: 'Get application metrics',
          description: 'Retrieve application metrics',
          tags: ['Metrics'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Application metrics',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Metrics' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
            },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
            environment: { type: 'string' },
            checks: {
              type: 'object',
              properties: {
                database: { $ref: '#/components/schemas/ComponentHealth' },
                supabase: { $ref: '#/components/schemas/ComponentHealth' },
                environment: { $ref: '#/components/schemas/ComponentHealth' },
                integrations: {
                  type: 'object',
                  additionalProperties: { $ref: '#/components/schemas/ComponentHealth' },
                },
              },
            },
            metrics: {
              type: 'object',
              properties: {
                responseTime: { type: 'number' },
                uptime: { type: 'number' },
              },
            },
          },
        },
        ComponentHealth: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
            },
            message: { type: 'string' },
            latency: { type: 'number' },
            details: { type: 'object', additionalProperties: true },
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
        CreateTelemetryEvent: {
          type: 'object',
          required: ['appId', 'eventType'],
          properties: {
            appId: { type: 'string' },
            eventType: { type: 'string' },
            durationMs: { type: 'integer' },
            metadataRedactedJson: { type: 'object' },
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
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object', additionalProperties: true },
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
export function writeOpenAPISpec(outputPath: string = 'openapi.json'): void {
  const spec = generateOpenAPISpec()
  const specPath = join(process.cwd(), outputPath)
  writeFileSync(specPath, JSON.stringify(spec, null, 2))
  console.log(`✅ OpenAPI specification written to ${specPath}`)
}

// Run if executed directly
if (require.main === module) {
  writeOpenAPISpec()
}
