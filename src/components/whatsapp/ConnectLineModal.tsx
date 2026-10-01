import React, { useState, useEffect } from 'react';
import { WhatsAppLine } from '../../types/whatsapp';
import { WhatsAppStatusBadge } from './WhatsAppStatusBadge';
import { X, RefreshCw, CheckCircle2, AlertCircle, Smartphone, ArrowRight, QrCode } from 'lucide-react';

interface ConnectLineModalProps {
  isOpen: boolean;
  line: WhatsAppLine | null;
  onClose: () => void;
  onCreateAndConnect: (name: string) => Promise<WhatsAppLine>;
  onTriggerConnect: (id: string) => Promise<WhatsAppLine>;
}

export const ConnectLineModal: React.FC<ConnectLineModalProps> = ({
  isOpen,
  line,
  onClose,
  onCreateAndConnect,
  onTriggerConnect,
}) => {
  const [lineName, setLineName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // If a line is passed in, sync or auto-trigger connect if disconnected
  useEffect(() => {
    if (line) {
      setLineName(line.name);
      if (
        line.status === 'disconnected' ||
        line.status === 'disconnected_by_user' ||
        line.status === 'error'
      ) {
        onTriggerConnect(line.id).catch((err) => {
          setLocalError(err?.message || 'Falha ao inicializar conexão.');
        });
      }
    } else {
      setLineName('');
      setLocalError(null);
    }
  }, [line, onTriggerConnect]);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineName.trim()) return;

    try {
      setIsSubmitting(true);
      setLocalError(null);
      await onCreateAndConnect(lineName.trim());
    } catch (err: any) {
      setLocalError(err?.message || 'Erro ao criar nova linha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (!line) return;
    try {
      setLocalError(null);
      await onTriggerConnect(line.id);
    } catch (err: any) {
      setLocalError(err?.message || 'Falha ao reiniciar tentativa de conexão.');
    }
  };

  const isConnected = line?.status === 'connected';
  const hasQrReady = line?.status === 'qr_ready' && !!line?.qrCodeDataUrl;
  const isWaiting = line?.status === 'waiting_qr' || line?.status === 'connecting';
  const isError = line?.status === 'error' || !!localError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5FAFD] border border-[#2F8CFF]/20 flex items-center justify-center text-[#184D9B]">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#162033] font-sora">
                {line ? `Conectar: ${line.name}` : 'Adicionar Nova Linha WhatsApp'}
              </h2>
              <p className="text-xs text-slate-500">
                Pareamento direto via protocolo seguro Baileys server-side
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Step 1: Input name if creating a new line */}
          {!line && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome da Linha
                </label>
                <input
                  type="text"
                  placeholder="Ex: Linha O.U.I, Linha Comercial 01..."
                  value={lineName}
                  onChange={(e) => setLineName(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#162033] placeholder-slate-400 focus:outline-hidden focus:border-[#2F8CFF] focus:ring-2 focus:ring-[#2F8CFF]/20"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Identificador para organização interna da carteira comercial.
                </span>
              </div>

              {localError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{localError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !lineName.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#184D9B] text-white hover:bg-[#162033] disabled:opacity-60 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Iniciando Servidor...</span>
                    </>
                  ) : (
                    <>
                      <span>Gerar QR Code Real</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: QR Code view / Connection Status */}
          {line && (
            <div className="space-y-5">
              
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  ID: {line.accountId}
                </span>
                <WhatsAppStatusBadge status={line.status} lastError={line.lastError || localError || undefined} />
              </div>

              {/* State: CONNECTED */}
              {isConnected ? (
                <div className="py-8 px-6 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#162033] font-sora">
                      Linha Conectada com Sucesso!
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 font-medium">
                      {line.phoneNumber ? `Número: +${line.phoneNumber}` : 'Conta WhatsApp autenticada.'}
                      {line.nameInWhatsApp && ` (${line.nameInWhatsApp})`}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Sessão salva com persistência local. A conexão está ativa e monitorada.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 bg-[#184D9B] text-white hover:bg-[#162033] rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
                    >
                      Concluir e Voltar
                    </button>
                  </div>
                </div>
              ) : isError ? (
                /* State: ERROR */
                <div className="py-8 px-6 bg-rose-50/60 rounded-2xl border border-rose-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#162033] font-sora">
                      Falha ao Conectar Linha
                    </h3>
                    <p className="text-xs text-rose-700 mt-1">
                      {line.lastError || localError || 'Ocorreu um erro durante a conexão com o WhatsApp.'}
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={handleRetry}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#184D9B] text-white hover:bg-[#162033] rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tentar Novamente</span>
                    </button>
                  </div>
                </div>
              ) : hasQrReady ? (
                /* State: QR CODE READY */
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-xs">
                    <div className="relative p-2 bg-white rounded-lg border-2 border-dashed border-[#2F8CFF]/40">
                      <img
                        src={line.qrCodeDataUrl}
                        alt="WhatsApp QR Code Real"
                        className="w-56 h-56 object-contain"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-3 font-mono">
                      Aguardando leitura pelo aplicativo do WhatsApp...
                    </span>
                  </div>

                  {/* Step-by-step instructions */}
                  <div className="bg-[#F5FAFD] rounded-xl p-4 border border-slate-200/70 text-xs text-slate-600 space-y-2">
                    <div className="font-semibold text-[#162033] text-[11px] uppercase tracking-wider mb-1">
                      Instruções no Celular
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#184D9B] text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>Abra o <strong>WhatsApp</strong> no seu aparelho telefônico.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#184D9B] text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>Acesse <strong>Configurações</strong> &gt; <strong>Aparelhos conectados</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#184D9B] text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>Toque em <strong>Conectar um aparelho</strong> e aponte a câmera para este QR Code.</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* State: WAITING_QR or CONNECTING */
                <div className="py-12 px-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#F5FAFD] border border-[#2F8CFF]/30 text-[#184D9B] mx-auto flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#2F8CFF]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#162033] font-sora">
                      {line.status === 'connecting'
                        ? 'QR Code Lido! Autenticando...'
                        : 'Inicializando Conexão Baileys...'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {line.status === 'connecting'
                        ? 'Sincronizando chaves de autenticação com os servidores do WhatsApp...'
                        : 'O servidor está gerando um QR Code real exclusivo para esta linha. Aguarde alguns instantes.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Close / Action Footer */}
              {!isConnected && (
                <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-[#2F8CFF] animate-pulse" />
                    <span>Transmissão em tempo real ativa</span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
