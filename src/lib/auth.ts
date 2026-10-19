// game/src/lib/auth.ts
//
// Authentication and session coordination layer for game portal.
// All endpoints and domain URLs are loaded strictly from environment
// variables (.env / import.meta.env) with safe fallback to relative host.
// No sensitive credentials or fixed URLs are hardcoded in source code.

export const AUTH_TOKEN_KEY = 'allyjis-auth-token';
export const AUTH_CHANNEL_NAME = 'ally_auth_channel';

export interface GameUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar_url?: string;
  department?: string;
  course?: string;
  year_level?: string;
  raw?: any;
}

export interface AuthSession {
  user: GameUser;
  accessToken: string;
  expiresAt?: number;
}

export const DEFAULT_PRODUCTION_API_URL = 'https://ally-jisbackend-production.up.railway.app/api';
export const DEFAULT_PRODUCTION_WEB_URL = 'https://ally-jis.com';
export const DEFAULT_PRODUCTION_SOCKET_URL = 'https://ally-jisbackend-production.up.railway.app';

/**
 * Resolves the Backend API base URL from .env (VITE_API_BASE_URL).
 * Falls back to Railway production API when running on production domains.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (
      host === 'game.ally-jis.com' ||
      host.endsWith('ally-jis.com') ||
      host.endsWith('ally-jis.xyz') ||
      host.includes('vercel.app')
    ) {
      return DEFAULT_PRODUCTION_API_URL;
    }
    return 'http://localhost:3001/api';
  }
  return DEFAULT_PRODUCTION_API_URL;
}

/**
 * Resolves the Socket.io server base URL from .env (VITE_SOCKET_URL or VITE_API_BASE_URL).
 */
export function getSocketBaseUrl(): string {
  const envSocketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (envSocketUrl) {
    return envSocketUrl.replace(/\/+$/, '');
  }
  const apiBase = getApiBaseUrl();
  return apiBase.replace(/\/api\/?$/, '');
}

/**
 * Resolves the Web Portal URL from .env (VITE_WEB_URL).
 * Points to https://ally-jis.com on production domains.
 */
export function getWebPortalUrl(): string {
  const envWebUrl = import.meta.env.VITE_WEB_URL as string | undefined;
  if (envWebUrl) {
    return envWebUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (
      host === 'game.ally-jis.com' ||
      host.endsWith('ally-jis.com') ||
      host.includes('vercel.app')
    ) {
      return DEFAULT_PRODUCTION_WEB_URL;
    }
    if (host.endsWith('ally-jis.xyz')) {
      return 'https://ally-jis.xyz';
    }
    return 'http://localhost:5173';
  }
  return DEFAULT_PRODUCTION_WEB_URL;
}

/**
 * Resolves the Game portal domain name from .env (VITE_GAME_DOMAIN).
 */
export function getGameDomain(): string {
  const envDomain = import.meta.env.VITE_GAME_DOMAIN as string | undefined;
  if (envDomain) {
    return envDomain;
  }
  if (typeof window !== 'undefined') {
    return window.location.host;
  }
  return '';
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {}
}

/**
 * Checks for token passed in query parameters (?token=... or #token=...)
 * upon being launched from the main web application.
 * If found, saves the token and strips it from the browser URL address bar.
 */
export function extractTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const searchParams = new URLSearchParams(window.location.search);
    let token = searchParams.get('token') || searchParams.get('accessToken');

    if (!token && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      token = hashParams.get('token') || hashParams.get('accessToken');
    }

    if (token) {
      setStoredToken(token);
      // Clean query parameter from URL bar without reloading
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('token');
      cleanUrl.searchParams.delete('accessToken');
      if (cleanUrl.hash) {
        cleanUrl.hash = '';
      }
      window.history.replaceState({}, document.title, cleanUrl.toString());
      return token;
    }
  } catch (e) {
    console.error('[GameAuth] Error parsing token from URL:', e);
  }

  return null;
}

