/**
 * WhatsApp Identity and Phone formatting utilities
 * Strictly hides technical IDs (JIDs, LIDs, Group hashes) from the UI.
 */

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

  // If the text is purely numeric or only numeric with +, -, space, brackets
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

  // E.164 phone numbers are between 8 and 15 digits
  if (digits.length < 8 || digits.length > 15) {
    return '';
  }

  // Group hash prefix
  if (digits.startsWith('12036')) {
    return '';
  }

  // Brazilian standard format
  if (digits.startsWith('55')) {
    if (digits.length === 12) {
      return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
    if (digits.length === 13) {
      return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
  }

  // International standard format
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
  }

  return `+${digits}`;
}

export function getCleanDisplayName(chat: {
  name?: string;
  jid: string;
  isGroup?: boolean;
  phoneNumber?: string;
}): string {
  const isGroup = !!chat.isGroup || isGroupJid(chat.jid);
  const isLid = isLidJid(chat.jid);

  if (isGroup) {
    if (!chat.name || isTechnicalIdentifier(chat.name) || chat.name === 'Grupo do WhatsApp') {
      return 'Grupo do WhatsApp';
    }
    return chat.name;
  }

  if (isLid) {
    if (!chat.name || isTechnicalIdentifier(chat.name)) {
      return 'Contato do WhatsApp';
    }
    return chat.name;
  }

  // 1-on-1 Contact
  if (chat.name && !isTechnicalIdentifier(chat.name)) {
    return chat.name;
  }

  const formatted = chat.phoneNumber || formatPhoneNumber(chat.jid);
  if (formatted) {
    return formatted;
  }

  return 'Contato do WhatsApp';
}
