import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useGameAuth } from './AuthContext';
import { useGameSocket } from './GameSocketContext';
import { getApiBaseUrl } from '../lib/auth';

interface PresenceContextValue {
  onlineUserIds: Set<string>;
  isOnline: (userId: string) => boolean;
  onlineCount: number;
  refreshOnlineUsers: () => Promise<void>;
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineUserIds: new Set(),
  isOnline: () => false,
  onlineCount: 0,
  refreshOnlineUsers: async () => {},
});

const HEARTBEAT_INTERVAL_MS = 25000;
const POLL_INTERVAL_MS = 30000;

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user, token } = useGameAuth();
  const { socket } = useGameSocket();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const sendHeartbeat = useCallback(async () => {
    if (!user || !token) return;
    try {
      const apiBase = getApiBaseUrl();
      await fetch(`${apiBase}/presence/heartbeat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform: 'game' }),
      });
    } catch {
      // presence heartbeat is best-effort
    }
  }, [user, token]);

  const refreshOnlineUsers = useCallback(async () => {
    try {
      const apiBase = getApiBaseUrl();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${apiBase}/presence/online`, { headers });
      if (res.ok) {
        const data = await res.json();
        const ids: string[] = data?.userIds || [];
        setOnlineUserIds(new Set(ids));
      }
    } catch {
      // presence fetch is best-effort
    }
  }, [token]);

  useEffect(() => {
    // Initial fetch
    void refreshOnlineUsers();

    if (user && token) {
      void sendHeartbeat();
    }

    const heartbeatInterval = setInterval(() => {
      if (user && token) {
        void sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL_MS);

    const pollInterval = setInterval(() => {
      void refreshOnlineUsers();
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (user && token) void sendHeartbeat();
        void refreshOnlineUsers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── Real-Time Socket Presence Listeners ─────────────────────────────────
    const onUserOnline = (payload: { userId?: string; user_id?: string }) => {
      const id = payload?.userId || payload?.user_id;
      if (!id) return;
      setOnlineUserIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    };

    const onUserOffline = (payload: { userId?: string; user_id?: string }) => {
      const id = payload?.userId || payload?.user_id;
      if (!id) return;
      setOnlineUserIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };

    const onPresenceChange = (payload: { userId?: string; user_id?: string; status?: string }) => {
      if (payload?.status === 'offline') {
        onUserOffline(payload);
      } else {
        onUserOnline(payload);
      }
    };

    if (socket) {
      socket.on('presence:online', onUserOnline);
      socket.on('presence:offline', onUserOffline);
      socket.on('presence:change', onPresenceChange);
    }

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (socket) {
        socket.off('presence:online', onUserOnline);
        socket.off('presence:offline', onUserOffline);
        socket.off('presence:change', onPresenceChange);
      }
    };
  }, [user?.id, token, socket, sendHeartbeat, refreshOnlineUsers]);

  const value = useMemo(
    () => ({
      onlineUserIds,
      isOnline: (id: string) => onlineUserIds.has(id),
      onlineCount: onlineUserIds.size,
      refreshOnlineUsers,
    }),
    [onlineUserIds, refreshOnlineUsers]
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  return useContext(PresenceContext);
}
