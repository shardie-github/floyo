/**
 * Structured Data Components
 * 
 * JSON-LD structured data for SEO.
 */

import { generateOrganizationSchema, generateWebsiteSchema } from './metadata';

export function OrganizationStructuredData() {
  const schema = generateOrganizationSchema();
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteStructuredData() {
  const schema = generateWebsiteSchema();
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
