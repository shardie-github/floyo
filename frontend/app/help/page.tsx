// [STAKE+TRUST:BEGIN:help_page]
"use client";

import { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'How do I export my data?',
    answer: 'You can export your data by visiting Settings → Privacy → Export Data, or by using the API endpoint /api/privacy/export.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'You can delete your account by visiting Settings → Privacy → Delete Account. This action is irreversible.',
  },
  {
    question: 'What data do you collect?',
    answer: 'We collect minimal data necessary to provide our service. You can see what we collect in our Privacy Policy.',
  },
  {
    question: 'How do I enable two-factor authentication?',
    answer: 'You can enable MFA in Settings → Privacy → Security → Two-Factor Authentication.',
  },
  {
    question: 'How do I contact support?',
    answer: 'You can contact support via email at support@example.com or through the in-app support widget.',
  },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Help Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          How can we help you?
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLineCap="round"
            strokeLineJoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        {filteredFAQs.map((faq, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {faq.question}
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLineCap="round"
                  strokeLineJoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Still Need Help?
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Contact our support team for assistance.
        </p>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Email:</strong> support@example.com
          </p>
          <p>
            <strong>Response Time:</strong> Within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}
// [STAKE+TRUST:END:help_page]
