const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pawhome.ie';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/profile', '/post-ad', '/api'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
