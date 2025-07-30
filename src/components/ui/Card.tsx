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
      <div className={`card p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 ${className}`}>
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </Link>
  );
};

export default Card;