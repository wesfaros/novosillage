import { Router, Request, Response } from 'express';
import { whatsAppManager } from '../services/whatsapp-manager.js';
import { WhatsAppServerEvent } from '../types/whatsapp.js';

export const whatsAppRouter = Router();

// GET all lines
whatsAppRouter.get('/lines', (req: Request, res: Response) => {
  try {
    const lines = whatsAppManager.getAllLines();
    res.json({ success: true, data: lines });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single line
whatsAppRouter.get('/lines/:id', (req: Request, res: Response) => {
  try {
    const line = whatsAppManager.getLine(req.params.id);
    if (!line) {
      return res.status(404).json({ success: false, error: 'Linha não encontrada.' });
    }
    res.json({ success: true, data: line });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create line (and initiate connection)
whatsAppRouter.post('/lines', async (req: Request, res: Response) => {
  try {
    const { name } = req.body || {};
    const line = await whatsAppManager.createLine(name || 'Nova Linha');
    res.status(201).json({ success: true, data: line });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST connect/reconnect line
whatsAppRouter.post('/lines/:id/connect', async (req: Request, res: Response) => {
  try {
    const line = await whatsAppManager.connectLine(req.params.id);
    res.json({ success: true, data: line });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST disconnect line
whatsAppRouter.post('/lines/:id/disconnect', async (req: Request, res: Response) => {
  try {
    const line = await whatsAppManager.disconnectLine(req.params.id);
    if (!line) {
      return res.status(404).json({ success: false, error: 'Linha não encontrada.' });
    }
    res.json({ success: true, data: line });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE line
whatsAppRouter.delete('/lines/:id', async (req: Request, res: Response) => {
  try {
    const success = await whatsAppManager.deleteLine(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Linha não encontrada para exclusão.' });
    }
    res.json({ success: true, message: 'Linha e dados de sessão removidos com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET chats for line
whatsAppRouter.get('/lines/:lineId/chats', (req: Request, res: Response) => {
  try {
    const chats = whatsAppManager.getChats(req.params.lineId);
    res.json({ success: true, data: chats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET messages for chat
whatsAppRouter.get('/lines/:lineId/chats/:chatJid/messages', (req: Request, res: Response) => {
  try {
    const messages = whatsAppManager.getMessages(req.params.lineId, req.params.chatJid);
    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST send message in chat
whatsAppRouter.post('/lines/:lineId/chats/:chatJid/messages', async (req: Request, res: Response) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Texto da mensagem é obrigatório.' });
    }
    const message = await whatsAppManager.sendMessage(req.params.lineId, req.params.chatJid, text);
    res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST start new chat by phone number
whatsAppRouter.post('/lines/:lineId/chats', async (req: Request, res: Response) => {
  try {
    const { phoneOrJid, name } = req.body || {};
    if (!phoneOrJid || typeof phoneOrJid !== 'string') {
      return res.status(400).json({ success: false, error: 'Telefone ou JID é obrigatório.' });
    }
    let jid = phoneOrJid.trim().replace(/[^0-9@.a-z_-]/gi, '');
    if (!jid.includes('@')) {
      jid = `${jid}@s.whatsapp.net`;
    }
    const chat = whatsAppManager.getChats(req.params.lineId).find((c) => c.jid === jid) || {
      id: jid,
      lineId: req.params.lineId,
      jid,
      name: name?.trim() || jid.split('@')[0],
      isGroup: jid.endsWith('@g.us'),
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };
    res.status(201).json({ success: true, data: chat });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/whatsapp/events (SSE)
whatsAppRouter.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connection event
  res.write(
    `data: ${JSON.stringify({
      type: 'connected_to_stream',
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  const eventListener = (event: WhatsAppServerEvent) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (err) {
      // client likely closed
    }
  };

  whatsAppManager.on('event', eventListener);

  // Keep-alive heartbeat every 20s
  const keepAlive = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(keepAlive);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAlive);
    whatsAppManager.off('event', eventListener);
  });
});
