import type { Friend, Game, Person } from './types';

export const ME: Person = { id: 'me', name: 'Kian', color: '#38C185' };

export const FRIENDS: Friend[] = [
  { id: 'mina', name: 'Mina', color: '#10B981', status: 'online' },
  { id: 'theo', name: 'Theo', color: '#60A5FA', status: 'online' },
  { id: 'ravi', name: 'Ravi', color: '#F0B247', status: 'away' },
  { id: 'lena', name: 'Lena', color: '#94A3B8', status: 'offline' },
];

export const GAMES: Game[] = [
  { id: 'merge', name: 'Number Merge Duel', description: 'Slide, merge, and outscore your rival.', tint: '#16241c', artWidth: '400px', featured: true },
  { id: 'ttt', name: 'Tic-Tac-Toe', description: 'Three in a row wins.', tint: '#141d2b', artWidth: '190px' },
  { id: 'clue', name: 'Secret Clue', description: 'One clue, one hidden word.', tint: '#1f1a29', artWidth: '230px' },
];
