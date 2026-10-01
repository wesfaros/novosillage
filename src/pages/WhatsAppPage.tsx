import React, { useState } from 'react';
import { useWhatsAppLines } from '../hooks/useWhatsAppLines';
import { WhatsAppLine } from '../types/whatsapp';
import { WhatsAppLineCard } from '../components/whatsapp/WhatsAppLineCard';
import { ConnectLineModal } from '../components/whatsapp/ConnectLineModal';
import { MessageSquare, Plus, RefreshCw, AlertCircle, Smartphone, Radio } from 'lucide-react';

interface WhatsAppPageProps {
  onGoHome?: () => void;
}

export const WhatsAppPage: React.FC<WhatsAppPageProps> = () => {
  const {
    lines,
    isLoading,
    error,
    isSseConnected,
    loadLines,
    createLine,
    connectLine,
    disconnectLine,
    deleteLine,
  } = useWhatsAppLines();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    targetLine: WhatsAppLine | null;
  }>({
    isOpen: false,
    targetLine: null,
  });

  const [confirmDeleteLine, setConfirmDeleteLine] = useState<WhatsAppLine | null>(null);

  const connectedCount = lines.filter((l) => l.status === 'connected').length;

  const handleOpenAddLine = () => {
    setModalState({
      isOpen: true,
      targetLine: null,
    });
  };

  const handleOpenLineConnect = (line: WhatsAppLine) => {
    setModalState({
      isOpen: true,
      targetLine: line,
    });
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      targetLine: null,
    });
  };

  const handleCreateAndConnect = async (name: string): Promise<WhatsAppLine> => {
    const newLine = await createLine(name);
    setModalState({
      isOpen: true,
      targetLine: newLine,
    });
    return newLine;
  };

  const handleTriggerConnect = async (id: string): Promise<WhatsAppLine> => {
    const updated = await connectLine(id);
    setModalState((prev) => ({
      ...prev,
      targetLine: updated,
    }));
    return updated;
  };

  const handleDisconnect = async (line: WhatsAppLine) => {
    if (window.confirm(`Deseja realmente desconectar a linha "${line.name}"?`)) {
      await disconnectLine(line.id);
    }
  };

  const handleDelete = async (line: WhatsAppLine) => {
    if (
      window.confirm(
        `Atenção: Ao excluir a linha "${line.name}", os dados de autenticação e sessão salvos em disco serão apagados. Deseja continuar?`
      )
    ) {
      await deleteLine(line.id);
    }
  };

  // Keep targetLine in modal in sync with the live lines state
  const liveModalLine = modalState.targetLine
    ? lines.find((l) => l.id === modalState.targetLine?.id) || modalState.targetLine
    : null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-4">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#184D9B] text-[#A9E6FF] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-[#162033] font-sora tracking-tight">
              WhatsApp — Gerenciamento de Linhas
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Conexão e controle de instâncias WhatsApp Web com persistência de sessão e pareamento direto.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time SSE status indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
              isSseConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={isSseConnected ? 'Transmissão em tempo real ativa' : 'Conectando ao stream de eventos...'}
          >
            <Radio className={`w-3.5 h-3.5 ${isSseConnected ? 'animate-pulse' : ''}`} />
            <span>{isSseConnected ? 'Tempo Real Ativo' : 'Sincronizando...'}</span>
          </div>

          <button
            onClick={loadLines}
            className="p-2 text-slate-500 hover:text-[#184D9B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddLine}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#184D9B] text-white hover:bg-[#162033] rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#A9E6FF]" />
            <span>Adicionar Linha</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadLines}
            className="text-xs font-medium underline hover:text-rose-900 cursor-pointer"
          >
            Recarregar
          </button>
        </div>
      )}

      {/* Overview Metrics (Only real data, no fake statistics) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <span className="text-xs text-slate-500 font-medium">Linhas Cadastradas</span>
          <div className="text-2xl font-bold font-sora text-[#162033] mt-1">
            {lines.length}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <span className="text-xs text-slate-500 font-medium">Linhas Conectadas</span>
          <div className="text-2xl font-bold font-sora text-emerald-600 mt-1">
            {connectedCount}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <span className="text-xs text-slate-500 font-medium">Motor de Conexão</span>
          <div className="text-xs font-mono text-[#184D9B] mt-2.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2F8CFF]" />
            <span>Baileys Multi-File Auth (Server-side)</span>
          </div>
        </div>
      </div>

      {/* Lines Grid or Empty State */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
            Linhas Registradas ({lines.length})
          </h2>
        </div>

        {isLoading && lines.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#2F8CFF] mx-auto" />
            <p className="text-xs text-slate-500">Carregando linhas e sessões ativas...</p>
          </div>
        ) : lines.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-[0_2px_12px_rgba(22,32,51,0.02)] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#F5FAFD] border border-[#2F8CFF]/20 text-[#184D9B] mx-auto flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-[#184D9B]" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#162033] font-sora">
                Nenhuma Linha WhatsApp Conectada
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Adicione sua primeira linha comercial para gerar o QR Code real e autenticar sua conta.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleOpenAddLine}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#184D9B] text-white hover:bg-[#162033] rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#A9E6FF]" />
                <span>Adicionar Primeira Linha</span>
              </button>
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lines.map((line) => (
              <WhatsAppLineCard
                key={line.id}
                line={line}
                onOpenConnectModal={handleOpenLineConnect}
                onDisconnect={handleDisconnect}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Connect / Add Line Modal */}
      <ConnectLineModal
        isOpen={modalState.isOpen}
        line={liveModalLine}
        onClose={handleCloseModal}
        onCreateAndConnect={handleCreateAndConnect}
        onTriggerConnect={handleTriggerConnect}
      />

    </div>
  );
};
