/**
 * Overlay Diagnostics Tracking
 * 
 * Captures detailed interaction diagnostics from overlays, modals, tooltips,
 * dropdowns, and all UI interactions to inform workflow model building.
 */

interface OverlayInteraction {
  type: 'click' | 'hover' | 'focus' | 'blur' | 'keydown' | 'keyup' | 'scroll' | 'resize';
  target: {
    tagName: string;
    id?: string;
    className?: string;
    dataTestId?: string;
    role?: string;
    ariaLabel?: string;
    textContent?: string;
  };
  overlay: {
    type: 'modal' | 'tooltip' | 'dropdown' | 'popover' | 'drawer' | 'none';
    id?: string;
    visible: boolean;
  };
  position: {
    x: number;
    y: number;
    viewport: { width: number; height: number };
  };
  timestamp: number;
  metadata: {
    key?: string;
    button?: number;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    scrollX?: number;
    scrollY?: number;
  };
  session: {
    sessionId: string;
    userId?: string;
    pageUrl: string;
    referrer?: string;
  };
}

interface BehaviorPattern {
  sequence: OverlayInteraction[];
  frequency: number;
  context: {
    page: string;
    timeOfDay: string;
    dayOfWeek: string;
  };
  outcome?: {
    success: boolean;
    duration: number;
    result?: string;
  };
}

