/**
 * Automated Moderation Service
 * Handles content moderation for marketplace/storefront using multiple AI providers
 */

import { OpenAI } from 'openai'
import { LanguageServiceClient } from '@google-cloud/language'

export interface ModerationRequest {
  content: string
  contentType: 'text' | 'image' | 'video' | 'audio' | 'file'
  userId?: string
  metadata?: Record<string, any>
}

export interface ModerationResult {
  approved: boolean
  confidence: number
  flags: ModerationFlag[]
  scores: ModerationScores
  action: 'approve' | 'reject' | 'review' | 'flag'
  reason?: string
}

export interface ModerationFlag {
  type: 'toxicity' | 'spam' | 'inappropriate' | 'violence' | 'harassment' | 'self-harm' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  details?: string
}

export interface ModerationScores {
  toxicity: number
  spam: number
  inappropriate: number
  violence: number
  harassment: number
  overall: number
}

export interface ModerationConfig {
  openaiApiKey: string
  perspectiveApiKey?: string
  googleCloudProjectId?: string
  thresholds: {
    toxicity: number
    spam: number
    inappropriate: number
    autoApprove: number
    autoReject: number
  }
  webhookSecret?: string
}

export class ModerationService {
  private openai: OpenAI
  private languageClient?: LanguageServiceClient
  private config: ModerationConfig

  constructor(config: ModerationConfig) {
    this.config = config
    this.openai = new OpenAI({ apiKey: config.openaiApiKey })
    
    if (config.googleCloudProjectId) {
      this.languageClient = new LanguageServiceClient({
        projectId: config.googleCloudProjectId
      })
    }
  }

  /**
   * Moderate content using multiple providers
   */
  async moderate(request: ModerationRequest): Promise<ModerationResult> {
    const { content, contentType } = request

    // Run moderation checks in parallel
    const [openaiResult, perspectiveResult, googleResult] = await Promise.all([
      this.checkOpenAI(content),
      this.checkPerspective(content).catch(() => null),
      this.checkGoogle(content).catch(() => null)
    ])

    // Aggregate results
    const scores = this.aggregateScores(openaiResult, perspectiveResult, googleResult)
    const flags = this.generateFlags(scores)
    const overallScore = scores.overall

    // Determine action
    let action: 'approve' | 'reject' | 'review' | 'flag'
    let approved: boolean

    if (overallScore <= this.config.thresholds.autoApprove) {
      action = 'approve'
      approved = true
    } else if (overallScore >= this.config.thresholds.autoReject) {
      action = 'reject'
      approved = false
    } else {
      action = 'review'
      approved = false
    }

    // Flag critical issues
    if (flags.some(f => f.severity === 'critical')) {
      action = 'flag'
    }

    return {
      approved,
      confidence: this.calculateConfidence(scores),
      flags,
      scores,
      action,
      reason: this.generateReason(flags, scores)
    }
  }

  /**
   * Check content using OpenAI moderation API
   */
  private async checkOpenAI(content: string): Promise<Partial<ModerationScores>> {
    try {
      const response = await this.openai.moderations.create({
        input: content
      })

      const result = response.results[0]
      const categories = result.categories
      const categoryScores = result.category_scores

      return {
        toxicity: categoryScores.toxicity || 0,
        spam: categoryScores.spam || 0,
        inappropriate: categoryScores.sexual || 0,
        violence: categoryScores.violence || 0,
        harassment: categoryScores.harassment || 0
      }
    } catch (error) {
      console.error('OpenAI moderation error:', error)
      return {}
    }
  }

