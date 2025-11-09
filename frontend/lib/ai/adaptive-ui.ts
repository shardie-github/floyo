/**
 * Adaptive UI Personalization
 * 
 * UI that adapts to user behavior and preferences.
 * Taps into: "I want the interface to learn and adapt to me"
 */

export interface UIProfile {
  userId: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    layout: 'compact' | 'comfortable' | 'spacious';
    sidebar: 'collapsed' | 'expanded';
    defaultView: 'dashboard' | 'files' | 'insights';
    favoriteFeatures: string[];
  };
  behavior: {
    mostUsedFeatures: Array<{ feature: string; count: number }>;
    preferredTimeOfDay: number[];
    interactionPattern: 'mouse' | 'keyboard' | 'touch' | 'mixed';
  };
}

export class AdaptiveUIService {
  /**
   * Learn from user interactions
   */
  trackInteraction(feature: string, interactionType: 'click' | 'keyboard' | 'touch'): void {
    const profile = this.getProfile();
    
    // Update most used features
    const existing = profile.behavior.mostUsedFeatures.find(f => f.feature === feature);
    if (existing) {
      existing.count++;
    } else {
      profile.behavior.mostUsedFeatures.push({ feature, count: 1 });
    }

    // Update interaction pattern
    const hour = new Date().getHours();
    if (!profile.behavior.preferredTimeOfDay.includes(hour)) {
      profile.behavior.preferredTimeOfDay.push(hour);
      profile.behavior.preferredTimeOfDay.sort();
    }

    // Detect interaction pattern
    if (interactionType === 'keyboard') {
      profile.behavior.interactionPattern = 'keyboard';
    } else if (interactionType === 'touch') {
      profile.behavior.interactionPattern = 'touch';
    } else if (profile.behavior.interactionPattern === 'mouse') {
      // Keep mouse if already set, but allow mixed
      if (profile.behavior.mostUsedFeatures.some(f => f.feature.includes('keyboard'))) {
        profile.behavior.interactionPattern = 'mixed';
      }
    }

    this.saveProfile(profile);
  }

  /**
   * Get personalized UI recommendations
   */
  getRecommendations(userId: string): {
    layout?: 'compact' | 'comfortable' | 'spacious';
    shortcuts?: string[];
    features?: string[];
  } {
    const profile = this.getProfile();

    const recommendations: {
      layout?: 'compact' | 'comfortable' | 'spacious';
      shortcuts?: string[];
      features?: string[];
    } = {};

    // Recommend layout based on interaction pattern
    if (profile.behavior.interactionPattern === 'keyboard') {
      recommendations.layout = 'compact';
      recommendations.shortcuts = ['Ctrl+K', 'Ctrl+G', 'Ctrl+S'];
    } else if (profile.behavior.interactionPattern === 'touch') {
      recommendations.layout = 'spacious';
    }

    // Recommend features based on usage
    const topFeatures = profile.behavior.mostUsedFeatures
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(f => f.feature);

    if (topFeatures.length > 0) {
      recommendations.features = topFeatures;
    }

    return recommendations;
  }

  /**
   * Get user profile
   */
  private getProfile(): UIProfile {
    const stored = localStorage.getItem('ui-profile');
    if (stored) {
      return JSON.parse(stored);
    }

    return {
      userId: 'default',
      preferences: {
        theme: 'auto',
        layout: 'comfortable',
        sidebar: 'expanded',
        defaultView: 'dashboard',
        favoriteFeatures: [],
      },
      behavior: {
        mostUsedFeatures: [],
        preferredTimeOfDay: [],
        interactionPattern: 'mouse',
      },
    };
  }

  /**
   * Save profile
   */
  private saveProfile(profile: UIProfile): void {
    localStorage.setItem('ui-profile', JSON.stringify(profile));
  }

  /**
   * Apply adaptive UI changes
   */
  applyAdaptations(userId: string): void {
    const recommendations = this.getRecommendations(userId);
    const profile = this.getProfile();

    // Apply layout
    if (recommendations.layout && recommendations.layout !== profile.preferences.layout) {
      document.documentElement.setAttribute('data-layout', recommendations.layout);
    }

    // Show shortcuts hint for keyboard users
    if (profile.behavior.interactionPattern === 'keyboard') {
      const shortcutsHint = document.getElementById('keyboard-shortcuts-hint');
      if (shortcutsHint) {
        shortcutsHint.style.display = 'block';
      }
    }
  }
}

export const adaptiveUI = new AdaptiveUIService();
