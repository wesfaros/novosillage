import { WhatsAppLine, WhatsAppServerEvent } from '../types/whatsapp';

export const whatsAppApi = {
  async fetchLines(): Promise<WhatsAppLine[]> {
    const res = await fetch('/api/whatsapp/lines');
    if (!res.ok) {
      throw new Error(`Erro ao buscar linhas: ${res.statusText}`);
    }
    const data = await res.json();
    return data.data || [];
  },

  async fetchLine(id: string): Promise<WhatsAppLine> {
    const res = await fetch(`/api/whatsapp/lines/${id}`);
    if (!res.ok) {
      throw new Error(`Erro ao buscar linha ${id}: ${res.statusText}`);
    }
    const data = await res.json();
    return data.data;
  },

  async createLine(name: string): Promise<WhatsAppLine> {
    const res = await fetch('/api/whatsapp/lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      throw new Error(`Erro ao criar linha: ${res.statusText}`);
    }
    const data = await res.json();
    return data.data;
  },

  async connectLine(id: string): Promise<WhatsAppLine> {
    const res = await fetch(`/api/whatsapp/lines/${id}/connect`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Erro ao conectar linha: ${res.statusText}`);
    }
    const data = await res.json();
    return data.data;
  },

  async disconnectLine(id: string): Promise<WhatsAppLine> {
    const res = await fetch(`/api/whatsapp/lines/${id}/disconnect`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Erro ao desconectar linha: ${res.statusText}`);
    }
    const data = await res.json();
    return data.data;
  },

  async deleteLine(id: string): Promise<void> {
    const res = await fetch(`/api/whatsapp/lines/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Erro ao excluir linha: ${res.statusText}`);
    }
  },

  subscribeToEvents(
    onEvent: (event: WhatsAppServerEvent) => void,
    onError?: (error: any) => void
  ): () => void {
    if (typeof window === 'undefined' || !window.EventSource) {
      return () => {};
    }

    let eventSource: EventSource | null = new EventSource('/api/whatsapp/events');

    eventSource.onmessage = (messageEvent) => {
      try {
        const parsed = JSON.parse(messageEvent.data) as WhatsAppServerEvent;
        onEvent(parsed);
      } catch (err) {
        console.error('[WhatsAppAPI] Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[WhatsAppAPI] SSE connection error, browser will reconnect:', err);
      if (onError) onError(err);
    };

    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  },
};
