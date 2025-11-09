/**
 * Floyo Marketplace SDK
 * Main SDK entry point for app store integrations
 */

export interface SDKConfig {
  apiKey: string
  environment: 'development' | 'staging' | 'production'
  endpoint: string
  version?: string
}

export interface SDKInitOptions {
  userId?: string
  metadata?: Record<string, any>
  autoTrack?: boolean
}

export class FloyoMarketplaceSDK {
  private config: SDKConfig
  private initialized: boolean = false
  private userId?: string

  constructor(config: SDKConfig) {
    this.config = config
  }

  /**
   * Initialize SDK
   */
  async initialize(options: SDKInitOptions = {}): Promise<void> {
    if (this.initialized) {
      console.warn('SDK already initialized')
      return
    }

    this.userId = options.userId

    // Validate API key
    const isValid = await this.validateApiKey()
    if (!isValid) {
      throw new Error('Invalid API key')
    }

    // Register SDK instance
    await this.registerInstance(options.metadata)

    this.initialized = true

    // Start auto-tracking if enabled
    if (options.autoTrack) {
      this.startAutoTracking()
    }
  }

  /**
   * Validate API key
   */
  private async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/sdk/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          environment: this.config.environment
        })
      })

      return response.ok
    } catch (error) {
      console.error('API key validation failed:', error)
      return false
    }
  }

  /**
   * Register SDK instance
   */
  private async registerInstance(metadata?: Record<string, any>): Promise<void> {
    try {
      await fetch(`${this.config.endpoint}/api/sdk/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          version: this.config.version || '1.0.0',
          environment: this.config.environment,
          platform: this.getPlatform(),
          metadata
        })
      })
    } catch (error) {
      console.error('SDK registration failed:', error)
    }
  }

  /**
   * Get platform information
   */
  private getPlatform(): string {
    if (typeof window === 'undefined') {
      return 'server'
    }

    const ua = navigator.userAgent
    if (/iPhone|iPad|iPod/.test(ua)) {
      return 'ios'
    }
    if (/Android/.test(ua)) {
      return 'android'
    }
    if (/Windows/.test(ua)) {
      return 'windows'
    }
    if (/Mac/.test(ua)) {
      return 'macos'
    }
    if (/Linux/.test(ua)) {
      return 'linux'
    }

    return 'web'
  }

  /**
   * Start auto-tracking
   */
  private startAutoTracking(): void {
    // Implement auto-tracking logic
    console.log('Auto-tracking started')
  }

  /**
   * Track event
   */
  async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call initialize() first.')
    }

    try {
      await fetch(`${this.config.endpoint}/api/sdk/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          event,
          properties,
          userId: this.userId,
          timestamp: new Date().toISOString(),
          platform: this.getPlatform()
        })
      })
    } catch (error) {
      console.error('Event tracking failed:', error)
    }
  }

  /**
   * Get SDK status
   */
  async getStatus(): Promise<{ initialized: boolean; version: string; environment: string }> {
    return {
      initialized: this.initialized,
      version: this.config.version || '1.0.0',
      environment: this.config.environment
    }
  }
}

// Export default instance factory
export function createSDK(config: SDKConfig): FloyoMarketplaceSDK {
  return new FloyoMarketplaceSDK(config)
}
