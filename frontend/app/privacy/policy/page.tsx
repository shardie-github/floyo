/**
 * Privacy Policy Page
 * Render the privacy policy document
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export default function PrivacyPolicyPage() {
  const policyPath = join(process.cwd(), 'docs', 'privacy', 'monitoring-policy.md');
  const policyContent = readFileSync(policyPath, 'utf-8');

  // Simple markdown to HTML conversion (basic)
  const htmlContent = policyContent
    .split('\n')
    .map((line) => {
      if (line.startsWith('# ')) {
        return `<h1>${line.substring(2)}</h1>`;
      } else if (line.startsWith('## ')) {
        return `<h2>${line.substring(3)}</h2>`;
      } else if (line.startsWith('### ')) {
        return `<h3>${line.substring(4)}</h3>`;
      } else if (line.startsWith('• ')) {
        return `<li>${line.substring(2)}</li>`;
      } else if (line.trim() === '') {
        return '<br/>';
      } else {
        return `<p>${line}</p>`;
      }
    })
    .join('\n');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    </div>
  );
}
