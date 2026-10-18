import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { GameUser } from '../lib/auth';

export type Player = 'X' | 'O';
export type BoardState = (Player | null)[];
export type GameMode = 'ai' | 'pvp';
export type Difficulty = 'easy' | 'hard';

interface Props {
  onBack: () => void;
  user?: GameUser | null;
}

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

// Minimax AI with heuristic tree search
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

  // Easy mode: 65% random move, 35% smart
  if (difficulty === 'easy' && Math.random() < 0.65) {
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

  // Full minimax search
  let bestScore = -Infinity;
  let move = availableMoves[0];

  for (const idx of availableMoves) {
    board[idx] = aiPlayer;
    const score = minimax(board, 0, false, aiPlayer, humanPlayer);
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
  humanPlayer: Player
): number {
  const result = checkWin(board);
  if (result.winner === aiPlayer) return 10 - depth;
  if (result.winner === humanPlayer) return depth - 10;
  if (result.isDraw) return 0;
  if (depth >= 5) return 0;

  const available: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) available.push(i);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of available) {
      board[move] = aiPlayer;
      const evaluation = minimax(board, depth + 1, false, aiPlayer, humanPlayer);
      board[move] = null;
      maxEval = Math.max(maxEval, evaluation);
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of available) {
      board[move] = humanPlayer;
      const evaluation = minimax(board, depth + 1, true, aiPlayer, humanPlayer);
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
      this.ctx.resume().catch(() => { });
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
    } catch { }
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
    } catch { }
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
    } catch { }
  }
}

const sfx = new SoundFx();

