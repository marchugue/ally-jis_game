import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { GameUser } from '../lib/auth';
import { SettingsModal, PlayAgainDialog } from './GameModal';
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

/**
 * ============================================================================
 * MANUAL CELL POSITION CONFIGURATION (0 to 8)
 *
 * Adjust the position, size, and fine-tune pixel offsets of the X and O pieces
 * for each of the 9 cells on the wooden grass platform manually.
 *
 * 3x3 Grid Layout:
 * [0] [1] [2]   (Row 0: Top-Left,    Top-Center,    Top-Right)
 * [3] [4] [5]   (Row 1: Middle-Left, Middle-Center, Middle-Right)
 * [6] [7] [8]   (Row 2: Bottom-Left, Bottom-Center, Bottom-Right)
 *
 * Properties for each cell:
 * - top:    Vertical position on platform (percentage string, e.g. '12.6%')
 * - left:   Horizontal position on platform (percentage string, e.g. '12.2%')
 * - width:  Cell bounding box width (percentage string, e.g. '23.2%')
 * - height: Cell bounding box height (percentage string, e.g. '22.6%')
 * - offsetX: Manual X nudge in pixels (positive = right, negative = left)
 * - offsetY: Manual Y nudge in pixels (positive = down, negative = up)
 * - scale:   Piece scale multiplier (1.0 = normal, 1.1 = +10%, etc.)
 * ============================================================================
 */
export interface CellPositionConfig {
  index: number;
  label: string;
  top: string;
  left: string;
  width: string;
  height: string;
  offsetX: number;
  offsetY: number;
  scale: number;
}

export const CELL_POSITIONS: CellPositionConfig[] = [
  // --- ROW 0 ---
  {
    index: 0,
    label: 'Cell 0: Top-Left (Row 0, Col 0)',
    top: '12.6%',
    left: '12.2%',
    width: '23.2%',
    height: '22.6%',
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
  },
  {
    index: 1,
    label: 'Cell 1: Top-Center (Row 0, Col 1)',
    top: '12.6%',
    left: '38.2%',
    width: '23.6%',
    height: '22.6%',
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
  },
  {
    index: 2,
    label: 'Cell 2: Top-Right (Row 0, Col 2)',
    top: '12.6%',
    left: '64.4%',
    width: '23.2%',
    height: '22.6%',
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
  },

  // --- ROW 1 ---
  {
    index: 3,
    label: 'Cell 3: Middle-Left (Row 1, Col 0)',
    top: '38.2%',
    left: '12.2%',
    width: '23.2%',
    height: '22.4%',
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
  },
  {
    index: 4,
    label: 'Cell 4: Center (Row 1, Col 1)',
    top: '38.2%',
    left: '38.2%',
    width: '23.6%',
    height: '22.4%',
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
  },
  {
    index: 5,
    label: 'Cell 5: Middle-Right (Row 1, Col 2)',
    top: '38.2%',
    left: '64.4%',
    width: '23.2%',
    height: '22.4%',
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
  },

  // --- ROW 2 ---
  {
    index: 6,
    label: 'Cell 6: Bottom-Left (Row 2, Col 0)',
    top: '63.8%',
    left: '12.2%',
    width: '23.2%',
    height: '22.2%',
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
  },
  {
    index: 7,
    label: 'Cell 7: Bottom-Center (Row 2, Col 1)',
    top: '63.8%',
    left: '38.2%',
    width: '23.6%',
    height: '22.2%',
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
  },
  {
    index: 8,
    label: 'Cell 8: Bottom-Right (Row 2, Col 2)',
    top: '63.8%',
    left: '64.4%',
    width: '23.2%',
    height: '22.2%',
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
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

  // Full minimax search
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

// Built-in Web Audio API sound generator
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
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      const freq = player === 'X' ? 440 : 587.33;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, now + 0.07);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
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
        const start = this.ctx!.currentTime + i * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {}
  }

  playDraw() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [440, 415.3, 370];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + i * 0.1;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch {}
  }
}

const sfx = new SoundFx();

