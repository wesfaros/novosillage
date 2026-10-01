import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Digite uma mensagem...',
}) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending || disabled) return;

    try {
      setIsSending(true);
      setError(null);
      await onSendMessage(trimmed);
      setText('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.focus();
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao enviar mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="p-3 bg-white border-t border-slate-200/80">
      {error && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-[11px] font-medium underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:bg-white focus-within:border-[#2F8CFF] focus-within:ring-1 focus-within:ring-[#2F8CFF]/20 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder={placeholder}
            className="w-full bg-transparent text-xs text-[#162033] placeholder-slate-400 focus:outline-hidden resize-none max-h-28 overflow-y-auto block leading-relaxed"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || isSending || disabled}
          className="p-2.5 rounded-xl bg-[#184D9B] text-white hover:bg-[#162033] disabled:opacity-40 disabled:hover:bg-[#184D9B] transition-colors cursor-pointer shrink-0 shadow-xs"
          title="Enviar mensagem (Enter)"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
