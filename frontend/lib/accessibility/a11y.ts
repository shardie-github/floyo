/**
 * Accessibility Utilities
 * 
 * ARIA helpers, keyboard navigation, and screen reader support.
 */

/**
 * Generate ARIA label for form fields
 */
export function getAriaLabel(fieldName: string, required?: boolean): string {
  return required ? `${fieldName} (required)` : fieldName;
}

/**
 * Generate ARIA describedby for form fields with help text
 */
export function getAriaDescribedBy(fieldId: string, helpTextId?: string): string | undefined {
  return helpTextId ? `${fieldId}-help` : undefined;
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
  Enter: 'Enter',
  Escape: 'Escape',
  Tab: 'Tab',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
  Space: ' ',
} as const;

/**
 * Focus management utilities
 */
export function trapFocus(element: HTMLElement): () => void {
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
  
  return () => {
    element.removeEventListener('keydown', handleTab);
  };
}

/**
 * Announce to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
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
 * Skip link component helper
 */
export function createSkipLink(targetId: string, label: string = 'Skip to main content') {
  return {
    href: `#${targetId}`,
    label,
    className: 'skip-link',
  };
}
