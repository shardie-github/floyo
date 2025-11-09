'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { voiceCommands } from '@/lib/ai/voice-commands';

export function VoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(voiceCommands.isSupported());
    setIsListening(voiceCommands.getListeningStatus());
  }, []);

  const handleToggle = () => {
    if (isListening) {
      voiceCommands.stop();
    } else {
      voiceCommands.start();
    }
    setIsListening(!isListening);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-full transition-colors ${
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
      aria-label={isListening ? 'Stop listening' : 'Start voice commands'}
      title={isListening ? 'Listening... Click to stop' : 'Click to start voice commands'}
    >
      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
}
