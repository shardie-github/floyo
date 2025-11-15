/**
 * Unit Tests for Environment Validation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { validatePublicEnv } from '../../frontend/lib/env'

describe('Environment Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should validate required environment variables', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
    process.env.NODE_ENV = 'test'

    expect(() => validatePublicEnv()).not.toThrow()
  })

  it('should throw error for missing required variables', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    expect(() => validatePublicEnv()).toThrow()
  })

  it('should validate URL format', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

    expect(() => validatePublicEnv()).toThrow()
  })

  it('should provide default values for optional variables', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
    process.env.NODE_ENV = 'test'

    const env = validatePublicEnv()
    expect(env.NEXT_PUBLIC_API_URL).toBe('http://localhost:8000')
  })
})
