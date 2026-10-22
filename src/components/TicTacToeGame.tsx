import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { GameUser } from '../lib/auth';
import { SettingsModal, GameModal, GameWoodButton } from './GameModal';
import { Avatar } from './Avatar';
import type { DuelApi } from '../hooks/useDuel';
import type { Series } from './DuelHost';

export type Player = 'X' | 'O';
export type BoardState = (Player | null)[];
export type Difficulty = 'easy' | 'medium' | 'hard';

interface Props {
  onBack: () => void;
  user?: GameUser | null;
  /** When set, this is a LIVE 1v1 against another person — the server owns the board. */
  duel?: DuelApi;
  /** Running win/loss/draw tally across rematches (duel only). */
  series?: Series;
}

export interface CellPositionConfig {
  index: number;
  label: string;
  top: string;
  left: string;
  width: string;
  height: string;
  centerPct: { x: number; y: number };
}

/**
 * 3x3 Grid Pocket Positions on the carved oak tabletop platform (tictactoe-board-wood.png)
 */
export const CELL_POSITIONS: CellPositionConfig[] = [
  // --- ROW 0 ---
  {
    index: 0,
    label: 'Cell 0: Top-Left (Row 0, Col 0)',
    top: '9%',
    left: '9%',
    width: '25%',
    height: '25%',
    centerPct: { x: 21.5, y: 21.5 },
  },
  {
    index: 1,
    label: 'Cell 1: Top-Center (Row 0, Col 1)',
    top: '9%',
    left: '37.5%',
    width: '25%',
    height: '25%',
    centerPct: { x: 50.0, y: 21.5 },
  },
  {
    index: 2,
    label: 'Cell 2: Top-Right (Row 0, Col 2)',
    top: '9%',
    left: '66%',
    width: '25%',
    height: '25%',
    centerPct: { x: 78.5, y: 21.5 },
  },

  // --- ROW 1 ---
  {
    index: 3,
    label: 'Cell 3: Middle-Left (Row 1, Col 0)',
    top: '37.5%',
    left: '9%',
    width: '25%',
    height: '25%',
    centerPct: { x: 21.5, y: 50.0 },
  },
  {
    index: 4,
    label: 'Cell 4: Center (Row 1, Col 1)',
    top: '37.5%',
    left: '37.5%',
    width: '25%',
    height: '25%',
    centerPct: { x: 50.0, y: 50.0 },
  },
  {
    index: 5,
    label: 'Cell 5: Middle-Right (Row 1, Col 2)',
    top: '37.5%',
    left: '66%',
    width: '25%',
    height: '25%',
    centerPct: { x: 78.5, y: 50.0 },
  },

  // --- ROW 2 ---
  {
    index: 6,
    label: 'Cell 6: Bottom-Left (Row 2, Col 0)',
    top: '66%',
    left: '9%',
    width: '25%',
    height: '25%',
    centerPct: { x: 21.5, y: 78.5 },
  },
  {
    index: 7,
    label: 'Cell 7: Bottom-Center (Row 2, Col 1)',
    top: '66%',
    left: '37.5%',
    width: '25%',
    height: '25%',
    centerPct: { x: 50.0, y: 78.5 },
  },
  {
    index: 8,
    label: 'Cell 8: Bottom-Right (Row 2, Col 2)',
    top: '66%',
    left: '66%',
    width: '25%',
    height: '25%',
    centerPct: { x: 78.5, y: 78.5 },
  },
];

const WINNING_COMBINATIONS = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];

function checkWin(board: BoardState): {
  winner: Player | null;
  combo: number[] | null;
  isDraw: boolean;
} {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo, isDraw: false };
    }
  }

  const isDraw = board.every((cell) => cell !== null);
  return { winner: null, combo: null, isDraw };
}

