import React from 'react';
import { WhatsAppLineStatus } from '../../types/whatsapp';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle, QrCode } from 'lucide-react';

interface WhatsAppStatusBadgeProps {
  status: WhatsAppLineStatus;
  lastError?: string;
  className?: string;
}

export const WhatsAppStatusBadge: React.FC<WhatsAppStatusBadgeProps> = ({
  status,
  lastError,
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Conectada',
          icon: CheckCircle2,
          dotColor: 'bg-emerald-500',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
        };
      case 'qr_ready':
        return {
          label: 'Aguardando Leitura do QR Code',
          icon: QrCode,
          dotColor: 'bg-[#2F8CFF]',
          textColor: 'text-[#184D9B]',
          bgColor: 'bg-[#F0F8FF]',
          borderColor: 'border-[#6FCBFF]/40',
        };
      case 'waiting_qr':
        return {
          label: 'Gerando QR Code Real...',
          icon: Clock,
          dotColor: 'bg-amber-400 animate-pulse',
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
        };
      case 'connecting':
        return {
          label: 'Conectando ao WhatsApp...',
          icon: RefreshCw,
          dotColor: 'bg-[#2F8CFF] animate-spin',
          textColor: 'text-[#184D9B]',
          bgColor: 'bg-[#F5FAFD]',
          borderColor: 'border-[#2F8CFF]/30',
        };
      case 'reconnecting':
        return {
          label: 'Reconectando linha...',
          icon: RefreshCw,
          dotColor: 'bg-orange-500 animate-spin',
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
        };
      case 'error':
        return {
          label: 'Falha na Conexão',
          icon: AlertCircle,
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
        };
      case 'disconnected_by_user':
        return {
          label: 'Desconectada pelo Operador',
          icon: XCircle,
          dotColor: 'bg-slate-400',
          textColor: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
        };
      case 'disconnected':
      default:
        return {
          label: 'Desconectada',
          icon: XCircle,
          dotColor: 'bg-slate-400',
          textColor: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${config.bgColor} ${config.borderColor} ${config.textColor}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
        <span>{config.label}</span>
      </div>
      {lastError && status === 'error' && (
        <span className="text-[11px] text-rose-600 font-mono line-clamp-1">
          {lastError}
        </span>
      )}
    </div>
  );
};
