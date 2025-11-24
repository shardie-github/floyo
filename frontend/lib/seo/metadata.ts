/**
 * SEO Metadata Utilities
 * 
 * Open Graph, structured data, and SEO helpers.
 */

import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  locale?: string;
}

/**
 * Generate comprehensive SEO metadata
 */
export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    image = '/og-image.png',
    url,
    type = 'website',
    siteName = 'Floyo',
    locale = 'en_US',
  } = config;
  
  const fullTitle = `${title} | ${siteName}`;
  const fullUrl = url ? `https://floyo.app${url}` : 'https://floyo.app';
  const fullImage = image.startsWith('http') ? image : `https://floyo.app${image}`;
  
  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [fullImage],
    },
    alternates: {
      canonical: fullUrl,
    },
  };
}

/**
 * Generate structured data (JSON-LD)
 */
export function generateStructuredData(type: 'Organization' | 'WebSite' | 'Product' | 'Article', data: Record<string, any>) {
  const baseStructure = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };
  
  return baseStructure;
}

/**
 * Generate organization structured data
 */
export function generateOrganizationSchema() {
  return generateStructuredData('Organization', {
    name: 'Floyo',
    url: 'https://floyo.app',
    logo: 'https://floyo.app/logo.png',
    description: 'File usage pattern tracking and integration suggestions',
    sameAs: [
      'https://twitter.com/floyo',
      'https://github.com/floyo',
    ],
  });
}

/**
 * Generate website structured data
 */
export function generateWebsiteSchema() {
  return generateStructuredData('WebSite', {
    name: 'Floyo',
    url: 'https://floyo.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://floyo.app/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  });
}
