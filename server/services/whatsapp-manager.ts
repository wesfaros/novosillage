import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import * as baileysPkg from '@whiskeysockets/baileys';
import {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  ConnectionState,
} from '@whiskeysockets/baileys';

// Robust resolution across ESM / tsx bundling
const makeWASocket = (
  typeof (baileysPkg as any).makeWASocket === 'function'
    ? (baileysPkg as any).makeWASocket
    : typeof (baileysPkg as any).default?.makeWASocket === 'function'
    ? (baileysPkg as any).default.makeWASocket
    : typeof (baileysPkg as any).default?.default === 'function'
    ? (baileysPkg as any).default.default
    : typeof (baileysPkg as any).default === 'function'
    ? (baileysPkg as any).default
    : baileysPkg
) as typeof baileysPkg.default;

const downloadMediaMessage = (
  (baileysPkg as any).downloadMediaMessage ||
  (baileysPkg as any).default?.downloadMediaMessage
);

import QRCode from 'qrcode';
import pino from 'pino';
import { whatsAppStorage } from '../storage/whatsapp-storage.js';
import {
  WhatsAppLine,
  WhatsAppLineStatus,
  WhatsAppServerEvent,
  WhatsAppChat,
  WhatsAppMessage,
  WhatsAppMediaMeta,
} from '../types/whatsapp.js';

export function isGroupJid(jid?: string): boolean {
  if (!jid) return false;
  return jid.endsWith('@g.us') || jid.includes('@g.us') || /^\d{16,}@/.test(jid);
}

export function isLidJid(jid?: string): boolean {
  if (!jid) return false;
  return jid.endsWith('@lid') || jid.includes('@lid');
}

export function isTechnicalIdentifier(val?: string): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  if (
    trimmed.includes('@g.us') ||
    trimmed.includes('@lid') ||
    trimmed.includes('@s.whatsapp.net') ||
    trimmed.includes('@broadcast')
  ) {
    return true;
  }

  // Extract raw digits
  const digits = trimmed.replace(/\D/g, '');

  // Group JIDs or LIDs without @ (e.g. 120363378416126903 or 231812387328214)
  if (digits.startsWith('12036')) return true;
  if (digits.length > 15) return true;

  // Purely numeric or numeric with formatting but suspicious length
  if (/^[+\d\s().-]+$/.test(trimmed)) {
    if (digits.length > 15 || digits.length < 8) return true;
    if (digits.startsWith('12036')) return true;
  }

  return false;
}

