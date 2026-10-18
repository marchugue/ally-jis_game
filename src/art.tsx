import type { ComponentType } from 'react';
import type { GameId } from './types';

const FONT = 'Bricolage Grotesque, DM Sans, sans-serif';

function TicTacToeArt() {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Tic-tac-toe board">
      <g stroke="#3b414b" strokeWidth="5" strokeLinecap="round">
        <path d="M73 22v156M127 22v156M22 73h156M22 127h156" />
      </g>
      <path d="M30 30L170 170" stroke="#7b97b8" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      <g stroke="#d6a25c" strokeWidth="7" strokeLinecap="round">
        <path d="M37 37l22 22M59 37L37 59" />
        <path d="M89 89l22 22M111 89L89 111" />
        <path d="M141 141l22 22M163 141l-22 22" />
      </g>
      <g fill="none" stroke="#a99bc4" strokeWidth="7">
        <circle cx="152" cy="48" r="13" />
        <circle cx="48" cy="152" r="13" />
        <circle cx="100" cy="152" r="13" />
      </g>
    </svg>
  );
}

function SecretClueArt() {
  return (
    <svg viewBox="0 0 240 190" role="img" aria-label="Hidden clue cards">
      <g transform="rotate(-9 104 84)">
        <rect x="56" y="22" width="96" height="124" rx="14" fill="#2d2a35" stroke="#47425a" strokeWidth="2" />
      </g>
      <g transform="rotate(7 138 84)">
        <rect x="90" y="22" width="96" height="124" rx="14" fill="#383349" stroke="#6a5f88" strokeWidth="2" />
        <circle cx="138" cy="72" r="9" fill="#a99bc4" />
        <path d="M133 79h10l2 29h-14z" fill="#a99bc4" />
      </g>
      <g stroke="#464b54" strokeWidth="4" strokeLinecap="round">
        <path d="M40 174h24M74 174h24M108 174h24M176 174h24" />
      </g>
      <path d="M142 174h24" stroke="#d6a25c" strokeWidth="4" strokeLinecap="round" />
      <text x="154" y="166" textAnchor="middle" fontSize="20" fontWeight="700" fill="#d6a25c" fontFamily={FONT}>
        E
      </text>
    </svg>
  );
}

const TILE: Record<number, [bg: string, fg: string]> = {
  2: ['#363a42', '#b5bac3'],
  4: ['#415068', '#dbe3ee'],
  8: ['#5a5075', '#e8e2f3'],
  16: ['#b08449', '#1c1710'],
};
const ROWS = [
  [2, 4, 8, 16],
  [0, 2, 4, 8],
  [0, 0, 2, 4],
];

function MergeArt() {
  return (
    <svg viewBox="0 0 264 200" role="img" aria-label="Numbered puzzle tiles">
      {ROWS.flatMap((row, y) =>
        row.map((v, x) => {
          const X = 8 + x * 64;
          const Y = 8 + y * 64;
          if (!v) {
            return (
              <rect key={`${x}-${y}`} x={X} y={Y} width="56" height="56" rx="14" fill="none"
                stroke="#3d4149" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
            );
          }
          const [bg, fg] = TILE[v];
          return (
            <g key={`${x}-${y}`}>
              <rect x={X} y={Y} width="56" height="56" rx="14" fill={bg} />
              <text x={X + 28} y={Y + 37} textAnchor="middle" fontSize={v > 8 ? 22 : 24}
                fontWeight="700" fill={fg} fontFamily={FONT}>
                {v}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}

export const GAME_ART: Record<GameId, ComponentType> = {
  ttt: TicTacToeArt,
  clue: SecretClueArt,
  merge: MergeArt,
};
