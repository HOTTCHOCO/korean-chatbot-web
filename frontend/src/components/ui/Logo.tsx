import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* UNNI 아이콘 */}
      <div className={`${sizeClasses[size]} font-bold text-primary-600 bg-primary-100 rounded-full w-10 h-10 flex items-center justify-center`}>
        U
      </div>
      
      {/* 로고 텍스트 */}
      <div className="flex flex-col">
        <span className={`${sizeClasses[size]} font-bold text-primary-800`}>
          UNNI
        </span>
        <span className="text-xs text-primary-500 font-medium">
          chat
        </span>
      </div>
    </div>
  );
};

export default Logo;
