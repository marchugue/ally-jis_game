import { getApiBaseUrl } from './auth';
import type { Friend, Presence } from '../types';
import { getDeterministicAnonymousAvatar } from './avatar';

const ALLIES_CACHE_KEY_PREFIX = 'ally_game_allied_connections_';
const ANONYMOUS_CACHE_KEY_PREFIX = 'ally_game_anonymous_matches_';

export interface AlliedResponseItem {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  course: string | null;
  department: string | null;
  yearLevel: string | null;
  alliedAt: string;
}

export interface ConversationMember {
  user_id: string;
  role?: string;
  profiles?: any;
}

export interface ConversationItem {
  id: string;
  type?: 'anonymous' | 'allied';
  variant?: 'anonymous' | 'anonymous_ended' | 'regular';
  conversation_members?: ConversationMember[];
  matchInfo?: {
    matchId?: string;
    status?: string;
    stage?: number;
    dayStreak?: number;
    matchPoints?: number;
    partnerAlias?: string;
    partnerAvatar?: string;
    ended?: boolean;
    isRevealed?: boolean;
  } | null;
}

/**
 * Reads cached allied connections from localStorage for instant display.
 */
export function getCachedAllies(userId: string): Friend[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`${ALLIES_CACHE_KEY_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Saves allied connections to localStorage cache.
 */
export function setCachedAllies(userId: string, allies: Friend[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`${ALLIES_CACHE_KEY_PREFIX}${userId}`, JSON.stringify(allies));
  } catch {}
}

/**
 * Reads cached anonymous matches from localStorage for instant display.
 */
export function getCachedAnonymousMatches(userId: string): Friend[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`${ANONYMOUS_CACHE_KEY_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Saves anonymous matches to localStorage cache.
 */
export function setCachedAnonymousMatches(userId: string, matches: Friend[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`${ANONYMOUS_CACHE_KEY_PREFIX}${userId}`, JSON.stringify(matches));
  } catch {}
}

/**
 * Fetches online user IDs from backend presence service.
 */
export async function fetchOnlineUserIds(token: string): Promise<Set<string>> {
  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/presence/online`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return new Set();
    const data = await res.json();
    const ids: string[] = data?.userIds || [];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

/**
 * Fetches real allied connections only for the current user.
 */
export async function fetchAlliedConnections(userId: string, token: string): Promise<Friend[]> {
  const apiBase = getApiBaseUrl();
  const [alliesRes, onlineSet] = await Promise.all([
    fetch(`${apiBase}/interactions/allies/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => null),
    fetchOnlineUserIds(token),
  ]);

  if (!alliesRes || !alliesRes.ok) {
    throw new Error('Failed to fetch allied connections');
  }

  const data = await alliesRes.json();
  const items: AlliedResponseItem[] = data?.items || [];

  const friends: Friend[] = items.map((item) => {
    const displayName = item.fullName?.trim() || item.username?.trim() || 'Allied Friend';
    const isOnline = onlineSet.has(item.id);

    return {
      id: item.id,
      name: displayName,
      color: '#38C185',
      avatar_url: item.avatarUrl || undefined,
      status: (isOnline ? 'online' : 'offline') as Presence,
      isAnonymous: false,
    };
  });

  setCachedAllies(userId, friends);
  return friends;
}

/**
 * Fetches active anonymous matches for the current user.
 * SECURITY: Guarantees that partner identity is NEVER revealed;
 * only partnerAlias and partnerAvatar are used.
 */
export async function fetchAnonymousMatches(userId: string, token: string): Promise<Friend[]> {
  const apiBase = getApiBaseUrl();
  const [convRes, onlineSet] = await Promise.all([
    fetch(`${apiBase}/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => null),
    fetchOnlineUserIds(token),
  ]);

  if (!convRes || !convRes.ok) {
    throw new Error('Failed to fetch conversations');
  }

  const data = await convRes.json();
  const conversations: ConversationItem[] = Array.isArray(data) ? data : data?.conversations || [];

  // Filter only active anonymous matches (not regular and not ended)
  const anonymousConvs = conversations.filter((c) => {
    const isAnon = c.type === 'anonymous' || c.variant === 'anonymous';
    const notEnded = !c.matchInfo?.ended && c.variant !== 'anonymous_ended';
    return isAnon && notEnded;
  });

  const matches: Friend[] = anonymousConvs.map((c) => {
    const match = c.matchInfo;
    const otherMemberId = c.conversation_members?.find((m) => m.user_id !== userId)?.user_id;

    // Determine consistent anonymous avatar
    const avatarKey =
      match?.partnerAvatar ||
      getDeterministicAnonymousAvatar(otherMemberId || c.id);

    // Format safe alias name (e.g. "Anonymous Panda")
    let alias = match?.partnerAlias?.trim();
    if (!alias) {
      const capKey = avatarKey.charAt(0).toUpperCase() + avatarKey.slice(1);
      alias = `Anonymous ${capKey}`;
    }

    const isOnline = otherMemberId ? onlineSet.has(otherMemberId) : false;

    return {
      id: otherMemberId || c.id,
      name: alias,
      color: '#38C185',
      avatarKey,
      status: (isOnline ? 'online' : 'offline') as Presence,
      isAnonymous: true,
      streak: match?.dayStreak ?? 0,
      matchPoints: match?.matchPoints ?? 0,
      matchId: match?.matchId,
      conversationId: c.id,
    };
  });

  setCachedAnonymousMatches(userId, matches);
  return matches;
}
