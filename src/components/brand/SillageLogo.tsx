import React from 'react';

interface SillageLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const SillageLogo: React.FC<SillageLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
}) => {
  const sizeMap = {
    sm: {
      mark: 'w-6 h-6',
      title: 'text-base',
      subtitle: 'text-[10px]',
    },
    md: {
      mark: 'w-8 h-8',
      title: 'text-xl',
      subtitle: 'text-xs',
    },
    lg: {
      mark: 'w-10 h-10',
      title: 'text-2xl',
      subtitle: 'text-sm',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Sillage S Trace Icon */}
      <div
        className={`relative ${currentSize.mark} rounded-lg bg-gradient-to-br from-[#184D9B] via-[#2F8CFF] to-[#6FCBFF] p-[1.5px] shadow-sm flex items-center justify-center`}
      >
        <div className="w-full h-full bg-[#162033] rounded-[7px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle trail light */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#184D9B]/50 via-transparent to-[#A9E6FF]/30" />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3/5 h-3/5 text-[#A9E6FF] relative z-10"
          >
            {/* Flowing curve representing rastro / sillage */}
            <path d="M7 17.5C7 15.5 8.5 14 11 13.5L13 13C15.5 12.5 17 11 17 9C17 6.5 14.5 5 12 5C9 5 7.5 6.5 7.5 8" />
            <circle cx="16.5" cy="17.5" r="1.5" fill="#6FCBFF" stroke="none" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={`font-semibold tracking-tight text-[#162033] font-sora ${currentSize.title}`}
        >
          Silláge
        </span>
        {showTagline && (
          <span className={`text-[#184D9B]/70 tracking-wide font-normal mt-0.5 ${currentSize.subtitle}`}>
            CRM Conversacional
          </span>
        )}
      </div>
    </div>
  );
};
