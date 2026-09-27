import React from 'react';

interface FlagIconProps {
  code: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<string, string> = {
  xs: 'w-4 h-3',
  sm: 'w-5 h-3.5',
  md: 'w-6 h-4.5',
  lg: 'w-8 h-6',
  xl: 'w-10 h-7.5',
};

export const FlagIcon: React.FC<FlagIconProps> = ({ code, className = '', size = 'md' }) => {
  const normalized = (code || '').toLowerCase().trim();
  const dimensionClass = sizeClasses[size] || sizeClasses.md;

  const renderSvg = () => {
    switch (normalized) {
      case 'pt':
      case 'br':
        // Brazil
        return (
          <svg viewBox="0 0 100 70" className="w-full h-full block">
            <rect width="100" height="70" fill="#009b3a" />
            <polygon points="50,9 90,35 50,61 10,35" fill="#fedf00" />
            <circle cx="50" cy="35" r="15" fill="#002776" />
            <path
              d="M 35.5 37 C 42 30, 58 31, 64.5 39 C 64.5 37, 58 29, 35.5 35 Z"
              fill="#ffffff"
            />
            {/* Constellation stars (subtle dots) */}
            <circle cx="47" cy="38" r="0.8" fill="#ffffff" />
            <circle cx="52" cy="39" r="0.8" fill="#ffffff" />
            <circle cx="50" cy="42" r="0.9" fill="#ffffff" />
            <circle cx="55" cy="36" r="0.7" fill="#ffffff" />
            <circle cx="44" cy="41" r="0.7" fill="#ffffff" />
          </svg>
        );

      case 'en':
      case 'us':
        // United States
        return (
          <svg viewBox="0 0 100 70" className="w-full h-full block">
            <rect width="100" height="70" fill="#ffffff" />
            {/* 7 Red stripes out of 13 */}
            <rect y="0" width="100" height="5.38" fill="#b22234" />
            <rect y="10.76" width="100" height="5.38" fill="#b22234" />
            <rect y="21.54" width="100" height="5.38" fill="#b22234" />
            <rect y="32.32" width="100" height="5.38" fill="#b22234" />
            <rect y="43.1" width="100" height="5.38" fill="#b22234" />
            <rect y="53.86" width="100" height="5.38" fill="#b22234" />
            <rect y="64.62" width="100" height="5.38" fill="#b22234" />
            {/* Blue canton */}
            <rect width="40" height="37.7" fill="#3c3b6e" />
            {/* White stars grid (representative) */}
            <g fill="#ffffff">
              <circle cx="7" cy="6" r="1.3" />
              <circle cx="15" cy="6" r="1.3" />
              <circle cx="23" cy="6" r="1.3" />
              <circle cx="31" cy="6" r="1.3" />
              <circle cx="11" cy="12" r="1.3" />
              <circle cx="19" cy="12" r="1.3" />
              <circle cx="27" cy="12" r="1.3" />
              <circle cx="7" cy="18" r="1.3" />
              <circle cx="15" cy="18" r="1.3" />
              <circle cx="23" cy="18" r="1.3" />
              <circle cx="31" cy="18" r="1.3" />
              <circle cx="11" cy="24" r="1.3" />
              <circle cx="19" cy="24" r="1.3" />
              <circle cx="27" cy="24" r="1.3" />
              <circle cx="7" cy="30" r="1.3" />
              <circle cx="15" cy="30" r="1.3" />
              <circle cx="23" cy="30" r="1.3" />
              <circle cx="31" cy="30" r="1.3" />
            </g>
          </svg>
        );

      case 'es':
        // Spain
        return (
          <svg viewBox="0 0 100 70" className="w-full h-full block">
            <rect width="100" height="17.5" fill="#c60b1e" />
            <rect y="17.5" width="100" height="35" fill="#ffc400" />
            <rect y="52.5" width="100" height="17.5" fill="#c60b1e" />
            {/* Simplified Spanish coat of arms */}
            <g transform="translate(25, 25)">
              <rect x="0" y="2" width="12" height="14" rx="2" fill="#c60b1e" />
              <rect x="2" y="4" width="8" height="10" fill="#ffffff" opacity="0.85" />
              <path d="M 1 2 L 6 -2 L 11 2 Z" fill="#ffc400" />
              <circle cx="6" cy="-2" r="1" fill="#c60b1e" />
              <rect x="-3" y="1" width="2" height="15" fill="#e5e7eb" />
              <rect x="13" y="1" width="2" height="15" fill="#e5e7eb" />
            </g>
          </svg>
        );

      case 'fr':
        // France
        return (
          <svg viewBox="0 0 100 70" className="w-full h-full block">
            <rect x="0" width="33.33" height="70" fill="#002654" />
            <rect x="33.33" width="33.34" height="70" fill="#ffffff" />
            <rect x="66.67" width="33.33" height="70" fill="#ed2939" />
          </svg>
        );

      case 'it':
        // Italy
        return (
          <svg viewBox="0 0 100 70" className="w-full h-full block">
            <rect x="0" width="33.33" height="70" fill="#008c45" />
            <rect x="33.33" width="33.34" height="70" fill="#f4f5f0" />
            <rect x="66.67" width="33.33" height="70" fill="#cd212a" />
          </svg>
        );

      case 'hi':
      case 'in':
        // India
        return (
          <svg viewBox="0 0 100 70" className="w-full h-full block">
            <rect width="100" height="23.33" fill="#ff9933" />
            <rect y="23.33" width="100" height="23.34" fill="#ffffff" />
            <rect y="46.67" width="100" height="23.33" fill="#138808" />
            {/* Ashoka Chakra */}
            <circle cx="50" cy="35" r="8.5" fill="none" stroke="#000080" strokeWidth="1.2" />
            <circle cx="50" cy="35" r="2.2" fill="#000080" />
            {/* 24 spokes (represented cleanly by cross lines) */}
            <line x1="50" y1="26.5" x2="50" y2="43.5" stroke="#000080" strokeWidth="0.8" />
            <line x1="41.5" y1="35" x2="58.5" y2="35" stroke="#000080" strokeWidth="0.8" />
            <line x1="44" y1="29" x2="56" y2="41" stroke="#000080" strokeWidth="0.8" />
            <line x1="44" y1="41" x2="56" y2="29" stroke="#000080" strokeWidth="0.8" />
            <line x1="42.5" y1="31.5" x2="57.5" y2="38.5" stroke="#000080" strokeWidth="0.6" />
            <line x1="42.5" y1="38.5" x2="57.5" y2="31.5" stroke="#000080" strokeWidth="0.6" />
            <line x1="46.5" y1="27.5" x2="53.5" y2="42.5" stroke="#000080" strokeWidth="0.6" />
            <line x1="53.5" y1="27.5" x2="46.5" y2="42.5" stroke="#000080" strokeWidth="0.6" />
          </svg>
        );

      case 'ar':
      case 'sa':
        // Saudi Arabia
        return (
          <svg viewBox="0 0 100 70" className="w-full h-full block">
            <rect width="100" height="70" fill="#006c35" />
            {/* Shahada stylized script */}
            <path
              d="M 28 28 Q 38 23 50 28 Q 62 23 72 28 Q 66 33 50 31 Q 34 33 28 28 Z"
              fill="#ffffff"
            />
            <path
              d="M 33 22 Q 35 18 38 22 M 43 20 Q 45 16 48 20 M 53 20 Q 55 16 58 20 M 63 21 Q 65 17 68 21"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Horizontal Sword */}
            <path
              d="M 30 40 L 68 40 L 71 41.5 L 68 43 L 30 43 Z"
              fill="#ffffff"
            />
            <rect x="67" y="38" width="2" height="7" rx="0.5" fill="#ffffff" />
            <circle cx="70" cy="41.5" r="1.5" fill="#ffffff" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 100 70" className="w-full h-full block">
            <rect width="100" height="70" fill="#334155" />
            <text x="50" y="42" fill="#94a3b8" fontSize="24" textAnchor="middle" fontWeight="bold">
              {normalized.toUpperCase().slice(0, 2)}
            </text>
          </svg>
        );
    }
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.35)] ring-1 ring-white/15 select-none ${dimensionClass} ${className}`}
      title={code}
    >
      {renderSvg()}
    </span>
  );
};
