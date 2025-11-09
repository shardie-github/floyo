'use client';

import { useEffect } from 'react';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  ctrl?: boolean;
  shift?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function KeyboardShortcutsHelp() {
  const shortcuts = [
    { key: 'k', ctrl: true, description: 'Open search' },
    { key: 'g', ctrl: true, description: 'Go to dashboard' },
    { key: 's', ctrl: true, description: 'Settings' },
    { key: '?', description: 'Show shortcuts' },
  ];

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-xs z-40">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Keyboard Shortcuts</h3>
      <div className="space-y-1 text-sm">
        {shortcuts.map((shortcut, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{shortcut.description}</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
              {shortcut.ctrl && 'Ctrl+'}
              {shortcut.shift && 'Shift+'}
              {shortcut.key.toUpperCase()}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
