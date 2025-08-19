import React from 'react';

interface Props {
  data: Record<string, any>;
}

/**
 * Component for adding JSON-LD structured data to pages
 * This helps search engines understand the content better
 */
const StructuredData: React.FC<Props> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2),
      }}
    />
  );
};

export default StructuredData;