// Chunky X Glyph matching the reference geometry with rounded ends
function ChunkyX({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <line
        x1="16"
        y1="16"
        x2="48"
        y2="48"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <line
        x1="48"
        y1="16"
        x2="16"
        y2="48"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Chunky O Glyph matching the reference geometry with thick ring
function ChunkyO({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <circle
        cx="32"
        cy="32"
        r="17"
        stroke="currentColor"
        strokeWidth="11"
      />
    </svg>
  );
}

export function TicTacToeGame({ onBack }: Props) {
  const [board, setBoard] = useState<BoardState>(() => Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('X');
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [scores, setScores] = useState({ x: 0, o: 0, ties: 0 });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(sfx.enabled);
  const containerRef = useRef<HTMLDivElement>(null);

  const { winner, combo, isDraw } = useMemo(() => checkWin(board), [board]);
  const isGameOver = Boolean(winner || isDraw);

  // Return to game catalog on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const toggleSound = () => {
    const next = !soundOn;
    sfx.enabled = next;
    setSoundOn(next);
    localStorage.setItem('ally_ttt_sound', String(next));
  };

  useEffect(() => {
    if (winner) {
      sfx.playWin();
      setScores((prev) => ({
        ...prev,
        [winner === 'X' ? 'x' : 'o']: prev[winner === 'X' ? 'x' : 'o'] + 1,
      }));
    } else if (isDraw) {
      sfx.playDraw();
      setScores((prev) => ({ ...prev, ties: prev.ties + 1 }));
    }
  }, [winner, isDraw]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] !== null || isGameOver || isAiThinking) return;

      const nextBoard = [...board];
      nextBoard[index] = turn;
      setBoard(nextBoard);
      sfx.playPop(turn);

      const nextPlayer: Player = turn === 'X' ? 'O' : 'X';
      setTurn(nextPlayer);
    },
    [board, isGameOver, isAiThinking, turn]
  );

  // AI turn
  useEffect(() => {
    if (mode !== 'ai' || turn !== 'O' || isGameOver) return;

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
  }, [mode, turn, board, difficulty, isGameOver]);

  const handlePlayAgain = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setIsAiThinking(false);
  };

  const handleResetScores = () => {
    setScores({ x: 0, o: 0, ties: 0 });
    handlePlayAgain();
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[440px] mx-auto flex flex-col items-center animate-pop select-none"
      aria-label="Tic-Tac-Toe Gameplay"
    >
      {/* Top Controls Bar: Back button, Mode toggles, Sound */}
      <div className="w-full flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1A1E] border border-[#26262E] text-xs font-semibold text-[#94A3B8] hover:text-[#EDEDED] hover:border-[#38C185]/50 transition-all duration-150 active:scale-95 group shadow-sm"
          aria-label="Back to Games"
        >
          <svg
            className="w-4 h-4 text-[#94A3B8] transition-transform group-hover:-translate-x-0.5 group-hover:text-[#38C185]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Games</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-[#1A1A1E] rounded-full border border-[#26262E]">
            <button
              type="button"
              onClick={() => {
                setMode('ai');
                handlePlayAgain();
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-150 ${mode === 'ai'
                ? 'bg-[#38C185] text-[#081B12] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#EDEDED]'
                }`}
            >
              vs CPU
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('pvp');
                handlePlayAgain();
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-150 ${mode === 'pvp'
                ? 'bg-[#38C185] text-[#081B12] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#EDEDED]'
                }`}
            >
              2P
            </button>
          </div>

          {mode === 'ai' && (
            <button
              type="button"
              onClick={() => setDifficulty((d) => (d === 'hard' ? 'easy' : 'hard'))}
              className="px-2.5 py-1 rounded-full bg-[#1A1A1E] border border-[#26262E] text-[10px] font-bold text-[#94A3B8] hover:text-[#EDEDED] transition-colors"
              title={`Bot Difficulty: ${difficulty === 'hard' ? 'Unbeatable' : 'Casual'}`}
            >
              {difficulty === 'hard' ? 'Hard' : 'Easy'}
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1A1A1E] border border-[#26262E] text-[#94A3B8] hover:text-[#EDEDED] transition-colors"
            title={soundOn ? 'Mute sound' : 'Unmute sound'}
            aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          >
            {soundOn ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: HEADER (LOGO + TURN PILL + RESTART BUTTON) */}
      <div className="w-full flex items-center justify-between mb-5 px-1">
        {/* Left: XO Logo */}
        <div className="flex items-center gap-1.5" aria-label="Tic Tac Toe Logo">
          <div className="text-[#38C185]">
            <ChunkyX className="w-8 h-8" />
          </div>
          <div className="text-[#F0B247]">
            <ChunkyO className="w-8 h-8" />
          </div>
        </div>

        {/* Center: Turn Pill with 3D bottom extruded shadow */}
        <div
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F1F24] shadow-[0_4px_0_#101013] text-xs font-black tracking-wider uppercase select-none transition-transform"
          aria-live="polite"
        >
          {turn === 'X' ? (
            <div className="text-[#38C185]">
              <ChunkyX className="w-4 h-4" />
            </div>
          ) : (
            <div className="text-[#F0B247]">
              <ChunkyO className="w-4 h-4" />
            </div>
          )}
          <span className="text-[#EDEDED] font-display font-extrabold">TURN</span>
        </div>

        {/* Right: Restart Button with 3D bottom extruded shadow */}
        <button
          type="button"
          onClick={handlePlayAgain}
          className="w-11 h-11 rounded-xl bg-[#2A2A32] shadow-[0_4px_0_#18181D] hover:bg-[#32323C] active:translate-y-1 active:shadow-[0_0px_0_#18181D] flex items-center justify-center text-[#EDEDED] transition-all duration-100"
          title="Restart game"
          aria-label="Restart game"
        >
          <svg
            className="w-5 h-5 text-[#94A3B8] hover:text-[#EDEDED]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.6}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* SECTION 2: THE 3x3 GRID (WITH 3D EXTRUDED BOTTOM SHADOWS) */}
      <div className="w-full grid grid-cols-3 gap-3.5 sm:gap-4 mb-5">
        {board.map((cell, idx) => {
          const isWinningCell = combo?.includes(idx);
          const isEmpty = cell === null;

          return (
            <button
              key={idx}
              type="button"
              disabled={isGameOver || isAiThinking || !isEmpty}
              onClick={() => handleCellClick(idx)}
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
              aria-label={`Cell ${idx + 1}, ${cell || 'Empty'}`}
              className={`aspect-square rounded-2xl flex items-center justify-center select-none transition-all duration-100 ${isWinningCell
                ? cell === 'X'
                  ? 'bg-[#38C185] text-[#081B12] shadow-[0_8px_0_#237D55] translate-y-0 scale-[1.02]'
                  : 'bg-[#F0B247] text-[#1A1305] shadow-[0_8px_0_#B88022] translate-y-0 scale-[1.02]'
                : 'bg-[#1F1F24] shadow-[0_8px_0_#101013] hover:bg-[#25252C] active:translate-y-1 active:shadow-[0_4px_0_#101013]'
                }`}
            >
              {/* Placed Mark */}
              {cell === 'X' && (
                <div
                  className={`animate-pop ${isWinningCell ? 'text-[#081B12]' : 'text-[#38C185]'
                    }`}
                >
                  <ChunkyX className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
              )}

              {cell === 'O' && (
                <div
                  className={`animate-pop ${isWinningCell ? 'text-[#1A1305]' : 'text-[#F0B247]'
                    }`}
                >
                  <ChunkyO className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
              )}

              {/* Ghost Hover Preview for Current Player */}
              {isEmpty && !isGameOver && !isAiThinking && hoverIndex === idx && (
                <div className="opacity-20 transition-opacity">
                  {turn === 'X' ? (
                    <div className="text-[#38C185]">
                      <ChunkyX className="w-12 h-12 sm:w-16 sm:h-16" />
                    </div>
                  ) : (
                    <div className="text-[#F0B247]">
                      <ChunkyO className="w-12 h-12 sm:w-16 sm:h-16" />
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION 3: BOTTOM SCOREBOARD (3 PODS WITH MATCHING 3D EXTRUDED SHADOWS) */}
      <div className="w-full grid grid-cols-3 gap-3.5 sm:gap-4">
        {/* Left: X (YOU) */}
        <div className="rounded-2xl bg-[#38C185] shadow-[0_6px_0_#237D55] p-3 sm:p-3.5 flex flex-col items-center justify-center text-[#081B12] select-none">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            {`X (YOU)`}
          </span>
          <span className="text-2xl sm:text-3xl font-display font-black mt-0.5 leading-none">
            {scores.x}
          </span>
        </div>

        {/* Center: TIES */}
        <div className="rounded-2xl bg-[#2A2A32] shadow-[0_6px_0_#18181D] p-3 sm:p-3.5 flex flex-col items-center justify-center text-[#EDEDED] select-none">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
            TIES
          </span>
          <span className="text-2xl sm:text-3xl font-display font-black mt-0.5 leading-none">
            {scores.ties}
          </span>
        </div>

        {/* Right: O (CPU / OPPONENT) */}
        <div className="rounded-2xl bg-[#F0B247] shadow-[0_6px_0_#B88022] p-3 sm:p-3.5 flex flex-col items-center justify-center text-[#1A1305] select-none">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            {`O (P2)`}
          </span>
          <span className="text-2xl sm:text-3xl font-display font-black mt-0.5 leading-none">
            {scores.o}
          </span>
        </div>
      </div>

      {/* SECTION 4: ROUND RESULT BANNER (UPON COMPLETION) */}
      {isGameOver && (
        <div className="w-full mt-5 p-4 rounded-2xl bg-[#1A1A1E] border border-[#282830] shadow-xl flex flex-col items-center gap-3 animate-pop">
          <div className="text-center">
            {winner ? (
              <p className="font-display font-bold text-lg text-[#EDEDED] flex items-center justify-center gap-2">
                <span className={winner === 'X' ? 'text-[#38C185]' : 'text-[#F0B247]'}>
                  {winner === 'X'
                    ? mode === 'ai'
                      ? '🎉 YOU WON THE ROUND!'
                      : '🎉 PLAYER X WON THE ROUND!'
                    : mode === 'ai'
                      ? '🤖 CPU WON THE ROUND!'
                      : '🎉 PLAYER O WON THE ROUND!'}
                </span>
              </p>
            ) : (
              <p className="font-display font-bold text-lg text-[#94A3B8]">
                🤝 ROUND TIED!
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePlayAgain}
              className="h-[40px] px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#38C185] shadow-[0_4px_0_#237D55] text-[#081B12] hover:bg-[#42d494] active:translate-y-1 active:shadow-none transition-all duration-100"
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={handleResetScores}
              className="h-[40px] px-5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#2A2A32] shadow-[0_4px_0_#18181D] text-[#EDEDED] hover:bg-[#32323C] active:translate-y-1 active:shadow-none transition-all duration-100"
            >
              Reset Scores
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
