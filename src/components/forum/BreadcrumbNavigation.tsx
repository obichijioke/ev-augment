import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import StructuredData from '@/components/seo/StructuredData';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface Props {
  items: BreadcrumbItem[];
  className?: string;
}

const BreadcrumbNavigation: React.FC<Props> = ({ items, className = '' }) => {
  // Generate structured data for breadcrumbs
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: process.env.NEXT_PUBLIC_SITE_URL || 'https://evcommunity.com',
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.label,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://evcommunity.com'}${item.href}`,
      })),
    ],
  };

  return (
    <>
      {/* Structured Data for Breadcrumbs */}
      <StructuredData data={structuredData} />
      
      <nav 
        className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}
        aria-label="Breadcrumb"
      >
        {/* Home Link */}
        <Link 
          href="/" 
          className="flex items-center hover:text-blue-600 transition-colors"
          aria-label="Go to homepage"
        >
          <Home className="w-4 h-4" />
          <span className="sr-only">Home</span>
        </Link>

        {/* Breadcrumb Items */}
        {items.map((item, index) => (
          <React.Fragment key={item.href}>
            <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            
            {index === items.length - 1 ? (
              // Current page - not a link
              <span 
                className="font-medium text-gray-900 truncate max-w-xs"
                aria-current="page"
                title={item.label}
              >
                {item.label}
              </span>
            ) : (
              // Link to parent pages
              <Link 
                href={item.href}
                className="hover:text-blue-600 transition-colors truncate max-w-xs"
                title={item.label}
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
};

export default BreadcrumbNavigation;
