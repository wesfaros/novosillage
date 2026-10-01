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

export interface WhatsAppServerEvent {
  type: 'connected_to_stream' | 'line_created' | 'line_updated' | 'line_deleted' | 'qr_updated' | 'connection_state_changed';
  lineId?: string;
  timestamp: string;
  payload?: Partial<WhatsAppLine>;
}
