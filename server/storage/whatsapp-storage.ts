import fs from 'fs';
import path from 'path';
import { WhatsAppLine, WhatsAppChat, WhatsAppMessage } from '../types/whatsapp.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LINES_FILE = path.join(DATA_DIR, 'whatsapp_lines.json');
export const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
export const MEDIA_DIR = path.join(DATA_DIR, 'media');

export class WhatsAppStorage {
  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
    if (!fs.existsSync(MEDIA_DIR)) {
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LINES_FILE)) {
      fs.writeFileSync(LINES_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  public getAllLines(): WhatsAppLine[] {
    try {
      this.ensureDirectories();
      const content = fs.readFileSync(LINES_FILE, 'utf-8');
      const lines = JSON.parse(content) as WhatsAppLine[];
      return lines;
    } catch (error) {
      console.error('[WhatsAppStorage] Error reading lines file:', error);
      return [];
    }
  }

  public getLineById(id: string): WhatsAppLine | undefined {
    const lines = this.getAllLines();
    return lines.find((l) => l.id === id);
  }

  public getLineByAccountId(accountId: string): WhatsAppLine | undefined {
    const lines = this.getAllLines();
    return lines.find((l) => l.accountId === accountId);
  }

  public saveLine(line: WhatsAppLine): void {
    const lines = this.getAllLines();
    const index = lines.findIndex((l) => l.id === line.id);
    const updatedLine = {
      ...line,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      lines[index] = updatedLine;
    } else {
      lines.push(updatedLine);
    }

    this.writeLines(lines);
  }

  public updateLineFields(id: string, fields: Partial<WhatsAppLine>): WhatsAppLine | undefined {
    const lines = this.getAllLines();
    const index = lines.findIndex((l) => l.id === id);
    if (index === -1) return undefined;

    const updated = {
      ...lines[index],
      ...fields,
      updatedAt: new Date().toISOString(),
    };

    lines[index] = updated;
    this.writeLines(lines);
    return updated;
  }

  public deleteLine(id: string): boolean {
    const lines = this.getAllLines();
    const target = lines.find((l) => l.id === id);
    if (!target) return false;

    const filtered = lines.filter((l) => l.id !== id);
    this.writeLines(filtered);

    // Delete session files
    this.deleteSessionDirectory(target.accountId);

    // Delete chats and messages files for this line
    const chatsFile = path.join(DATA_DIR, `chats_${id}.json`);
    const messagesFile = path.join(DATA_DIR, `messages_${id}.json`);
    if (fs.existsSync(chatsFile)) {
      try {
        fs.unlinkSync(chatsFile);
      } catch (e) {
        // ignore
      }
    }
    if (fs.existsSync(messagesFile)) {
      try {
        fs.unlinkSync(messagesFile);
      } catch (e) {
        // ignore
      }
    }

    // Delete media files for this line
    const mediaDir = path.join(MEDIA_DIR, id);
    if (fs.existsSync(mediaDir)) {
      try {
        fs.rmSync(mediaDir, { recursive: true, force: true });
      } catch (e) {
        // ignore
      }
    }

    return true;
  }

  public getMediaDirectory(lineId: string): string {
    const mediaDir = path.join(MEDIA_DIR, lineId);
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    return mediaDir;
  }

  public getSessionDirectory(accountId: string): string {
    const sessionPath = path.join(SESSIONS_DIR, accountId);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }
    return sessionPath;
  }

  public deleteSessionDirectory(accountId: string): void {
    const sessionPath = path.join(SESSIONS_DIR, accountId);
    if (fs.existsSync(sessionPath)) {
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(`[WhatsAppStorage] Cleaned session directory for ${accountId}`);
      } catch (err) {
        console.error(`[WhatsAppStorage] Failed to remove session dir for ${accountId}:`, err);
      }
    }
  }

  // Chats Storage
  private getChatsFilePath(lineId: string): string {
    return path.join(DATA_DIR, `chats_${lineId}.json`);
  }

  public getChats(lineId: string): WhatsAppChat[] {
    try {
      const filePath = this.getChatsFilePath(lineId);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const chats = JSON.parse(content) as WhatsAppChat[];
      // Sort by updatedAt descending
      return chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (err) {
      console.error(`[WhatsAppStorage] Error reading chats for line ${lineId}:`, err);
      return [];
    }
  }

  public upsertChat(lineId: string, chatData: Partial<WhatsAppChat> & { jid: string }): WhatsAppChat {
    const chats = this.getChats(lineId);
    const existingIndex = chats.findIndex((c) => c.jid === chatData.jid);

    const now = new Date().toISOString();
    let updatedChat: WhatsAppChat;

    if (existingIndex >= 0) {
      updatedChat = {
        ...chats[existingIndex],
        ...chatData,
        updatedAt: chatData.updatedAt || now,
      };
      chats[existingIndex] = updatedChat;
    } else {
      updatedChat = {
        id: chatData.jid,
        lineId,
        jid: chatData.jid,
        name: chatData.name || chatData.jid.split('@')[0],
        isGroup: chatData.isGroup ?? chatData.jid.endsWith('@g.us'),
        unreadCount: chatData.unreadCount ?? 0,
        lastMessage: chatData.lastMessage,
        updatedAt: chatData.updatedAt || now,
      };
      chats.push(updatedChat);
    }

    try {
      this.ensureDirectories();
      fs.writeFileSync(this.getChatsFilePath(lineId), JSON.stringify(chats, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[WhatsAppStorage] Error writing chats for line ${lineId}:`, err);
    }

    return updatedChat;
  }

  public updateChat(lineId: string, jid: string, fields: Partial<WhatsAppChat>): WhatsAppChat | undefined {
    const chats = this.getChats(lineId);
    const index = chats.findIndex((c) => c.jid === jid);
    if (index === -1) return undefined;

    chats[index] = {
      ...chats[index],
      ...fields,
      updatedAt: fields.updatedAt || new Date().toISOString(),
    };

    try {
      this.ensureDirectories();
      fs.writeFileSync(this.getChatsFilePath(lineId), JSON.stringify(chats, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[WhatsAppStorage] Error updating chat ${jid} for line ${lineId}:`, err);
    }

    return chats[index];
  }

  // Messages Storage
  private getMessagesFilePath(lineId: string): string {
    return path.join(DATA_DIR, `messages_${lineId}.json`);
  }

  public getMessages(lineId: string, chatJid?: string): WhatsAppMessage[] {
    try {
      const filePath = this.getMessagesFilePath(lineId);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const messages = JSON.parse(content) as WhatsAppMessage[];

      if (chatJid) {
        return messages
          .filter((m) => m.chatJid === chatJid)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }

      return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (err) {
      console.error(`[WhatsAppStorage] Error reading messages for line ${lineId}:`, err);
      return [];
    }
  }

  public saveMessage(lineId: string, message: WhatsAppMessage): WhatsAppMessage {
    const messages = this.getMessages(lineId);
    const existingIndex = messages.findIndex((m) => m.id === message.id);

    if (existingIndex >= 0) {
      messages[existingIndex] = {
        ...messages[existingIndex],
        ...message,
      };
    } else {
      messages.push(message);
    }

    try {
      this.ensureDirectories();
      fs.writeFileSync(this.getMessagesFilePath(lineId), JSON.stringify(messages, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[WhatsAppStorage] Error writing messages for line ${lineId}:`, err);
    }

    return message;
  }

  private writeLines(lines: WhatsAppLine[]): void {
    try {
      this.ensureDirectories();
      fs.writeFileSync(LINES_FILE, JSON.stringify(lines, null, 2), 'utf-8');
    } catch (error) {
      console.error('[WhatsAppStorage] Error writing lines file:', error);
    }
  }
}

export const whatsAppStorage = new WhatsAppStorage();
