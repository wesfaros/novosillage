export type WhatsAppLineStatus =
  | 'disconnected'
  | 'waiting_qr'
  | 'qr_ready'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'disconnected_by_user';

export interface WhatsAppLine {
  id: string;
  name: string;
  accountId: string;
  phoneNumber?: string;
  jid?: string;
  nameInWhatsApp?: string;
  status: WhatsAppLineStatus;
  qrCodeDataUrl?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  connectedAt?: string;
  lastSeenAt?: string;
}

export interface CreateWhatsAppLineDto {
  name: string;
}

export interface WhatsAppMediaMeta {
  mediaType: 'image' | 'audio' | 'document' | 'video';
  mediaUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  caption?: string;
  isPtt?: boolean;
}

export interface WhatsAppChat {
  id: string; // remoteJid
  lineId: string;
  jid: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  profilePictureUrl?: string;
  phoneNumber?: string;
  lastMessage?: {
    text: string;
    timestamp: string;
    fromMe: boolean;
    mediaType?: string;
  };
  updatedAt: string;
}

export type WhatsAppMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppMessage {
  id: string; // message key ID
  lineId: string;
  chatJid: string;
  fromMe: boolean;
  senderName?: string;
  text: string;
  timestamp: string;
  status: WhatsAppMessageStatus;
  media?: WhatsAppMediaMeta;
}

export interface SendMessageDto {
  text: string;
}

export interface WhatsAppServerEvent {
  type:
    | 'connected_to_stream'
    | 'line_created'
    | 'line_updated'
    | 'line_deleted'
    | 'qr_updated'
    | 'connection_state_changed'
    | 'chat_upsert'
    | 'message_upsert';
  lineId: string;
  timestamp: string;
  payload: any;
}
