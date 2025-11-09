import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const isPreview = process.env.VERCEL_ENV === 'preview' || 
                    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
  
  if (isPreview) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`
      : undefined,
  };
}
