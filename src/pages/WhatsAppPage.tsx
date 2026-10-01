import React, { useState, useEffect } from 'react';
import { useWhatsAppLines } from '../hooks/useWhatsAppLines';
import { useWhatsAppChat } from '../hooks/useWhatsAppChat';
import { WhatsAppLine } from '../types/whatsapp';
import { WhatsAppLineCard } from '../components/whatsapp/WhatsAppLineCard';
import { ConnectLineModal } from '../components/whatsapp/ConnectLineModal';
import { ChatList } from '../components/whatsapp/ChatList';
import { MessageThread } from '../components/whatsapp/MessageThread';
import { NewChatModal } from '../components/whatsapp/NewChatModal';
import {
  MessageSquare,
  Plus,
  RefreshCw,
  AlertCircle,
  Smartphone,
  Radio,
  Settings2,
  ChevronDown,
} from 'lucide-react';

interface WhatsAppPageProps {
  onGoHome?: () => void;
}

export const WhatsAppPage: React.FC<WhatsAppPageProps> = () => {
  const {
    lines,
    isLoading: isLoadingLines,
    error: linesError,
    isSseConnected,
    loadLines,
    createLine,
    connectLine,
    disconnectLine,
    deleteLine,
  } = useWhatsAppLines();

  // Find connected lines
  const connectedLines = lines.filter((l) => l.status === 'connected');
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  // If connected lines exist, ensure active selectedLineId points to a connected line
  useEffect(() => {
    if (connectedLines.length > 0) {
      if (!selectedLineId || !connectedLines.some((l) => l.id === selectedLineId)) {
        setSelectedLineId(connectedLines[0].id);
      }
    } else {
      setSelectedLineId(null);
    }
  }, [connectedLines, selectedLineId]);

  // Mode: if there's a connected line, default to 'inbox'. Operator can toggle to 'manage_lines'.
  const [viewMode, setViewMode] = useState<'inbox' | 'manage_lines'>('inbox');

  const activeConnectedLine = connectedLines.find((l) => l.id === selectedLineId) || connectedLines[0];

  // Chats and Messages hook for active connected line
  const {
    chats,
    selectedChat,
    messages,
    isLoadingChats,
    isLoadingMessages,
    error: chatError,
    loadChats,
    selectChat,
    sendMessage,
    startNewChat,
  } = useWhatsAppChat(activeConnectedLine?.id);

  // Modals state
  const [connectModalState, setConnectModalState] = useState<{
    isOpen: boolean;
    targetLine: WhatsAppLine | null;
  }>({
    isOpen: false,
    targetLine: null,
  });

  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Connect / Add Line actions
  const handleOpenAddLine = () => {
    setConnectModalState({
      isOpen: true,
      targetLine: null,
    });
  };

  const handleOpenLineConnect = (line: WhatsAppLine) => {
    setConnectModalState({
      isOpen: true,
      targetLine: line,
    });
  };

  const handleCloseConnectModal = () => {
    setConnectModalState({
      isOpen: false,
      targetLine: null,
    });
  };

  const handleCreateAndConnect = async (name: string): Promise<WhatsAppLine> => {
    const newLine = await createLine(name);
    setConnectModalState({
      isOpen: true,
      targetLine: newLine,
    });
    return newLine;
  };

  const handleTriggerConnect = async (id: string): Promise<WhatsAppLine> => {
    const updated = await connectLine(id);
    setConnectModalState((prev) => ({
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
        `Atenção: Ao excluir a linha "${line.name}", os dados de autenticação e histórico serão apagados. Deseja continuar?`
      )
    ) {
      await deleteLine(line.id);
    }
  };

  const liveModalLine = connectModalState.targetLine
    ? lines.find((l) => l.id === connectModalState.targetLine?.id) || connectModalState.targetLine
    : null;

  // Decide whether to show Inbox or Line Management
  const hasConnectedLine = connectedLines.length > 0;
  const isInboxView = hasConnectedLine && viewMode === 'inbox';

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      
      {/* Top Operational Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#184D9B] text-[#A9E6FF] flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-semibold text-[#162033] font-sora tracking-tight leading-tight">
                {isInboxView ? 'Caixa de Entrada' : 'WhatsApp — Linhas'}
              </h1>
              {hasConnectedLine && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  {connectedLines.length} {connectedLines.length === 1 ? 'linha conectada' : 'linhas conectadas'}
                </span>
              )}
            </div>

            {isInboxView && activeConnectedLine && (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span>Operando com:</span>
                <strong className="text-[#162033] font-medium">{activeConnectedLine.name}</strong>
                {activeConnectedLine.phoneNumber && (
                  <span className="font-mono text-slate-400">
                    (+{activeConnectedLine.phoneNumber})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Multiple connected lines selector */}
          {isInboxView && connectedLines.length > 1 && (
            <div className="relative">
              <select
                value={selectedLineId || ''}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="pl-3 pr-7 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[#162033] font-medium appearance-none focus:outline-hidden focus:border-[#2F8CFF] cursor-pointer"
              >
                {connectedLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name} {line.phoneNumber ? `(+${line.phoneNumber})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Real-time SSE indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
              isSseConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={isSseConnected ? 'Transmissão em tempo real ativa' : 'Sincronizando stream...'}
          >
            <Radio className={`w-3.5 h-3.5 ${isSseConnected ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{isSseConnected ? 'Tempo Real' : 'Conectando'}</span>
          </div>

          {/* Toggle between Inbox and Line Management */}
          {hasConnectedLine && (
            <button
              onClick={() => setViewMode(viewMode === 'inbox' ? 'manage_lines' : 'inbox')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                viewMode === 'manage_lines'
                  ? 'bg-[#184D9B] text-white border-transparent'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-[#184D9B] hover:bg-slate-50'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{viewMode === 'inbox' ? 'Gerenciar Linhas' : 'Voltar para Inbox'}</span>
            </button>
          )}

          {/* Add Line button */}
          <button
            onClick={handleOpenAddLine}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#184D9B] text-white hover:bg-[#162033] rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#A9E6FF]" />
            <span className="hidden sm:inline">Adicionar Linha</span>
          </button>
        </div>
      </div>

      {/* Error Banners */}
      {(linesError || chatError) && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{linesError || chatError}</span>
          </div>
          <button
            onClick={() => {
              loadLines();
              if (activeConnectedLine) loadChats();
            }}
            className="text-xs font-medium underline hover:text-rose-900 cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Main View Area */}
      {isInboxView ? (
        /* ================= INBOX VIEW ================= */
        <div className="w-full flex-1 min-h-[580px] h-[calc(100vh-210px)] max-h-[850px] bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row">
          <ChatList
            chats={chats}
            selectedChatId={selectedChat?.jid}
            onSelectChat={selectChat}
            onOpenNewChatModal={() => setIsNewChatModalOpen(true)}
            isLoading={isLoadingChats}
          />

          <MessageThread
            chat={selectedChat}
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoadingMessages}
            onBack={() => selectChat(null as any)}
          />
        </div>
      ) : (
        /* ================= LINE MANAGEMENT VIEW ================= */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600 font-sora">
                Linhas Registradas ({lines.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Conecte seu WhatsApp escaneando o QR Code real com a câmera do celular.
              </p>
            </div>

            <button
              onClick={loadLines}
              className="p-1.5 text-slate-400 hover:text-[#184D9B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Recarregar linhas"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLines ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingLines && lines.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#2F8CFF] mx-auto" />
              <p className="text-xs text-slate-500">Carregando linhas e sessões ativas...</p>
            </div>
          ) : lines.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#F5FAFD] border border-[#2F8CFF]/20 text-[#184D9B] mx-auto flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-[#184D9B]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#162033] font-sora">
                  Nenhuma Linha WhatsApp Conectada
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Adicione sua linha comercial para gerar o QR Code real e habilitar a Caixa de Entrada.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleOpenAddLine}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#184D9B] text-white hover:bg-[#162033] rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 text-[#A9E6FF]" />
                  <span>Adicionar Linha</span>
                </button>
              </div>
            </div>
          ) : (
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
      )}

      {/* Connect Line Modal */}
      <ConnectLineModal
        isOpen={connectModalState.isOpen}
        line={liveModalLine}
        onClose={handleCloseConnectModal}
        onCreateAndConnect={handleCreateAndConnect}
        onTriggerConnect={handleTriggerConnect}
      />

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onStartChat={startNewChat}
      />

    </div>
  );
};
