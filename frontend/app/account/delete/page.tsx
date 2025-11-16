/**
 * Account Deletion Confirmation Page
 * 
 * Allows users to permanently delete their account and all associated data.
 * Implements GDPR-compliant account deletion flow.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');

  const requiredText = 'DELETE MY ACCOUNT';

  const handleDelete = async () => {
    if (confirmText !== requiredText) {
      setError(`Please type "${requiredText}" to confirm`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Call delete endpoint
      const response = await fetch('/api/privacy/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Logout and redirect
      await logout();
      router.push('/?deleted=true');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'warning') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Delete Account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
          </div>

          <div className="mt-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">What will be deleted:</h3>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                <li>Your profile and account information</li>
                <li>All your events and patterns</li>
                <li>All your integrations and workflows</li>
                <li>All your privacy preferences</li>
                <li>All your telemetry data</li>
              </ul>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This action is permanent and cannot be reversed. All your data
                will be permanently deleted according to our data retention policy.
              </p>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Confirm Account Deletion</h2>
          <p className="mt-2 text-sm text-gray-600">
            To confirm, please type <strong>{requiredText}</strong> below:
          </p>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mt-6">
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
            Confirmation
          </label>
          <input
            type="text"
            id="confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            placeholder={requiredText}
            disabled={loading}
          />
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => setStep('warning')}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || confirmText !== requiredText}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