// Minimax AI with heuristic tree search (Easy, Medium, Hard)
function getBestMove(
  board: BoardState,
  difficulty: Difficulty,
  aiPlayer: Player = 'O',
  humanPlayer: Player = 'X'
): number {
  const availableMoves: number[] = [];
  board.forEach((val, idx) => {
    if (val === null) availableMoves.push(idx);
  });

  if (availableMoves.length === 0) return -1;

  // Easy mode: 65% random move
  if (difficulty === 'easy' && Math.random() < 0.65) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Medium mode: 30% random move
  if (difficulty === 'medium' && Math.random() < 0.3) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Quick move 1: Can AI win right now?
  for (const move of availableMoves) {
    board[move] = aiPlayer;
    if (checkWin(board).winner === aiPlayer) {
      board[move] = null;
      return move;
    }
    board[move] = null;
  }

  // Quick move 2: Must AI block opponent's immediate win?
  for (const move of availableMoves) {
    board[move] = humanPlayer;
    if (checkWin(board).winner === humanPlayer) {
      board[move] = null;
      return move;
    }
    board[move] = null;
  }

  // Center preference on first turns
  if (board[4] === null) return 4;

  const maxDepth = difficulty === 'medium' ? 2 : 5;

  let bestScore = -Infinity;
  let move = availableMoves[0];

  for (const idx of availableMoves) {
    board[idx] = aiPlayer;
    const score = minimax(board, 0, false, aiPlayer, humanPlayer, maxDepth);
    board[idx] = null;
    if (score > bestScore) {
      bestScore = score;
      move = idx;
    }
  }

  return move;
}

function minimax(
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  humanPlayer: Player,
  maxDepth: number = 5
): number {
  const result = checkWin(board);
  if (result.winner === aiPlayer) return 10 - depth;
  if (result.winner === humanPlayer) return depth - 10;
  if (result.isDraw) return 0;
  if (depth >= maxDepth) return 0;

  const available: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) available.push(i);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of available) {
      board[move] = aiPlayer;
      const evaluation = minimax(board, depth + 1, false, aiPlayer, humanPlayer, maxDepth);
      board[move] = null;
      maxEval = Math.max(maxEval, evaluation);
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of available) {
      board[move] = humanPlayer;
      const evaluation = minimax(board, depth + 1, true, aiPlayer, humanPlayer, maxDepth);
      board[move] = null;
      minEval = Math.min(minEval, evaluation);
    }
    return minEval;
  }
}

// Built-in Web Audio API sound generator for wooden clacks & magical chimes
class SoundFx {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ally_ttt_sound');
      this.enabled = saved !== 'false';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playPop(player: Player) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Resonant wood impact thump
      const woodOsc = this.ctx.createOscillator();
      const woodGain = this.ctx.createGain();
      woodOsc.type = 'triangle';
      woodOsc.frequency.setValueAtTime(140, now);
      woodOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
      woodGain.gain.setValueAtTime(0.35, now);
      woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      woodOsc.connect(woodGain);
      woodGain.connect(this.ctx.destination);
      woodOsc.start(now);
      woodOsc.stop(now + 0.09);

      // Mystical rune chime (Cyan chime for X, Emerald chime for O)
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      const freq = player === 'X' ? 880 : 659.25;
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(freq, now + 0.02);
      chimeOsc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.16);
      chimeGain.gain.setValueAtTime(0.12, now + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chimeOsc.start(now + 0.02);
      chimeOsc.stop(now + 0.22);
    } catch {}
  }

  playWin() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + i * 0.09;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.38);
      });
    } catch {}
  }

  playDraw() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [349.23, 311.13, 293.66];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + i * 0.1;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.28);
      });
    } catch {}
  }
}

const sfx = new SoundFx();

// ── 3D Carved Wood Runic Pieces (Vector SVGs matching game cover art) ──────

