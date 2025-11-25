import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy-First Productivity Tools - Floyo | Workflow Insights Without Exposing Code',
  description: 'Get workflow insights without exposing your code. Floyo tracks metadata only, never file content. GDPR-compliant, HIPAA-ready, self-hosted option.',
  keywords: 'privacy-first productivity, developer privacy, workflow tracking, gdpr compliant, hipaa compliant',
};

export default function PrivacyFirstProductivityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Privacy-First Workflow Insights
          </h1>
          <p className="text-xl mb-8">
            Get productivity insights without exposing your code. Metadata only, never content.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Privacy Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Privacy-First Design</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
              <h3 className="font-semibold text-lg mb-4 text-green-800">What We Track</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ File paths (not content)</li>
                <li>✅ Tool names (VS Code, Terminal, etc.)</li>
                <li>✅ Timestamps</li>
                <li>✅ Usage patterns</li>
              </ul>
            </div>
            <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
              <h3 className="font-semibold text-lg mb-4 text-red-800">What We Never Track</h3>
              <ul className="space-y-2 text-gray-700">
                <li>❌ File content</li>
                <li>❌ Code snippets</li>
                <li>❌ Sensitive data</li>
                <li>❌ Personal information</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Compliance Ready</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="font-semibold mb-2">GDPR Compliant</h3>
              <p className="text-sm text-gray-600">Full data export, deletion, and consent management</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="font-semibold mb-2">HIPAA Ready</h3>
              <p className="text-sm text-gray-600">Metadata-only tracking meets healthcare requirements</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="text-4xl mb-4">☁️</div>
              <h3 className="font-semibold mb-2">Self-Hosted</h3>
              <p className="text-sm text-gray-600">Self-hosted option for complete control</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Perfect For</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Healthcare Developers</h3>
              <p className="text-gray-600 text-sm">
                Healthcare developers working with PHI
              </p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Finance Developers</h3>
              <p className="text-gray-600 text-sm">
                Financial developers handling sensitive data
              </p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Government Contractors</h3>
              <p className="text-gray-600 text-sm">
                Developers working on government projects
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Insights Without Compromising Privacy?</h2>
          <p className="text-xl mb-8">Start free. Privacy-first. No code content tracked.</p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