export function TicTacToeGame({ onBack, duel, series }: Props) {
  const [localBoard, setBoard] = useState<BoardState>(() => Array(9).fill(null));
  const [localTurn, setTurn] = useState<Player>('X');

  // In a duel the server's board is the single source of truth.
  const duelState = duel?.session.state as
    | { board?: BoardState; myMark?: Player }
    | undefined;
  const myMark: Player = duelState?.myMark ?? 'X';
  const board: BoardState = duel ? duelState?.board ?? (Array(9).fill(null) as BoardState) : localBoard;
  const turn: Player = duel ? (duel.isMyTurn ? myMark : myMark === 'X' ? 'O' : 'X') : localTurn;

  // Re-render twice a second so the per-move countdown stays live.
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

  // Settings & Duel state
  const [soundOn, setSoundOn] = useState(sfx.enabled);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const isDueling = Boolean(duel);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlayAgainDialog, setShowPlayAgainDialog] = useState(false);

  const { winner, combo, isDraw } = useMemo(() => checkWin(board), [board]);
  const isGameOver = Boolean(winner || isDraw || (duel && duel.session.status !== 'active'));

  // Return to game catalog on Escape or close modals
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
      // Result dialog + tally are handled by <DuelHost/>; just play the right jingle.
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
  }, [winner, isDraw]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Opponent just moved → play their mark's sound.
  const filledCount = board.filter(Boolean).length;
  const prevFilled = useRef(filledCount);
  useEffect(() => {
    if (duel && filledCount > prevFilled.current && duel.isMyTurn) sfx.playPop(myMark === 'X' ? 'O' : 'X');
    prevFilled.current = filledCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledCount]);

  // AI turn (only runs when NOT in dueling state)
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
    }, 400);

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
      {/* ═══ Immersive Sunny Cartoon Meadow Background Layer ═══ */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/merge-meadow-bg.jpg"
          alt=""
          className="w-full h-full object-cover object-center filter saturate-[1.12] brightness-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#184878]/30 via-transparent to-[#04120a]/40" />
      </div>

      {/* Floating Game Scene (Fixed 100dvh viewport, zero scroll, touch locked) */}
      <div className="relative z-10 w-full max-w-[440px] h-[100dvh] max-h-[100dvh] mx-auto pt-5 pb-5 sm:pt-7 sm:pb-7 px-3 flex flex-col items-center justify-between overflow-hidden select-none touch-none overscroll-none">
        
        {/* Top Header Group: Back Button, Game Logo & Turn/Controls Bar */}
        <div className="w-full flex flex-col items-center flex-shrink-0 gap-2 sm:gap-2.5">
          {/* Top Floating Row: Back Button (Only arrow and text, no container) */}
          <div className="w-full flex items-center justify-between px-1">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-white/95 hover:text-white font-bold text-sm transition-all duration-150 active:scale-95 group drop-shadow-[0_2px_5px_rgba(0,0,0,0.65)] cursor-pointer"
              aria-label="Back to Games"
            >
              <svg
                className="w-5 h-5 text-white transition-transform group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="tracking-wide">Back</span>
            </button>
          </div>

          {/* Center: Centered Tic Tac Toe Game Logo */}
          <div className="w-full flex items-center justify-center">
            <img
              src="/tictactoelogo.png"
              alt="Tic Tac Toe"
              className="h-10 sm:h-12 w-auto max-w-[190px] sm:max-w-[220px] object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] select-none hover:scale-105 transition-transform"
              draggable={false}
            />
          </div>

          {/* Turn Pod, Refresh Button & Settings Button */}
          <div className="w-full max-w-[420px] sm:max-w-[440px] flex items-center justify-between px-1 select-none">
            {/* Turn Indicator inside generated stone pod */}
            <div className="relative h-10 px-3.5 sm:px-4 flex items-center justify-center gap-2 select-none">
              <img
                src="/ui-pod.png"
                alt=""
                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                draggable={false}
              />
              <img
                src={turn === 'X' ? '/x.png' : '/o.png'}
                alt={turn}
                className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 object-contain filter drop-shadow-sm"
                draggable={false}
              />
              <span className="relative z-10 font-black text-xs uppercase tracking-wider text-[#4a3219] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                {duel
                  ? isGameOver
                    ? 'GAME OVER'
                    : duel.isMyTurn
                    ? `YOUR TURN${secondsLeft !== null ? ` · ${secondsLeft}s` : ''}`
                    : `${duel.opponentName.length > 12 ? `${duel.opponentName.slice(0, 11)}…` : duel.opponentName}${secondsLeft !== null ? ` · ${secondsLeft}s` : ''}`
                  : 'TURN'}
              </span>
            </div>

            {/* Right Action Buttons: Refresh & Settings */}
            <div className="flex items-center gap-2">
              {/* Refresh Button (hidden in a live duel — rematches go through the result dialog) */}
              {!duel && (
              <button
                type="button"
                onClick={handlePlayAgain}
                className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-100 cursor-pointer"
                title="Restart game"
                aria-label="Restart game"
              >
                <img
                  src="/ui-button.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
                <svg
                  className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 text-[#4a3219] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.8}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              )}

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-100 cursor-pointer"
                title="Settings"
                aria-label="Settings"
              >
                <img
                  src="/ui-button.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
                <svg
                  className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 text-[#4a3219] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Floating 3x3 Nature Platform Board (Centered in available vertical space) */}
        <div className="flex-1 w-full flex items-center justify-center min-h-0 my-auto py-1 sm:py-2">
          <div
            className="relative w-full aspect-square max-w-[min(360px,calc(100dvh-280px))] sm:max-w-[min(380px,calc(100dvh-290px))] mx-auto select-none touch-none overscroll-none flex-shrink-0"
            aria-label="Tic Tac Toe 3x3 Board Platform"
          >
          {/* Grass Frame & 3x3 Stone Tile Platform Background Image */}
          <img
            src="/tictactoe-platform.png"
            alt="Tic Tac Toe Platform"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0 select-none"
            draggable={false}
          />

          {/* The 9 Interactive Cell Buttons (Positioned by CELL_POSITIONS array) */}
          {board.map((cell, idx) => {
            const pos = CELL_POSITIONS[idx] || CELL_POSITIONS[0];
            const isWinningCell = combo?.includes(idx);
            const isEmpty = cell === null;

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
                  transform: `translate(${pos.offsetX}px, ${pos.offsetY}px) scale(${pos.scale})`,
                }}
                className="z-10 rounded-[18px] flex items-center justify-center cursor-pointer transition-transform duration-100 hover:scale-[1.03] active:scale-95 group focus:outline-none"
              >
                {/* Placed Mark: x.png for X */}
                {cell === 'X' && (
                  <img
                    src="/x.png"
                    alt="X"
                    className={`w-[84%] h-[84%] object-contain select-none transition-all duration-200 ${
                      isWinningCell
                        ? 'animate-winning-piece-x'
                        : 'animate-pop filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]'
                    }`}
                    draggable={false}
                  />
                )}

                {/* Placed Mark: o.png for O */}
                {cell === 'O' && (
                  <img
                    src="/o.png"
                    alt="O"
                    className={`w-[84%] h-[84%] object-contain select-none transition-all duration-200 ${
                      isWinningCell
                        ? 'animate-winning-piece-o'
                        : 'animate-pop filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]'
                    }`}
                    draggable={false}
                  />
                )}

                {/* Ghost Hover Preview for Current Player */}
                {isEmpty && !isGameOver && !isAiThinking && hoverIndex === idx && (!duel || duel.isMyTurn) && (
                  <img
                    src={turn === 'X' ? '/x.png' : '/o.png'}
                    alt="preview"
                    className="w-[76%] h-[76%] object-contain opacity-40 group-hover:scale-105 transition-all pointer-events-none select-none filter brightness-110"
                    draggable={false}
                  />
                )}
              </button>
            );
          })}
          </div>
        </div>

        {/* Bottom Scoreboard Pods (Generated Containers Matching the Platform) */}
        {/* No X or O icons on label, strictly YOU, TIES, and P2 */}
        <div className="w-full max-w-[420px] sm:max-w-[440px] grid grid-cols-3 gap-2.5 sm:gap-3.5 flex-shrink-0 select-none">
          {/* Left: YOU */}
          <div className="relative aspect-[1.56/1] flex flex-col items-center justify-center p-2">
            <img
              src="/ui-pod.png"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
              draggable={false}
            />
            <span className="relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#6a4c28] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              YOU
            </span>
            <span className="relative z-10 text-lg sm:text-xl font-black font-display text-[#382613] leading-none mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {duel ? series?.you ?? 0 : scores.x}
            </span>
          </div>

          {/* Center: TIES */}
          <div className="relative aspect-[1.56/1] flex flex-col items-center justify-center p-2">
            <img
              src="/ui-pod.png"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
              draggable={false}
            />
            <span className="relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#6a4c28] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              TIES
            </span>
            <span className="relative z-10 text-lg sm:text-xl font-black font-display text-[#382613] leading-none mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {duel ? series?.draws ?? 0 : scores.ties}
            </span>
          </div>

          {/* Right: P2 */}
          <div className="relative aspect-[1.56/1] flex flex-col items-center justify-center p-2">
            <img
              src="/ui-pod.png"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
              draggable={false}
            />
            <span className="relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#6a4c28] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {duel ? (duel.opponentName.length > 9 ? `${duel.opponentName.slice(0, 8)}…` : duel.opponentName).toUpperCase() : 'P2'}
            </span>
            <span className="relative z-10 text-lg sm:text-xl font-black font-display text-[#382613] leading-none mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {duel ? series?.opponent ?? 0 : scores.o}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ SETTINGS MODAL ═══ */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        isDueling={isDueling}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        difficulty={difficulty}
        onCycleDifficulty={cycleDifficulty}
        onSwitchToCpu={
          duel
            ? undefined
            : () => {
                setShowSettings(false);
                handlePlayAgain();
              }
        }
        onExitToMainMenu={onBack}
      />

      {/* ═══ DIALOG FOR PLAY AGAIN (UPON MATCH COMPLETION) ═══ */}
      <PlayAgainDialog
        open={showPlayAgainDialog && isGameOver && !duel}
        winner={winner}
        isDraw={isDraw}
        isDueling={isDueling}
        onPlayAgain={handlePlayAgain}
        onExitToMainMenu={onBack}
      />
    </>
  );
}
