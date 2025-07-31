import Link from 'next/link';
import React from 'react';

interface CardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

const Card: React.FC<CardProps> = ({ href, icon, title, description, className }) => {
  return (
    <Link href={href} className="group">
      <div className={`card p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 ${className}`}>
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
      </div>
    </Link>
  );
};

export default Card;