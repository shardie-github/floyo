import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Zapier Alternative - Floyo | Discover Automations You Didn\'t Know Existed',
  description: 'Unlike Zapier, Floyo discovers automation opportunities automatically. Get suggestions based on your actual workflow patterns, not generic templates.',
  keywords: 'zapier alternative, workflow automation, automation discovery, workflow patterns',
};

export default function ZapierAlternativePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Zapier Alternative That Discovers Automations For You
          </h1>
          <p className="text-xl mb-8">
            Unlike Zapier, Floyo watches your workflow and suggests automations you didn't know existed.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            Try Floyo Free
          </Link>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Floyo vs. Zapier</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
              <h3 className="font-semibold text-lg mb-4 text-green-800">Floyo</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ Discovers automation opportunities automatically</li>
                <li>✅ Suggests based on YOUR workflow patterns</li>
                <li>✅ Privacy-first (metadata only, never content)</li>
                <li>✅ Developer-focused (understands code workflows)</li>
                <li>✅ Provides actual code examples</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <h3 className="font-semibold text-lg mb-4">Zapier</h3>
              <ul className="space-y-2 text-gray-700">
                <li>❌ Requires you to know what to automate</li>
                <li>❌ Generic templates, not personalized</li>
                <li>❌ Tracks content (privacy concerns)</li>
                <li>❌ Generic workflows, not developer-focused</li>
                <li>❌ UI-only, no code examples</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">How Floyo Works</h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 text-purple-600 rounded-full w-10 h-10 flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Automatic Pattern Discovery</h3>
                  <p className="text-gray-700">
                    Floyo watches how you work—which files you open, which scripts you run, which tools you use—automatically.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 text-purple-600 rounded-full w-10 h-10 flex items-center justify-center font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI-Powered Suggestions</h3>
                  <p className="text-gray-700">
                    Based on your actual patterns, Floyo suggests concrete automations—like "you always run this script then upload to Dropbox, here's a Zapier workflow for that."
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 text-purple-600 rounded-full w-10 h-10 flex items-center justify-center font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">One-Click Setup</h3>
                  <p className="text-gray-700">
                    Click "Set up integration" and Floyo guides you through the Zapier workflow setup. Done in minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Common Automations Floyo Discovers</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Shopify → Google Sheets</h3>
              <p className="text-gray-600 text-sm">
                Floyo notices you manually export orders daily, suggests automated Zapier workflow
              </p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Python Script → Dropbox</h3>
              <p className="text-gray-600 text-sm">
                Floyo sees you run script then upload, suggests automation
              </p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">TikTok Ads → Analytics</h3>
              <p className="text-gray-600 text-sm">
                Floyo detects manual data sync, suggests API integration
              </p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">GitHub → Slack</h3>
              <p className="text-gray-600 text-sm">
                Floyo notices code push patterns, suggests notification automation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Discover Automations?</h2>
          <p className="text-xl mb-8">Start free. No credit card required. Discover automations Zapier can't.</p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            Try Floyo Free
          </Link>
        </div>
      </section>
    </div>
  );
}
