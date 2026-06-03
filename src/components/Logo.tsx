import React from 'react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textColor?: string;
}

const styles = `
@keyframes logo-sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  25% { opacity: 1; transform: scale(1); }
  50% { opacity: 0; transform: scale(0); }
}
@keyframes logo-hover {
  0%, 100% { transform: rotate(0deg) scale(1); }
  20% { transform: rotate(-10deg) scale(1.1); }
  40% { transform: rotate(10deg) scale(1.1); }
  60% { transform: rotate(-10deg) scale(1.1); }
  80% { transform: rotate(0deg) scale(1.1); }
}
.logo-svg:hover { animation: logo-hover 0.5s ease-in-out; }
.logo-sparkle { animation: logo-sparkle 2s ease-in-out infinite; }
.logo-sparkle--delay { animation-delay: 0.5s; }
`;

export function Logo({ className = '', iconSize = 32, textColor }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`} style={textColor ? { color: textColor } : undefined}>
      <style>{styles}</style>
      {/* Gem Icon */}
      <svg
        className="logo-svg"
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ cursor: 'pointer' }}
      >
        {/* Outer gem shape */}
        <path
          d="M20 2L28 12H12L20 2Z"
          fill="url(#gemGradient1)"
          stroke="var(--bx-accent)"
          strokeWidth="1.5"
          strokeLinejoin="bevel"
        />
        <path
          d="M12 12L6 16L20 38L34 16L28 12H12Z"
          fill="url(#gemGradient2)"
          stroke="var(--bx-accent)"
          strokeWidth="1.5"
          strokeLinejoin="bevel"
        />
        {/* Inner facets */}
        <path
          d="M20 12V38"
          stroke="var(--bx-accent)"
          strokeWidth="1"
          opacity="0.6"
        />
        <path
          d="M12 12L20 38L28 12"
          stroke="var(--bx-accent)"
          strokeWidth="1"
          opacity="0.4"
        />
        <path
          d="M6 16L20 12L34 16"
          stroke="#b5295e"
          strokeWidth="1"
          opacity="0.5"
        />
        {/* Sparkle effect */}
        <circle
          className="logo-sparkle"
          cx="16" cy="8" r="1.5"
          fill="white"
        />
        <circle
          className="logo-sparkle logo-sparkle--delay"
          cx="26" cy="20" r="1.5"
          fill="white"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="gemGradient1" x1="20" y1="2" x2="20" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d64c7a" />
            <stop offset="100%" stopColor="#b5295e" />
          </linearGradient>
          <linearGradient id="gemGradient2" x1="20" y1="12" x2="20" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#b5295e" />
            <stop offset="50%" stopColor="var(--bx-accent)" />
            <stop offset="100%" stopColor="var(--bx-accent)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Logo Text */}
      <div className="flex flex-col leading-none">
        <span className="text-[18px] sm:text-[20px] lg:text-[24px] font-bold tracking-tight" style={{ color: 'inherit' }}>
          Lowkey Gem
        </span>
        <span className="text-[8px] sm:text-[9px] lg:text-[10px] uppercase tracking-wider opacity-60" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"', color: 'inherit' }}>
          Hidden Talent Found
        </span>
      </div>
    </div>
  );
}
