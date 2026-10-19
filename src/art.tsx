import type { ComponentType } from 'react';
import type { GameId } from './types';

const FONT = 'Bricolage Grotesque, DM Sans, sans-serif';

function TicTacToeArt() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-3 select-none">
      <img
        src="/tictactoe-platform.png"
        alt="Tic Tac Toe"
        className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
        draggable={false}
      />
      <img
        src="/x.png"
        alt="X"
        className="absolute top-[25%] left-[23%] w-[22%] h-[22%] object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        draggable={false}
      />
      <img
        src="/o.png"
        alt="O"
        className="absolute top-[25%] right-[23%] w-[22%] h-[22%] object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        draggable={false}
      />
      <img
        src="/x.png"
        alt="X"
        className="absolute bottom-[25%] left-[23%] w-[22%] h-[22%] object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        draggable={false}
      />
    </div>
  );
}

function SecretClueArt() {
  return (
    <svg viewBox="0 0 240 190" role="img" aria-label="Hidden clue cards">
      <g transform="rotate(-9 104 84)">
        <rect x="56" y="22" width="96" height="124" rx="14" fill="#1C2720" stroke="#263E32" strokeWidth="2" />
      </g>
      <g transform="rotate(7 138 84)">
        <rect x="90" y="22" width="96" height="124" rx="14" fill="#20362B" stroke="#38C185" strokeWidth="2" />
        <circle cx="138" cy="72" r="9" fill="#38C185" />
        <path d="M133 79h10l2 29h-14z" fill="#38C185" />
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

const CASUAL_GRID: (number | null)[][] = [
  [2, 4, 8, 16],
  [null, 2, 8, 32],
  [null, null, 16, 64],
  [null, null, null, 128],
];

const CASUAL_TILES: Record<number, { bg: string; fg: string; shadow: string }> = {
  2: { bg: '#eee4da', fg: '#544738', shadow: '#d5c8bb' },
  4: { bg: '#ede0c8', fg: '#544738', shadow: '#d5c5ad' },
  8: { bg: '#f39c55', fg: '#ffffff', shadow: '#d97c31' },
  16: { bg: '#f57c5f', fg: '#ffffff', shadow: '#d85a3b' },
  32: { bg: '#f65e3b', fg: '#ffffff', shadow: '#d4421e' },
  64: { bg: '#ed4436', fg: '#ffffff', shadow: '#c5281b' },
  128: { bg: '#f7c948', fg: '#ffffff', shadow: '#d6a524' },
};

function MergeArt() {
  return (
    <svg viewBox="0 0 280 270" role="img" aria-label="Casual 2048 Number Merge Board">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#309fe8" />
          <stop offset="60%" stopColor="#5ec2fa" />
          <stop offset="100%" stopColor="#9de1ff" />
        </linearGradient>
        <linearGradient id="hillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64d836" />
          <stop offset="100%" stopColor="#359e18" />
        </linearGradient>
        <filter id="boardShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0a253d" floodOpacity="0.45" />
        </filter>
        <filter id="tileShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.16" />
        </filter>
      </defs>

      {/* Sky Background */}
      <rect width="280" height="270" rx="24" fill="url(#skyGrad)" />

      {/* Fluffy Cartoon Clouds */}
      <ellipse cx="36" cy="30" rx="24" ry="14" fill="#ffffff" opacity="0.9" />
      <ellipse cx="54" cy="24" rx="20" ry="16" fill="#ffffff" opacity="0.95" />
      <ellipse cx="72" cy="31" rx="18" ry="13" fill="#ffffff" opacity="0.85" />

      <ellipse cx="230" cy="28" rx="28" ry="14" fill="#ffffff" opacity="0.88" />
      <ellipse cx="248" cy="22" rx="22" ry="16" fill="#ffffff" opacity="0.95" />

      {/* Rolling Meadow Hills at bottom */}
      <path d="M-10 236 Q 60 190 140 220 T 290 195 L 290 280 L -10 280 Z" fill="url(#hillGrad)" />
      <path d="M-10 252 Q 80 222 180 242 T 290 226 L 290 280 L -10 280 Z" fill="#2d8e12" opacity="0.95" />

      {/* Top Header Pods (No wooden logo as requested) */}
      {/* Score Pod */}
      <rect x="88" y="10" width="58" height="34" rx="11" fill="#255882" stroke="#4280b2" strokeWidth="1.5" />
      <text x="117" y="21" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#9acbf2" fontFamily={FONT} letterSpacing="0.6">
        SCORE
      </text>
      <text x="117" y="38" textAnchor="middle" fontSize="13" fontWeight="900" fill="#ffffff" fontFamily={FONT}>
        1240
      </text>

      {/* Best Pod */}
      <rect x="154" y="10" width="58" height="34" rx="11" fill="#255882" stroke="#4280b2" strokeWidth="1.5" />
      <text x="183" y="21" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#9acbf2" fontFamily={FONT} letterSpacing="0.6">
        BEST
      </text>
      <text x="183" y="38" textAnchor="middle" fontSize="13" fontWeight="900" fill="#ffffff" fontFamily={FONT}>
        3568
      </text>

      {/* Pause Button */}
      <rect x="220" y="10" width="34" height="34" rx="11" fill="#255882" stroke="#4280b2" strokeWidth="1.5" />
      <rect x="231" y="20" width="4" height="14" rx="1.5" fill="#ffffff" />
      <rect x="239" y="20" width="4" height="14" rx="1.5" fill="#ffffff" />

      {/* 4x4 Game Board Frame */}
      <g filter="url(#boardShadow)">
        <rect x="32" y="50" width="216" height="216" rx="22" fill="#396c97" stroke="#4c83b2" strokeWidth="3" />
      </g>

      {/* 4x4 Grid Cells & Number Tiles */}
      {CASUAL_GRID.flatMap((row, r) =>
        row.map((val, c) => {
          const x = 41 + c * 51;
          const y = 59 + r * 51;

          // Empty recessed slot
          if (!val) {
            return (
              <rect
                key={`empty-${r}-${c}`}
                x={x}
                y={y}
                width="45"
                height="45"
                rx="11"
                fill="#4b7a9f"
              />
            );
          }

          const style = CASUAL_TILES[val];
          return (
            <g key={`tile-${r}-${c}`} filter="url(#tileShadow)">
              {/* Bottom 3D shelf edge */}
              <rect x={x} y={y + 3} width="45" height="42" rx="11" fill={style.shadow} />
              {/* Tile Face */}
              <rect x={x} y={y} width="45" height="43" rx="11" fill={style.bg} />
              {/* Tile Number Text */}
              <text
                x={x + 22.5}
                y={y + (val >= 100 ? 28 : 30)}
                textAnchor="middle"
                fontSize={val >= 100 ? 16 : 21}
                fontWeight="900"
                fill={style.fg}
                fontFamily={FONT}
              >
                {val}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}

export const GAME_ART: Record<GameId, ComponentType> = {
  ttt: TicTacToeArt,
  clue: SecretClueArt,
  merge: MergeArt,
};
