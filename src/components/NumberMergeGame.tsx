import { useState, useEffect, useCallback, useRef } from 'react';
import type { DuelApi } from '../hooks/useDuel';
import type { GameUser } from '../lib/auth';
import { GameModal, GameWoodButton } from './GameModal';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface TileItem {
  id: number;
  value: number;
  row: number; // 0..3
  col: number; // 0..3
  isMerged?: boolean;
  isNew?: boolean;
  isFading?: boolean;
  startPosFromEdge?: number; // 1..4 in move direction for bounce qualification
}

interface Props {
  onBack: () => void;
  user?: GameUser | null;
  duel?: DuelApi;
}

// Spawns a new tile (90% chance of 2, 10% chance of 4) in an empty cell
function spawnTile(activeTiles: TileItem[], nextId: () => number): TileItem[] {
  const occupied = new Set(activeTiles.map((t) => `${t.row},${t.col}`));

  const emptyCells: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!occupied.has(`${r},${c}`)) {
        emptyCells.push([r, c]);
      }
    }
  }

  if (emptyCells.length === 0) return activeTiles;

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newTile: TileItem = {
    id: nextId(),
    value: Math.random() < 0.9 ? 2 : 4,
    row,
    col,
    isNew: true,
  };

  return [...activeTiles.map((t) => ({ ...t, isNew: false })), newTile];
}

// Initializes a fresh board with 2 tiles
function createInitialTiles(nextId: () => number): TileItem[] {
  let tiles: TileItem[] = [];
  tiles = spawnTile(tiles, nextId);
  tiles = spawnTile(tiles, nextId);
  return tiles;
}

// Core sliding and collision merge engine with animation tracking
function moveTiles(
  currentTiles: TileItem[],
  dir: Direction
): {
  nextActiveTiles: TileItem[];
  fadingTiles: TileItem[];
  scoreGained: number;
  moved: boolean;
  maxVal: number;
  bouncingTileIds: number[];
} {
  // Only process active non-fading tiles
  const activeTiles = currentTiles.filter((t) => !t.isFading);

  // Build a 4x4 matrix of active tiles
  const grid: (TileItem | null)[][] = [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];

  for (const t of activeTiles) {
    grid[t.row][t.col] = t;
  }

  // Define coordinate lines based on direction (line[0] is the destination edge)
  const lines: [number, number][][] = [];
  if (dir === 'LEFT') {
    for (let r = 0; r < 4; r++) {
      lines.push([[r, 0], [r, 1], [r, 2], [r, 3]]);
    }
  } else if (dir === 'RIGHT') {
    for (let r = 0; r < 4; r++) {
      lines.push([[r, 3], [r, 2], [r, 1], [r, 0]]);
    }
  } else if (dir === 'UP') {
    for (let c = 0; c < 4; c++) {
      lines.push([[0, c], [1, c], [2, c], [3, c]]);
    }
  } else if (dir === 'DOWN') {
    for (let c = 0; c < 4; c++) {
      lines.push([[3, c], [2, c], [1, c], [0, c]]);
    }
  }

  let moved = false;
  let scoreGained = 0;
  const nextActiveTiles: TileItem[] = [];
  const fadingTiles: TileItem[] = [];
  const bouncingTileIds: number[] = [];

  for (const line of lines) {
    const lineTiles: TileItem[] = [];
    for (const [r, c] of line) {
      if (grid[r][c]) lineTiles.push(grid[r][c]!);
    }

    let targetIdx = 0;

    for (let i = 0; i < lineTiles.length; i++) {
      const tile = lineTiles[i];
      const prevPlaced = targetIdx > 0 ? nextActiveTiles[nextActiveTiles.length - 1] : null;

      // Find the starting position of this tile in the directional line
      // line[0] = 1st tile (at edge), line[1] = 2nd tile, line[2] = 3rd tile, line[3] = 4th tile
      const startLineIdx = line.findIndex(([r, c]) => r === tile.row && c === tile.col);
      const startPosFromEdge = startLineIdx + 1; // 1, 2, 3, or 4

      // Check if tile can merge with previous tile placed in this line
      const prevIsInThisLine =
        prevPlaced &&
        line.slice(0, targetIdx).some(([r, c]) => prevPlaced.row === r && prevPlaced.col === c);

      if (prevPlaced && prevIsInThisLine && prevPlaced.value === tile.value && !prevPlaced.isMerged) {
        // COLLIDE & MERGE!
        const [targetRow, targetCol] = line[targetIdx - 1];

        // The incoming tile slides smoothly into targetRow, targetCol then fades away
        fadingTiles.push({
          id: tile.id, // preserve incoming tile id so browser animates slide from its origin into targetRow, targetCol
          value: tile.value,
          row: targetRow,
          col: targetCol,
          isFading: true,
          isNew: false,
          isMerged: false,
        });

        // The target tile upgrades its value and triggers the bounce collide animation
        prevPlaced.value = tile.value * 2;
        prevPlaced.isMerged = true;
        prevPlaced.isNew = false;
        scoreGained += prevPlaced.value;
        moved = true;

        // Bouncy effect qualification:
        // Trigger only if merge happens at the edge (targetIdx - 1 === 0)
        // AND either the target tile or the incoming tile slid from 3 to 4 tiles away (startPosFromEdge >= 3).
        if (
          targetIdx - 1 === 0 &&
          ((prevPlaced.startPosFromEdge ?? 0) >= 3 || startPosFromEdge >= 3)
        ) {
          if (!bouncingTileIds.includes(prevPlaced.id)) {
            bouncingTileIds.push(prevPlaced.id);
          }
        }
      } else {
        // Slide tile to next available spot in line
        const [targetRow, targetCol] = line[targetIdx];
        const hasMoved = tile.row !== targetRow || tile.col !== targetCol;
        if (hasMoved) {
          moved = true;
        }

        const placedTile: TileItem = {
          id: tile.id,
          value: tile.value,
          row: targetRow,
          col: targetCol,
          isNew: false,
          isMerged: false,
          startPosFromEdge,
        };
        nextActiveTiles.push(placedTile);

        // Required 3 to 4 tiles away to edge to trigger bouncy effect:
        if (hasMoved && targetIdx === 0 && startPosFromEdge >= 3) {
          bouncingTileIds.push(tile.id);
        }

        targetIdx++;
      }
    }
  }

  let maxVal = 0;
  for (const t of nextActiveTiles) {
    if (t.value > maxVal) maxVal = t.value;
  }

  return { nextActiveTiles, fadingTiles, scoreGained, moved, maxVal, bouncingTileIds };
}

