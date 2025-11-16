'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Copy, Download } from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

interface TwoFactorSetup {
  qr_code: string;
  secret: string;
  backup_codes: string[];
}

export default function TwoFactorAuthPage() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status');
      if (response.ok) {
        const data = await response.json();
        setEnabled(data.enabled || false);
      }
    } catch (err) {
      console.error('Failed to check 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData(data);
        setSetupMode(true);
      } else {
        setError('Failed to start 2FA setup');
      }
    } catch (err) {
      setError('Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode,
          secret: setupData?.secret,
        }),
      });

      if (response.ok) {
        setEnabled(true);
        setSetupMode(false);
        setSuccess('2FA has been enabled successfully!');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
      });

      if (response.ok) {
        setEnabled(false);
        setSuccess('2FA has been disabled');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('Failed to disable 2FA');
      }
    } catch (err) {
      setError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (setupData?.backup_codes) {
      navigator.clipboard.writeText(setupData.backup_codes.join('\n'));
      setSuccess('Backup codes copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const downloadBackupCodes = () => {
    if (setupData?.backup_codes) {
      const content = `Floyo 2FA Backup Codes\n\n${setupData.backup_codes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'floyo-2fa-backup-codes.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading && !setupMode) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
        </div>

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!setupMode && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-semibold">2FA Status</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div className={`flex items-center gap-2 ${enabled ? 'text-green-600' : 'text-gray-400'}`}>
                {enabled ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
            </div>

            {enabled ? (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Two-factor authentication is currently enabled. Your account is protected with an additional security layer.
                </p>
                <button
                  onClick={disable2FA}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  Disable 2FA
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                  You'll need to enter a code from your authenticator app when signing in.
                </p>
                <button
                  onClick={startSetup}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Enable 2FA
                </button>
              </div>
            )}
          </div>
        )}

        {setupMode && setupData && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Step 1: Scan QR Code</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img src={setupData.qr_code} alt="2FA QR Code" className="w-48 h-48" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Or enter this code manually: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{setupData.secret}</code>
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Step 2: Enter Verification Code</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter the 6-digit code from your authenticator app to verify setup.
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={verifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Verify and Enable
              </button>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Step 3: Save Backup Codes</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {setupData.backup_codes.map((code, idx) => (
                    <div key={idx} className="p-2 bg-white dark:bg-gray-800 rounded">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyBackupCodes}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Codes
                </button>
                <button
                  onClick={downloadBackupCodes}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSetupMode(false);
                setVerificationCode('');
                setError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel Setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
