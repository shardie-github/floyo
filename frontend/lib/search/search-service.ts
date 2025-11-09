/**
 * Search Service
 * 
 * Full-text search for files, events, and patterns.
 * Taps into user need: "I want to find things quickly"
 */

import prisma from '@/lib/db/prisma';

export interface SearchResult {
  type: 'file' | 'event' | 'pattern';
  id: string;
  title: string;
  description: string;
  relevance: number;
  metadata?: Record<string, unknown>;
}

export class SearchService {
  /**
   * Search across files, events, and patterns
   */
  async search(
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<SearchResult[]> {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) {
      return [];
    }

    const results: SearchResult[] = [];

    // Search events (file paths)
    const events = await prisma.event.findMany({
      where: {
        userId,
        filePath: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
    });

    events.forEach(event => {
      const relevance = this.calculateRelevance(event.filePath, searchTerm);
      results.push({
        type: 'event',
        id: event.id,
        title: event.filePath.split('/').pop() || event.filePath,
        description: `Last accessed ${new Date(event.timestamp).toLocaleDateString()}`,
        relevance,
        metadata: {
          eventType: event.eventType,
          tool: event.tool,
          timestamp: event.timestamp,
        },
      });
    });

    // Search patterns
    const patterns = await prisma.pattern.findMany({
      where: {
        userId,
        fileExtension: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      take: limit,
    });

    patterns.forEach(pattern => {
      const relevance = this.calculateRelevance(pattern.fileExtension, searchTerm);
      results.push({
        type: 'pattern',
        id: pattern.id,
        title: `.${pattern.fileExtension} files`,
        description: `Used ${pattern.count} times`,
        relevance,
        metadata: {
          count: pattern.count,
          tools: pattern.tools,
          lastUsed: pattern.lastUsed,
        },
      });
    });

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Calculate relevance score (0-1)
   */
  private calculateRelevance(text: string, query: string): number {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Exact match
    if (lowerText === lowerQuery) return 1.0;

    // Starts with query
    if (lowerText.startsWith(lowerQuery)) return 0.8;

    // Contains query
    if (lowerText.includes(lowerQuery)) {
      const position = lowerText.indexOf(lowerQuery);
      // Earlier in string = more relevant
      return 0.6 - (position / text.length) * 0.2;
    }

    // Word match
    const words = lowerText.split(/[\s\/\-_\.]/);
    const queryWords = lowerQuery.split(/[\s\/\-_\.]/);
    let wordMatches = 0;
    queryWords.forEach(qw => {
      if (words.some(w => w.includes(qw))) wordMatches++;
    });
    if (wordMatches > 0) {
      return 0.4 * (wordMatches / queryWords.length);
    }

    return 0.1;
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(userId: string, query: string): Promise<string[]> {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const suggestions = new Set<string>();

    // Get file paths that match
    const events = await prisma.event.findMany({
      where: {
        userId,
        filePath: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      select: { filePath: true },
      take: 10,
      distinct: ['filePath'],
    });

    events.forEach(event => {
      const fileName = event.filePath.split('/').pop();
      if (fileName) {
        suggestions.add(fileName);
      }
    });

    // Get file extensions
    const patterns = await prisma.pattern.findMany({
      where: {
        userId,
        fileExtension: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      select: { fileExtension: true },
      take: 5,
    });

    patterns.forEach(pattern => {
      suggestions.add(`.${pattern.fileExtension}`);
    });

    return Array.from(suggestions).slice(0, 10);
  }
}
