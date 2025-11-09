/**
 * Push Notifications Service
 * 
 * Browser push notifications for achievements, streaks, insights.
 * Taps into: "I want to know when something happens"
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushNotificationService {
  private permission: NotificationPermission = 'default';

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  /**
   * Send notification
   */
  async send(payload: NotificationPayload): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return;
      }
    }

    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      tag: payload.tag,
      data: payload.data,
      requireInteraction: payload.requireInteraction,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle click
    notification.onclick = () => {
      window.focus();
      if (payload.data?.url) {
        window.location.href = payload.data.url as string;
      }
      notification.close();
    };
  }

  /**
   * Send achievement notification
   */
  async sendAchievement(achievement: {
    name: string;
    icon: string;
    xp: number;
  }): Promise<void> {
    await this.send({
      title: '🎉 Achievement Unlocked!',
      body: `${achievement.name} - +${achievement.xp} XP`,
      icon: '/icon-192x192.png',
      tag: `achievement-${achievement.name}`,
      requireInteraction: true,
      data: { url: '/dashboard' },
    });
  }

  /**
   * Send streak notification
   */
  async sendStreakReminder(days: number): Promise<void> {
    await this.send({
      title: '🔥 Keep Your Streak Alive!',
      body: `You're on a ${days} day streak. Don't break it!`,
      tag: 'streak-reminder',
      data: { url: '/dashboard' },
    });
  }

  /**
   * Send FOMO notification
   */
  async sendFOMO(message: string, expiresIn: string): Promise<void> {
    await this.send({
      title: '⏰ Limited Time Opportunity',
      body: `${message} (Expires in ${expiresIn})`,
      tag: 'fomo-alert',
      requireInteraction: true,
      data: { url: '/dashboard' },
    });
  }

  /**
   * Send insight notification
   */
  async sendInsight(title: string, message: string): Promise<void> {
    await this.send({
      title,
      body: message,
      tag: 'insight',
      data: { url: '/dashboard' },
    });
  }
}

export const pushNotifications = new PushNotificationService();
