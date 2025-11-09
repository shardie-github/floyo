/**
 * Voice Commands Interface
 * 
 * Hands-free operation using Web Speech API.
 * Taps into: "I want to control things with my voice"
 */

export interface VoiceCommand {
  command: string;
  action: () => void | Promise<void>;
  keywords: string[];
}

class VoiceCommandService {
  private recognition: SpeechRecognition | null = null;
  private commands: VoiceCommand[] = [];
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // @ts-expect-error - WebKit Speech Recognition API
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        this.processCommand(transcript);
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
      };
    }
  }

  /**
   * Register a voice command
   */
  register(command: VoiceCommand): void {
    this.commands.push(command);
  }

  /**
   * Process voice command
   */
  private processCommand(transcript: string): void {
    for (const cmd of this.commands) {
      const matched = cmd.keywords.some(keyword => transcript.includes(keyword.toLowerCase()));
      if (matched) {
        cmd.action();
        this.announce(`Executed: ${cmd.command}`);
        break;
      }
    }
  }

  /**
   * Start listening
   */
  start(): void {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) return;

    this.recognition.start();
    this.isListening = true;
    this.announce('Listening for voice commands');
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (!this.recognition || !this.isListening) return;

    this.recognition.stop();
    this.isListening = false;
    this.announce('Stopped listening');
  }

  /**
   * Toggle listening
   */
  toggle(): void {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Announce to user
   */
  private announce(message: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.volume = 0.5;
      speechSynthesis.speak(utterance);
    }
  }

  /**
   * Check if voice commands are supported
   */
  isSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Get listening status
   */
  getListeningStatus(): boolean {
    return this.isListening;
  }
}

export const voiceCommands = new VoiceCommandService();

// Register default commands
if (typeof window !== 'undefined') {
  voiceCommands.register({
    command: 'Search',
    keywords: ['search', 'find', 'look for'],
    action: () => {
      const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
      searchInput?.focus();
    },
  });

  voiceCommands.register({
    command: 'Dashboard',
    keywords: ['dashboard', 'home', 'main'],
    action: () => {
      window.location.href = '/dashboard';
    },
  });

  voiceCommands.register({
    command: 'Notifications',
    keywords: ['notifications', 'alerts', 'messages'],
    action: () => {
      const notificationButton = document.querySelector<HTMLButtonElement>('[aria-label="Notifications"]');
      notificationButton?.click();
    },
  });
}
