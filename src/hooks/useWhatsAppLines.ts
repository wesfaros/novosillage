import { useState, useEffect, useCallback, useRef } from 'react';
import { WhatsAppLine, WhatsAppServerEvent } from '../types/whatsapp';
import { whatsAppApi } from '../services/whatsapp-api';

export function useWhatsAppLines() {
  const [lines, setLines] = useState<WhatsAppLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSseConnected, setIsSseConnected] = useState(false);

  // Load lines initially
  const loadLines = useCallback(async () => {
    try {
      setError(null);
      const data = await whatsAppApi.fetchLines();
      setLines(data);
    } catch (err: any) {
      console.error('[useWhatsAppLines] Error loading lines:', err);
      setError(err?.message || 'Falha ao carregar linhas WhatsApp.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  // Setup real-time SSE stream
  useEffect(() => {
    const unsubscribe = whatsAppApi.subscribeToEvents(
      (event: WhatsAppServerEvent) => {
        if (event.type === 'connected_to_stream') {
          setIsSseConnected(true);
          return;
        }

        if (event.type === 'line_created' && event.payload) {
          const newLine = event.payload as WhatsAppLine;
          setLines((prev) => {
            if (prev.some((l) => l.id === newLine.id)) return prev;
            return [...prev, newLine];
          });
        } else if (
          (event.type === 'line_updated' ||
            event.type === 'connection_state_changed' ||
            event.type === 'qr_updated') &&
          event.lineId &&
          event.payload
        ) {
          const updatedFields = event.payload;
          setLines((prev) =>
            prev.map((l) => (l.id === event.lineId ? { ...l, ...updatedFields } : l))
          );
        } else if (event.type === 'line_deleted' && event.lineId) {
          setLines((prev) => prev.filter((l) => l.id !== event.lineId));
        }
      },
      () => {
        setIsSseConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const createLine = async (name: string): Promise<WhatsAppLine> => {
    const newLine = await whatsAppApi.createLine(name);
    setLines((prev) => {
      if (prev.some((l) => l.id === newLine.id)) return prev;
      return [...prev, newLine];
    });
    return newLine;
  };

  const connectLine = async (id: string): Promise<WhatsAppLine> => {
    const updated = await whatsAppApi.connectLine(id);
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    return updated;
  };

  const disconnectLine = async (id: string): Promise<WhatsAppLine> => {
    const updated = await whatsAppApi.disconnectLine(id);
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    return updated;
  };

  const deleteLine = async (id: string): Promise<void> => {
    await whatsAppApi.deleteLine(id);
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  return {
    lines,
    isLoading,
    error,
    isSseConnected,
    loadLines,
    createLine,
    connectLine,
    disconnectLine,
    deleteLine,
  };
}
