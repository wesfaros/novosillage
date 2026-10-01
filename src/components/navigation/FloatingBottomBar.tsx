import React, { useState } from 'react';
import { NavItemId } from '../../types/navigation';
import { NAVIGATION_ITEMS, NAVIGATION_GROUPS } from '../../config/navigation';

interface FloatingBottomBarProps {
  activeId: NavItemId;
  onNavigate: (id: NavItemId) => void;
}

export const FloatingBottomBar: React.FC<FloatingBottomBarProps> = ({
  activeId,
  onNavigate,
}) => {
  const [hoveredId, setHoveredId] = useState<NavItemId | null>(null);

  const coreGroup = NAVIGATION_GROUPS.find((g) => g.id === 'core')!;
  const secondItem = NAVIGATION_ITEMS['second'];
  const flowsItem = NAVIGATION_ITEMS['flows'];

  const coreItems = coreGroup.items.map((id) => NAVIGATION_ITEMS[id]);
  const primaryCoreItems = coreItems.filter((item) => item.isPrimary);
  const secondaryCoreItems = coreItems.filter((item) => !item.isPrimary);

  return (
    <nav
      aria-label="Controle Central de Navegação Silláge"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[96vw] select-none"
    >
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#162033]/10 shadow-[0_12px_40px_rgba(22,32,51,0.09)] transition-all">
        
        {/* GROUP 1: CORE OPERATIONS */}
        <div className="flex items-center gap-1 px-1">
          {/* Primary Operations (Início, WhatsApp, Email) */}
          <div className="flex items-center gap-1">
            {primaryCoreItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#184D9B] text-white shadow-sm font-semibold'
                      : 'text-[#162033] hover:bg-[#F5FAFD] hover:text-[#184D9B]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-[#A9E6FF]' : 'text-[#184D9B]'
                    }`}
                  />
                  <span className="tracking-tight">{item.label}</span>

                  {/* Active Indicator dot */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6FCBFF] ml-0.5 animate-pulse" />
                  )}

                  {/* Tooltip on hover */}
                  {hoveredId === item.id && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-[#162033] text-white text-[11px] font-normal whitespace-nowrap shadow-md pointer-events-none z-20">
                      {item.tooltip}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Micro separator for secondary core items */}
          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Secondary Operations (Campanhas, Carteira, Agenda, Configurações) */}
          <div className="flex items-center gap-0.5">
            {secondaryCoreItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group relative flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#2F8CFF]/15 text-[#184D9B] font-semibold ring-1 ring-[#2F8CFF]/30'
                      : 'text-slate-500 hover:text-[#162033] hover:bg-slate-100/70 font-normal'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-[#184D9B]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="hidden xl:inline text-[11px] tracking-tight">{item.label}</span>

                  {/* Tooltip on hover */}
                  {hoveredId === item.id && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-[#162033] text-white text-[11px] font-normal whitespace-nowrap shadow-md pointer-events-none z-20">
                      {item.label} &mdash; {item.tooltip}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* GROUP SEPARATOR 1 -> 2 */}
        <div className="h-6 w-px bg-slate-200 mx-0.5" />

        {/* GROUP 2: SECOND (AI LAYER - VISUALLY DISTINCT) */}
        <div className="px-0.5">
          {(() => {
            const Icon = secondItem.icon;
            const isActive = activeId === 'second';
            return (
              <button
                key="second"
                onClick={() => onNavigate('second')}
                onMouseEnter={() => setHoveredId('second')}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#184D9B] to-[#2F8CFF] text-white border-transparent shadow-sm font-semibold'
                    : 'bg-gradient-to-r from-[#F0F8FF] to-[#E8F4FD] border-[#6FCBFF]/40 text-[#184D9B] hover:border-[#2F8CFF]/60 hover:shadow-xs'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    isActive ? 'text-[#A9E6FF]' : 'text-[#2F8CFF]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="font-sora font-medium tracking-tight">Second</span>

                {/* Subtle AI sparkle indicator */}
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    isActive ? 'bg-white/20 text-[#A9E6FF]' : 'bg-[#6FCBFF]/20 text-[#184D9B]'
                  }`}
                >
                  IA
                </span>

                {hoveredId === 'second' && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-[#162033] text-white text-[11px] font-normal whitespace-nowrap shadow-md pointer-events-none z-20">
                    Second &mdash; Inteligência Comercial da Carteira
                  </div>
                )}
              </button>
            );
          })()}
        </div>

        {/* GROUP SEPARATOR 2 -> 3 */}
        <div className="h-6 w-px bg-slate-200 mx-0.5" />

        {/* GROUP 3: FLOWS (AUTOMATION ENGINE - VISUALLY DISTINCT) */}
        <div className="px-0.5">
          {(() => {
            const Icon = flowsItem.icon;
            const isActive = activeId === 'flows';
            return (
              <button
                key="flows"
                onClick={() => onNavigate('flows')}
                onMouseEnter={() => setHoveredId('flows')}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer border ${
                  isActive
                    ? 'bg-[#162033] text-[#A9E6FF] border-[#162033] shadow-sm font-semibold'
                    : 'bg-white border-[#2F8CFF]/30 text-[#162033] hover:border-[#184D9B]/50 hover:bg-[#F5FAFD]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#6FCBFF]' : 'text-[#2F8CFF] group-hover:text-[#184D9B]'
                  }`}
                />
                <span className="font-sora font-medium tracking-tight">Flows</span>

                {/* Flow indicator badge */}
                <span
                  className={`text-[9px] uppercase tracking-wider px-1 py-0.2 rounded font-semibold ${
                    isActive
                      ? 'bg-[#2F8CFF]/20 text-[#6FCBFF]'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-[#2F8CFF]/10 group-hover:text-[#184D9B]'
                  }`}
                >
                  Auto
                </span>

                {hoveredId === 'flows' && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-[#162033] text-white text-[11px] font-normal whitespace-nowrap shadow-md pointer-events-none z-20">
                    Flows &mdash; Motor de Jornadas e Automação
                  </div>
                )}
              </button>
            );
          })()}
        </div>

      </div>
    </nav>
  );
};