export function formatPhoneNumber(jidOrPhone?: string): string {
  if (!jidOrPhone) return '';
  if (isGroupJid(jidOrPhone) || isLidJid(jidOrPhone) || jidOrPhone === 'status@broadcast') {
    return '';
  }

  const raw = jidOrPhone.split('@')[0].split(':')[0];
  const digits = raw.replace(/\D/g, '');

  // Valid E.164 phone numbers are strictly between 8 and 15 digits
  if (digits.length < 8 || digits.length > 15) {
    return '';
  }

  if (digits.startsWith('12036')) {
    return '';
  }

  // Brazilian numbers
  if (digits.startsWith('55')) {
    if (digits.length === 12) {
      return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
    if (digits.length === 13) {
      return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
  }

  // International standard
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
  }

  return `+${digits}`;
}

export function unwrapMessage(msgContent: any): any {
  if (!msgContent) return undefined;
  if (msgContent.ephemeralMessage?.message) {
    return unwrapMessage(msgContent.ephemeralMessage.message);
  }
  if (msgContent.viewOnceMessage?.message) {
    return unwrapMessage(msgContent.viewOnceMessage.message);
  }
  if (msgContent.viewOnceMessageV2?.message) {
    return unwrapMessage(msgContent.viewOnceMessageV2.message);
  }
  if (msgContent.documentWithCaptionMessage?.message) {
    return unwrapMessage(msgContent.documentWithCaptionMessage.message);
  }
  return msgContent;
}

function extractMessageText(msgContent: any): string {
  if (!msgContent) return '';
  const content = unwrapMessage(msgContent);
  if (!content) return '';

  if (typeof content.conversation === 'string' && content.conversation) {
    return content.conversation;
  }
  if (content.extendedTextMessage?.text) {
    return content.extendedTextMessage.text;
  }
  if (content.imageMessage?.caption) {
    return content.imageMessage.caption;
  }
  if (content.videoMessage?.caption) {
    return content.videoMessage.caption;
  }
  if (content.documentMessage?.caption) {
    return content.documentMessage.caption;
  }
  return '';
}

async function handleMediaDownload(
  sock: WASocket,
  lineId: string,
  messageId: string,
  msg: any
): Promise<WhatsAppMediaMeta | undefined> {
  if (!msg?.message || !downloadMediaMessage) return undefined;
  const content = unwrapMessage(msg.message);
  if (!content) return undefined;

  let mediaType: 'image' | 'audio' | 'document' | 'video' | undefined;
  let ext = 'bin';
  let mimeType = '';
  let fileName: string | undefined;
  let caption: string | undefined;
  let isPtt = false;

  if (content.imageMessage) {
    mediaType = 'image';
    mimeType = content.imageMessage.mimetype || 'image/jpeg';
    ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    caption = content.imageMessage.caption;
  } else if (content.audioMessage) {
    mediaType = 'audio';
    mimeType = content.audioMessage.mimetype || 'audio/ogg; codecs=opus';
    isPtt = !!content.audioMessage.ptt;
    ext = isPtt ? 'ogg' : (mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'mp3');
  } else if (content.documentMessage) {
    mediaType = 'document';
    mimeType = content.documentMessage.mimetype || 'application/octet-stream';
    const rawFileName = content.documentMessage.fileName || 'documento.pdf';
    fileName = rawFileName;
    caption = content.documentMessage.caption;
    const parts = rawFileName.split('.');
    ext = parts.length > 1 ? parts.pop()! : 'pdf';
  } else if (content.videoMessage) {
    mediaType = 'video';
    mimeType = content.videoMessage.mimetype || 'video/mp4';
    ext = 'mp4';
    caption = content.videoMessage.caption;
  }

  if (!mediaType) return undefined;

  try {
    const messageToDownload = {
      key: msg.key,
      message: content,
    };

    const buffer = await downloadMediaMessage(
      messageToDownload as any,
      'buffer',
      {},
      {
        logger: pino({ level: 'silent' }),
        reuploadRequest: sock.updateMediaMessage,
      }
    );

    if (buffer && Buffer.isBuffer(buffer)) {
      const mediaDir = whatsAppStorage.getMediaDirectory(lineId);
      const safeFilename = `${messageId.replace(/[^a-zA-Z0-9_-]/g, '')}.${ext}`;
      const filePath = path.join(mediaDir, safeFilename);
      fs.writeFileSync(filePath, buffer);

      console.log(`[WhatsAppManager] Successfully saved media (${mediaType}, ${buffer.length} bytes) to ${filePath}`);

      return {
        mediaType,
        mediaUrl: `/api/whatsapp/lines/${lineId}/media/${safeFilename}`,
        fileName,
        fileSize: buffer.length,
        mimeType,
        caption,
        isPtt,
      };
    }
  } catch (err) {
    console.error(`[WhatsAppManager] Failed to download media for msg ${messageId}:`, err);
  }

  return undefined;
}

interface ActiveLineSession {
  socket: WASocket;
  lineId: string;
  accountId: string;
  isIntentionalDisconnect: boolean;
  reconnectAttempts: number;
  reconnectTimer?: NodeJS.Timeout;
}

const MAX_RECONNECT_ATTEMPTS = 5;

let cachedWaVersion: [number, number, number] | undefined;

async function getWhatsAppWebVersion(): Promise<[number, number, number]> {
  if (cachedWaVersion) return cachedWaVersion;
  try {
    const fetchLatest =
      (baileysPkg as any).fetchLatestWaWebVersion ||
      (baileysPkg as any).default?.fetchLatestWaWebVersion;
    if (typeof fetchLatest === 'function') {
      const { version } = await fetchLatest();
      console.log(`[WhatsAppManager] Retrieved latest WhatsApp Web version:`, version);
      cachedWaVersion = version;
      return version;
    }
  } catch (err) {
    console.warn(`[WhatsAppManager] Could not fetch latest WA version, using fallback:`, err);
  }
  return [2, 3000, 1049045808];
}

export class WhatsAppConnectionManager extends EventEmitter {
  private activeSessions = new Map<string, ActiveLineSession>();
  private isInitialized = false;
  private groupSubjectCache = new Map<string, { subject: string; fetchedAt: number }>();
  private profilePictureCache = new Map<string, { url: string; fetchedAt: number }>();

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('[WhatsAppManager] Initializing Connection Manager...');

    const lines = whatsAppStorage.getAllLines();
    for (const line of lines) {
      // Clean up corrupted names and phone numbers in existing chats
      this.sanitizeExistingData(line.id);

      if (line.status === 'connected' || line.status === 'reconnecting') {
        console.log(`[WhatsAppManager] Auto-reconnecting previously active line: ${line.name} (${line.id})`);
        this.connectLine(line.id).catch((err) => {
          console.error(`[WhatsAppManager] Failed auto-reconnect for ${line.id}:`, err);
        });
      } else {
        if (line.status === 'waiting_qr' || line.status === 'qr_ready' || line.status === 'connecting') {
          whatsAppStorage.updateLineFields(line.id, {
            status: 'disconnected',
            qrCodeDataUrl: undefined,
          });
        }
      }
    }
  }

  private sanitizeExistingData(lineId: string): void {
    try {
      const chats = whatsAppStorage.getChats(lineId);
      for (const chat of chats) {
        const isGroup = chat.isGroup || isGroupJid(chat.jid);
        let updated = false;
        const patch: Partial<WhatsAppChat> = {};

        if (isGroup) {
          if (!chat.isGroup) {
            patch.isGroup = true;
            updated = true;
          }
          if (chat.phoneNumber) {
            patch.phoneNumber = undefined;
            updated = true;
          }
          if (!chat.name || isTechnicalIdentifier(chat.name)) {
            patch.name = 'Grupo do WhatsApp';
            updated = true;
          }
        } else {
          if (chat.phoneNumber && isTechnicalIdentifier(chat.phoneNumber)) {
            patch.phoneNumber = formatPhoneNumber(chat.jid) || undefined;
            updated = true;
          }
          if (!chat.name || isTechnicalIdentifier(chat.name)) {
            patch.name = formatPhoneNumber(chat.jid) || 'Contato do WhatsApp';
            updated = true;
          }
        }

        if (updated) {
          whatsAppStorage.updateChat(lineId, chat.jid, patch);
        }
      }
    } catch (e) {
      console.error('[WhatsAppManager] Error sanitizing data:', e);
    }
  }

  public getAllLines(): WhatsAppLine[] {
    return whatsAppStorage.getAllLines();
  }

  public getLine(id: string): WhatsAppLine | undefined {
    return whatsAppStorage.getLineById(id);
  }

  public async createLine(name: string): Promise<WhatsAppLine> {
    const id = `line_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newLine: WhatsAppLine = {
      id,
      name: name.trim() || 'Nova Linha',
      accountId,
      status: 'waiting_qr',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    whatsAppStorage.saveLine(newLine);
    this.broadcastEvent({
      type: 'line_created',
      lineId: id,
      timestamp: new Date().toISOString(),
      payload: newLine,
    });

    this.connectLine(id).catch((err) => {
      console.error(`[WhatsAppManager] Error starting new line ${id}:`, err);
    });

    return newLine;
  }

  public async connectLine(lineId: string): Promise<WhatsAppLine> {
    const line = whatsAppStorage.getLineById(lineId);
    if (!line) {
      throw new Error(`Linha com ID ${lineId} não encontrada.`);
    }

    const existingSession = this.activeSessions.get(lineId);
    if (existingSession) {
      if (line.status === 'connected' || line.status === 'connecting') {
        console.log(`[WhatsAppManager] Line ${lineId} already has an active socket.`);
        return line;
      }
      this.cleanupSession(lineId, false);
    }

    const sessionDir = whatsAppStorage.getSessionDirectory(line.accountId);
    console.log(`[WhatsAppManager] Connecting line ${line.name} (${lineId}) with sessionDir: ${sessionDir}`);

    this.updateStatus(lineId, 'waiting_qr', { lastError: undefined });

    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      const version = await getWhatsAppWebVersion();

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
      });

      const session: ActiveLineSession = {
        socket: sock,
        lineId,
        accountId: line.accountId,
        isIntentionalDisconnect: false,
        reconnectAttempts: 0,
      };

      this.activeSessions.set(lineId, session);

      // Save credentials update
      sock.ev.on('creds.update', saveCreds);

      // Handle connection updates
      sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
        await this.handleConnectionUpdate(lineId, update);
      });

      // Handle real-time incoming & outgoing messages
      sock.ev.on('messages.upsert', async ({ messages }: any) => {
        for (const msg of messages || []) {
          const remoteJid = msg.key?.remoteJid;
          if (!remoteJid || remoteJid === 'status@broadcast') continue;

          const isGroup = isGroupJid(remoteJid);
          const isFromMe = !!msg.key?.fromMe;
          const messageId = msg.key?.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

          // Check if message has media
          const unwrapped = unwrapMessage(msg.message);
          const hasMedia = !!(
            unwrapped?.imageMessage ||
            unwrapped?.audioMessage ||
            unwrapped?.documentMessage ||
            unwrapped?.videoMessage
          );

          let mediaMeta: WhatsAppMediaMeta | undefined;
          if (hasMedia) {
            mediaMeta = await handleMediaDownload(sock, lineId, messageId, msg);
          }

          let text = extractMessageText(msg.message);
          if (!text) {
            if (mediaMeta?.mediaType === 'image') text = mediaMeta.caption || '📷 Foto';
            else if (mediaMeta?.mediaType === 'audio') text = mediaMeta.isPtt ? '🎤 Mensagem de voz' : '🎵 Áudio';
            else if (mediaMeta?.mediaType === 'document') text = `📄 ${mediaMeta.fileName || 'Documento'}`;
            else if (mediaMeta?.mediaType === 'video') text = mediaMeta.caption || '🎥 Vídeo';
            else if (unwrapped?.stickerMessage) text = '👾 Figurinha';
            else if (hasMedia) text = '📎 Arquivo de mídia';
            else continue;
          }

          const timestamp = msg.messageTimestamp
            ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
            : new Date().toISOString();

          // In groups, msg.pushName is the participant who sent the message
          const senderName = isGroup ? (msg.pushName || undefined) : undefined;

          const normalizedMsg: WhatsAppMessage = {
            id: messageId,
            lineId,
            chatJid: remoteJid,
            fromMe: isFromMe,
            senderName,
            text,
            timestamp,
            status: isFromMe ? 'sent' : 'delivered',
            media: mediaMeta,
          };

          whatsAppStorage.saveMessage(lineId, normalizedMsg);

          // Resolve chat name carefully:
          // NEVER overwrite a group's subject with participant pushName!
          let chatName: string;
          let phoneNumber: string | undefined;

          if (isGroup) {
            const cachedSubject = this.groupSubjectCache.get(remoteJid)?.subject;
            if (cachedSubject) {
              chatName = cachedSubject;
            } else {
              chatName = await this.getGroupName(lineId, remoteJid);
            }
            phoneNumber = undefined;
          } else {
            const existingChat = whatsAppStorage.getChats(lineId).find((c) => c.jid === remoteJid);
            if (!isFromMe && msg.pushName && !isTechnicalIdentifier(msg.pushName)) {
              chatName = msg.pushName;
            } else if (existingChat?.name && !isTechnicalIdentifier(existingChat.name)) {
              chatName = existingChat.name;
            } else {
              chatName = formatPhoneNumber(remoteJid) || 'Contato do WhatsApp';
            }
            phoneNumber = formatPhoneNumber(remoteJid) || undefined;
          }

          // Fetch profile picture in background if not yet cached
          const existingChat = whatsAppStorage.getChats(lineId).find((c) => c.jid === remoteJid);
          if (!existingChat?.profilePictureUrl) {
            this.getProfilePic(lineId, remoteJid).then((url) => {
              if (url) {
                whatsAppStorage.updateChat(lineId, remoteJid, { profilePictureUrl: url });
                const updated = whatsAppStorage.getChats(lineId).find((c) => c.jid === remoteJid);
                if (updated) {
                  this.broadcastEvent({
                    type: 'chat_upsert',
                    lineId,
                    timestamp: new Date().toISOString(),
                    payload: updated,
                  });
                }
              }
            });
          }

          const updatedChat = whatsAppStorage.upsertChat(lineId, {
            jid: remoteJid,
            name: chatName,
            phoneNumber,
            isGroup,
            lastMessage: {
              text: normalizedMsg.text,
              timestamp: normalizedMsg.timestamp,
              fromMe: normalizedMsg.fromMe,
              mediaType: mediaMeta?.mediaType,
            },
            updatedAt: normalizedMsg.timestamp,
          });

          this.broadcastEvent({
            type: 'message_upsert',
            lineId,
            timestamp: new Date().toISOString(),
            payload: normalizedMsg,
          });

          this.broadcastEvent({
            type: 'chat_upsert',
            lineId,
            timestamp: new Date().toISOString(),
            payload: updatedChat,
          });
        }
      });

      // Handle chats updates
      sock.ev.on('chats.upsert', async (newChats: any[]) => {
        for (const chat of newChats || []) {
          if (!chat.id || chat.id === 'status@broadcast') continue;
          const isGroup = isGroupJid(chat.id);
          let name = chat.name;

          if (isGroup) {
            if (!name || isTechnicalIdentifier(name) || name === 'Grupo do WhatsApp') {
              name = await this.getGroupName(lineId, chat.id);
            }
          } else {
            if (!name || isTechnicalIdentifier(name)) {
              name = formatPhoneNumber(chat.id) || 'Contato do WhatsApp';
            }
          }

          const phoneNumber = isGroup ? undefined : (formatPhoneNumber(chat.id) || undefined);

          const updatedChat = whatsAppStorage.upsertChat(lineId, {
            jid: chat.id,
            name: name || (isGroup ? 'Grupo do WhatsApp' : 'Contato do WhatsApp'),
            phoneNumber,
            isGroup,
            unreadCount: chat.unreadCount || 0,
            updatedAt: new Date().toISOString(),
          });

          this.broadcastEvent({
            type: 'chat_upsert',
            lineId,
            timestamp: new Date().toISOString(),
            payload: updatedChat,
          });

          this.getProfilePic(lineId, chat.id).then((url) => {
            if (url) {
              whatsAppStorage.updateChat(lineId, chat.id, { profilePictureUrl: url });
            }
          });
        }
      });

      // Handle initial history sync
      sock.ev.on('messaging-history.set', async ({ chats, messages }: any) => {
        console.log(`[WhatsAppManager] History sync for line ${lineId}: ${chats?.length || 0} chats, ${messages?.length || 0} messages`);
        if (chats) {
          for (const chat of chats) {
            if (!chat.id || chat.id === 'status@broadcast') continue;
            const isGroup = isGroupJid(chat.id);
            let name = chat.name;

            if (isGroup) {
              name = await this.getGroupName(lineId, chat.id);
            } else {
              if (!name || isTechnicalIdentifier(name)) {
                name = formatPhoneNumber(chat.id) || 'Contato do WhatsApp';
              }
            }

            const phoneNumber = isGroup ? undefined : (formatPhoneNumber(chat.id) || undefined);

            whatsAppStorage.upsertChat(lineId, {
              jid: chat.id,
              name: name || (isGroup ? 'Grupo do WhatsApp' : 'Contato do WhatsApp'),
              phoneNumber,
              isGroup,
              unreadCount: chat.unreadCount || 0,
              updatedAt: new Date().toISOString(),
            });

            this.getProfilePic(lineId, chat.id).then((url) => {
              if (url) {
                whatsAppStorage.updateChat(lineId, chat.id, { profilePictureUrl: url });
              }
            });
          }
        }

        if (messages) {
          for (const msg of messages) {
            const remoteJid = msg.key?.remoteJid;
            if (!remoteJid || remoteJid === 'status@broadcast') continue;
            const text = extractMessageText(msg.message);
            if (!text) continue;

            const isGroup = isGroupJid(remoteJid);
            const isFromMe = !!msg.key?.fromMe;

            const timestamp = msg.messageTimestamp
              ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
              : new Date().toISOString();

            const normalizedMsg: WhatsAppMessage = {
              id: msg.key.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              lineId,
              chatJid: remoteJid,
              fromMe: isFromMe,
              senderName: isGroup ? (msg.pushName || undefined) : undefined,
              text,
              timestamp,
              status: isFromMe ? 'sent' : 'delivered',
            };
            whatsAppStorage.saveMessage(lineId, normalizedMsg);

            const existing = whatsAppStorage.getChats(lineId).find((c) => c.jid === remoteJid);
            let chatName = existing?.name;

            if (isGroup) {
              if (!chatName || isTechnicalIdentifier(chatName) || chatName === 'Grupo do WhatsApp') {
                chatName = this.groupSubjectCache.get(remoteJid)?.subject || 'Grupo do WhatsApp';
              }
            } else {
              if (!isFromMe && msg.pushName && !isTechnicalIdentifier(msg.pushName)) {
                chatName = msg.pushName;
              } else if (!chatName || isTechnicalIdentifier(chatName)) {
                chatName = formatPhoneNumber(remoteJid) || 'Contato do WhatsApp';
              }
            }

            whatsAppStorage.upsertChat(lineId, {
              jid: remoteJid,
              name: chatName || (isGroup ? 'Grupo do WhatsApp' : 'Contato do WhatsApp'),
              phoneNumber: isGroup ? undefined : (formatPhoneNumber(remoteJid) || undefined),
              isGroup,
              lastMessage: {
                text: normalizedMsg.text,
                timestamp: normalizedMsg.timestamp,
                fromMe: normalizedMsg.fromMe,
              },
              updatedAt: normalizedMsg.timestamp,
            });
          }
        }
      });

      return whatsAppStorage.getLineById(lineId) || line;
    } catch (err: any) {
      console.error(`[WhatsAppManager] Failed to create socket for line ${lineId}:`, err);
      const updated = this.updateStatus(lineId, 'error', {
        lastError: err?.message || 'Erro ao inicializar conexão Baileys.',
      });
      return updated || line;
    }
  }

  private async syncGroupsAndProfiles(lineId: string, sock: WASocket): Promise<void> {
    try {
      console.log(`[WhatsAppManager] Syncing participating groups and subjects for line ${lineId}...`);
      const groups = await sock.groupFetchAllParticipating();
      for (const [groupJid, groupMeta] of Object.entries(groups)) {
        if (groupMeta?.subject) {
          this.groupSubjectCache.set(groupJid, { subject: groupMeta.subject, fetchedAt: Date.now() });
          const updatedChat = whatsAppStorage.upsertChat(lineId, {
            jid: groupJid,
            name: groupMeta.subject,
            isGroup: true,
            phoneNumber: undefined,
          });

          this.broadcastEvent({
            type: 'chat_upsert',
            lineId,
            timestamp: new Date().toISOString(),
            payload: updatedChat,
          });

          // Fetch group profile pic
          this.getProfilePic(lineId, groupJid).then((url) => {
            if (url) {
              whatsAppStorage.updateChat(lineId, groupJid, { profilePictureUrl: url });
              const withPic = whatsAppStorage.getChats(lineId).find((c) => c.jid === groupJid);
              if (withPic) {
                this.broadcastEvent({
                  type: 'chat_upsert',
                  lineId,
                  timestamp: new Date().toISOString(),
                  payload: withPic,
                });
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('[WhatsAppManager] Failed groupFetchAllParticipating:', err);
    }

    // Also fetch profile pictures for all stored chats lacking one
    const allChats = whatsAppStorage.getChats(lineId);
    for (const chat of allChats) {
      if (!chat.profilePictureUrl) {
        this.getProfilePic(lineId, chat.jid).then((url) => {
          if (url) {
            whatsAppStorage.updateChat(lineId, chat.jid, { profilePictureUrl: url });
            const withPic = whatsAppStorage.getChats(lineId).find((c) => c.jid === chat.jid);
            if (withPic) {
              this.broadcastEvent({
                type: 'chat_upsert',
                lineId,
                timestamp: new Date().toISOString(),
                payload: withPic,
              });
            }
          }
        });
      }
    }
  }

  public async getGroupName(lineId: string, groupJid: string): Promise<string> {
    const cached = this.groupSubjectCache.get(groupJid);
    if (cached && Date.now() - cached.fetchedAt < 3600000) {
      return cached.subject;
    }

    const session = this.activeSessions.get(lineId);
    if (session?.socket) {
      try {
        const meta = await session.socket.groupMetadata(groupJid);
        if (meta?.subject) {
          this.groupSubjectCache.set(groupJid, { subject: meta.subject, fetchedAt: Date.now() });
          return meta.subject;
        }
      } catch (err) {
        // e.g. group no longer accessible
      }
    }

    const existing = whatsAppStorage.getChats(lineId).find((c) => c.jid === groupJid);
    if (existing?.name && !isTechnicalIdentifier(existing.name) && existing.name !== 'Grupo do WhatsApp') {
      return existing.name;
    }

    return 'Grupo do WhatsApp';
  }

  public async getProfilePic(lineId: string, jid: string): Promise<string | undefined> {
    const cached = this.profilePictureCache.get(jid);
    if (cached && Date.now() - cached.fetchedAt < 7200000) {
      return cached.url;
    }

    const session = this.activeSessions.get(lineId);
    if (session?.socket) {
      try {
        let url: string | undefined;
        try {
          url = await session.socket.profilePictureUrl(jid, 'image');
        } catch {
          try {
            url = await session.socket.profilePictureUrl(jid, 'preview');
          } catch {
            // ignore
          }
        }

        if (url) {
          this.profilePictureCache.set(jid, { url, fetchedAt: Date.now() });
          return url;
        }
      } catch {
        // No profile picture or privacy restricted
      }
    }
    return undefined;
  }

  private async handleConnectionUpdate(
    lineId: string,
    update: Partial<ConnectionState>
  ): Promise<void> {
    const { connection, lastDisconnect, qr } = update;
    const session = this.activeSessions.get(lineId);
    const line = whatsAppStorage.getLineById(lineId);

    if (!line) return;

    console.log(
      `[WhatsAppManager][Event] Line: ${line.name} (${lineId}) | Connection: ${connection} | QR: ${!!qr}`
    );

    // 1. QR Code generated
    if (qr) {
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(qr, {
          margin: 2,
          scale: 6,
          color: {
            dark: '#162033',
            light: '#FFFFFF',
          },
        });

        this.updateStatus(lineId, 'qr_ready', {
          qrCodeDataUrl,
          lastError: undefined,
        });

        console.log(`[WhatsAppManager] Real QR Code generated successfully for line ${line.name}`);
      } catch (qrErr) {
        console.error(`[WhatsAppManager] Error converting QR to data URL:`, qrErr);
      }
    }

    // 2. Connection state transitions
    if (connection === 'connecting') {
      this.updateStatus(lineId, 'connecting');
    } else if (connection === 'open') {
      const sock = session?.socket;
      const user = sock?.user;
      const rawJid = user?.id || '';
      const phoneNumber = rawJid.split('@')[0]?.split(':')[0] || undefined;
      const nameInWhatsApp = user?.name || undefined;

      if (session) {
        session.reconnectAttempts = 0;
      }

      console.log(`[WhatsAppManager] SUCCESS: Line ${line.name} CONNECTED! Phone: ${phoneNumber}, JID: ${rawJid}`);

      this.updateStatus(lineId, 'connected', {
        phoneNumber,
        jid: rawJid,
        nameInWhatsApp,
        qrCodeDataUrl: undefined,
        lastError: undefined,
        connectedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      });

      if (sock) {
        this.syncGroupsAndProfiles(lineId, sock).catch((err) => {
          console.warn('[WhatsAppManager] syncGroupsAndProfiles error:', err);
        });
      }
    } else if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isIntentional = session?.isIntentionalDisconnect ?? false;

      console.warn(
        `[WhatsAppManager] Connection closed for line ${line.name}. Status code: ${statusCode} (${DisconnectReason[statusCode] || 'Unknown'}), Intentional: ${isIntentional}, LoggedOut: ${isLoggedOut}`
      );

      if (isIntentional) {
        this.updateStatus(lineId, 'disconnected_by_user', {
          qrCodeDataUrl: undefined,
        });
        this.cleanupSession(lineId, false);
      } else if (isLoggedOut) {
        console.warn(`[WhatsAppManager] Device logged out on WhatsApp mobile. Cleaning credentials.`);
        whatsAppStorage.deleteSessionDirectory(line.accountId);
        this.updateStatus(lineId, 'disconnected', {
          qrCodeDataUrl: undefined,
          phoneNumber: undefined,
          lastError: 'Linha desconectada pelo aparelho ou sessão revogada.',
        });
        this.cleanupSession(lineId, false);
      } else {
        const currentAttempts = (session?.reconnectAttempts || 0) + 1;
        if (session) {
          session.reconnectAttempts = currentAttempts;
        }

        if (currentAttempts <= MAX_RECONNECT_ATTEMPTS) {
          const delayMs = Math.min(1500 * Math.pow(1.8, currentAttempts), 25000);
          console.log(
            `[WhatsAppManager] Scheduling reconnect #${currentAttempts}/${MAX_RECONNECT_ATTEMPTS} for line ${line.name} in ${Math.round(delayMs / 1000)}s`
          );

          this.updateStatus(lineId, 'reconnecting', {
            qrCodeDataUrl: undefined,
            lastError: `Tentando reconectar (#${currentAttempts}/${MAX_RECONNECT_ATTEMPTS})...`,
          });

          this.cleanupSession(lineId, false);

          const timer = setTimeout(() => {
            console.log(`[WhatsAppManager] Executing controlled reconnect for ${line.name}...`);
            this.connectLine(lineId).catch((err) => {
              console.error(`[WhatsAppManager] Reconnect error for ${lineId}:`, err);
            });
          }, delayMs);

          const refreshedSession = this.activeSessions.get(lineId);
          if (refreshedSession) {
            refreshedSession.reconnectTimer = timer;
          }
        } else {
          console.error(`[WhatsAppManager] Exceeded maximum reconnect attempts for line ${line.name}`);
          this.updateStatus(lineId, 'error', {
            qrCodeDataUrl: undefined,
            lastError: 'Falha na reconexão após múltiplas tentativas. Tente reconectar manualmente.',
          });
          this.cleanupSession(lineId, false);
        }
      }
    }
  }

  public async disconnectLine(lineId: string): Promise<WhatsAppLine | undefined> {
    const line = whatsAppStorage.getLineById(lineId);
    if (!line) return undefined;

    console.log(`[WhatsAppManager] Disconnecting line ${line.name} (${lineId}) upon user request.`);

    const session = this.activeSessions.get(lineId);
    if (session) {
      session.isIntentionalDisconnect = true;
      if (session.reconnectTimer) {
        clearTimeout(session.reconnectTimer);
      }
      try {
        session.socket.end(undefined);
      } catch (e) {
        // ignore socket close errors
      }
      this.cleanupSession(lineId, false);
    }

    return this.updateStatus(lineId, 'disconnected_by_user', {
      qrCodeDataUrl: undefined,
    });
  }

  public async deleteLine(lineId: string): Promise<boolean> {
    const line = whatsAppStorage.getLineById(lineId);
    if (!line) return false;

    console.log(`[WhatsAppManager] Deleting line ${line.name} (${lineId}) and clearing session.`);
    await this.disconnectLine(lineId);
    const success = whatsAppStorage.deleteLine(lineId);

    if (success) {
      this.broadcastEvent({
        type: 'line_deleted',
        lineId,
        timestamp: new Date().toISOString(),
        payload: { id: lineId },
      });
    }

    return success;
  }

  public getChats(lineId: string): WhatsAppChat[] {
    const rawChats = whatsAppStorage.getChats(lineId);
    return rawChats.map((c) => {
      const isGroup = c.isGroup || isGroupJid(c.jid);
      let sanitizedName = c.name;

      if (isGroup) {
        const cachedSubject = this.groupSubjectCache.get(c.jid)?.subject;
        if (cachedSubject) {
          sanitizedName = cachedSubject;
        } else if (!sanitizedName || isTechnicalIdentifier(sanitizedName) || sanitizedName === 'Grupo do WhatsApp') {
          sanitizedName = 'Grupo do WhatsApp';
          this.getGroupName(lineId, c.jid).then((subject) => {
            if (subject && subject !== 'Grupo do WhatsApp') {
              whatsAppStorage.updateChat(lineId, c.jid, { name: subject });
              const updated = whatsAppStorage.getChats(lineId).find((ch) => ch.jid === c.jid);
              if (updated) {
                this.broadcastEvent({
                  type: 'chat_upsert',
                  lineId,
                  timestamp: new Date().toISOString(),
                  payload: updated,
                });
              }
            }
          });
        }
      } else {
        if (!sanitizedName || isTechnicalIdentifier(sanitizedName)) {
          sanitizedName = formatPhoneNumber(c.jid) || 'Contato do WhatsApp';
        }
      }

      if (!c.profilePictureUrl) {
        this.getProfilePic(lineId, c.jid).then((url) => {
          if (url) {
            whatsAppStorage.updateChat(lineId, c.jid, { profilePictureUrl: url });
            const updated = whatsAppStorage.getChats(lineId).find((ch) => ch.jid === c.jid);
            if (updated) {
              this.broadcastEvent({
                type: 'chat_upsert',
                lineId,
                timestamp: new Date().toISOString(),
                payload: updated,
              });
            }
          }
        });
      }

      return {
        ...c,
        isGroup,
        name: sanitizedName,
        phoneNumber: isGroup ? undefined : (formatPhoneNumber(c.jid) || undefined),
      };
    });
  }

  public getMessages(lineId: string, chatJid?: string): WhatsAppMessage[] {
    return whatsAppStorage.getMessages(lineId, chatJid);
  }

  public async sendMessage(lineId: string, chatJid: string, text: string): Promise<WhatsAppMessage> {
    const line = whatsAppStorage.getLineById(lineId);
    if (!line) {
      throw new Error(`Linha com ID ${lineId} não encontrada.`);
    }

    const session = this.activeSessions.get(lineId);
    if (!session || line.status !== 'connected') {
      throw new Error(`A linha "${line.name}" não está conectada ao WhatsApp no momento.`);
    }

    let targetJid = chatJid.trim();
    if (!targetJid.includes('@')) {
      targetJid = `${targetJid}@s.whatsapp.net`;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error('O texto da mensagem não pode ser vazio.');
    }

    console.log(`[WhatsAppManager] Sending message via line ${line.name} to ${targetJid}: "${trimmedText.slice(0, 30)}..."`);
    const sent = await session.socket.sendMessage(targetJid, { text: trimmedText });

    const normalizedMsg: WhatsAppMessage = {
      id: sent?.key?.id || `sent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      lineId,
      chatJid: targetJid,
      fromMe: true,
      text: trimmedText,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    whatsAppStorage.saveMessage(lineId, normalizedMsg);

    const isGroup = isGroupJid(targetJid);
    const existing = whatsAppStorage.getChats(lineId).find((c) => c.jid === targetJid);
    let name = existing?.name;
    if (isGroup) {
      name = this.groupSubjectCache.get(targetJid)?.subject || name || 'Grupo do WhatsApp';
    } else {
      if (!name || isTechnicalIdentifier(name)) {
        name = formatPhoneNumber(targetJid) || 'Contato do WhatsApp';
      }
    }

    const updatedChat = whatsAppStorage.upsertChat(lineId, {
      jid: targetJid,
      name,
      phoneNumber: isGroup ? undefined : (formatPhoneNumber(targetJid) || undefined),
      isGroup,
      lastMessage: {
        text: trimmedText,
        timestamp: normalizedMsg.timestamp,
        fromMe: true,
      },
      updatedAt: normalizedMsg.timestamp,
    });

    this.broadcastEvent({
      type: 'message_upsert',
      lineId,
      timestamp: new Date().toISOString(),
      payload: normalizedMsg,
    });

    this.broadcastEvent({
      type: 'chat_upsert',
      lineId,
      timestamp: new Date().toISOString(),
      payload: updatedChat,
    });

    return normalizedMsg;
  }

  private updateStatus(
    lineId: string,
    status: WhatsAppLineStatus,
    extraFields?: Partial<WhatsAppLine>
  ): WhatsAppLine | undefined {
    const updated = whatsAppStorage.updateLineFields(lineId, {
      status,
      ...extraFields,
    });

    if (updated) {
      this.broadcastEvent({
        type: extraFields?.qrCodeDataUrl ? 'qr_updated' : 'connection_state_changed',
        lineId,
        timestamp: new Date().toISOString(),
        payload: updated,
      });
    }

    return updated;
  }

  private cleanupSession(lineId: string, closeSocket = true): void {
    const session = this.activeSessions.get(lineId);
    if (!session) return;

    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
    }

    if (closeSocket) {
      try {
        session.socket.end(undefined);
      } catch (err) {
        // ignore
      }
    }

    this.activeSessions.delete(lineId);
  }

  private broadcastEvent(event: WhatsAppServerEvent): void {
    this.emit('event', event);
  }
}

export const whatsAppManager = new WhatsAppConnectionManager();
