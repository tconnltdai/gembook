import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
    >
      <defs>
        <linearGradient id="gemGradient" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" /> {/* Indigo-600 */}
          <stop offset="1" stopColor="#9333EA" /> {/* Purple-600 */}
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer Glow (Optional, subtle) */}
      <circle cx="16" cy="16" r="14" fill="url(#gemGradient)" fillOpacity="0.1" />

      {/* Hexagon Gem Base */}
      <path 
        d="M16 2L29 9.5V22.5L16 30L3 22.5V9.5L16 2Z" 
        fill="url(#gemGradient)" 
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      
      {/* Internal Facets/Network Lines */}
      <path d="M16 16L16 2" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
      <path d="M16 16L29 9.5" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
      <path d="M16 16L29 22.5" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
      <path d="M16 16L16 30" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
      <path d="M16 16L3 22.5" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
      <path d="M16 16L3 9.5" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>

      {/* Central Node */}
      <circle cx="16" cy="16" r="3" fill="white" />
      
      {/* Satellite Nodes (Hive Mind) */}
      <circle cx="16" cy="6" r="1.5" fill="white" fillOpacity="0.8" />
      <circle cx="24.5" cy="11" r="1.5" fill="white" fillOpacity="0.8" />
      <circle cx="24.5" cy="21" r="1.5" fill="white" fillOpacity="0.8" />
      <circle cx="16" cy="26" r="1.5" fill="white" fillOpacity="0.8" />
      <circle cx="7.5" cy="21" r="1.5" fill="white" fillOpacity="0.8" />
      <circle cx="7.5" cy="11" r="1.5" fill="white" fillOpacity="0.8" />
    </svg>
  );
};

export default Logo;