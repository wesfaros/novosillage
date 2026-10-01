import fs from 'fs';
import path from 'path';
import { WhatsAppLine } from '../types/whatsapp.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LINES_FILE = path.join(DATA_DIR, 'whatsapp_lines.json');
export const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');

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
    return true;
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
