/**
 * AI Chat Assistant
 * 
 * Conversational AI to help users navigate and understand the system.
 * Taps into: "I want to ask questions and get intelligent answers"
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export interface ChatContext {
  userId?: string;
  recentActions?: string[];
  currentPage?: string;
}

class ChatAssistant {
  private messages: ChatMessage[] = [];
  private context: ChatContext = {};

  /**
   * Set context
   */
  setContext(context: ChatContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Process user message
   */
  async processMessage(userMessage: string): Promise<ChatMessage> {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    this.messages.push(userMsg);

    // Simple rule-based responses (in production, use GPT/Claude API)
    const response = this.generateResponse(userMessage);

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
      suggestions: response.suggestions,
    };

    this.messages.push(assistantMsg);
    return assistantMsg;
  }

  /**
   * Generate response (rule-based, upgrade to LLM in production)
   */
  private generateResponse(message: string): { content: string; suggestions?: string[] } {
    const lowerMessage = message.toLowerCase();

    // Greetings
    if (lowerMessage.match(/^(hi|hello|hey|greetings)/)) {
      return {
        content: "Hello! I'm your Floyo assistant. How can I help you today?",
        suggestions: [
          'How do I search for files?',
          'What are my stats?',
          'How do I set up integrations?',
        ],
      };
    }

    // Search
    if (lowerMessage.match(/(search|find|look for)/)) {
      return {
        content: "You can search for files, events, and patterns using the search bar at the top. Press Ctrl+K to quickly open search, or use voice commands by saying 'search'.",
        suggestions: [
          'Try searching for a file type',
          'Search by tool name',
        ],
      };
    }

    // Stats
    if (lowerMessage.match(/(stats|statistics|metrics|performance)/)) {
      return {
        content: "Your stats are available on the dashboard. You can see your level, XP, streak, badges, efficiency score, and productivity metrics. Check the Gamification Dashboard for detailed stats.",
        suggestions: [
          'View my achievements',
          'Check my efficiency',
        ],
      };
    }

    // Integrations
    if (lowerMessage.match(/(integrat|connect|link)/)) {
      return {
        content: "Floyo automatically detects your file usage patterns and suggests integrations. Check the Recommendations panel for AI-powered suggestions based on your workflow.",
        suggestions: [
          'Show me recommended integrations',
          'How do I set up an integration?',
        ],
      };
    }

    // Voice commands
    if (lowerMessage.match(/(voice|speak|talk)/)) {
      return {
        content: "Voice commands are available! Click the microphone icon or say 'Hey Floyo' to activate. You can search, navigate, and control the app hands-free.",
        suggestions: [
          'What voice commands are available?',
          'How do I enable voice?',
        ],
      };
    }

    // Help
    if (lowerMessage.match(/(help|how|what|guide)/)) {
      return {
        content: "I can help you with:\n• Searching for files and patterns\n• Understanding your stats and achievements\n• Setting up integrations\n• Using voice commands\n• Automating workflows\n\nWhat would you like to know more about?",
        suggestions: [
          'How do I search?',
          'What are achievements?',
          'How do automations work?',
        ],
      };
    }

    // Default response
    return {
      content: "I'm here to help! Try asking about:\n• Searching for files\n• Your stats and achievements\n• Setting up integrations\n• Voice commands\n• Workflow automation\n\nOr type 'help' for more options.",
      suggestions: [
        'How do I search?',
        'What are my stats?',
        'Show me integrations',
      ],
    };
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Clear conversation
   */
  clear(): void {
    this.messages = [];
  }
}

export const chatAssistant = new ChatAssistant();
