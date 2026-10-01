import React from 'react';
import { NavItemId } from '../types/navigation';
import { NAVIGATION_ITEMS, NAVIGATION_GROUPS } from '../config/navigation';
import { ArrowRight, Sparkles, Workflow, Layers, ShieldCheck, Compass } from 'lucide-react';
import { SillageLogo } from '../components/brand/SillageLogo';

interface HomePageProps {
  onNavigate: (id: NavItemId) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 py-6">
      
      {/* Hero / Identity Section */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-8 md:p-12 shadow-[0_2px_12px_rgba(22,32,51,0.03)] relative overflow-hidden">
        {/* Subtle decorative trace representing 'sillage' */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-[#A9E6FF]/20 via-[#6FCBFF]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="mb-4">
            <SillageLogo size="lg" showTagline={true} />
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold text-[#162033] font-sora tracking-tight leading-snug mt-6 mb-3">
            Plataforma comercial de relacionamento, canais integrados e automação.
          </h1>

          <p className="text-sm md:text-base text-slate-600 leading-relaxed font-normal">
            O Silláge centraliza a carteira de clientes, linhas de atendimento,
            inteligência comercial assistida e jornadas automatizadas em uma experiência
            operacional única e direta.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('whatsapp')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#184D9B] text-white hover:bg-[#162033] rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              <span>Acessar WhatsApp</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#A9E6FF]" />
            </button>

            <button
              onClick={() => onNavigate('second')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#F0F8FF] to-[#E8F4FD] border border-[#6FCBFF]/50 text-[#184D9B] hover:border-[#2F8CFF] rounded-xl text-xs font-medium transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2F8CFF]" />
              <span>Conhecer o Second</span>
            </button>

            <button
              onClick={() => onNavigate('flows')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-[#162033] hover:border-[#2F8CFF]/50 hover:bg-[#F5FAFD] rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <Workflow className="w-3.5 h-3.5 text-[#2F8CFF]" />
              <span>Explorar Flows</span>
            </button>
          </div>
        </div>
      </section>

      {/* Navigation Structure Guide */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#162033] font-sora tracking-tight">
              Estrutura de Controle
            </h2>
            <p className="text-xs text-slate-500">
              Navegação centralizada na barra flutuante inferior, organizada em 3 blocos lógicos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Group 1: Operações Centrais */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#184D9B] tracking-wider uppercase">
                  Grupo 1
                </span>
                <span className="text-[11px] text-slate-400">7 Módulos</span>
              </div>
              <h3 className="text-base font-semibold text-[#162033] font-sora mb-1.5">
                Operação Comercial
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Atendimento direto e gestão da carteira. Os canais primários são Início,
                WhatsApp e Email, com suporte de Campanhas, Carteira, Agenda e Configurações.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
              {['whatsapp', 'email', 'campanhas', 'carteira'].map((id) => {
                const item = NAVIGATION_ITEMS[id as NavItemId];
                return (
                  <button
                    key={id}
                    onClick={() => onNavigate(id as NavItemId)}
                    className="text-[11px] text-slate-600 hover:text-[#184D9B] hover:bg-slate-50 px-2 py-1 rounded border border-slate-200/60 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Second AI */}
          <div className="bg-gradient-to-b from-[#F5FAFD] to-white rounded-xl border border-[#6FCBFF]/40 p-5 flex flex-col justify-between hover:border-[#2F8CFF]/60 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#184D9B] tracking-wider uppercase">
                  Grupo 2
                </span>
                <span className="text-[11px] text-[#2F8CFF] font-medium">IA Estratégica</span>
              </div>
              <h3 className="text-base font-semibold text-[#162033] font-sora mb-1.5 flex items-center gap-1.5">
                <span>Second</span>
                <Sparkles className="w-4 h-4 text-[#2F8CFF]" />
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Camada de inteligência comercial para análise de carteira, sugestões
                de abordagem, apoio a metas e consultoria de produto integrada ao atendimento.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigate('second')}
                className="w-full text-center text-xs font-medium text-[#184D9B] hover:text-[#162033] py-1 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Acessar Second</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Group 3: Flows Automation */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col justify-between hover:border-[#2F8CFF]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#162033] tracking-wider uppercase">
                  Grupo 3
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Automação</span>
              </div>
              <h3 className="text-base font-semibold text-[#162033] font-sora mb-1.5 flex items-center gap-1.5">
                <span>Flows</span>
                <Workflow className="w-4 h-4 text-[#2F8CFF]" />
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Motor de automação de comunicação e jornadas sequenciais multicanais.
                Gerencia disparos privados estruturados e Listas de Transmissão 2.0.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigate('flows')}
                className="w-full text-center text-xs font-medium text-[#162033] hover:text-[#184D9B] py-1 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Acessar Flows</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Roadmap & Architecture Principles */}
      <section className="bg-slate-50/60 rounded-xl border border-slate-200/60 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Status de Implementação · Etapa Atual
        </h2>

        <div className="space-y-2.5 text-xs text-slate-600">
          <div className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
            <div>
              <strong className="text-[#162033] font-medium">Etapa 1 — Shell & Navegação Base (Concluída):</strong>{' '}
              Criação da estrutura modular, rotas, barra de controle flutuante inferior com os 3 grupos lógicos e estados limpos para todos os módulos.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#2F8CFF] mt-1 shrink-0" />
            <div>
              <strong className="text-[#162033] font-medium">Próxima Etapa — WhatsApp Básico:</strong>{' '}
              Integração com upstream Baileys server-side, Connection Manager centralizado, persistência de autenticação por accountId e pareamento.
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