// Checks if any valid moves remain
function checkIsGameOver(tiles: TileItem[]): boolean {
  const active = tiles.filter((t) => !t.isFading);
  if (active.length < 16) return false;

  const grid: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  for (const t of active) {
    grid[t.row][t.col] = t.value;
  }

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return false;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }

  return true;
}

// Built-in Web Audio API Synthesizer
class MergeSoundFx {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ally_merge_sound');
      this.enabled = saved !== 'false';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playSlide() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  playMerge(val: number) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      const baseFreq = 340;
      const pitchFactor = Math.min(2.8, 1 + Math.log2(val) * 0.12);
      const freq = baseFreq * pitchFactor;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.14);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
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
        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {}
  }
}

const sfx = new MergeSoundFx();

interface TileStyle {
  bg: string;
  fg: string;
  boxShadow: string;
  zIndex: number;
  textClass: string;
  textShadowClass: string;
  liftPx: number;
}

// Cartoon nature & sandstone tile styling matching the 4x4 platform aesthetic
function getTileStyle(val: number): TileStyle {
  switch (val) {
    case 2:
      return {
        bg: '#fcf6ec',
        fg: '#543d2b',
        boxShadow:
          'inset 0 2px 1px rgba(255,255,255,0.95), inset 0 -2px 1px rgba(180,160,140,0.35), 0 3px 6px rgba(0,0,0,0.14)',
        zIndex: 12,
        textClass: 'text-2xl sm:text-3xl font-black',
        textShadowClass: 'drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]',
        liftPx: 0,
      };
    case 4:
      return {
        bg: '#f8eed9',
        fg: '#543d2b',
        boxShadow:
          'inset 0 2px 1px rgba(255,255,255,0.95), inset 0 -2px 1px rgba(180,155,130,0.35), 0 3px 6px rgba(0,0,0,0.15)',
        zIndex: 14,
        textClass: 'text-2xl sm:text-3xl font-black',
        textShadowClass: 'drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]',
        liftPx: 0.8,
      };
    case 8:
      return {
        bg: '#f59b53',
        fg: '#ffffff',
        boxShadow:
          'inset 0 2px 1px rgba(255,255,255,0.6), inset 0 -2.5px 1px rgba(180,80,20,0.35), 0 3px 6px rgba(245,155,83,0.35)',
        zIndex: 16,
        textClass: 'text-2xl sm:text-3xl font-black',
        textShadowClass: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
        liftPx: 1.5,
      };
    case 16:
      return {
        bg: '#f36e4f',
        fg: '#ffffff',
        boxShadow:
          'inset 0 2px 1px rgba(255,255,255,0.6), inset 0 -2.5px 1px rgba(170,50,25,0.35), 0 3px 7px rgba(243,110,79,0.38)',
        zIndex: 18,
        textClass: 'text-2xl sm:text-3xl font-black',
        textShadowClass: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
        liftPx: 2.2,
      };
    case 32:
      return {
        bg: '#54be38',
        fg: '#ffffff',
        boxShadow:
          'inset 0 2px 1px rgba(255,255,255,0.6), inset 0 -2.5px 1px rgba(35,110,20,0.35), 0 3px 7px rgba(84,190,56,0.38)',
        zIndex: 20,
        textClass: 'text-2xl sm:text-3xl font-black',
        textShadowClass: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
        liftPx: 3,
      };
    case 64:
      return {
        bg: '#2bb673',
        fg: '#ffffff',
        boxShadow:
          'inset 0 2.5px 1.5px rgba(255,255,255,0.6), inset 0 -2.5px 1px rgba(20,100,60,0.35), 0 3.5px 8px rgba(43,182,115,0.4)',
        zIndex: 22,
        textClass: 'text-2xl sm:text-3xl font-black',
        textShadowClass: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
        liftPx: 3.8,
      };
    case 128:
      return {
        bg: '#f6c338',
        fg: '#ffffff',
        boxShadow:
          'inset 0 2.5px 1.5px rgba(255,255,255,0.65), inset 0 -3px 1px rgba(170,120,15,0.35), 0 4px 9px rgba(246,195,56,0.45)',
        zIndex: 24,
        textClass: 'text-xl sm:text-2xl font-black',
        textShadowClass: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
        liftPx: 4.5,
      };
    case 256:
      return {
        bg: '#f4a91e',
        fg: '#ffffff',
        boxShadow:
          'inset 0 2.5px 1.5px rgba(255,255,255,0.65), inset 0 -3px 1px rgba(160,100,8,0.35), 0 4px 10px rgba(244,169,30,0.5)',
        zIndex: 26,
        textClass: 'text-xl sm:text-2xl font-black',
        textShadowClass: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
        liftPx: 5.2,
      };
    case 512:
      return {
        bg: '#ea8d15',
        fg: '#ffffff',
        boxShadow:
          'inset 0 3px 2px rgba(255,255,255,0.7), inset 0 -3.5px 1px rgba(150,80,5,0.4), 0 4.5px 11px rgba(234,141,21,0.55)',
        zIndex: 28,
        textClass: 'text-xl sm:text-2xl font-black',
        textShadowClass: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
        liftPx: 5.8,
      };
    case 1024:
      return {
        bg: '#e8453c',
        fg: '#ffffff',
        boxShadow:
          'inset 0 3px 2px rgba(255,255,255,0.7), inset 0 -3.5px 1px rgba(140,30,25,0.4), 0 5px 12px rgba(232,69,60,0.6)',
        zIndex: 30,
        textClass: 'text-lg sm:text-xl font-black',
        textShadowClass: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
        liftPx: 6.5,
      };
    case 2048:
      return {
        bg: 'linear-gradient(135deg, #ffd752 0%, #f5a623 100%)',
        fg: '#ffffff',
        boxShadow:
          'inset 0 3px 2px rgba(255,255,255,0.85), inset 0 -3.5px 1px rgba(160,95,8,0.4), 0 5px 14px rgba(245,166,35,0.65), 0 0 20px rgba(255,215,82,0.5)',
        zIndex: 35,
        textClass: 'text-lg sm:text-xl font-black',
        textShadowClass: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]',
        liftPx: 7.2,
      };
    default:
      if (val > 2048) {
        return {
          bg: 'linear-gradient(135deg, #f472b6 0%, #c084fc 100%)',
          fg: '#ffffff',
          boxShadow:
            'inset 0 3px 2px rgba(255,255,255,0.85), inset 0 -3.5px 1px rgba(110,40,160,0.4), 0 5px 14px rgba(192,132,252,0.65)',
          zIndex: 40,
          textClass: 'text-base sm:text-lg font-black',
          textShadowClass: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]',
          liftPx: 8,
        };
      }
      return {
        bg: '#fcf6ec',
        fg: 'transparent',
        boxShadow: 'none',
        zIndex: 10,
        textClass: '',
        textShadowClass: '',
        liftPx: 0,
      };
  }
}

