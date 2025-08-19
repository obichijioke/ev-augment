import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://evcommunity.com';
  
  const robots = `User-agent: *
Allow: /

# Allow all forum content
Allow: /forums/
Allow: /forums/*/

# Disallow edit pages and admin areas
Disallow: /forums/*/edit
Disallow: /admin/
Disallow: /api/
Disallow: /auth/

# Disallow old thread URLs (they redirect anyway)
Disallow: /forums/thread/

# Allow specific important pages
Allow: /ev-listings
Allow: /marketplace
Allow: /whats-new

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
    },
  });
}
