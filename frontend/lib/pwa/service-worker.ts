/**
 * Service Worker Registration and Management
 * 
 * Enhanced PWA support with offline capabilities and push notifications.
 */

const CACHE_NAME = 'floyo-v1';
const OFFLINE_URL = '/offline';

/**
 * Install service worker
 */
export async function installServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('Service Worker registered:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New service worker available');
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  
  return Notification.permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    const permission = await requestPushPermission();
    if (permission !== 'granted') {
      return null;
    }
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });
    
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

/**
 * Show notification
 */
export function showNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
}
