import React from 'react';
import { generateColorFromSeed } from '../utils';

interface AvatarProps {
  seed: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ seed, size = 'md', className = '' }) => {
  const color = generateColorFromSeed(seed);
  
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-24 h-24 text-xl'
  };

  return (
    <div 
      className={`rounded-full flex items-center justify-center font-bold text-white shadow-sm border-2 border-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color }}
      title={seed}
    >
      {seed.charAt(0).toUpperCase()}
    </div>
  );
};

export default Avatar;