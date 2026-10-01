import React from 'react';
import { NavItemId } from '../../types/navigation';
import { NAVIGATION_ITEMS } from '../../config/navigation';
import { SillageLogo } from '../brand/SillageLogo';
import { FloatingBottomBar } from '../navigation/FloatingBottomBar';

interface AppShellProps {
  activeId: NavItemId;
  onNavigate: (id: NavItemId) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeId,
  onNavigate,
  children,
}) => {
  const currentItem = NAVIGATION_ITEMS[activeId];

  return (
    <div className="min-h-screen bg-[#F5FAFD] text-[#162033] flex flex-col relative font-sans">
      {/* Top Ambient Header (Discreet identity & context; NO primary navigation links here) */}
      <header className="sticky top-0 z-40 w-full bg-[#F5FAFD]/90 backdrop-blur-xs border-b border-[#162033]/5 px-6 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('inicio')}
              className="cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2F8CFF] rounded-lg p-0.5"
              title="Voltar para Início"
            >
              <SillageLogo size="sm" showTagline={false} />
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-[#162033]">{currentItem.label}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-400 hidden sm:inline">{currentItem.tagline}</span>
            </div>
          </div>

          {/* Operational Context Tag */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white/70 border border-slate-200/60 rounded-md px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F8CFF]" />
              <span className="font-mono text-slate-600">Silláge v0.1 · Shell</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-6 pb-32">
        {children}
      </main>

      {/* Official Silláge Bottom Floating Navigation Bar */}
      <FloatingBottomBar activeId={activeId} onNavigate={onNavigate} />
    </div>
  );
};
