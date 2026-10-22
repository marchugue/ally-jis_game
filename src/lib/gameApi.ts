import { getApiBaseUrl } from './auth';
import type { GameId } from '../types';

// ── DTOs (mirror ally-jis_backend game.service PublicGameSession) ────────────

export type GameSessionStatus =
  | 'invited'
  | 'active'
  | 'finished'
  | 'declined'
  | 'cancelled'
  | 'expired'
  | 'abandoned';

export interface DuelIdentity {
  id: string;
  name: string;
  isAnonymous: boolean;
  avatar_url?: string | null;
  avatarKey?: string;
}

export interface GameSessionDto {
  id: string;
  gameId: GameId;
  gameName: string;
  status: GameSessionStatus;
  conversationId: string | null;
  matchId: string | null;
  hostId: string;
  guestId: string;
  youAre: 'host' | 'guest';
  turnUserId: string | null;
  scores: { you: number; opponent: number };
  winnerId: string | null;
  isDraw: boolean;
  endReason: string | null;
  opponent: DuelIdentity;
  /** Per-game projection of the server state (see game.engine publicState). */
  state: any;
  startedAt: string | null;
  endedAt: string | null;
  inviteExpiresAt: string | null;
  serverNow: number;
}

export interface IncomingInvite {
  session: GameSessionDto;
  from: DuelIdentity;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  avatarKey?: string;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  points: number;
  bestScore: number;
  isMe: boolean;
}

export interface LeaderboardResponse {
  gameId: GameId;
  scope: 'global' | 'friends';
  items: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

// ── REST ─────────────────────────────────────────────────────────────────────

async function request<T>(path: string, token?: string | null, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body as T;
}

export async function sendGameInvite(token: string, friendId: string, gameId: GameId): Promise<GameSessionDto> {
  const data = await request<{ session: GameSessionDto }>('/games/invite', token, {
    method: 'POST',
    body: JSON.stringify({ friendId, gameId }),
  });
  return data.session;
}

export async function acceptGameInvite(token: string, sessionId: string): Promise<GameSessionDto> {
  const data = await request<{ session: GameSessionDto }>(`/games/${sessionId}/accept`, token, { method: 'POST' });
  return data.session;
}

export async function declineGameInvite(token: string, sessionId: string): Promise<void> {
  await request(`/games/${sessionId}/decline`, token, { method: 'POST' });
}

export async function cancelGameInvite(token: string, sessionId: string): Promise<void> {
  await request(`/games/${sessionId}/cancel`, token, { method: 'POST' });
}

export async function fetchGameSession(token: string, sessionId: string): Promise<GameSessionDto> {
  const data = await request<{ session: GameSessionDto }>(`/games/${sessionId}`, token);
  return data.session;
}

export async function fetchOpenGames(
  token: string,
): Promise<{ active: GameSessionDto | null; invites: IncomingInvite[] }> {
  return request('/games/open', token);
}

export async function fetchLeaderboard(
  token: string | null | undefined,
  gameId: GameId,
  scope: 'global' | 'friends',
): Promise<LeaderboardResponse> {
  return request(`/games/leaderboard?game=${gameId}&scope=${scope}&limit=50`, token);
}
