import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Developer Productivity Tools - Floyo',
  description: 'Track your coding patterns, optimize your workflow, and discover tools that fit your development style. Privacy-first developer productivity.',
  keywords: 'developer productivity, workflow tracking, coding patterns, developer tools, privacy-first',
};

export default function DeveloperProductivityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Optimize Your Developer Workflow
          </h1>
          <p className="text-xl mb-8">
            Track your coding patterns, discover integrations, and boost productivity. Privacy-first.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100"
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
              <h3 className="font-semibold text-lg mb-4">Context Loss</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Can't remember what you worked on yesterday</li>
                <li>Switching between multiple projects</li>
                <li>Losing track of which files you modified</li>
                <li>No visibility into your own workflow</li>
              </ul>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Tool Discovery</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Hard to find tools that fit your workflow</li>
                <li>Don't know which VS Code extensions you actually use</li>
                <li>Paying for tools you don't need</li>
                <li>Missing integration opportunities</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">How Floyo Helps</h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">1. Automatic Pattern Tracking</h3>
              <p className="text-gray-700">
                Floyo automatically tracks which files you open, which scripts you run, and which tools you use—no manual logging required.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">2. Privacy-First Design</h3>
              <p className="text-gray-700">
                We track metadata only—never your code content. Your code stays private while you get insights.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">3. Integration Suggestions</h3>
              <p className="text-gray-700">
                Get suggestions for tools and integrations that fit your actual coding patterns—not generic recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">File Usage Tracking</h3>
              <p className="text-gray-600 text-sm">
                See which files you use together most often
              </p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Script Pattern Analysis</h3>
              <p className="text-gray-600 text-sm">
                Discover patterns in your script executions
              </p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Tool Usage Insights</h3>
              <p className="text-gray-600 text-sm">
                See which tools you actually use vs. subscribe to
              </p>
            </div>
            <div className="border p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Integration Suggestions</h3>
              <p className="text-gray-600 text-sm">
                Get AI-powered suggestions for tools and workflows
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Workflow?</h2>
          <p className="text-xl mb-8">Start free. Privacy-first. No code content tracked.</p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