class OverlayDiagnosticsTracker {
  private interactions: OverlayInteraction[] = [];
  private patterns: Map<string, BehaviorPattern> = new Map();
  private sessionId: string;
  private userId?: string;
  private isTracking: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadUserId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadUserId(): void {
    // Try to get user ID from various sources
    if (typeof window !== 'undefined') {
      // Check localStorage
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        this.userId = storedUserId;
      }

      // Check cookies
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'userId' || name === 'user_id') {
          this.userId = value;
          break;
        }
      }
    }
  }

  /**
   * Start tracking overlay interactions
   */
  startTracking(): void {
    if (this.isTracking) return;
    this.isTracking = true;

    // Track clicks
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    // Track hovers
    document.addEventListener('mouseenter', this.handleHover.bind(this), true);
    document.addEventListener('mouseleave', this.handleHover.bind(this), true);
    
    // Track focus events
    document.addEventListener('focus', this.handleFocus.bind(this), true);
    document.addEventListener('blur', this.handleBlur.bind(this), true);
    
    // Track keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    document.addEventListener('keyup', this.handleKeyUp.bind(this), true);
    
    // Track scroll
    document.addEventListener('scroll', this.handleScroll.bind(this), true);
    
    // Track resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Stop tracking overlay interactions
   */
  stopTracking(): void {
    if (!this.isTracking) return;
    this.isTracking = false;

    document.removeEventListener('click', this.handleClick.bind(this), true);
    document.removeEventListener('mouseenter', this.handleHover.bind(this), true);
    document.removeEventListener('mouseleave', this.handleHover.bind(this), true);
    document.removeEventListener('focus', this.handleFocus.bind(this), true);
    document.removeEventListener('blur', this.handleBlur.bind(this), true);
    document.removeEventListener('keydown', this.handleKeyDown.bind(this), true);
    document.removeEventListener('keyup', this.handleKeyUp.bind(this), true);
    document.removeEventListener('scroll', this.handleScroll.bind(this), true);
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  private detectOverlay(element: Element): { type: string; id?: string; visible: boolean } {
    // Check if element is in a modal
    const modal = element.closest('[role="dialog"], .modal, [data-testid*="modal"]');
    if (modal) {
      return {
        type: 'modal',
        id: modal.id || modal.getAttribute('data-testid') || undefined,
        visible: true,
      };
    }

    // Check if element is in a tooltip
    const tooltip = element.closest('[role="tooltip"], .tooltip, [data-testid*="tooltip"]');
    if (tooltip) {
      return {
        type: 'tooltip',
        id: tooltip.id || tooltip.getAttribute('data-testid') || undefined,
        visible: true,
      };
    }

    // Check if element is in a dropdown
    const dropdown = element.closest('[role="menu"], .dropdown-menu, [data-testid*="dropdown"]');
    if (dropdown) {
      return {
        type: 'dropdown',
        id: dropdown.id || dropdown.getAttribute('data-testid') || undefined,
        visible: true,
      };
    }

    // Check if element is in a popover
    const popover = element.closest('[role="tooltip"][data-popover], .popover');
    if (popover) {
      return {
        type: 'popover',
        id: popover.id || popover.getAttribute('data-testid') || undefined,
        visible: true,
      };
    }

    // Check if element is in a drawer
    const drawer = element.closest('[role="dialog"][data-drawer], .drawer');
    if (drawer) {
      return {
        type: 'drawer',
        id: drawer.id || drawer.getAttribute('data-testid') || undefined,
        visible: true,
      };
    }

    return { type: 'none', visible: false };
  }

  private extractTargetInfo(element: Element): OverlayInteraction['target'] {
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: element.className ? String(element.className) : undefined,
      dataTestId: element.getAttribute('data-testid') || undefined,
      role: element.getAttribute('role') || undefined,
      ariaLabel: element.getAttribute('aria-label') || undefined,
      textContent: element.textContent?.substring(0, 100) || undefined,
    };
  }

  private createInteraction(
    type: OverlayInteraction['type'],
    event: Event,
    metadata: Partial<OverlayInteraction['metadata']> = {}
  ): OverlayInteraction {
    const target = event.target as Element;
    const overlay = this.detectOverlay(target);
    const rect = target.getBoundingClientRect();

    let keyMetadata: Partial<OverlayInteraction['metadata']> = {};
    if (event instanceof KeyboardEvent) {
      keyMetadata = {
        key: event.key,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
      };
    } else if (event instanceof MouseEvent) {
      keyMetadata = {
        button: event.button,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
      };
    }

    return {
      type,
      target: this.extractTargetInfo(target),
      overlay,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      timestamp: Date.now(),
      metadata: {
        ...keyMetadata,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        ...metadata,
      },
      session: {
        sessionId: this.sessionId,
        userId: this.userId,
        pageUrl: window.location.href,
        referrer: document.referrer || undefined,
      },
    };
  }

  private handleClick(event: MouseEvent): void {
    const interaction = this.createInteraction('click', event);
    this.recordInteraction(interaction);
  }

  private handleHover(event: MouseEvent): void {
    const type = event.type === 'mouseenter' ? 'hover' : 'hover';
    const interaction = this.createInteraction(type, event);
    this.recordInteraction(interaction);
  }

  private handleFocus(event: FocusEvent): void {
    const interaction = this.createInteraction('focus', event);
    this.recordInteraction(interaction);
  }

  private handleBlur(event: FocusEvent): void {
    const interaction = this.createInteraction('blur', event);
    this.recordInteraction(interaction);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const interaction = this.createInteraction('keydown', event);
    this.recordInteraction(interaction);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const interaction = this.createInteraction('keyup', event);
    this.recordInteraction(interaction);
  }

  private handleScroll(event: Event): void {
    const interaction = this.createInteraction('scroll', event, {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    });
    this.recordInteraction(interaction);
  }

  private handleResize(event: UIEvent): void {
    const interaction = this.createInteraction('resize', event, {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    });
    this.recordInteraction(interaction);
  }

  /**
   * Record an interaction
   */
  private recordInteraction(interaction: OverlayInteraction): void {
    this.interactions.push(interaction);

    // Keep only last 1000 interactions in memory
    if (this.interactions.length > 1000) {
      this.interactions.shift();
    }

    // Batch send to server every 10 interactions or every 5 seconds
    if (this.interactions.length % 10 === 0) {
      this.flushInteractions();
    }
  }

  /**
   * Flush interactions to server
   */
  async flushInteractions(): Promise<void> {
    if (this.interactions.length === 0) return;

    const interactionsToSend = [...this.interactions];
    this.interactions = [];

    try {
      await fetch('/api/telemetry/overlay-diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interactions: interactionsToSend,
          sessionId: this.sessionId,
          userId: this.userId,
        }),
      });
    } catch (error) {
      console.error('Failed to send overlay diagnostics:', error);
      // Re-add interactions if send failed
      this.interactions.unshift(...interactionsToSend);
    }
  }

  /**
   * Analyze patterns from interactions
   */
  analyzePatterns(): BehaviorPattern[] {
    const patterns: Map<string, BehaviorPattern> = new Map();

    // Group interactions by sequence
    for (let i = 0; i < this.interactions.length - 2; i++) {
      const sequence = this.interactions.slice(i, i + 3);
      const key = this.generateSequenceKey(sequence);

      if (!patterns.has(key)) {
        patterns.set(key, {
          sequence,
          frequency: 0,
          context: {
            page: sequence[0].session.pageUrl,
            timeOfDay: new Date(sequence[0].timestamp).toISOString().split('T')[1].substring(0, 5),
            dayOfWeek: new Date(sequence[0].timestamp).toLocaleDateString('en-US', { weekday: 'long' }),
          },
        });
      }

      const pattern = patterns.get(key)!;
      pattern.frequency++;
    }

    return Array.from(patterns.values());
  }

  private generateSequenceKey(sequence: OverlayInteraction[]): string {
    return sequence
      .map((i) => `${i.type}:${i.target.tagName}:${i.overlay.type}`)
      .join('->');
  }

  /**
   * Get interaction statistics
   */
  getStatistics(): {
    totalInteractions: number;
    overlayTypes: Record<string, number>;
    interactionTypes: Record<string, number>;
    topTargets: Array<{ target: string; count: number }>;
  } {
    const overlayTypes: Record<string, number> = {};
    const interactionTypes: Record<string, number> = {};
    const targetCounts: Map<string, number> = new Map();

    for (const interaction of this.interactions) {
      overlayTypes[interaction.overlay.type] = (overlayTypes[interaction.overlay.type] || 0) + 1;
      interactionTypes[interaction.type] = (interactionTypes[interaction.type] || 0) + 1;

      const targetKey = `${interaction.target.tagName}${interaction.target.id ? `#${interaction.target.id}` : ''}`;
      targetCounts.set(targetKey, (targetCounts.get(targetKey) || 0) + 1);
    }

    const topTargets = Array.from(targetCounts.entries())
      .map(([target, count]) => ({ target, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalInteractions: this.interactions.length,
      overlayTypes,
      interactionTypes,
      topTargets,
    };
  }
}

// Singleton instance
let trackerInstance: OverlayDiagnosticsTracker | null = null;

export function getOverlayDiagnosticsTracker(): OverlayDiagnosticsTracker {
  if (!trackerInstance) {
    trackerInstance = new OverlayDiagnosticsTracker();
  }
  return trackerInstance;
}

export function startOverlayTracking(): void {
  const tracker = getOverlayDiagnosticsTracker();
  tracker.startTracking();
  
  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    tracker.flushInteractions();
  });
  
  // Periodic flush
  setInterval(() => {
    tracker.flushInteractions();
  }, 5000);
}

export type { OverlayInteraction, BehaviorPattern };