  /**
   * Check content using Perspective API
   */
  private async checkPerspective(content: string): Promise<Partial<ModerationScores>> {
    if (!this.config.perspectiveApiKey) {
      return {}
    }

    try {
      const response = await fetch('https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=' + this.config.perspectiveApiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: { text: content },
          requestedAttributes: {
            TOXICITY: {},
            SPAM: {},
            SEXUALLY_EXPLICIT: {},
            THREAT: {},
            INSULT: {}
          }
        })
      })

      const data = await response.json()
      const attributes = data.attributeScores || {}

      return {
        toxicity: attributes.TOXICITY?.summaryScore?.value || 0,
        spam: attributes.SPAM?.summaryScore?.value || 0,
        inappropriate: attributes.SEXUALLY_EXPLICIT?.summaryScore?.value || 0,
        violence: attributes.THREAT?.summaryScore?.value || 0,
        harassment: attributes.INSULT?.summaryScore?.value || 0
      }
    } catch (error) {
      console.error('Perspective API error:', error)
      return {}
    }
  }

  /**
   * Check content using Google Cloud Natural Language API
   */
  private async checkGoogle(content: string): Promise<Partial<ModerationScores>> {
    if (!this.languageClient) {
      return {}
    }

    try {
      const [result] = await this.languageClient.analyzeSentiment({
        document: {
          content,
          type: 'PLAIN_TEXT'
        }
      })

      // Google NL API doesn't provide moderation scores directly
      // Use sentiment as a proxy for toxicity
      const sentiment = result.documentSentiment
      const toxicity = sentiment.score < -0.5 ? Math.abs(sentiment.score) : 0

      return {
        toxicity,
        spam: 0,
        inappropriate: 0,
        violence: 0,
        harassment: 0
      }
    } catch (error) {
      console.error('Google NL API error:', error)
      return {}
    }
  }

  /**
   * Aggregate scores from multiple providers
   */
  private aggregateScores(
    openai?: Partial<ModerationScores>,
    perspective?: Partial<ModerationScores> | null,
    google?: Partial<ModerationScores> | null
  ): ModerationScores {
    const scores: ModerationScores = {
      toxicity: 0,
      spam: 0,
      inappropriate: 0,
      violence: 0,
      harassment: 0,
      overall: 0
    }

    const providers = [openai, perspective, google].filter(Boolean) as Partial<ModerationScores>[]
    const count = providers.length

    if (count === 0) {
      return scores
    }

    // Average scores from all providers
    for (const provider of providers) {
      scores.toxicity += (provider.toxicity || 0) / count
      scores.spam += (provider.spam || 0) / count
      scores.inappropriate += (provider.inappropriate || 0) / count
      scores.violence += (provider.violence || 0) / count
      scores.harassment += (provider.harassment || 0) / count
    }

    // Calculate overall score (weighted average)
    scores.overall = (
      scores.toxicity * 0.3 +
      scores.spam * 0.2 +
      scores.inappropriate * 0.2 +
      scores.violence * 0.15 +
      scores.harassment * 0.15
    )

    return scores
  }

  /**
   * Generate flags based on scores
   */
  private generateFlags(scores: ModerationScores): ModerationFlag[] {
    const flags: ModerationFlag[] = []

    if (scores.toxicity > this.config.thresholds.toxicity) {
      flags.push({
        type: 'toxicity',
        severity: this.getSeverity(scores.toxicity),
        confidence: scores.toxicity,
        details: `Toxicity score: ${(scores.toxicity * 100).toFixed(1)}%`
      })
    }

    if (scores.spam > this.config.thresholds.spam) {
      flags.push({
        type: 'spam',
        severity: this.getSeverity(scores.spam),
        confidence: scores.spam,
        details: `Spam score: ${(scores.spam * 100).toFixed(1)}%`
      })
    }

    if (scores.inappropriate > this.config.thresholds.inappropriate) {
      flags.push({
        type: 'inappropriate',
        severity: this.getSeverity(scores.inappropriate),
        confidence: scores.inappropriate,
        details: `Inappropriate content score: ${(scores.inappropriate * 100).toFixed(1)}%`
      })
    }

    if (scores.violence > 0.7) {
      flags.push({
        type: 'violence',
        severity: 'critical',
        confidence: scores.violence,
        details: `Violence detected: ${(scores.violence * 100).toFixed(1)}%`
      })
    }

    if (scores.harassment > 0.7) {
      flags.push({
        type: 'harassment',
        severity: 'critical',
        confidence: scores.harassment,
        details: `Harassment detected: ${(scores.harassment * 100).toFixed(1)}%`
      })
    }

    return flags
  }

  /**
   * Get severity level from score
   */
  private getSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical'
    if (score >= 0.6) return 'high'
    if (score >= 0.4) return 'medium'
    return 'low'
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(scores: ModerationScores): number {
    // Confidence is inverse of uncertainty
    // Higher scores = higher confidence in moderation decision
    return Math.min(1, scores.overall * 1.2)
  }

  /**
   * Generate human-readable reason
   */
  private generateReason(flags: ModerationFlag[], scores: ModerationScores): string {
    if (flags.length === 0) {
      return 'Content approved - no issues detected'
    }

    const criticalFlags = flags.filter(f => f.severity === 'critical')
    if (criticalFlags.length > 0) {
      return `Content rejected: ${criticalFlags.map(f => f.type).join(', ')} detected`
    }

    const highFlags = flags.filter(f => f.severity === 'high')
    if (highFlags.length > 0) {
      return `Content flagged for review: ${highFlags.map(f => f.type).join(', ')} detected`
    }

    return `Content requires review: ${flags.map(f => f.type).join(', ')} detected`
  }

  /**
   * Batch moderate multiple items
   */
  async moderateBatch(requests: ModerationRequest[]): Promise<ModerationResult[]> {
    return Promise.all(requests.map(req => this.moderate(req)))
  }

  /**
   * Check if content should be auto-approved
   */
  async shouldAutoApprove(content: string): Promise<boolean> {
    const result = await this.moderate({ content, contentType: 'text' })
    return result.approved && result.action === 'approve'
  }
}
