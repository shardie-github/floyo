'use client';

import { useState, useEffect } from 'react';

export default function InvitePage() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchReferralCode() {
      try {
        const response = await fetch('/api/referral/code');
        if (response.ok) {
          const data = await response.json();
          setReferralCode(data.referral_code);
          setReferralLink(data.referral_link);
        }
      } catch (error) {
        console.error('Error fetching referral code:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReferralCode();
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch('/api/referral/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function handleInvite() {
    if (!email) return;

    setSending(true);
    try {
      const response = await fetch('/api/referral/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitee_email: email }),
      });

      if (response.ok) {
        alert('Invitation sent!');
        setEmail('');
        fetchStats();
      } else {
        alert('Error sending invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Error sending invitation');
    } finally {
      setSending(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Invite Friends</h1>

        {/* Referral Code */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Referral Code</h2>
          <div className="flex items-center gap-4">
            <code className="text-2xl font-mono bg-gray-100 px-4 py-2 rounded">
              {referralCode}
            </code>
            <button
              onClick={() => copyToClipboard(referralCode)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copy Code
            </button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              onClick={() => copyToClipboard(referralLink)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copy Link
            </button>
          </div>
        </div>

        {/* Invite by Email */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Invite by Email</h2>
          <div className="flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              onClick={handleInvite}
              disabled={sending || !email}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Referral Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Referrals</div>
                <div className="text-2xl font-bold">{stats.total_referrals_used || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Rewards Given</div>
                <div className="text-2xl font-bold">{stats.total_rewards_given || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Last Used</div>
                <div className="text-sm">
                  {stats.last_used_at
                    ? new Date(stats.last_used_at).toLocaleDateString()
                    : 'Never'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rewards Info */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-semibold mb-2">How It Works</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>Share your referral code or link with friends</li>
            <li>When they sign up using your code, you both get rewards</li>
            <li>Earn free months, discounts, and more!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
