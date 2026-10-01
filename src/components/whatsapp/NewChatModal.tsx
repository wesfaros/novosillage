import React, { useState } from 'react';
import { X, MessageSquare, ArrowRight } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (phone: string, name?: string) => Promise<any>;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onStartChat,
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Por favor, informe um número de telefone válido (DDI + DDD + Número).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onStartChat(cleanPhone, name.trim() || undefined);
      setPhone('');
      setName('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao iniciar conversa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5FAFD] border border-[#2F8CFF]/20 flex items-center justify-center text-[#184D9B]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#162033] font-sora">
                Iniciar Nova Conversa
              </h2>
              <p className="text-[11px] text-slate-500">
                Abra uma conversa direta pelo número de WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Telefone com DDI e DDD
            </label>
            <input
              type="text"
              placeholder="Ex: 5511999998888"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#162033] placeholder-slate-400 focus:outline-hidden focus:border-[#2F8CFF] focus:ring-1 focus:ring-[#2F8CFF]/20"
            />
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
              Formato: 55 (Brasil) + DDD (ex: 11) + 9 dígitos
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nome do Contato (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Maria Consultora"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#162033] placeholder-slate-400 focus:outline-hidden focus:border-[#2F8CFF] focus:ring-1 focus:ring-[#2F8CFF]/20"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !phone.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#184D9B] text-white hover:bg-[#162033] disabled:opacity-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <span>Abrir Conversa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
