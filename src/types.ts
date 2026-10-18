export type GameId = 'ttt' | 'clue' | 'merge';
export type Presence = 'online' | 'away' | 'offline';
export type View = 'games' | 'friends';

export interface Person {
  id: string;
  name: string;
  color: string;
}

export interface Friend extends Person {
  status: Presence;
}

export interface Game {
  id: GameId;
  name: string;
  description: string;
  tint: string;
  artWidth: string;
  featured?: boolean;
}

export interface Pending {
  friendId: string;
  gameId: GameId;
}
