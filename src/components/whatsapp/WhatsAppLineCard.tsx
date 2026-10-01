import React from 'react';
import { WhatsAppLine } from '../../types/whatsapp';
import { WhatsAppStatusBadge } from './WhatsAppStatusBadge';
import { Phone, QrCode, Power, Trash2, RefreshCw, Smartphone } from 'lucide-react';

interface WhatsAppLineCardProps {
  line: WhatsAppLine;
  onOpenConnectModal: (line: WhatsAppLine) => void;
  onDisconnect: (line: WhatsAppLine) => void;
  onDelete: (line: WhatsAppLine) => void;
}

export const WhatsAppLineCard: React.FC<WhatsAppLineCardProps> = ({
  line,
  onOpenConnectModal,
  onDisconnect,
  onDelete,
}) => {
  const isConnected = line.status === 'connected';
  const isConnecting = line.status === 'connecting' || line.status === 'reconnecting';
  const hasQrReady = line.status === 'qr_ready' || line.status === 'waiting_qr';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_2px_10px_rgba(22,32,51,0.03)] hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        {/* Header: Title and Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <Smartphone className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#162033] font-sora tracking-tight leading-tight">
                {line.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-mono text-[11px] text-slate-400">{line.accountId}</span>
                {line.nameInWhatsApp && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-600">{line.nameInWhatsApp}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <WhatsAppStatusBadge status={line.status} lastError={line.lastError} />
        </div>

        {/* Details: Phone Number & Connection info */}
        <div className="my-4 py-3 px-3.5 rounded-lg bg-[#F5FAFD] border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-3.5 h-3.5 text-[#184D9B]" />
            <span className="font-medium text-[#162033]">
              {line.phoneNumber ? `+${line.phoneNumber}` : 'Nenhum aparelho conectado'}
            </span>
          </div>

          {line.connectedAt && isConnected && (
            <span className="text-[11px] text-slate-400">
              Conectado desde {new Date(line.connectedAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {hasQrReady && (
            <button
              onClick={() => onOpenConnectModal(line)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#184D9B] text-white hover:bg-[#162033] rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Ver QR Code</span>
            </button>
          )}

          {!isConnected && !hasQrReady && (
            <button
              onClick={() => onOpenConnectModal(line)}
              disabled={isConnecting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#184D9B] text-white hover:bg-[#162033] disabled:opacity-60 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Conectar Aparelho</span>
                </>
              )}
            </button>
          )}

          {isConnected && (
            <button
              onClick={() => onDisconnect(line)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-rose-200"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Desconectar</span>
            </button>
          )}
        </div>

        <button
          onClick={() => onDelete(line)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Excluir linha e dados de sessão"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
