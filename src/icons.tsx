import type { ReactNode } from 'react';
import type { GameId } from './types';

export type IconName = GameId | 'games' | 'friends';

const PATHS: Record<IconName, ReactNode> = {
  ttt: <path d="M8 3v18M16 3v18M3 8h18M3 16h18" />,
  clue: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <path d="M10 10a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.5M12 17h.01" />
    </>
  ),
  merge: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </>
  ),
  games: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  friends: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
      <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.4 3.5 5.2" />
    </>
  ),
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
