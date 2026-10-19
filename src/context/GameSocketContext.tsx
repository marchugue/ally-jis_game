import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useGameAuth } from './AuthContext';
import { getSocketBaseUrl } from '../lib/auth';
import { fetchOpenGames, type GameSessionDto, type IncomingInvite } from '../lib/gameApi';

interface GameSocketValue {
  socket: Socket | null;
  connected: boolean;
  /** Invites addressed to me that are still pending (live popups + resumed on reconnect). */
  incomingInvites: IncomingInvite[];
  dismissInvite: (sessionId: string) => void;
  /** A game I'm already in the middle of (e.g. after a refresh) — offer to resume it. */
  resumable: GameSessionDto | null;
  clearResumable: () => void;
}

const GameSocketContext = createContext<GameSocketValue>({
  socket: null,
  connected: false,
  incomingInvites: [],
  dismissInvite: () => {},
  resumable: null,
  clearResumable: () => {},
});

/**
 * One authenticated Socket.io connection for the whole game portal. The same
 * connection carries invites, live duel state and presence of the opponent.
 * Must be rendered inside <AuthProvider>.
 */
export function GameSocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useGameAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const [resumable, setResumable] = useState<GameSessionDto | null>(null);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  const hydrate = useCallback(async () => {
    const current = tokenRef.current;
    if (!current) return;
    try {
      const open = await fetchOpenGames(current);
      setIncomingInvites(open.invites);
      setResumable(open.active);
    } catch {
      // Game tables may not be migrated yet — the portal still works without duels.
    }
  }, []);

  useEffect(() => {
    if (!token || !user) {
      setSocket(null);
      setConnected(false);
      setIncomingInvites([]);
      setResumable(null);
      return;
    }

    const s = io(getSocketBaseUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelayMax: 4000,
    });

    s.on('connect', () => {
      setConnected(true);
      void hydrate();
    });
    s.on('disconnect', () => setConnected(false));

    s.on('game:invite', (payload: IncomingInvite) => {
      setIncomingInvites((cur) => [payload, ...cur.filter((i) => i.session.id !== payload.session.id)]);
    });

    const removeInvite = (payload: { session?: GameSessionDto }) => {
      const id = payload?.session?.id;
      if (id) setIncomingInvites((cur) => cur.filter((i) => i.session.id !== id));
    };
    s.on('game:invite_cancelled', removeInvite);
    s.on('game:declined', removeInvite);
    s.on('game:ended', removeInvite); // covers invite expiry

    setSocket(s);
    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token, user, hydrate]);

  const dismissInvite = useCallback((sessionId: string) => {
    setIncomingInvites((cur) => cur.filter((i) => i.session.id !== sessionId));
  }, []);

  const clearResumable = useCallback(() => setResumable(null), []);

  const value = useMemo<GameSocketValue>(
    () => ({ socket, connected, incomingInvites, dismissInvite, resumable, clearResumable }),
    [socket, connected, incomingInvites, dismissInvite, resumable, clearResumable],
  );

  return <GameSocketContext.Provider value={value}>{children}</GameSocketContext.Provider>;
}

export function useGameSocket(): GameSocketValue {
  return useContext(GameSocketContext);
}
