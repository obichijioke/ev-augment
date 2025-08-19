import React from 'react';

interface Props {
  url: string;
}

/**
 * Component for adding canonical URL meta tag
 * This helps prevent duplicate content issues
 */
const CanonicalUrl: React.FC<Props> = ({ url }) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://evcommunity.com';
  const canonicalUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  return (
    <link rel="canonical" href={canonicalUrl} />
  );
};

export default CanonicalUrl;
