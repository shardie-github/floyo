/**
 * Integration Tests for API Endpoints
 * 
 * Tests API endpoints to ensure they work correctly and return expected responses.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'

describe('API Endpoints', () => {
  describe('Health Endpoints', () => {
    it('should return health status', async () => {
      const response = await fetch(`${API_BASE_URL}/health`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('status')
    })

    it('should return comprehensive health check', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health/comprehensive`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('checks')
      expect(data.checks).toHaveProperty('database')
      expect(data.checks).toHaveProperty('supabase')
    })
  })

  describe('Authentication Endpoints', () => {
    it('should register a new user', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'TestPassword123!',
          name: 'Test User',
        }),
      })

      expect([200, 201]).toContain(response.status)
    })

    it('should reject invalid email', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'TestPassword123!',
        }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Integration Endpoints', () => {
    it('should return integration status', async () => {
      const response = await fetch(`${API_BASE_URL}/api/integrations/status`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await fetch(`${API_BASE_URL}/api/nonexistent`)
      expect(response.status).toBe(404)
    })

    it('should return proper error format', async () => {
      const response = await fetch(`${API_BASE_URL}/api/nonexistent`)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })
})
