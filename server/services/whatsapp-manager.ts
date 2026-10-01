import { EventEmitter } from 'events';
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

import QRCode from 'qrcode';
import pino from 'pino';
import { whatsAppStorage } from '../storage/whatsapp-storage.js';
import { WhatsAppLine, WhatsAppLineStatus, WhatsAppServerEvent } from '../types/whatsapp.js';

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

  constructor() {
    super();
    // Allow multiple SSE client listeners without warnings
    this.setMaxListeners(50);
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('[WhatsAppManager] Initializing Connection Manager...');

    const lines = whatsAppStorage.getAllLines();
    for (const line of lines) {
      // If a line was previously connected, we attempt to reconnect gracefully on server start
      if (line.status === 'connected' || line.status === 'reconnecting') {
        console.log(`[WhatsAppManager] Auto-reconnecting previously active line: ${line.name} (${line.id})`);
        this.connectLine(line.id).catch((err) => {
          console.error(`[WhatsAppManager] Failed auto-reconnect for ${line.id}:`, err);
        });
      } else {
        // Reset transient states (waiting_qr, connecting) to disconnected on restart
        if (line.status === 'waiting_qr' || line.status === 'qr_ready' || line.status === 'connecting') {
          whatsAppStorage.updateLineFields(line.id, {
            status: 'disconnected',
            qrCodeDataUrl: undefined,
          });
        }
      }
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

    // Automatically initiate socket connection to produce the QR Code
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

    // Check if there is already an active session for this line
    const existingSession = this.activeSessions.get(lineId);
    if (existingSession) {
      if (line.status === 'connected' || line.status === 'connecting') {
        console.log(`[WhatsAppManager] Line ${lineId} already has an active socket.`);
        return line;
      }
      // If stuck or disconnected, clean it up before reconnecting
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

      return whatsAppStorage.getLineById(lineId) || line;
    } catch (err: any) {
      console.error(`[WhatsAppManager] Failed to create socket for line ${lineId}:`, err);
      const updated = this.updateStatus(lineId, 'error', {
        lastError: err?.message || 'Erro ao inicializar conexão Baileys.',
      });
      return updated || line;
    }
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
      // Extract phone number from WhatsApp JID (e.g. 5511999999999:1@s.whatsapp.net -> 5511999999999)
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
        // Unintentional network disruption or socket restart
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
