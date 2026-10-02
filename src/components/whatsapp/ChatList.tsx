import React, { useState } from 'react';
import { WhatsAppChat } from '../../types/whatsapp';
import { getCleanDisplayName, formatPhoneNumber, isGroupJid } from '../../utils/phone';
import {
  Search,
  Plus,
  User,
  Users,
  MessageSquare,
  CheckCheck,
  Camera,
  Mic,
  FileText,
  Video,
} from 'lucide-react';

interface ChatListProps {
  chats: WhatsAppChat[];
  selectedChatId?: string;
  onSelectChat: (chat: WhatsAppChat) => void;
  onOpenNewChatModal: () => void;
  isLoading: boolean;
}

// Avatar component with graceful fallback to Users / User icon
const ChatAvatar: React.FC<{ chat: WhatsAppChat; displayName: string; isSelected: boolean }> = ({
  chat,
  displayName,
  isSelected,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const isGroup = !!chat.isGroup || isGroupJid(chat.jid);

  if (chat.profilePictureUrl && !imgFailed) {
    return (
      <img
        src={chat.profilePictureUrl}
        alt={displayName}
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-medium ${
        isSelected
          ? 'bg-[#184D9B] text-white'
          : 'bg-slate-100 text-slate-600 border border-slate-200/60'
      }`}
    >
      {isGroup ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
    </div>
  );
};

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  onOpenNewChatModal,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const displayName = getCleanDisplayName(c).toLowerCase();
    const phone = c.phoneNumber || formatPhoneNumber(c.jid);
    return (
      displayName.includes(q) ||
      phone.includes(q) ||
      (c.lastMessage?.text && c.lastMessage.text.toLowerCase().includes(q))
    );
  });

  const formatTimestamp = (isoDate?: string) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMediaIcon = (mediaType?: string) => {
    switch (mediaType) {
      case 'image':
        return <Camera className="w-3 h-3 text-[#2F8CFF] shrink-0" />;
      case 'audio':
        return <Mic className="w-3 h-3 text-emerald-600 shrink-0" />;
      case 'document':
        return <FileText className="w-3 h-3 text-amber-600 shrink-0" />;
      case 'video':
        return <Video className="w-3 h-3 text-indigo-600 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-white border-r border-slate-200/80 shrink-0 select-none">
      
      {/* Search & Actions Header */}
      <div className="p-3 border-b border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-sora">
            Conversas ({chats.length})
          </span>
          <button
            onClick={onOpenNewChatModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#184D9B] hover:text-[#162033] hover:bg-[#F5FAFD] rounded-lg transition-colors cursor-pointer border border-[#2F8CFF]/20"
            title="Iniciar nova conversa com um número"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova conversa</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome ou número..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[#162033] placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-[#2F8CFF] focus:ring-1 focus:ring-[#2F8CFF]/30 transition-all"
          />
        </div>
      </div>

      {/* Chat List Items Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading && chats.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Carregando conversas...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">
                {searchQuery ? 'Nenhum resultado para a busca' : 'Nenhuma conversa encontrada'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                {searchQuery
                  ? 'Verifique os termos pesquisados.'
                  : 'As conversas recebidas e enviadas pelo WhatsApp aparecerão aqui.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={onOpenNewChatModal}
                className="text-xs font-medium text-[#184D9B] hover:underline cursor-pointer"
              >
                + Iniciar conversa com número
              </button>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = selectedChatId === chat.jid;
            const displayName = getCleanDisplayName(chat);
            const isGroup = !!chat.isGroup || isGroupJid(chat.jid);

            return (
              <button
                key={chat.jid}
                onClick={() => onSelectChat(chat)}
                className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative ${
                  isSelected
                    ? 'bg-[#F0F8FF] border-l-3 border-[#184D9B]'
                    : 'hover:bg-slate-50/80 bg-white'
                }`}
              >
                {/* Profile Picture / Avatar */}
                <ChatAvatar
                  chat={chat}
                  displayName={displayName}
                  isSelected={isSelected}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-semibold text-[#162033] font-sora truncate">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {formatTimestamp(chat.lastMessage?.timestamp || chat.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      {chat.lastMessage?.fromMe && (
                        <CheckCheck className="w-3 h-3 text-[#2F8CFF] shrink-0" />
                      )}
                      {renderMediaIcon(chat.lastMessage?.mediaType)}
                      <span className="truncate">
                        {chat.lastMessage?.text || (isGroup ? 'Grupo do WhatsApp' : 'Mensagem')}
                      </span>
                    </p>

                    {chat.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#2F8CFF] text-white text-[10px] font-semibold shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

    </div>
  );
};
