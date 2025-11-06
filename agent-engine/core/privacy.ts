/**
 * Privacy Layer - PII Tokenization & Sanitization
 * Tokenize all PII before model exposure
 */

import type { TokenizedData } from './types.js';
import { createHash } from 'crypto';

export class PrivacyLayer {
  private tokenMap: Map<string, TokenizedData> = new Map();
  private reverseMap: Map<string, string> = new Map();

  // Regex patterns for PII detection
  private patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\+?\d{10,15}\b/g,
    ip: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    user_id: /\buser[_\-]?id[:=]\s*['"]?([A-Za-z0-9_-]+)['"]?/gi,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  };

  /**
   * Tokenize PII in data (recursive)
   */
  tokenize(data: any): any {
    if (typeof data === 'string') {
      return this.tokenizeString(data);
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.tokenize(item));
    }
    if (data && typeof data === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip known safe keys
        if (['id', 'timestamp', 'created_at', 'updated_at'].includes(key)) {
          sanitized[key] = value;
        } else {
          sanitized[key] = this.tokenize(value);
        }
      }
      return sanitized;
    }
    return data;
  }

  /**
   * Tokenize string containing PII
   */
  private tokenizeString(text: string): string {
    let sanitized = text;

    // Tokenize emails
    sanitized = sanitized.replace(this.patterns.email, (match) => {
      return this.createToken(match, 'email');
    });

    // Tokenize phones
    sanitized = sanitized.replace(this.patterns.phone, (match) => {
      return this.createToken(match, 'phone');
    });

    // Tokenize IPs
    sanitized = sanitized.replace(this.patterns.ip, (match) => {
      return this.createToken(match, 'ip');
    });

    // Tokenize user IDs
    sanitized = sanitized.replace(this.patterns.user_id, (match, userId) => {
      const token = this.createToken(userId, 'user_id');
      return match.replace(userId, token);
    });

    // Tokenize SSNs
    sanitized = sanitized.replace(this.patterns.ssn, (match) => {
      return this.createToken(match, 'other');
    });

    return sanitized;
  }

  /**
   * Create token for PII value
   */
  private createToken(value: string, type: TokenizedData['type']): string {
    // Check if already tokenized
    const existing = this.reverseMap.get(value);
    if (existing) return existing;

    // Generate deterministic token (hash-based)
    const hash = createHash('sha256').update(value).digest('hex').substring(0, 16);
    const token = `[${type.toUpperCase()}_${hash}]`;

    // Store mapping
    const tokenized: TokenizedData = {
      original: value,
      token,
      type,
    };
    this.tokenMap.set(token, tokenized);
    this.reverseMap.set(value, token);

    return token;
  }

  /**
   * Detokenize (restore original PII) - only for authorized operations
   */
  detokenize(token: string): string | null {
    const tokenized = this.tokenMap.get(token);
    return tokenized?.original || null;
  }

  /**
   * Detokenize entire data structure
   */
  detokenizeData(data: any): any {
    if (typeof data === 'string') {
      // Replace tokens with originals
      let restored = data;
      for (const [token, tokenized] of this.tokenMap.entries()) {
        restored = restored.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), tokenized.original);
      }
      return restored;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.detokenizeData(item));
    }
    if (data && typeof data === 'object') {
      const restored: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        restored[key] = this.detokenizeData(value);
      }
      return restored;
    }
    return data;
  }

  /**
   * Check if data contains PII
   */
  containsPII(data: any): boolean {
    const str = JSON.stringify(data);
    return Object.values(this.patterns).some((pattern) => pattern.test(str));
  }

  /**
   * Get sanitized telemetry record (minimal, no PII)
   */
  getSanitizedTelemetry(record: {
    toolName: string;
    tokensUsed: number;
    latencyMs: number;
    success: boolean;
  }): Record<string, any> {
    return {
      tool_name: record.toolName,
      token_used: record.tokensUsed,
      latency_ms: record.latencyMs,
      success: record.success,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear tokenization cache (for privacy)
   */
  clearCache(): void {
    this.tokenMap.clear();
    this.reverseMap.clear();
  }
}
