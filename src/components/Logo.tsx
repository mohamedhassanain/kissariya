import React, { useState } from 'react';

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  title?: string;
}

function InlineSVG({ className = 'h-8 w-8', title = 'KissariyaMaroc' }: { className?: string; title?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      
      {/* Background rounded square */}
      <rect width="100" height="100" rx="25" fill="url(#logoGradient)" />
      
      {/* Storefront Icon - New Design */}
      <g transform="translate(28, 28)" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Roof/Awning */}
        <path d="M2 15 L42 15 L38 2 L6 2 Z" fill="white" fillOpacity="0.3" />
        <path d="M6 2 L2 15 M14 2 L12 15 M22 2 L22 15 M30 2 L32 15 M38 2 L42 15" stroke="white" strokeWidth="2.5" />
        
        {/* Main building */}
        <path d="M6 15 L6 40 Q6 44 10 44 L34 44 Q38 44 38 40 L38 15" />
        
        {/* Door */}
        <path d="M16 44 L16 34 Q16 28 22 28 Q28 28 28 34 L28 44" />
      </g>
    </svg>
  );
}

export default function Logo({ className = 'h-8 w-8', title = 'KissariyaMaroc', ...props }: LogoProps) {
  return (
    <InlineSVG className={className} title={title} />
  );
}
