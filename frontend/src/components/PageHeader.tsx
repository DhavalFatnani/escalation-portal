import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string;
  children?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, badge, children }) => {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex items-center gap-4">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
            {title}
            {badge && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-normal">
                {badge}
              </span>
            )}
          </h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          {children}
        </div>
      </div>
      
      {/* Logo in top right */}
      <Link to="/" className="flex-shrink-0">
        <img 
          src="/logo.svg" 
          alt="KNOT Logo" 
          className="w-12 h-12 rounded-xl hover:scale-105 transition-transform" 
        />
      </Link>
    </div>
  );
};

export default PageHeader;