export function RunicPieceX({ isWinning }: { isWinning?: boolean }) {
  return (
    <div
      className={`relative w-[86%] h-[86%] flex items-center justify-center select-none ${
        isWinning ? 'animate-winning-piece-x scale-105' : 'animate-pop'
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]">
        <defs>
          <filter id="neonCyanGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="oakWoodX" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5d3c22" />
            <stop offset="50%" stopColor="#432a17" />
            <stop offset="100%" stopColor="#2a190d" />
          </linearGradient>
          <linearGradient id="bevelWoodX" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a502e" />
            <stop offset="100%" stopColor="#180e07" />
          </linearGradient>
        </defs>

        {/* 3D Deep Ground Shadow */}
        <path
          d="M 28,14 L 50,36 L 72,14 L 86,28 L 64,50 L 86,72 L 72,86 L 50,64 L 28,86 L 14,72 L 36,50 L 14,28 Z"
          transform="translate(0, 7)"
          fill="#0c0704"
          opacity="0.85"
        />

        {/* 3D Beveled Wooden Edge */}
        <path
          d="M 28,14 L 50,36 L 72,14 L 86,28 L 64,50 L 86,72 L 72,86 L 50,64 L 28,86 L 14,72 L 36,50 L 14,28 Z"
          transform="translate(0, 3.5)"
          fill="url(#bevelWoodX)"
        />

        {/* Top Carved Wood Cross Face */}
        <path
          d="M 28,14 L 50,36 L 72,14 L 86,28 L 64,50 L 86,72 L 72,86 L 50,64 L 28,86 L 14,72 L 36,50 L 14,28 Z"
          fill="url(#oakWoodX)"
          stroke="#8c5e37"
          strokeWidth="1.6"
        />

        {/* Glowing Neon Cyan Inset Runes Channel */}
        <path
          d="M 32,22 L 50,40 L 68,22 M 78,32 L 60,50 L 78,68 M 68,78 L 50,60 L 32,78 M 22,68 L 40,50 L 22,32"
          fill="none"
          stroke={isWinning ? '#F0B247' : '#38bdf8'}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#neonCyanGlow)"
        />

        {/* Core Laser Highlight */}
        <path
          d="M 32,22 L 50,40 L 68,22 M 78,32 L 60,50 L 78,68 M 68,78 L 50,60 L 32,78 M 22,68 L 40,50 L 22,32"
          fill="none"
          stroke={isWinning ? '#FFFBEB' : '#e0f2fe'}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Core Rune Orb */}
        <circle cx="50" cy="50" r="3" fill={isWinning ? '#F0B247' : '#38bdf8'} filter="url(#neonCyanGlow)" />
        <circle cx="50" cy="50" r="1.3" fill="#ffffff" />
      </svg>
    </div>
  );
}

export function RunicPieceO({ isWinning }: { isWinning?: boolean }) {
  return (
    <div
      className={`relative w-[86%] h-[86%] flex items-center justify-center select-none ${
        isWinning ? 'animate-winning-piece-o scale-105' : 'animate-pop'
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]">
        <defs>
          <filter id="neonEmeraldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="oakWoodO" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5d3c22" />
            <stop offset="50%" stopColor="#432a17" />
            <stop offset="100%" stopColor="#2a190d" />
          </linearGradient>
          <linearGradient id="bevelWoodO" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a502e" />
            <stop offset="100%" stopColor="#180e07" />
          </linearGradient>
        </defs>

        {/* 3D Deep Ground Shadow */}
        <circle cx="50" cy="57" r="36" fill="#0c0704" opacity="0.85" />
        <circle cx="50" cy="57" r="17" fill="#0c0704" opacity="0.85" />

        {/* 3D Beveled Wooden Edge */}
        <circle cx="50" cy="53.5" r="36" fill="url(#bevelWoodO)" />

        {/* Top Carved Wood Ring Face */}
        <path
          d="M 50,14 A 36,36 0 1 0 50,86 A 36,36 0 1 0 50,14 Z M 50,33 A 17,17 0 1 1 50,67 A 17,17 0 1 1 50,33 Z"
          fill="url(#oakWoodO)"
          stroke="#8c5e37"
          strokeWidth="1.6"
          fillRule="evenodd"
        />

        {/* Glowing Neon Emerald Inset Runes Ring */}
        <circle
          cx="50"
          cy="50"
          r="26.5"
          fill="none"
          stroke={isWinning ? '#F0B247' : '#34d399'}
          strokeWidth="3.4"
          strokeDasharray="14 5 8 5"
          filter="url(#neonEmeraldGlow)"
        />

        {/* Core Laser Highlight */}
        <circle
          cx="50"
          cy="50"
          r="26.5"
          fill="none"
          stroke={isWinning ? '#FFFBEB' : '#ecfdf5'}
          strokeWidth="1.4"
          strokeDasharray="14 5 8 5"
        />

        {/* Four Cardinal Runic Nodes */}
        <circle cx="50" cy="23.5" r="2.2" fill={isWinning ? '#F0B247' : '#34d399'} filter="url(#neonEmeraldGlow)" />
        <circle cx="50" cy="76.5" r="2.2" fill={isWinning ? '#F0B247' : '#34d399'} filter="url(#neonEmeraldGlow)" />
        <circle cx="23.5" cy="50" r="2.2" fill={isWinning ? '#F0B247' : '#34d399'} filter="url(#neonEmeraldGlow)" />
        <circle cx="76.5" cy="50" r="2.2" fill={isWinning ? '#F0B247' : '#34d399'} filter="url(#neonEmeraldGlow)" />
      </svg>
    </div>
  );
}

export function TicTacToeGame({ onBack, user, duel, series }: Props) {
  // If dueling, the server is the authority — read the session state projection.
  const duelState = duel?.session.state as { board?: BoardState; winnerId?: string | null } | undefined;
  const myMark: Player = duel ? (duel.session.hostId === user?.id ? 'X' : 'O') : 'X';

  const [localBoard, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [localTurn, setTurn] = useState<Player>('X');

  const board: BoardState = duel ? duelState?.board ?? (Array(9).fill(null) as BoardState) : localBoard;
  const turn: Player = duel ? (duel.isMyTurn ? myMark : myMark === 'X' ? 'O' : 'X') : localTurn;

  // Countdown timer for live duel turn
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!duel) return;
    const id = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [duel]);

  const turnEndsAt = (duel?.session.state as { turnEndsAt?: number | null } | undefined)?.turnEndsAt ?? null;
  const secondsLeft = duel && turnEndsAt ? Math.max(0, Math.ceil((turnEndsAt - duel.now()) / 1000)) : null;

  const [scores, setScores] = useState({ x: 0, o: 0, ties: 0 });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Settings & Dialogs
  const [soundOn, setSoundOn] = useState(sfx.enabled);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const isDueling = Boolean(duel);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlayAgainDialog, setShowPlayAgainDialog] = useState(false);

  const { winner, combo, isDraw } = useMemo(() => checkWin(board), [board]);
  const isGameOver = Boolean(winner || isDraw || (duel && duel.session.status !== 'active'));

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        } else if (showPlayAgainDialog) {
          setShowPlayAgainDialog(false);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, showSettings, showPlayAgainDialog]);

  const toggleSound = () => {
    const next = !soundOn;
    sfx.enabled = next;
    setSoundOn(next);
    localStorage.setItem('ally_ttt_sound', String(next));
  };

  const cycleDifficulty = () => {
    setDifficulty((prev) => {
      if (prev === 'easy') return 'medium';
      if (prev === 'medium') return 'hard';
      return 'easy';
    });
  };

  useEffect(() => {
    if (duel && (winner || isDraw)) {
      if (winner && winner === myMark) sfx.playWin();
      else sfx.playDraw();
      return;
    }
    if (winner) {
      sfx.playWin();
      setScores((prev) => ({
        ...prev,
        [winner === 'X' ? 'x' : 'o']: prev[winner === 'X' ? 'x' : 'o'] + 1,
      }));
      const timer = setTimeout(() => {
        setShowPlayAgainDialog(true);
      }, 700);
      return () => clearTimeout(timer);
    } else if (isDraw) {
      sfx.playDraw();
      setScores((prev) => ({ ...prev, ties: prev.ties + 1 }));
      const timer = setTimeout(() => {
        setShowPlayAgainDialog(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [winner, isDraw]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (duel) {
        if (board[index] !== null || isGameOver || !duel.isMyTurn || duel.session.status !== 'active') return;
        sfx.playPop(myMark);
        void duel.sendMove({ type: 'place', cell: index });
        return;
      }
      if (board[index] !== null || isGameOver || isAiThinking) return;

      const nextBoard = [...board];
      nextBoard[index] = turn;
      setBoard(nextBoard);
      sfx.playPop(turn);

      const nextPlayer: Player = turn === 'X' ? 'O' : 'X';
      setTurn(nextPlayer);
    },
    [board, isGameOver, isAiThinking, turn, duel, myMark]
  );

  // Play sound when opponent moves in duel
  const filledCount = board.filter(Boolean).length;
  const prevFilled = useRef(filledCount);
  useEffect(() => {
    if (duel && filledCount > prevFilled.current && duel.isMyTurn) {
      sfx.playPop(myMark === 'X' ? 'O' : 'X');
    }
    prevFilled.current = filledCount;
  }, [filledCount, duel, myMark]);

  // AI turn (Solo mode)
  useEffect(() => {
    if (isDueling || turn !== 'O' || isGameOver) return;

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      const bestMove = getBestMove(board, difficulty, 'O', 'X');
      if (bestMove !== -1) {
        setBoard((prev) => {
          const next = [...prev];
          next[bestMove] = 'O';
          return next;
        });
        sfx.playPop('O');
        setTurn('X');
      }
      setIsAiThinking(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [turn, board, isGameOver, isDueling, difficulty]);

  const handlePlayAgain = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setIsAiThinking(false);
    setShowPlayAgainDialog(false);
  };

  return (
    <>
      {/* ═══ Atmospheric Tavern Tabletop Background ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <img
          src="/ttt-tavern-bg.jpg"
          alt=""
          className="w-full h-full object-cover object-center filter brightness-[0.88] saturate-[1.15]"
        />
        {/* Warm tavern lighting and vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0604]/60 via-transparent to-[#050302]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.7)_100%)]" />
      </div>

      {/* Floating Game Scene (Fixed 100dvh viewport, zero scroll, touch locked) */}
      <div className="relative z-10 w-full max-w-[460px] h-[100dvh] max-h-[100dvh] mx-auto pt-3 pb-3 sm:pt-5 sm:pb-5 px-3 flex flex-col items-center justify-between overflow-hidden select-none touch-none overscroll-none">
        {/* Top Header Group: Back Button, Tavern Title & Stat Pods */}
        <div className="w-full flex flex-col items-center flex-shrink-0 gap-2 sm:gap-2.5">
          {/* Top Floating Row: Back Button */}
          <div className="w-full flex items-center justify-between px-1">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white/95 hover:text-white font-bold text-xs sm:text-sm transition-all duration-150 active:scale-95 group shadow-md cursor-pointer backdrop-blur-md"
              aria-label="Back to Games"
            >
              <svg
                className="w-4 h-4 text-[#F0B247] transition-transform group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="tracking-wide">Back</span>
            </button>

            {/* Live Duel Series Pills or Solo Difficulty Badge */}
            {duel && series ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-[#F0B247]/40 text-[10px] font-bold text-[#F0B247] backdrop-blur-md shadow-sm">
                <span>SERIES: {series.you}W - {series.opponent}L{series.draws > 0 ? ` - ${series.draws}T` : ''}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={cycleDifficulty}
                className="px-3 py-1 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-[11px] font-black uppercase tracking-wider text-[#F0B247] transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                title="Tap to change difficulty"
              >
                {difficulty === 'easy' && '🌱 EASY AI'}
                {difficulty === 'medium' && '⚖️ MEDIUM AI'}
                {difficulty === 'hard' && '⚔️ HARD AI'}
              </button>
            )}
          </div>

          {/* Center: Tavern Tabletop Carved Badge */}
          <div className="w-full flex items-center justify-center">
            <div className="flex items-center gap-2.5 px-5 py-1.5 rounded-2xl bg-gradient-to-r from-[#1a1008]/90 via-[#2e1c0e]/95 to-[#1a1008]/90 border border-[#c8924a]/45 shadow-[0_8px_25px_rgba(0,0,0,0.65)] backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_10px_#38bdf8] animate-pulse" />
              <span className="font-display font-black text-sm sm:text-base tracking-[0.25em] text-[#FFE8B3] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                TIC · TAC · TOE
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] shadow-[0_0_10px_#34d399] animate-pulse" />
            </div>
          </div>

          {/* Turn Pod, Controls & Player Indicators */}
          {duel ? (
            /* ═══ LIVE DUEL STATS ROW ═══ */
            <div className="w-full max-w-[430px] grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 select-none">
              {/* You */}
              <div
                className={`relative px-2.5 py-1.5 rounded-2xl border transition-all flex items-center gap-2 backdrop-blur-md ${
                  duel.isMyTurn
                    ? 'bg-[#152a3d]/90 border-[#38bdf8] shadow-[0_0_18px_rgba(56,189,248,0.35)]'
                    : 'bg-black/45 border-white/10 opacity-80'
                }`}
              >
                <Avatar
                  person={{
                    id: user?.id || 'me',
                    name: user?.name || 'You',
                    avatar_url: user?.avatar_url,
                  }}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate">You</span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${
                        myMark === 'X'
                          ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/40'
                          : 'bg-[#34d399]/20 text-[#34d399] border-[#34d399]/40'
                      }`}
                    >
                      {myMark}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-[#F0B247] block truncate">
                    {duel.isMyTurn ? 'YOUR TURN' : 'WAITING'}
                  </span>
                </div>
              </div>

              {/* Center: Live Turn Countdown Timer */}
              <div className="relative px-3.5 py-1.5 rounded-2xl bg-black/60 border border-[#F0B247]/50 backdrop-blur-md text-center flex flex-col items-center justify-center min-w-[70px]">
                <span className="text-[8px] font-black uppercase tracking-widest text-[#F0B247]/80">TIMER</span>
                <span
                  className={`text-sm sm:text-base font-black font-mono leading-tight ${
                    secondsLeft !== null && secondsLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-white'
                  }`}
                >
                  {secondsLeft !== null ? `${secondsLeft}s` : '45s'}
                </span>
              </div>

              {/* Opponent */}
              <div
                className={`relative px-2.5 py-1.5 rounded-2xl border transition-all flex items-center gap-2 backdrop-blur-md ${
                  !duel.isMyTurn
                    ? 'bg-[#15342a]/90 border-[#34d399] shadow-[0_0_18px_rgba(52,211,153,0.35)]'
                    : 'bg-black/45 border-white/10 opacity-80'
                }`}
              >
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${
                        myMark === 'X'
                          ? 'bg-[#34d399]/20 text-[#34d399] border-[#34d399]/40'
                          : 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/40'
                      }`}
                    >
                      {myMark === 'X' ? 'O' : 'X'}
                    </span>
                    <span className="text-xs font-black text-white truncate max-w-[85px]">{duel.opponentName}</span>
                  </div>
                  <span className="text-[9px] font-bold text-[#94A3B8] block truncate">
                    {!duel.isMyTurn ? 'THINKING...' : 'WAITING'}
                  </span>
                </div>
                <Avatar
                  person={{
                    id: duel.session.opponent?.id || 'opponent',
                    name: duel.opponentName,
                    avatar_url: duel.session.opponent?.avatar_url || undefined,
                  }}
                  size="sm"
                />
              </div>
            </div>
          ) : (
            /* ═══ SOLO VS CPU STATS ROW ═══ */
            <div className="w-full max-w-[430px] flex items-center justify-between px-1 select-none">
              {/* Turn Pod */}
              <div className="relative h-10 px-4 flex items-center justify-center gap-2 select-none rounded-2xl bg-black/45 border border-white/15 backdrop-blur-md shadow-inner">
                {turn === 'X' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399] animate-pulse" />
                )}
                <span className="font-black text-xs uppercase tracking-wider text-white drop-shadow-sm">
                  {turn === 'X' ? 'YOUR TURN (X)' : isAiThinking ? 'AI THINKING...' : 'AI TURN (O)'}
                </span>
              </div>

              {/* Score Pod */}
              <div className="h-10 px-4 rounded-2xl bg-black/45 border border-white/15 backdrop-blur-md flex items-center gap-2 font-mono text-xs">
                <span className="text-[#38bdf8] font-black">{scores.x}W</span>
                <span className="text-white/30">-</span>
                <span className="text-[#34d399] font-black">{scores.o}L</span>
                {scores.ties > 0 && (
                  <>
                    <span className="text-white/30">-</span>
                    <span className="text-[#F0B247] font-black">{scores.ties}T</span>
                  </>
                )}
              </div>

              {/* Action Buttons: Restart & Settings */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="w-10 h-10 rounded-2xl bg-black/45 hover:bg-black/65 border border-white/15 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-[#F0B247] cursor-pointer shadow-md backdrop-blur-md"
                  title="Restart board"
                  aria-label="Restart board"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.6}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="w-10 h-10 rounded-2xl bg-black/45 hover:bg-black/65 border border-white/15 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-[#F0B247] cursor-pointer shadow-md backdrop-blur-md"
                  title="Settings"
                  aria-label="Settings"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.4}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══ 3x3 CARVED OAK TABLETOP BOARD ═══ */}
        <div className="flex-1 w-full flex items-center justify-center min-h-0 my-auto py-1 sm:py-2">
          <div
            className="relative w-full aspect-square max-w-[min(370px,calc(100dvh-270px))] sm:max-w-[min(390px,calc(100dvh-280px))] mx-auto select-none touch-none overscroll-none flex-shrink-0 filter drop-shadow-[0_24px_45px_rgba(0,0,0,0.85)]"
            aria-label="Tic Tac Toe Carved Wood Board"
          >
            {/* The Authentic 3x3 Carved Wood Board Sprite */}
            <img
              src="/tictactoe-board-wood.png"
              alt="Carved Wood Board"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0 select-none drop-shadow-2xl"
              draggable={false}
            />

            {/* The 9 Interactive Cell Pockets */}
            {board.map((cell, idx) => {
              const pos = CELL_POSITIONS[idx] || CELL_POSITIONS[0];
              const isWinningCell = combo?.includes(idx);
              const isEmpty = cell === null;
              const isHovered = hoverIndex === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isGameOver || isAiThinking || !isEmpty || Boolean(duel && !duel.isMyTurn)}
                  onClick={() => handleCellClick(idx)}
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  aria-label={`${pos.label}, ${cell || 'Empty'}`}
                  style={{
                    position: 'absolute',
                    top: pos.top,
                    left: pos.left,
                    width: pos.width,
                    height: pos.height,
                  }}
                  className={`z-10 rounded-2xl flex items-center justify-center transition-all duration-150 focus:outline-none ${
                    isEmpty && !isGameOver && (!duel || duel.isMyTurn)
                      ? 'cursor-pointer hover:scale-[1.03] active:scale-95'
                      : 'cursor-default'
                  }`}
                >
                  {/* Active Cell Recessed Floor Shadow */}
                  <div
                    className={`absolute inset-0 rounded-2xl transition-all duration-200 pointer-events-none ${
                      isWinningCell
                        ? 'bg-[#F0B247]/20 shadow-[0_0_20px_rgba(240,178,71,0.5)] border border-[#F0B247]/60'
                        : isHovered && isEmpty && !isGameOver && (!duel || duel.isMyTurn)
                        ? turn === 'X'
                          ? 'bg-[#38bdf8]/15 shadow-[0_0_15px_rgba(56,189,248,0.35)]'
                          : 'bg-[#34d399]/15 shadow-[0_0_15px_rgba(52,211,153,0.35)]'
                        : ''
                    }`}
                  />

                  {/* Placed Runic Piece: X (Cyan Wood Rune Cross) */}
                  {cell === 'X' && <RunicPieceX isWinning={isWinningCell} />}

                  {/* Placed Runic Piece: O (Emerald Wood Rune Ring) */}
                  {cell === 'O' && <RunicPieceO isWinning={isWinningCell} />}

                  {/* Ghost Hover Mark in Empty Cell */}
                  {isEmpty && isHovered && !isGameOver && (!duel || duel.isMyTurn) && (
                    <div className="opacity-40 scale-90 transition-transform pointer-events-none">
                      {turn === 'X' ? <RunicPieceX /> : <RunicPieceO />}
                    </div>
                  )}
                </button>
              );
            })}

            {/* Glowing Victory Laser Beam across the 3 winning cells */}
            {combo && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                <defs>
                  <filter id="winBeamGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Outer Radiant Gold Beam */}
                <line
                  x1={`${CELL_POSITIONS[combo[0]].centerPct.x}%`}
                  y1={`${CELL_POSITIONS[combo[0]].centerPct.y}%`}
                  x2={`${CELL_POSITIONS[combo[2]].centerPct.x}%`}
                  y2={`${CELL_POSITIONS[combo[2]].centerPct.y}%`}
                  stroke="#F0B247"
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#winBeamGlow)"
                  className="animate-pulse"
                />
                {/* Core White Energy Stroke */}
                <line
                  x1={`${CELL_POSITIONS[combo[0]].centerPct.x}%`}
                  y1={`${CELL_POSITIONS[combo[0]].centerPct.y}%`}
                  x2={`${CELL_POSITIONS[combo[2]].centerPct.x}%`}
                  y2={`${CELL_POSITIONS[combo[2]].centerPct.y}%`}
                  stroke="#FFFDF0"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Bottom Status Pill / Guide */}
        <div className="w-full flex items-center justify-center flex-shrink-0 pt-1 pb-1">
          <div className="px-4 py-1.5 rounded-full bg-black/45 border border-white/10 backdrop-blur-md shadow-md flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#F0B247] uppercase tracking-wider">
              {duel
                ? isGameOver
                  ? 'DUEL FINISHED'
                  : duel.isMyTurn
                  ? 'YOUR TURN · PLACE A RUNE'
                  : `WAITING FOR ${duel.opponentName.toUpperCase()}`
                : isGameOver
                ? winner
                  ? `PLAYER ${winner} WINS!`
                  : 'STALEMATE!'
                : turn === 'X'
                ? 'TAP ANY CELL TO PLACE X'
                : 'AI IS FORMULATING TACTICS...'}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Solo Victory / Defeat Modal ═══ */}
      {!duel && (
        <GameModal
          open={showPlayAgainDialog}
          onClose={() => setShowPlayAgainDialog(false)}
          title={
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">{winner === 'X' ? '🏆' : winner === 'O' ? '💀' : '⚔️'}</span>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-wide drop-shadow-md uppercase">
                {winner === 'X' ? 'Victory!' : winner === 'O' ? 'Defeat!' : 'Stalemate!'}
              </h2>
            </div>
          }
        >
          <div className="flex flex-col items-center text-center w-full gap-3">
            <p className="text-xs sm:text-sm text-[#F0B247] font-medium">
              {winner === 'X'
                ? 'Three in a row! You mastered the board.'
                : winner === 'O'
                ? 'The AI claimed three in a row this round.'
                : 'Every slot filled with no victor. A hard-fought tie.'}
            </p>

            <div className="flex items-center justify-center gap-4 py-1.5 px-4 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
              <span className="text-[#38bdf8] font-bold">X: {scores.x}</span>
              <span className="text-white/40">•</span>
              <span className="text-[#34d399] font-bold">O: {scores.o}</span>
              <span className="text-white/40">•</span>
              <span className="text-[#F0B247] font-bold">Ties: {scores.ties}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full pt-2">
              <GameWoodButton
                colSpan={2}
                onClick={handlePlayAgain}
                className="shadow-[0_0_15px_rgba(56,189,248,0.4)]"
              >
                PLAY AGAIN
              </GameWoodButton>
              <GameWoodButton
                colSpan={1}
                onClick={() => {
                  cycleDifficulty();
                  handlePlayAgain();
                }}
              >
                DIFFICULTY
              </GameWoodButton>
              <GameWoodButton
                colSpan={1}
                onClick={() => {
                  setShowPlayAgainDialog(false);
                  onBack();
                }}
              >
                BACK
              </GameWoodButton>
            </div>
          </div>
        </GameModal>
      )}

      {/* ═══ Settings Modal ═══ */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        difficulty={difficulty}
        onCycleDifficulty={cycleDifficulty}
        onExitToMainMenu={() => {
          setShowSettings(false);
          onBack();
        }}
        isDueling={isDueling}
      />
    </>
  );
}