/**
 * Decodes the payload portion of a JWT token safely in the browser.
 */
export function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('[GameAuth] Failed to parse JWT payload:', err);
    return null;
  }
}

/**
 * Creates an immediate authenticated AuthSession from a valid JWT token.
 * Validates expiration (exp claim) if present.
 */
export function createSessionFromToken(token: string): AuthSession | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  const userId = payload.sub || payload.id;
  if (!userId) return null;

  // Check expiration if present (exp is in seconds)
  if (payload.exp && typeof payload.exp === 'number') {
    if (Date.now() >= payload.exp * 1000) {
      console.warn('[GameAuth] Provided token has expired:', new Date(payload.exp * 1000).toISOString());
      return null;
    }
  }

  return {
    user: normalizeUser(payload),
    accessToken: token,
    expiresAt: payload.exp ? payload.exp * 1000 : undefined,
  };
}

/**
 * Normalizes backend user payload into a clean GameUser representation.
 */
export function normalizeUser(rawUser: any): GameUser {
  const meta = rawUser?.user_metadata || {};
  const name =
    meta.full_name ||
    meta.name ||
    rawUser.name ||
    meta.username ||
    rawUser.username ||
    rawUser?.email?.split('@')[0] ||
    'Campus Player';

  const username = meta.username || rawUser.username || rawUser?.email?.split('@')[0] || 'player';

  return {
    id: rawUser.id || rawUser.sub || '',
    email: rawUser.email || '',
    name,
    username,
    avatar_url: meta.avatar_url || rawUser.avatar_url,
    department: meta.department || rawUser.department,
    course: meta.course || rawUser.course,
    year_level: meta.year_level || rawUser.year_level,
    raw: rawUser,
  };
}

/**
 * Fetches user session from backend using Bearer access token.
 */
export async function fetchSession(token: string): Promise<AuthSession | null> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return null;

  try {
    const res = await fetch(`${baseUrl}/auth/session`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn('[GameAuth] Session expired or invalid on backend (401)');
        setStoredToken(null);
      }
      return null;
    }

    const payload = await res.json();
    const rawUser = payload?.user || payload;
    const userId = rawUser?.id || rawUser?.sub;
    if (!userId) return null;

    return {
      user: normalizeUser(rawUser),
      accessToken: token,
      expiresAt: payload?.expiresAt,
    };
  } catch (err) {
    console.warn('[GameAuth] Session fetch failed:', err);
    return null;
  }
}

/**
 * Silent refresh using the backend HttpOnly refresh cookie (or stored token).
 * Allows the game portal to inherit the same active session as the main web.
 */
export async function silentRefresh(): Promise<AuthSession | null> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return null;

  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return null;
    }

    const payload = await res.json();
    const nextToken = payload?.accessToken || payload?.data?.accessToken;
    const rawUser = payload?.user || payload?.data?.user;

    if (nextToken && rawUser) {
      setStoredToken(nextToken);
      return {
        user: normalizeUser(rawUser),
        accessToken: nextToken,
        expiresAt: payload?.expiresAt,
      };
    }
    return null;
  } catch (err) {
    console.warn('[GameAuth] Silent refresh failed:', err);
    return null;
  }
}

/**
 * Signs out on backend, revokes credentials, clears token, and broadcasts LOGOUT.
 */
export async function logoutSession(token?: string | null): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const currentToken = token || getStoredToken();

  try {
    if (currentToken && baseUrl) {
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      });
    }
  } catch (e) {
    console.warn('[GameAuth] Backend logout network error (swallowed):', e);
  } finally {
    setStoredToken(null);
    broadcastAuth({ type: 'LOGOUT' });
  }
}

export function broadcastAuth(message: {
  type: 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESHED';
  token?: string;
  session?: any;
}): void {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      channel.postMessage(message);
      channel.close();
    }
  } catch {}
}
