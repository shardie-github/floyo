'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface NPSSurveyProps {
  onClose?: () => void;
}

export function NPSSurvey({ onClose }: NPSSurveyProps) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showSurvey, setShowSurvey] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if user should see survey
    const lastSurveyDate = localStorage.getItem('lastNPSSurvey');
    const daysSinceLastSurvey = lastSurveyDate 
      ? (Date.now() - parseInt(lastSurveyDate)) / (1000 * 60 * 60 * 24)
      : Infinity;

    // Show survey if:
    // - Never shown before, OR
    // - Last shown > 90 days ago, AND
    // - User has been active for at least 7 days
    const userCreatedAt = localStorage.getItem('userCreatedAt');
    const daysSinceSignup = userCreatedAt
      ? (Date.now() - parseInt(userCreatedAt)) / (1000 * 60 * 60 * 24)
      : 0;

    if (daysSinceLastSurvey > 90 && daysSinceSignup >= 7) {
      setShowSurvey(true);
    }
  }, []);

  const handleSubmit = async () => {
    if (score === null) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/nps/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          score, 
          feedback: feedback.trim() || null 
        }),
      });

      if (response.ok) {
        localStorage.setItem('lastNPSSurvey', Date.now().toString());
        setShowSurvey(false);
        onClose?.();
      }
    } catch (error) {
      console.error('Failed to submit NPS survey:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('lastNPSSurvey', Date.now().toString());
    setShowSurvey(false);
    onClose?.();
  };

  if (!showSurvey) return null;

  return (
    <Dialog open={showSurvey} onOpenChange={setShowSurvey}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How likely are you to recommend Floyo?</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">Not likely</span>
            <span className="text-sm text-gray-500">Very likely</span>
          </div>
          
          <div className="grid grid-cols-11 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setScore(n)}
                className={`h-12 rounded transition-colors ${
                  score === n
                    ? 'bg-blue-600 text-white scale-110'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {score !== null && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  What's the main reason for your score?
                </label>
                <textarea
                  placeholder="Your feedback helps us improve..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-3 border rounded-md resize-none"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  disabled={submitting}
                >
                  Skip
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
