import React, { useEffect, useRef, useState } from 'react';
import { WhatsAppChat, WhatsAppMessage } from '../../types/whatsapp';
import { MessageInput } from './MessageInput';
import { getCleanDisplayName, formatPhoneNumber, isGroupJid } from '../../utils/phone';
import {
  User,
  Users,
  CheckCheck,
  Clock,
  ArrowLeft,
  FileText,
  Download,
} from 'lucide-react';

interface MessageThreadProps {
  chat: WhatsAppChat | null;
  messages: WhatsAppMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onBack?: () => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  chat,
  messages,
  onSendMessage,
  isLoading,
  onBack,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Reset avatar error when chat changes
  useEffect(() => {
    setAvatarError(false);
  }, [chat?.jid, chat?.profilePictureUrl]);

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F5FAFD]/60">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-400 mb-3">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#162033] font-sora">
          Nenhuma conversa selecionada
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Selecione uma conversa na lista ao lado ou inicie um novo contato para visualizar o histórico de mensagens.
        </p>
      </div>
    );
  }

  const isGroup = !!chat.isGroup || isGroupJid(chat.jid);
  const displayName = getCleanDisplayName(chat);
  const subtitle = isGroup
    ? 'Grupo do WhatsApp'
    : chat.phoneNumber || formatPhoneNumber(chat.jid) || 'Contato do WhatsApp';

  const formatMessageTime = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5FAFD]/40 overflow-hidden relative">
      
      {/* Thread Header */}
      <div className="px-5 py-3 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Avatar or Profile Picture */}
          {chat.profilePictureUrl && !avatarError ? (
            <img
              src={chat.profilePictureUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#184D9B] text-white flex items-center justify-center text-xs font-semibold font-sora shrink-0">
              {isGroup ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-[#162033] font-sora leading-tight">
              {displayName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{subtitle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 pb-6 space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5 animate-spin text-[#2F8CFF]" />
            <span>Carregando histórico...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-xs font-medium text-slate-600">
              Nenhuma mensagem nesta conversa ainda.
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Envie uma mensagem de texto abaixo para iniciar a comunicação real via WhatsApp.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.fromMe;
            const media = msg.media;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && msg.senderName && isGroup && (
                  <span className="text-[10px] text-slate-500 mb-1 ml-1 font-medium">
                    {msg.senderName}
                  </span>
                )}

                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs text-xs leading-relaxed relative ${
                    isMe
                      ? 'bg-[#184D9B] text-white rounded-br-xs'
                      : 'bg-white border border-slate-200/90 text-[#162033] rounded-bl-xs'
                  }`}
                >
                  {/* Media: Image */}
                  {media && media.mediaType === 'image' && (
                    <div className="my-1.5 overflow-hidden rounded-xl bg-black/5">
                      <a href={media.mediaUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={media.mediaUrl}
                          alt={media.caption || 'Foto'}
                          className="rounded-xl max-h-72 max-w-full w-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          loading="lazy"
                        />
                      </a>
                    </div>
                  )}

                  {/* Media: Audio (Voice Note / Audio file) */}
                  {media && media.mediaType === 'audio' && (
                    <div className="my-1.5 p-1 rounded-xl bg-black/5">
                      <audio
                        controls
                        className="w-full min-w-[220px] max-w-[290px] h-9"
                        preload="metadata"
                      >
                        <source src={media.mediaUrl} type={media.mimeType || 'audio/ogg'} />
                        Seu navegador não suporta áudio HTML5.
                      </audio>
                    </div>
                  )}

                  {/* Media: Document */}
                  {media && media.mediaType === 'document' && (
                    <a
                      href={media.mediaUrl}
                      download={media.fileName || 'documento'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border my-1 transition-colors ${
                        isMe
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                          : 'bg-slate-50 border-slate-200 text-[#162033] hover:bg-slate-100'
                      }`}
                    >
                      <FileText className="w-5 h-5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{media.fileName || 'Documento'}</p>
                        {media.fileSize && (
                          <p className={`text-[10px] ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                            {(media.fileSize / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>
                      <Download className="w-4 h-4 shrink-0 opacity-70" />
                    </a>
                  )}

                  {/* Media: Video */}
                  {media && media.mediaType === 'video' && (
                    <div className="my-1.5 overflow-hidden rounded-xl bg-black/5">
                      <video
                        controls
                        src={media.mediaUrl}
                        className="rounded-xl max-h-72 max-w-full w-auto"
                        preload="metadata"
                      />
                    </div>
                  )}

                  {/* Message Text (Hide if it's default fallback placeholder when media exists) */}
                  {(!media || (media.caption && msg.text !== '📷 Foto' && msg.text !== '🎤 Mensagem de voz' && !msg.text.startsWith('📄 '))) && (
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  )}

                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    <span>{formatMessageTime(msg.timestamp)}</span>
                    {isMe && (
                      <CheckCheck
                        className={`w-3.5 h-3.5 ${
                          msg.status === 'read' ? 'text-[#6FCBFF]' : 'text-white/80'
                        }`}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Composer Footer - Solidly positioned */}
      <div className="shrink-0 bg-white">
        <MessageInput
          onSendMessage={onSendMessage}
          disabled={isLoading}
          placeholder={`Enviar mensagem para ${displayName}...`}
        />
      </div>

    </div>
  );
};
