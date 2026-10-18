import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  AuthSession,
  GameUser,
  fetchSession,
  silentRefresh,
  logoutSession,
  extractTokenFromUrl,
  getStoredToken,
  setStoredToken,
  getSocketBaseUrl,
  getWebPortalUrl,
  AUTH_CHANNEL_NAME,
} from '../lib/auth';

interface AuthContextValue {
  user: GameUser | null;
  session: AuthSession | null;
  token: string | null;
  loading: boolean;
  isChecking: boolean;
  error: string | null;
  loginUrl: string;
  webUrl: string;
  checkSession: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Compute login redirect URL pointing to the web portal login page
  const webUrl = useMemo(() => getWebPortalUrl(), []);
  const loginUrl = useMemo(() => {
    if (typeof window === 'undefined') return `${webUrl}/login`;
    const currentUrl = window.location.href;
    return `${webUrl}/login?redirect=${encodeURIComponent(currentUrl)}`;
  }, [webUrl]);

  /**
   * Primary session validator and mirror.
   * 1. Checks URL for ?token=...
   * 2. Checks localStorage token
   * 3. Validates against backend /api/auth/session
   * 4. If invalid or missing, attempts silent refresh via backend HttpOnly cookie (/api/auth/refresh)
   */
  const checkSession = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setError(null);

    try {
      // 1. Check if token was provided in URL query parameters (e.g. from web launch/redirect)
      const urlToken = extractTokenFromUrl();
      const currentToken = urlToken || getStoredToken();

      // 2. If token exists, test with backend /auth/session
      if (currentToken) {
        const activeSession = await fetchSession(currentToken);
        if (activeSession) {
          setSession(activeSession);
          setIsChecking(false);
          setLoading(false);
          return true;
        }
      }

      // 3. Fallback: try silent refresh using cross-domain HttpOnly cookie
      console.info('[GameAuth] Attempting silent session restore via backend credentials cookie...');
      const refreshedSession = await silentRefresh();
      if (refreshedSession) {
        setSession(refreshedSession);
        setIsChecking(false);
        setLoading(false);
        return true;
      }

      // 4. No active session found
      setSession(null);
      setStoredToken(null);
      return false;
    } catch (err: any) {
      console.warn('[GameAuth] Session validation failed:', err);
      setSession(null);
      setStoredToken(null);
      setError(err?.message || 'Failed to authenticate session');
      return false;
    } finally {
      setIsChecking(false);
      setLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Real-time backend revocation listener via Socket.io
  useEffect(() => {
    if (!session?.accessToken) return;

    const socketUrl = getSocketBaseUrl();
    if (!socketUrl) return;
    let socket: Socket | null = null;

    try {
      socket = io(socketUrl, {
        auth: { token: session.accessToken },
        autoConnect: true,
        reconnection: true,
        timeout: 6000,
      });

      // Server emits 'auth:revoked' when session is invalidated (logout, ban, force logout)
      socket.on('auth:revoked', (data: any) => {
        console.warn('[GameAuth] Session revoked by server:', data);
        setSession(null);
        setStoredToken(null);
        setError('Your session has been signed out remotely.');
      });
    } catch (e) {
      console.warn('[GameAuth] Socket connection error:', e);
    }

    return () => {
      socket?.disconnect();
    };
  }, [session?.accessToken]);

  // Cross-portal & Cross-tab synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          console.info('[GameAuth] Remote LOGOUT broadcast received. Clearing game session.');
          setSession(null);
          setStoredToken(null);
        } else if (event.data?.type === 'LOGIN' && event.data?.session) {
          console.info('[GameAuth] Remote LOGIN broadcast received. Synchronizing session.');
          setSession({
            user: event.data.session.user,
            accessToken: event.data.token || event.data.session.accessToken,
            expiresAt: event.data.session.expiresAt,
          });
        }
      };
    } catch {}

    return () => {
      channel?.close();
    };
  }, []);

  // Watch localStorage changes for multi-tab token removals
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'allyjis-auth-token') {
        if (!e.newValue && session) {
          console.info('[GameAuth] Local token removed. Revoking game portal session.');
          setSession(null);
        } else if (e.newValue && !session) {
          checkSession();
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [session, checkSession]);

  // Re-check session on window focus / visibility change (seamless unlock after logging in on web tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !session) {
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [session, checkSession]);

  const logout = useCallback(async () => {
    const currentToken = session?.accessToken || getStoredToken();
    setSession(null);
    setStoredToken(null);
    await logoutSession(currentToken);
  }, [session?.accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user || null,
      session,
      token: session?.accessToken || null,
      loading,
      isChecking,
      error,
      loginUrl,
      webUrl,
      checkSession,
      logout,
    }),
    [session, loading, isChecking, error, loginUrl, webUrl, checkSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useGameAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useGameAuth must be used within an AuthProvider');
  }
  return context;
}
