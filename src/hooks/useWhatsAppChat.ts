import { useState, useEffect, useCallback, useRef } from 'react';
import { WhatsAppChat, WhatsAppMessage, WhatsAppServerEvent } from '../types/whatsapp';
import { whatsAppApi } from '../services/whatsapp-api';

export function useWhatsAppChat(lineId?: string) {
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedChatRef = useRef<WhatsAppChat | null>(null);
  selectedChatRef.current = selectedChat;

  // Load chats for active line
  const loadChats = useCallback(async () => {
    if (!lineId) {
      setChats([]);
      return;
    }
    try {
      setIsLoadingChats(true);
      setError(null);
      const data = await whatsAppApi.fetchChats(lineId);
      setChats(data);
    } catch (err: any) {
      console.error('[useWhatsAppChat] Error loading chats:', err);
      setError(err?.message || 'Falha ao carregar conversas.');
    } finally {
      setIsLoadingChats(false);
    }
  }, [lineId]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Load messages when selectedChat changes
  const selectChat = useCallback(
    async (chat: WhatsAppChat) => {
      setSelectedChat(chat);
      if (!lineId) return;

      try {
        setIsLoadingMessages(true);
        setError(null);
        const data = await whatsAppApi.fetchMessages(lineId, chat.jid);
        setMessages(data);
      } catch (err: any) {
        console.error('[useWhatsAppChat] Error loading messages:', err);
        setError(err?.message || 'Falha ao carregar histórico de mensagens.');
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [lineId]
  );

  // Send message to selected chat
  const sendMessage = useCallback(
    async (text: string) => {
      if (!lineId || !selectedChatRef.current || !text.trim()) return;
      const targetJid = selectedChatRef.current.jid;

      try {
        setIsSending(true);
        setError(null);
        const newMsg = await whatsAppApi.sendMessage(lineId, targetJid, text.trim());

        // Update messages list immediately if not already present
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Update chats list lastMessage
        setChats((prev) =>
          prev.map((c) =>
            c.jid === targetJid
              ? {
                  ...c,
                  lastMessage: {
                    text: newMsg.text,
                    timestamp: newMsg.timestamp,
                    fromMe: true,
                  },
                  updatedAt: newMsg.timestamp,
                }
              : c
          )
        );
      } catch (err: any) {
        console.error('[useWhatsAppChat] Error sending message:', err);
        setError(err?.message || 'Falha ao enviar mensagem.');
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [lineId]
  );

  // Start new chat with phone number
  const startNewChat = useCallback(
    async (phoneOrJid: string, name?: string) => {
      if (!lineId || !phoneOrJid.trim()) return null;
      try {
        setError(null);
        const chat = await whatsAppApi.startChat(lineId, phoneOrJid.trim(), name);
        setChats((prev) => {
          const exists = prev.find((c) => c.jid === chat.jid);
          if (exists) return prev;
          return [chat, ...prev];
        });
        await selectChat(chat);
        return chat;
      } catch (err: any) {
        console.error('[useWhatsAppChat] Error starting chat:', err);
        setError(err?.message || 'Falha ao iniciar conversa.');
        return null;
      }
    },
    [lineId, selectChat]
  );

  // Real-time SSE listener
  useEffect(() => {
    const unsubscribe = whatsAppApi.subscribeToEvents((event: WhatsAppServerEvent) => {
      if (!lineId || event.lineId !== lineId) return;

      if (event.type === 'message_upsert' && event.payload) {
        const msg = event.payload as WhatsAppMessage;

        // If this message belongs to the current open chat, append to messages
        if (selectedChatRef.current && selectedChatRef.current.jid === msg.chatJid) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }

        // Also update chats list
        setChats((prev) => {
          const existing = prev.find((c) => c.jid === msg.chatJid);
          if (existing) {
            const updated = {
              ...existing,
              lastMessage: {
                text: msg.text,
                timestamp: msg.timestamp,
                fromMe: msg.fromMe,
              },
              updatedAt: msg.timestamp,
            };
            return [updated, ...prev.filter((c) => c.jid !== msg.chatJid)];
          } else {
            const isGroup = msg.chatJid.endsWith('@g.us') || msg.chatJid.includes('@g.us');
            const newChat: WhatsAppChat = {
              id: msg.chatJid,
              lineId,
              jid: msg.chatJid,
              name: isGroup ? 'Grupo do WhatsApp' : (msg.senderName || 'Contato do WhatsApp'),
              isGroup,
              phoneNumber: isGroup ? undefined : undefined,
              unreadCount: msg.fromMe ? 0 : 1,
              lastMessage: {
                text: msg.text,
                timestamp: msg.timestamp,
                fromMe: msg.fromMe,
                mediaType: msg.media?.mediaType,
              },
              updatedAt: msg.timestamp,
            };
            return [newChat, ...prev];
          }
        });
      } else if (event.type === 'chat_upsert' && event.payload) {
        const chat = event.payload as WhatsAppChat;
        setChats((prev) => {
          const filtered = prev.filter((c) => c.jid !== chat.jid);
          return [chat, ...filtered];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [lineId]);

  return {
    chats,
    selectedChat,
    messages,
    isLoadingChats,
    isLoadingMessages,
    isSending,
    error,
    loadChats,
    selectChat,
    sendMessage,
    startNewChat,
  };
}
