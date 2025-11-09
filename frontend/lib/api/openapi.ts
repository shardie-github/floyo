/**
 * OpenAPI/Swagger Documentation Generator
 * 
 * Generates API documentation for all routes.
 */

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Floyo API',
    version: '1.0.0',
    description: 'Floyo - File usage pattern tracking and integration suggestions API',
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      description: 'Production server',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check',
        description: 'Returns system health status',
        responses: {
          '200': {
            description: 'Healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string' },
                    checks: {
                      type: 'object',
                      properties: {
                        database: { type: 'object' },
                        supabase: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/search': {
      get: {
        summary: 'Search files, events, and patterns',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string', minLength: 2 },
            description: 'Search query',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
            description: 'Maximum number of results',
          },
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['file', 'event', 'pattern'] },
                          id: { type: 'string' },
                          title: { type: 'string' },
                          description: { type: 'string' },
                          relevance: { type: 'number' },
                        },
                      },
                    },
                    query: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
          },
        },
      },
    },
    '/api/gamification/stats': {
      get: {
        summary: 'Get user gamification stats',
        responses: {
          '200': {
            description: 'User stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    level: { type: 'integer' },
                    xp: { type: 'integer' },
                    badges: { type: 'array' },
                    streak: { type: 'integer' },
                    rank: { type: 'integer' },
                    percentile: { type: 'number' },
                    efficiency: { type: 'number' },
                    productivity: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/insights': {
      get: {
        summary: 'Get personalized insights',
        responses: {
          '200': {
            description: 'Insights array',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string' },
                      title: { type: 'string' },
                      message: { type: 'string' },
                      urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
                      expiresAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};
