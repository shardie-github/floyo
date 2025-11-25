import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shopify Automation Tools - Floyo',
  description: 'Automate your Shopify store workflows. Connect Shopify with TikTok Ads, Meta Ads, Zapier, and more. Save hours every day.',
  keywords: 'shopify automation, e-commerce automation, shopify integrations, workflow automation',
};

export default function ShopifyAutomationPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Automate Your Shopify Store Workflows
          </h1>
          <p className="text-xl mb-8">
            Connect Shopify with TikTok Ads, Meta Ads, Zapier, and more. Save hours every day.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">The Problem</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Manual Work</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Spending 2-3 hours/day manually syncing data</li>
                <li>Copying orders from Shopify to Google Sheets</li>
                <li>Manually updating ad campaigns</li>
                <li>Exporting and importing CSV files</li>
              </ul>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Tool Sprawl</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Paying for 10+ tools you don't use</li>
                <li>Can't remember which tool does what</li>
                <li>Tools don't connect to each other</li>
                <li>Wasting $300-500/month on unused subscriptions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">How Floyo Solves This</h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">1. Automatic Pattern Discovery</h3>
              <p className="text-gray-700">
                Floyo watches how you use Shopify, TikTok Ads, Meta Ads, and other tools, then suggests automations based on your actual workflow.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">2. Concrete Integration Suggestions</h3>
              <p className="text-gray-700">
                Get actual Zapier workflows, API connections, and automation scripts—not just generic advice.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">3. Tool Optimization</h3>
              <p className="text-gray-700">
                See which tools you actually use vs. just subscribe to. Cancel unused subscriptions and save money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Common Automations</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Shopify → Google Sheets</h3>
              <p className="text-gray-600 text-sm">
                Automatically sync orders to Google Sheets for analysis
              </p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">TikTok Ads → Analytics</h3>
              <p className="text-gray-600 text-sm">
                Automatically export ad performance data to your analytics dashboard
              </p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Meta Ads → Shopify</h3>
              <p className="text-gray-600 text-sm">
                Sync ad performance with product sales in Shopify
              </p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Order Fulfillment</h3>
              <p className="text-gray-600 text-sm">
                Automatically trigger fulfillment workflows when orders are placed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Shopify Workflows?</h2>
          <p className="text-xl mb-8">Start free. No credit card required.</p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