export function NumberMergeGame({ onBack, duel }: Props) {
  // Re-render timer every 500ms when in duel mode
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!duel) return;
    const interval = setInterval(() => forceTick((t) => t + 1), 500);
    return () => clearInterval(interval);
  }, [duel]);

  const endsAt = duel?.session?.state?.endsAt;
  const duelSecondsLeft = duel && endsAt ? Math.max(0, Math.ceil((endsAt - duel.now()) / 1000)) : null;
  const opponentScore = duel?.session?.scores?.opponent ?? 0;
  const opponentDone = Boolean(duel?.session?.state?.opponentDone);
  const nextIdRef = useRef(1);
  const getNextId = useCallback(() => nextIdRef.current++, []);

  const [playerTiles, setPlayerTiles] = useState<TileItem[]>(() => createInitialTiles(getNextId));
  const [playerScore, setPlayerScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('ally_merge_best');
      return s ? parseInt(s, 10) : 0;
    }
    return 0;
  });

  const [playerOver, setPlayerOver] = useState(false);
  const [hasWon2048, setHasWon2048] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(() => sfx.enabled);

  const toggleSound = () => {
    const next = !soundOn;
    sfx.enabled = next;
    setSoundOn(next);
    localStorage.setItem('ally_merge_sound', String(next));
  };

  const boardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Timing constants: Slide in animation duration (180ms) + explicit settle delay (80ms) before tile respawns
  const SLIDE_DURATION_MS = 180;
  const SPAWN_DELAY_MS = 80;

  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimatingRef = useRef(false);
  const queuedMoveRef = useRef<Direction | null>(null);

  // Directional landing bounce animation state & refs (individual tile tracking)
  const [bouncingTileIds, setBouncingTileIds] = useState<Set<number>>(new Set());
  const [bounceDir, setBounceDir] = useState<Direction | null>(null);
  const [bounceSeq, setBounceSeq] = useState(0);
  const bounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const landingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerTilesRef = useRef(playerTiles);
  playerTilesRef.current = playerTiles;

  // Return to games on Escape or close settings modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, showSettings]);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
      if (landingTimeoutRef.current) clearTimeout(landingTimeoutRef.current);
      if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current);
    };
  }, []);

  const handleRestart = useCallback(() => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
    if (landingTimeoutRef.current) clearTimeout(landingTimeoutRef.current);
    if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current);
    isAnimatingRef.current = false;
    queuedMoveRef.current = null;
    setBouncingTileIds(new Set());
    setBounceDir(null);
    setPlayerTiles(createInitialTiles(getNextId));
    setPlayerScore(0);
    setPlayerOver(false);
    setHasWon2048(false);
  }, [getNextId]);

  useEffect(() => {
    if (playerScore > bestScore) {
      setBestScore(playerScore);
      localStorage.setItem('ally_merge_best', String(playerScore));
    }
    if (duel) {
      duel.sendScore(playerScore, playerOver);
    }
  }, [playerScore, bestScore, duel, playerOver]);

  // Primary player move handler with physical slide in animation and delayed tile respawn
  const handlePlayerMove = useCallback(
    (dir: Direction) => {
      if (playerOver) return;

      // If a slide in animation is currently in flight, queue this move instead of cancelling
      if (isAnimatingRef.current) {
        queuedMoveRef.current = dir;
        return;
      }

      // Strip any fading tiles before calculating next move
      const base = playerTilesRef.current.filter((t) => !t.isFading);
      const {
        nextActiveTiles,
        fadingTiles,
        scoreGained,
        moved,
        maxVal,
        bouncingTileIds: moveBouncingIds,
      } = moveTiles(base, dir);

      if (!moved) {
        queuedMoveRef.current = null;
        return;
      }

      // Lock animation during the slide animation and post-slide respawn delay
      isAnimatingRef.current = true;

      // Audio feedback
      if (scoreGained > 0) {
        sfx.playMerge(scoreGained);
      } else {
        sfx.playSlide();
      }

      if (!hasWon2048 && maxVal >= 2048) {
        setHasWon2048(true);
        sfx.playWin();
      }

      setPlayerScore((s) => s + scoreGained);

      // Phase 1: Render moving active tiles and collapsing fading tiles
      const phase1Tiles = [...nextActiveTiles, ...fadingTiles];
      setPlayerTiles(phase1Tiles);
      playerTilesRef.current = phase1Tiles;

      // Schedule directional overlap bounce in the move direction for individual qualifying tiles
      if (landingTimeoutRef.current) clearTimeout(landingTimeoutRef.current);
      if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current);
      setBouncingTileIds(new Set());

      // Only schedule bounce if at least one tile qualified (slid from 3 to 4 tiles away to edge)
      if (moveBouncingIds.length > 0) {
        landingTimeoutRef.current = setTimeout(() => {
          setBounceDir(dir);
          setBouncingTileIds(new Set(moveBouncingIds));
          setBounceSeq((s) => s + 1);

          bounceTimeoutRef.current = setTimeout(() => {
            setBouncingTileIds(new Set());
            setBounceDir(null);
            bounceTimeoutRef.current = null;
          }, 160);
          landingTimeoutRef.current = null;
        }, 140);
      }

      // Clear any pending timeouts
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);

      // Phase 2: Slide animation completes (at 180ms)
      // Settle active tiles into place and remove fading tiles
      animTimeoutRef.current = setTimeout(() => {
        const settledTiles = nextActiveTiles.map((t) => ({
          ...t,
          isNew: false,
        }));
        setPlayerTiles(settledTiles);
        playerTilesRef.current = settledTiles;
        animTimeoutRef.current = null;

        // Phase 3: Added ms delay (80ms) AFTER slide in animations have fully finished
        // Only now does the new tile respawn into an empty slot with its pop-in animation
        spawnTimeoutRef.current = setTimeout(() => {
          let updatedWithSpawn: TileItem[] = [];
          setPlayerTiles((cur) => {
            const activeOnly = cur.filter((t) => !t.isFading);
            updatedWithSpawn = spawnTile(activeOnly, getNextId);
            if (checkIsGameOver(updatedWithSpawn)) {
              setPlayerOver(true);
              if (duel) {
                duel.sendScore(playerScore, true);
              }
            }
            return updatedWithSpawn;
          });
          playerTilesRef.current = updatedWithSpawn;

          spawnTimeoutRef.current = null;
          isAnimatingRef.current = false;

          // If a move was queued during the slide/delay, execute it now cleanly
          if (queuedMoveRef.current) {
            const nextDir = queuedMoveRef.current;
            queuedMoveRef.current = null;
            handlePlayerMove(nextDir);
          }
        }, SPAWN_DELAY_MS);
      }, SLIDE_DURATION_MS);
    },
    [playerOver, hasWon2048, getNextId]
  );

  // Keyboard controls: Arrow Keys + WASD (disabled while settings modal is open)
  useEffect(() => {
    if (showSettings) return;

    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handlePlayerMove('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handlePlayerMove('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        handlePlayerMove('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        handlePlayerMove('RIGHT');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePlayerMove, showSettings]);

  // Touch Swipe controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const threshold = 30;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > threshold) {
        handlePlayerMove(dx > 0 ? 'RIGHT' : 'LEFT');
      }
    } else {
      if (Math.abs(dy) > threshold) {
        handlePlayerMove(dy > 0 ? 'DOWN' : 'UP');
      }
    }
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
      <div className="relative z-10 w-full max-w-[440px] h-[100dvh] max-h-[100dvh] mx-auto pt-5 pb-6 sm:pt-7 sm:pb-8 px-3 flex flex-col items-center justify-between overflow-hidden select-none touch-none overscroll-none">
        
        {/* Top Header Group: Back Button, Game Logo & Score/Controls Bar */}
        <div className="w-full flex flex-col items-center flex-shrink-0 gap-2 sm:gap-2.5">
          {/* Top Floating Row: Back Button (Only arrow and text label, no container) */}
          <div className="w-full max-w-[420px] sm:max-w-[440px] flex items-center justify-between px-1">
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
              <span className="tracking-wide">Back to Games</span>
            </button>
          </div>

          {/* Center: Centered 2048 Merge Game Logo */}
          <div className="w-full flex items-center justify-center">
            <img
              src="/merge-logo.png"
              alt="2048 Merge"
              className="h-10 sm:h-12 md:h-13 w-auto max-w-[210px] sm:max-w-[240px] object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] select-none hover:scale-105 transition-transform"
              draggable={false}
            />
          </div>

          {/* Left and Right Layout for SCORE and BEST (Reusing /ui-pod.png) with Center Restart Button */}
          <div className="w-full max-w-[420px] sm:max-w-[440px] flex items-center justify-between px-1 select-none">
            {/* Left: YOU SCORE Pod */}
            <div className="relative aspect-[1.56/1] w-24 sm:w-28 flex flex-col items-center justify-center p-2">
              <img
                src="/ui-pod.png"
                alt=""
                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                draggable={false}
              />
              <span className="relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#6a4c28] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                {duel ? 'YOU' : 'SCORE'}
              </span>
              <span className="relative z-10 text-lg sm:text-xl font-black font-display text-[#382613] leading-none mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                {playerScore}
              </span>
            </div>

            {/* Center: Action Buttons / Timer */}
            <div className="flex items-center gap-2">
              {duel && duelSecondsLeft !== null ? (
                <div className="relative h-10 px-3 flex flex-col items-center justify-center select-none">
                  <img
                    src="/ui-pod.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                    draggable={false}
                  />
                  <span className="relative z-10 text-[8px] font-black uppercase tracking-wider text-[#6a4c28] leading-none">
                    TIME
                  </span>
                  <span className={`relative z-10 text-sm font-black font-mono leading-tight mt-0.5 ${duelSecondsLeft <= 20 ? 'text-[#DC2626] animate-pulse' : 'text-[#382613]'}`}>
                    {Math.floor(duelSecondsLeft / 60)}:{duelSecondsLeft % 60 < 10 ? '0' : ''}{duelSecondsLeft % 60}
                  </span>
                </div>
              ) : (
                /* Restart Button (Solo only) */
                <button
                  type="button"
                  onClick={handleRestart}
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

            {/* Right: OPPONENT (in duel) or BEST (in solo) Pod */}
            <div className="relative aspect-[1.56/1] w-24 sm:w-28 flex flex-col items-center justify-center p-2">
              <img
                src="/ui-pod.png"
                alt=""
                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                draggable={false}
              />
              <span className="relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#6a4c28] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] truncate max-w-[80px]">
                {duel ? (duel.opponentName.length > 8 ? `${duel.opponentName.slice(0, 7)}…` : duel.opponentName).toUpperCase() : 'BEST'}
              </span>
              <span className="relative z-10 text-lg sm:text-xl font-black font-display text-[#382613] leading-none mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                {duel ? opponentScore : bestScore}
              </span>
            </div>
          </div>
        </div>

        {/* Live Duel Status Banner */}
        {duel && (playerOver || opponentDone) && (
          <div className="w-full max-w-[400px] mx-auto py-1 px-3 mb-1 rounded-xl bg-black/40 border border-[#F0B247]/40 text-center animate-pop">
            <span className="text-xs font-bold text-[#F0B247]">
              {playerOver && opponentDone
                ? 'Both players finished! Calculating results...'
                : playerOver
                ? 'Board locked! Waiting for timer or opponent to finish...'
                : `${duel.opponentName} finished! Keep scoring until time expires!`}
            </span>
          </div>
        )}

        {/* Floating 4x4 Nature Platform Board (Centered in available vertical space) */}
        <div className="flex-1 w-full flex items-center justify-center min-h-0 my-auto py-2">
          <div
            ref={boardRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative w-full aspect-square max-w-[min(390px,calc(100dvh-250px))] sm:max-w-[min(410px,calc(100dvh-260px))] mx-auto select-none touch-none overscroll-none flex-shrink-0"
            aria-label="2048 Merge 4x4 Board Platform"
          >
          {/* Grass Frame & 4x4 Stone Tile Platform Background Image */}
          <img
            src="/merge-platform.png"
            alt="Merge 4x4 Platform"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0 select-none"
            draggable={false}
          />

          {/* Active Animated Sliding and Colliding Tiles */}
          <div className="absolute inset-0 pointer-events-none">
            {playerTiles.map((tile) => {
              const style = getTileStyle(tile.value);
              const isTileBouncing = bouncingTileIds.has(tile.id);

              return (
                <div
                  key={tile.id}
                  className={`absolute rounded-[16%] ${
                    tile.isFading ? 'opacity-60 pointer-events-none' : ''
                  }`}
                  style={{
                    left: '14.52%',
                    top: '14.45%',
                    width: '15.3%',
                    height: '15.3%',
                    transform: `translate3d(calc(${tile.col} * 121.05%), calc(${tile.row} * 121.18%), 0)`,
                    transition: tile.isNew
                      ? 'none'
                      : `transform ${SLIDE_DURATION_MS}ms cubic-bezier(0.2, 0.9, 0.35, 1)`,
                    zIndex: tile.isFading ? 5 : style.zIndex,
                    willChange: 'transform',
                  }}
                >
                  {/* Physical 3D Elevation / Lift Layer based on Tile Value */}
                  <div
                    className="w-full h-full rounded-[16%] transition-transform duration-150"
                    style={{
                      transform: `translateY(-${style.liftPx}px)`,
                    }}
                  >
                    {/* Directional Overlap & Rebound Bounce Layer (Individual tile bounce) */}
                    <div
                      key={isTileBouncing ? `bounce-${bounceSeq}` : 'idle'}
                      className={`w-full h-full rounded-[16%] ${
                        isTileBouncing && bounceDir === 'LEFT'
                          ? 'animate-bounce-left'
                          : isTileBouncing && bounceDir === 'RIGHT'
                          ? 'animate-bounce-right'
                          : isTileBouncing && bounceDir === 'UP'
                          ? 'animate-bounce-up'
                          : isTileBouncing && bounceDir === 'DOWN'
                          ? 'animate-bounce-down'
                          : ''
                      }`}
                    >
                      {/* Visual 3D Tile Face (Matching Platform Sandstone, Leaves & Nature Palette) */}
                      <div
                        style={{
                          background: style.bg,
                          color: style.fg,
                          boxShadow: style.boxShadow,
                        }}
                        className={`w-full h-full rounded-[16%] flex items-center justify-center font-display font-black select-none ${
                          style.textClass
                        } ${
                          tile.isMerged
                            ? 'animate-merge-collide'
                            : tile.isNew
                            ? 'animate-spawn-pop'
                            : ''
                        }`}
                      >
                        <span className={style.textShadowClass}>
                          {tile.value}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

      {/* ═══ SETTINGS MODAL (USING PUBLIC /modal-container.png & /ui-wood-btn.png) ═══ */}
      <GameModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidthClass="max-w-[360px] sm:max-w-[380px]"
        title={
          <h3 className="font-display font-black text-2xl sm:text-3xl text-[#5c4028] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
            Settings
          </h3>
        }
      >
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
          {/* Sound Toggle */}
          <GameWoodButton colSpan={1} onClick={toggleSound}>
            {soundOn ? 'Sound: ON' : 'Sound: OFF'}
          </GameWoodButton>

          {/* Restart Run */}
          <GameWoodButton
            colSpan={1}
            onClick={() => {
              setShowSettings(false);
              handleRestart();
            }}
          >
            Restart
          </GameWoodButton>

          {/* Resume / Back to Game */}
          <GameWoodButton colSpan={2} onClick={() => setShowSettings(false)}>
            Back to Game
          </GameWoodButton>

          {/* Exit to Main Menu */}
          <GameWoodButton colSpan={2} onClick={onBack}>
            Exit to Games
          </GameWoodButton>
        </div>
      </GameModal>

      {/* ═══ GAME OVER / MATCH CONCLUSION MODAL (MATCHING NATURE WOOD/STONE THEME) ═══ */}
      <GameModal
        open={playerOver && !duel}
        maxWidthClass="max-w-[360px] sm:max-w-[380px]"
        title={
          <div className="text-center">
            <h3 className="font-display font-black text-2xl sm:text-3xl text-[#5c4028] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {hasWon2048 ? '🏆 2048 CHAMPION!' : 'GAME OVER'}
            </h3>
            <p className="text-xs font-bold text-[#8c6743] mt-1">
              Final Score: {playerScore}
            </p>
          </div>
        }
      >
        <div className="flex flex-col gap-2.5 w-full">
          <GameWoodButton colSpan={2} onClick={handleRestart}>
            Play Again
          </GameWoodButton>
          <GameWoodButton colSpan={2} onClick={onBack}>
            Back to Games
          </GameWoodButton>
        </div>
      </GameModal>
    </>
  );
}
