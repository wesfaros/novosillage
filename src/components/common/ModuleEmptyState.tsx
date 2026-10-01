import React from 'react';
import { LucideIcon, ArrowLeft } from 'lucide-react';
import { NavItemId } from '../../types/navigation';

interface ModuleEmptyStateProps {
  title: string;
  icon: LucideIcon;
  tagline: string;
  stageInfo?: string;
  onGoHome?: () => void;
  accentColor?: string;
}

export const ModuleEmptyState: React.FC<ModuleEmptyStateProps> = ({
  title,
  icon: Icon,
  tagline,
  stageInfo = 'Este módulo será implementado na etapa correspondente do projeto.',
  onGoHome,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto py-16 px-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 md:p-10 shadow-[0_2px_12px_rgba(22,32,51,0.03)] text-center">
        {/* Module Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#F5FAFD] border border-[#2F8CFF]/20 text-[#184D9B] mx-auto flex items-center justify-center mb-5">
          <Icon className="w-6 h-6 text-[#184D9B]" />
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-semibold text-[#162033] font-sora tracking-tight mb-2">
          {title}
        </h2>

        {/* Tagline */}
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          {tagline}
        </p>

        {/* Stage Status info */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-8 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F8CFF]" />
          <span>{stageInfo}</span>
        </div>

        {/* Action */}
        {onGoHome && (
          <div>
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#184D9B] hover:text-[#162033] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retornar ao Início</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
