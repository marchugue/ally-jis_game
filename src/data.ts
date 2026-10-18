import type { Friend, Game, Person } from './types';

export const ME: Person = { id: 'me', name: 'Kian', color: '#d9d3c7' };

export const FRIENDS: Friend[] = [
  { id: 'mina', name: 'Mina', color: '#a99bc4', status: 'online' },
  { id: 'theo', name: 'Theo', color: '#7b97b8', status: 'online' },
  { id: 'ravi', name: 'Ravi', color: '#d6a25c', status: 'away' },
  { id: 'lena', name: 'Lena', color: '#9aa3ad', status: 'offline' },
];

export const GAMES: Game[] = [
  { id: 'merge', name: 'Number Merge Duel', description: 'Slide, merge, and outscore your rival.', tint: '#2a251f', artWidth: '400px', featured: true },
  { id: 'ttt', name: 'Tic-Tac-Toe', description: 'Three in a row wins.', tint: '#1f252c', artWidth: '190px' },
  { id: 'clue', name: 'Secret Clue', description: 'One clue, one hidden word.', tint: '#25222d', artWidth: '230px' },
];
