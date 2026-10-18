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

const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds (matches web)
const POLL_INTERVAL_MS = 30000;      // 30 seconds (matches web)

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user, token } = useGameAuth();
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
      });
    } catch {
      // presence heartbeat is best-effort
    }
  }, [user, token]);

  const refreshOnlineUsers = useCallback(async () => {
    if (!token) return;
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/presence/online`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
    if (!user || !token) {
      setOnlineUserIds(new Set());
      return;
    }

    // 1. Initial heartbeat & online list
    void sendHeartbeat();
    void refreshOnlineUsers();

    // 2. Set interval timers
    const heartbeatInterval = setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const pollInterval = setInterval(() => {
      void refreshOnlineUsers();
    }, POLL_INTERVAL_MS);

    // 3. Immediately sync on tab focus / visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat();
        void refreshOnlineUsers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, token, sendHeartbeat, refreshOnlineUsers]);

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
