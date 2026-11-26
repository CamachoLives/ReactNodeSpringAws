/**
 * HOOK DE WEBSOCKET — comunicación en tiempo real con el game server
 *
 * Encapsula la conexión STOMP/SockJS para:
 * - Recibir resultados de quests
 * - Actualizaciones del leaderboard en vivo
 * - Notificaciones de logros
 *
 * Patrón: Custom Hook = SRP (un hook, una responsabilidad)
 * Concurrencia: eventos asincrónicos en el event loop del browser
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws/game';

export function useGameWebSocket(username) {
  const clientRef = useRef(null);
  const subscriptionsRef = useRef([]);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    if (!username) return;

    // Conexión lazy — solo cuando hay username
    let client = null;

    const connect = async () => {
      // Importación dinámica — no carga SockJS si no hay username
      const SockJS = (await import('sockjs-client')).default;
      const { Client } = await import('@stomp/stompjs');

      client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        onConnect: () => {
          setConnected(true);

          // Suscribir a mensajes privados (resultados de quest)
          const sub1 = client.subscribe(`/user/queue/quest-result`, (msg) => {
            setLastMessage({ type: 'QUEST_RESULT', data: JSON.parse(msg.body) });
          });

          // Suscribir al leaderboard público
          const sub2 = client.subscribe('/topic/leaderboard-update', (msg) => {
            setLastMessage({ type: 'LEADERBOARD_UPDATE', data: JSON.parse(msg.body) });
          });

          subscriptionsRef.current = [sub1, sub2];
        },
        onDisconnect: () => setConnected(false),
        onStompError: (frame) => {
          console.error('[WS] Error STOMP:', frame.headers?.message);
          setConnected(false);
        }
      });

      client.activate();
      clientRef.current = client;
    };

    connect();

    // Cleanup: desconectar al desmontar o cambiar username
    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      clientRef.current?.deactivate();
      setConnected(false);
    };
  }, [username]);

  const sendMessage = useCallback((destination, body) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination, body: JSON.stringify(body) });
    }
  }, []);

  return { connected, lastMessage, sendMessage };
}

/**
 * Hook derivado: solo escucha actualizaciones del leaderboard
 * Composición de hooks (SRP aplicado a hooks)
 */
export function useLeaderboard(username) {
  const { lastMessage, connected } = useGameWebSocket(username);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (lastMessage?.type === 'LEADERBOARD_UPDATE') {
      setLeaderboard(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(e => e.username === lastMessage.data.username);
        if (idx >= 0) updated[idx] = lastMessage.data;
        else updated.push(lastMessage.data);
        return updated.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
      });
    }
  }, [lastMessage]);

  return { leaderboard, connected };
}
