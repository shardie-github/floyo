/**
 * Accessibility Utilities
 * 
 * Improves accessibility for better UX and compliance.
 * Taps into: "I want everyone to be able to use this"
 */

/**
 * Announce to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus trap for modals
 */
export function createFocusTrap(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTab);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTab);
  };
}

/**
 * Skip to main content link
 */
export function addSkipToContentLink(): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById('skip-to-content')) return;

  const link = document.createElement('a');
  link.id = 'skip-to-content';
  link.href = '#main-content';
  link.textContent = 'Skip to main content';
  link.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded';
  document.body.insertBefore(link, document.body.firstChild);
}

/**
 * Initialize accessibility features
 */
export function initAccessibility(): void {
  if (typeof window === 'undefined') return;

  addSkipToContentLink();

  // Add main content landmark if missing
  const main = document.querySelector('main');
  if (main && !main.id) {
    main.id = 'main-content';
  }
}
