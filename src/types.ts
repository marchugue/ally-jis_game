export type GameId = 'ttt' | 'clue' | 'merge';
export type Presence = 'online' | 'away' | 'offline';
export type View = 'games' | 'friends' | 'leaderboard';

export interface Person {
  id: string;
  name: string;
  color?: string;
  avatar_url?: string;
  avatarKey?: string;
  isAnonymous?: boolean;
}

export interface Friend extends Person {
  status: Presence;
  isAnonymous?: boolean;
  avatarKey?: string;
  streak?: number;
  matchPoints?: number;
  matchId?: string;
  conversationId?: string;
}

export interface Game {
  id: GameId;
  name: string;
  description: string;
  tint: string;
  artWidth: string;
  featured?: boolean;
  coverImage?: string;
}

export interface Pending {
  friendId: string;
  gameId: GameId;
}
