import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameUser } from '../lib/auth';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameMode = 'duel' | 'solo';

interface TileItem {
  id: number;
  value: number;
  row: number; // 0..3
  col: number; // 0..3
  isMerged?: boolean;
  isNew?: boolean;
  isFading?: boolean;
}

interface Props {
  onBack: () => void;
  user?: GameUser | null;
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

  return [...activeTiles, newTile];
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
  dir: Direction,
  nextId: () => number
): {
  nextActiveTiles: TileItem[];
  fadingTiles: TileItem[];
  scoreGained: number;
  moved: boolean;
  maxVal: number;
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

  // Define coordinate lines based on direction
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

  for (const line of lines) {
    const lineTiles: TileItem[] = [];
    for (const [r, c] of line) {
      if (grid[r][c]) lineTiles.push(grid[r][c]!);
    }

    let targetIdx = 0;

    for (let i = 0; i < lineTiles.length; i++) {
      const tile = lineTiles[i];
      const prevPlaced = targetIdx > 0 ? nextActiveTiles[nextActiveTiles.length - 1] : null;

      // Check if tile can merge with previous tile placed in this line
      const prevIsInThisLine =
        prevPlaced &&
        line.slice(0, targetIdx).some(([r, c]) => prevPlaced.row === r && prevPlaced.col === c);

      if (prevPlaced && prevIsInThisLine && prevPlaced.value === tile.value && !prevPlaced.isMerged) {
        // COLLIDE & MERGE!
        const [targetRow, targetCol] = line[targetIdx - 1];

        // The incoming tile slides smoothly into targetRow, targetCol then fades away
        fadingTiles.push({
          id: nextId(), // give fading clone unique key so react animates slide seamlessly
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
      } else {
        // Slide tile to next available spot in line
        const [targetRow, targetCol] = line[targetIdx];
        if (tile.row !== targetRow || tile.col !== targetCol) {
          moved = true;
        }

        nextActiveTiles.push({
          id: tile.id,
          value: tile.value,
          row: targetRow,
          col: targetCol,
          isNew: false,
          isMerged: false,
        });

        targetIdx++;
      }
    }
  }

  let maxVal = 0;
  for (const t of nextActiveTiles) {
    if (t.value > maxVal) maxVal = t.value;
  }

  return { nextActiveTiles, fadingTiles, scoreGained, moved, maxVal };
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

// AI heuristic move generator for CPU Duel mode
function getBestCpuDirection(tiles: TileItem[]): Direction | null {
  const active = tiles.filter((t) => !t.isFading);
  const directions: Direction[] = ['UP', 'LEFT', 'RIGHT', 'DOWN'];
  let bestScore = -Infinity;
  let bestDir: Direction | null = null;

  for (const dir of directions) {
    const { nextActiveTiles, scoreGained, moved } = moveTiles(active, dir, () => 0);
    if (!moved) continue;

    let evalScore = scoreGained * 2;
    evalScore += (16 - nextActiveTiles.length) * 35; // Empty slots bonus

    let maxVal = 0;
    let maxInCorner = false;
    for (const t of nextActiveTiles) {
      if (t.value > maxVal) {
        maxVal = t.value;
        maxInCorner = t.row === 0 && t.col === 0;
      }
    }
    if (maxInCorner) evalScore += 90;

    if (evalScore > bestScore) {
      bestScore = evalScore;
      bestDir = dir;
    }
  }

  return bestDir;
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
  liftPx: number;
}

// Color, depth offset, and 3D extruded shadow styling scaled based on tile value
function getTileStyle(val: number): TileStyle {
  switch (val) {
    case 2:
      return {
        bg: '#232730',
        fg: '#EDEDED',
        // 4px depth: crisp top reflection, 4px solid extruded shelf, soft ambient drop
        boxShadow:
          'inset 0 1.5px 0.5px rgba(255,255,255,0.1), 0 4px 0 #121419, 0 6px 10px rgba(0,0,0,0.45)',
        zIndex: 12,
        textClass: 'text-2xl sm:text-3xl font-black',
        liftPx: 0,
      };
    case 4:
      return {
        bg: '#2C3646',
        fg: '#EDEDED',
        // 5px depth: steel slate slab with 5px extruded shelf
        boxShadow:
          'inset 0 1.5px 0.5px rgba(255,255,255,0.15), 0 5px 0 #161C24, 0 7px 12px rgba(0,0,0,0.48)',
        zIndex: 14,
        textClass: 'text-2xl sm:text-3xl font-black',
        liftPx: 0.8,
      };
    case 8:
      return {
        bg: '#18432E',
        fg: '#A7F3D0',
        // 6px depth: deep emerald forest with mint text
        boxShadow:
          'inset 0 2px 1px rgba(255,255,255,0.2), 0 6px 0 #0C2419, 0 9px 14px rgba(0,0,0,0.5)',
        zIndex: 16,
        textClass: 'text-2xl sm:text-3xl font-black',
        liftPx: 1.5,
      };
    case 16:
      return {
        bg: '#1F613E',
        fg: '#E6FFFA',
        // 7px depth: vibrant emerald with 7px solid bottom edge
        boxShadow:
          'inset 0 2px 1px rgba(255,255,255,0.25), 0 7px 0 #103823, 0 11px 16px rgba(0,0,0,0.52)',
        zIndex: 18,
        textClass: 'text-2xl sm:text-3xl font-black',
        liftPx: 2.2,
      };
    case 32:
      return {
        bg: '#2CA36F',
        fg: '#04160E',
        // 8px depth: punchy ALLY emerald with colored halo
        boxShadow:
          'inset 0 2.5px 1.5px rgba(255,255,255,0.3), 0 8px 0 #186644, 0 13px 18px rgba(0,0,0,0.55), 0 0 14px rgba(44,163,111,0.3)',
        zIndex: 20,
        textClass: 'text-2xl sm:text-3xl font-black',
        liftPx: 3,
      };
    case 64:
      return {
        bg: '#38C185',
        fg: '#04160E',
        // 9px depth: signature brand emerald with radiant aura
        boxShadow:
          'inset 0 2.5px 1.5px rgba(255,255,255,0.38), 0 9px 0 #1E754E, 0 15px 22px rgba(0,0,0,0.6), 0 0 20px rgba(56,193,133,0.4)',
        zIndex: 22,
        textClass: 'text-2xl sm:text-3xl font-black',
        liftPx: 3.8,
      };
    case 128:
      return {
        bg: '#92631E',
        fg: '#FEF3C7',
        // 9.5px depth: rich bronze amber with bronze ledge
        boxShadow:
          'inset 0 2.5px 1.5px rgba(255,255,255,0.28), 0 9.5px 0 #56390E, 0 16px 24px rgba(0,0,0,0.62), 0 0 22px rgba(146,99,30,0.35)',
        zIndex: 24,
        textClass: 'text-xl sm:text-2xl font-black',
        liftPx: 4.5,
      };
    case 256:
      return {
        bg: '#B88022',
        fg: '#FFFBEB',
        // 10px depth: warm gold with rich 10px ledge
        boxShadow:
          'inset 0 3px 2px rgba(255,255,255,0.32), 0 10px 0 #734F12, 0 18px 26px rgba(0,0,0,0.65), 0 0 26px rgba(184,128,34,0.4)',
        zIndex: 26,
        textClass: 'text-xl sm:text-2xl font-black',
        liftPx: 5.2,
      };
    case 512:
      return {
        bg: '#D99528',
        fg: '#1A1204',
        // 10.5px depth: radiant gold monolith
        boxShadow:
          'inset 0 3px 2px rgba(255,255,255,0.38), 0 10.5px 0 #885B13, 0 20px 28px rgba(0,0,0,0.68), 0 0 30px rgba(217,149,40,0.45)',
        zIndex: 28,
        textClass: 'text-xl sm:text-2xl font-black',
        liftPx: 5.8,
      };
    case 1024:
      return {
        bg: '#F0B247',
        fg: '#1A1204',
        // 11.5px depth: signature ALLY gold with bold bottom ledge
        boxShadow:
          'inset 0 3px 2px rgba(255,255,255,0.45), 0 11.5px 0 #A17020, 0 22px 32px rgba(0,0,0,0.72), 0 0 36px rgba(240,178,71,0.55)',
        zIndex: 30,
        textClass: 'text-lg sm:text-xl font-black',
        liftPx: 6.5,
      };
    case 2048:
      return {
        bg: '#FBBF24',
        fg: '#1A1204',
        // 12.5px depth: champion crown gold with intense aura
        boxShadow:
          'inset 0 3.5px 2.5px rgba(255,255,255,0.55), 0 12.5px 0 #B45309, 0 24px 36px rgba(0,0,0,0.76), 0 0 42px rgba(251,191,36,0.65)',
        zIndex: 35,
        textClass: 'text-lg sm:text-xl font-black',
        liftPx: 7.2,
      };
    default:
      if (val > 2048) {
        return {
          bg: '#EC4899',
          fg: '#FFFFFF',
          // 13.5px depth: cosmic pink crystal
          boxShadow:
            'inset 0 3.5px 2.5px rgba(255,255,255,0.6), 0 13.5px 0 #831843, 0 26px 40px rgba(0,0,0,0.8), 0 0 46px rgba(236,72,153,0.75)',
          zIndex: 40,
          textClass: 'text-base sm:text-lg font-black',
          liftPx: 8,
        };
      }
      return {
        bg: '#18181D',
        fg: 'transparent',
        boxShadow: '0 4px 0 #0F0F12',
        zIndex: 10,
        textClass: '',
        liftPx: 0,
      };
  }
}

export function NumberMergeGame({ onBack, user }: Props) {
  const nextIdRef = useRef(1);
  const getNextId = useCallback(() => nextIdRef.current++, []);

  const [playerTiles, setPlayerTiles] = useState<TileItem[]>(() => createInitialTiles(getNextId));
  const [cpuTiles, setCpuTiles] = useState<TileItem[]>(() => createInitialTiles(getNextId));
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('ally_merge_best');
      return s ? parseInt(s, 10) : 0;
    }
    return 0;
  });

  const [mode, setMode] = useState<GameMode>('duel');
  const [playerOver, setPlayerOver] = useState(false);
  const [cpuOver, setCpuOver] = useState(false);
  const [hasWon2048, setHasWon2048] = useState(false);
  const [soundOn, setSoundOn] = useState(sfx.enabled);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cpuAnimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Directional landing bounce animation state & refs
  const [isBouncing, setIsBouncing] = useState(false);
  const [bounceDir, setBounceDir] = useState<Direction | null>(null);
  const [bounceSeq, setBounceSeq] = useState(0);
  const bounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const landingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerTilesRef = useRef(playerTiles);
  playerTilesRef.current = playerTiles;

  // Return to games on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      if (cpuAnimTimeoutRef.current) clearTimeout(cpuAnimTimeoutRef.current);
      if (landingTimeoutRef.current) clearTimeout(landingTimeoutRef.current);
      if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current);
    };
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    sfx.enabled = next;
    setSoundOn(next);
    localStorage.setItem('ally_merge_sound', String(next));
  };

  const handleRestart = useCallback(() => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    if (cpuAnimTimeoutRef.current) clearTimeout(cpuAnimTimeoutRef.current);
    if (landingTimeoutRef.current) clearTimeout(landingTimeoutRef.current);
    if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current);
    setIsBouncing(false);
    setBounceDir(null);
    setPlayerTiles(createInitialTiles(getNextId));
    setCpuTiles(createInitialTiles(getNextId));
    setPlayerScore(0);
    setCpuScore(0);
    setPlayerOver(false);
    setCpuOver(false);
    setHasWon2048(false);
  }, [getNextId]);

  useEffect(() => {
    if (playerScore > bestScore) {
      setBestScore(playerScore);
      localStorage.setItem('ally_merge_best', String(playerScore));
    }
  }, [playerScore, bestScore]);

  // Primary player move handler with directional overlap & recoil spring animation
  const handlePlayerMove = useCallback(
    (dir: Direction) => {
      if (playerOver) return;

      // Cancel pending slide completion timeout
      if (animTimeoutRef.current) {
        clearTimeout(animTimeoutRef.current);
        animTimeoutRef.current = null;
      }

      // Strip any fading tiles before calculating next move
      const base = playerTilesRef.current.filter((t) => !t.isFading);
      const { nextActiveTiles, fadingTiles, scoreGained, moved, maxVal } = moveTiles(
        base,
        dir,
        getNextId
      );

      if (!moved) return;

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

      // Render moving active tiles and collapsing fading tiles
      setPlayerTiles([...nextActiveTiles, ...fadingTiles]);

      // Schedule directional overlap bounce in the move direction:
      if (landingTimeoutRef.current) clearTimeout(landingTimeoutRef.current);
      if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current);
      setIsBouncing(false);

      // Trigger directional overlap right as tiles arrive at destination (140ms)
      landingTimeoutRef.current = setTimeout(() => {
        setBounceDir(dir);
        setIsBouncing(true);
        setBounceSeq((s) => s + 1);

        bounceTimeoutRef.current = setTimeout(() => {
          setIsBouncing(false);
          bounceTimeoutRef.current = null;
        }, 180);
        landingTimeoutRef.current = null;
      }, 140);

      // Schedule slide completion:
      // After 160ms, purge fading tiles, spawn new tile, check game over
      animTimeoutRef.current = setTimeout(() => {
        setPlayerTiles((cur) => {
          const activeOnly = cur.filter((t) => !t.isFading);
          const withSpawn = spawnTile(activeOnly, getNextId);
          if (checkIsGameOver(withSpawn)) {
            setPlayerOver(true);
          }
          return withSpawn;
        });
        animTimeoutRef.current = null;
      }, 160);
    },
    [playerOver, hasWon2048, getNextId]
  );

  // Keyboard controls
  useEffect(() => {
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
  }, [handlePlayerMove]);

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

  // CPU Bot ticker in Duel mode
  useEffect(() => {
    if (mode !== 'duel' || cpuOver || playerOver) return;

    const interval = setInterval(() => {
      setCpuTiles((prevTiles) => {
        const base = prevTiles.filter((t) => !t.isFading);
        if (checkIsGameOver(base)) {
          setCpuOver(true);
          return base;
        }

        const bestDir = getBestCpuDirection(base);
        if (!bestDir) {
          setCpuOver(true);
          return base;
        }

        const { nextActiveTiles, fadingTiles, scoreGained, moved } = moveTiles(
          base,
          bestDir,
          getNextId
        );

        if (!moved) return base;

        setCpuScore((s) => s + scoreGained);

        if (cpuAnimTimeoutRef.current) clearTimeout(cpuAnimTimeoutRef.current);
        cpuAnimTimeoutRef.current = setTimeout(() => {
          setCpuTiles((cur) => {
            const activeOnly = cur.filter((t) => !t.isFading);
            const withSpawn = spawnTile(activeOnly, getNextId);
            if (checkIsGameOver(withSpawn)) {
              setCpuOver(true);
            }
            return withSpawn;
          });
          cpuAnimTimeoutRef.current = null;
        }, 190);

        return [...nextActiveTiles, ...fadingTiles];
      });
    }, 700);

    return () => {
      clearInterval(interval);
      if (cpuAnimTimeoutRef.current) clearTimeout(cpuAnimTimeoutRef.current);
    };
  }, [mode, cpuOver, playerOver, getNextId]);

  let playerMaxTile = 0;
  for (const t of playerTiles) {
    if (!t.isFading && t.value > playerMaxTile) playerMaxTile = t.value;
  }

  let cpuMaxTile = 0;
  for (const t of cpuTiles) {
    if (!t.isFading && t.value > cpuMaxTile) cpuMaxTile = t.value;
  }

  const isMatchEnded = playerOver && (mode === 'solo' || cpuOver);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[480px] mx-auto flex flex-col items-center animate-pop select-none"
      aria-label="Number Merge Duel Gameplay"
    >
      {/* Top Navigation & Controls Bar */}
      <div className="w-full flex items-center justify-between mb-4">
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
                setMode('duel');
                handleRestart();
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-150 ${
                mode === 'duel'
                  ? 'bg-[#38C185] text-[#081B12] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#EDEDED]'
              }`}
            >
              Duel vs CPU
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('solo');
                handleRestart();
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-150 ${
                mode === 'solo'
                  ? 'bg-[#38C185] text-[#081B12] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#EDEDED]'
              }`}
            >
              Solo Run
            </button>
          </div>

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

      {/* SECTION 1: HEADER (LOGO + SCORE PODS + RESTART BUTTON) */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        {/* Left: 2048 Emblem Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#38C185] shadow-[0_4px_0_#237D55] flex items-center justify-center text-[#081B12] font-display font-black text-lg">
            2048
          </div>
          <div>
            <h1 className="font-display font-black text-lg text-[#EDEDED] leading-none">
              Merge Duel
            </h1>
            <p className="text-[11px] text-[#94A3B8] font-medium">Slide & Conquer</p>
          </div>
        </div>

        {/* Right: Score Pods & Restart Button with 3D bottom shadow */}
        <div className="flex items-center gap-2">
          {/* Score Pod */}
          <div className="px-3.5 py-1.5 rounded-xl bg-[#1F1F24] shadow-[0_4px_0_#101013] flex flex-col items-center min-w-[70px]">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#38C185]">
              SCORE
            </span>
            <span className="text-base font-display font-black text-[#EDEDED] leading-none mt-0.5">
              {playerScore}
            </span>
          </div>

          {/* Best Score Pod */}
          <div className="px-3.5 py-1.5 rounded-xl bg-[#1F1F24] shadow-[0_4px_0_#101013] flex flex-col items-center min-w-[70px]">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#F0B247]">
              BEST
            </span>
            <span className="text-base font-display font-black text-[#EDEDED] leading-none mt-0.5">
              {bestScore}
            </span>
          </div>

          {/* Restart Button */}
          <button
            type="button"
            onClick={handleRestart}
            className="w-10 h-10 rounded-xl bg-[#2A2A32] shadow-[0_4px_0_#18181D] hover:bg-[#32323C] active:translate-y-1 active:shadow-none flex items-center justify-center text-[#EDEDED] transition-all duration-100"
            title="Restart game"
            aria-label="Restart game"
          >
            <svg
              className="w-4 h-4 text-[#94A3B8] hover:text-[#EDEDED]"
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
      </div>

      {/* SECTION 2: LIVE DUEL COMPARISON BAR (WHEN IN DUEL MODE) */}
      {mode === 'duel' && (
        <div className="w-full mb-3.5 px-3 py-2 rounded-2xl bg-[#1A1A1E] border border-[#26262E] flex items-center justify-between text-xs">
          {/* Player stats */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38C185] animate-pulse" />
            <span className="font-bold text-[#EDEDED]">
              {user?.name ? user.name.split(' ')[0] : 'You'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#38C185]/15 text-[#38C185] font-black text-[11px]">
              Tile {playerMaxTile}
            </span>
          </div>

          <span className="text-xs font-black text-[#64748B] uppercase">VS</span>

          {/* CPU stats */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#F0B247]/15 text-[#F0B247] font-black text-[11px]">
              Tile {cpuMaxTile}
            </span>
            <span className="font-bold text-[#EDEDED]">CPU Bot</span>
            <span className="text-[#94A3B8] font-bold">({cpuScore})</span>
          </div>
        </div>
      )}

      {/* SECTION 3: 4x4 GAME BOARD WITH HARDWARE-ACCELERATED SLIDE & COLLIDE ANIMATIONS */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full aspect-square max-w-[440px] p-[12px] rounded-[26px] bg-[#121215] border border-[#24242A] shadow-inner select-none touch-none overflow-hidden"
      >
        {/* Static Background Grid Slots as recessed 3D sockets */}
        <div className="grid grid-cols-4 grid-rows-4 gap-[10px] w-full h-full">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-full rounded-2xl bg-[#16161B] shadow-[inset_0_2px_4px_rgba(0,0,0,0.55),0_2px_0_#0F0F12] border border-[#222228]/50"
            />
          ))}
        </div>

        {/* Active Animated Sliding and Colliding Tiles */}
        <div className="absolute inset-[12px] pointer-events-none">
          {playerTiles.map((tile) => {
            const style = getTileStyle(tile.value);

            return (
              <div
                key={tile.id}
                className={`absolute rounded-2xl ${tile.isFading ? 'opacity-60' : ''}`}
                style={{
                  width: 'calc((100% - 30px) / 4)',
                  height: 'calc((100% - 30px) / 4)',
                  transform: `translate3d(calc(${tile.col} * (100% + 10px)), calc(${tile.row} * (100% + 10px)), 0)`,
                  transition: 'transform 160ms cubic-bezier(0.2, 0.9, 0.35, 1)',
                  zIndex: tile.isFading ? 5 : style.zIndex,
                }}
              >
                {/* Physical 3D Elevation / Lift Layer based on Tile Value */}
                <div
                  className="w-full h-full transition-transform duration-150"
                  style={{
                    transform: `translateY(-${style.liftPx}px)`,
                  }}
                >
                  {/* Directional Overlap & Rebound Bounce Layer (Entire Square moves in slide direction) */}
                  <div
                    key={isBouncing ? `bounce-${bounceSeq}` : 'idle'}
                    className={`w-full h-full ${
                      isBouncing && bounceDir === 'LEFT'
                        ? 'animate-bounce-left'
                        : isBouncing && bounceDir === 'RIGHT'
                        ? 'animate-bounce-right'
                        : isBouncing && bounceDir === 'UP'
                        ? 'animate-bounce-up'
                        : isBouncing && bounceDir === 'DOWN'
                        ? 'animate-bounce-down'
                        : ''
                    }`}
                  >
                    {/* Visual 3D Tile Face (Whole Square with 3D Ledge, Shadows & Chamfer) */}
                    <div
                      style={{
                        backgroundColor: style.bg,
                        color: style.fg,
                        boxShadow: style.boxShadow,
                      }}
                      className={`w-full h-full rounded-2xl flex items-center justify-center font-display font-black select-none ${style.textClass} ${
                        tile.isMerged
                          ? 'animate-merge-collide'
                          : tile.isNew
                          ? 'animate-spawn-pop'
                          : ''
                      }`}
                    >
                      {tile.value}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: TACTILE CONTROLS (KEYBOARD HINT & 3D ARROW D-PAD) */}
      <div className="w-full mt-4 flex items-center justify-between px-2">
        <p className="text-xs text-[#64748B] flex items-center gap-1.5">
          <span>Use</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#1F1F24] border border-[#2B2B32] text-[10px] text-[#94A3B8]">
            Arrow Keys
          </kbd>
          <span>or swipe</span>
        </p>

        {/* 3D Extruded Arrow D-Pad */}
        <div className="grid grid-cols-3 gap-1.5 w-[140px]">
          <div />
          <button
            type="button"
            onClick={() => handlePlayerMove('UP')}
            className="w-10 h-10 rounded-xl bg-[#222228] shadow-[0_4px_0_#141418] hover:bg-[#2A2A32] active:translate-y-1 active:shadow-none flex items-center justify-center text-[#EDEDED] transition-all"
            aria-label="Move Up"
          >
            ▲
          </button>
          <div />

          <button
            type="button"
            onClick={() => handlePlayerMove('LEFT')}
            className="w-10 h-10 rounded-xl bg-[#222228] shadow-[0_4px_0_#141418] hover:bg-[#2A2A32] active:translate-y-1 active:shadow-none flex items-center justify-center text-[#EDEDED] transition-all"
            aria-label="Move Left"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => handlePlayerMove('DOWN')}
            className="w-10 h-10 rounded-xl bg-[#222228] shadow-[0_4px_0_#141418] hover:bg-[#2A2A32] active:translate-y-1 active:shadow-none flex items-center justify-center text-[#EDEDED] transition-all"
            aria-label="Move Down"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => handlePlayerMove('RIGHT')}
            className="w-10 h-10 rounded-xl bg-[#222228] shadow-[0_4px_0_#141418] hover:bg-[#2A2A32] active:translate-y-1 active:shadow-none flex items-center justify-center text-[#EDEDED] transition-all"
            aria-label="Move Right"
          >
            ▶
          </button>
        </div>
      </div>

      {/* SECTION 5: MATCH CONCLUSION MODAL / BANNER */}
      {isMatchEnded && (
        <div className="w-full mt-4 p-4 rounded-2xl bg-[#1A1A1E] border border-[#282830] shadow-xl flex flex-col items-center gap-3 animate-pop">
          <div className="text-center">
            {mode === 'duel' ? (
              <p className="font-display font-bold text-lg text-[#EDEDED]">
                {playerScore > cpuScore ? (
                  <span className="text-[#38C185]">🎉 YOU WON THE DUEL!</span>
                ) : playerScore === cpuScore ? (
                  <span className="text-[#94A3B8]">🤝 DUEL TIED!</span>
                ) : (
                  <span className="text-[#F0B247]">🤖 CPU BOT OUTSCORED YOU!</span>
                )}
              </p>
            ) : (
              <p className="font-display font-bold text-lg text-[#EDEDED]">
                {hasWon2048 ? (
                  <span className="text-[#38C185]">🏆 2048 CHAMPION!</span>
                ) : (
                  <span className="text-[#94A3B8]">GAME OVER — OUT OF MOVES!</span>
                )}
              </p>
            )}
            <p className="text-xs text-[#94A3B8] mt-1">
              Final Score: {playerScore} {mode === 'duel' ? `| CPU Score: ${cpuScore}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="h-[40px] px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#38C185] shadow-[0_4px_0_#237D55] text-[#081B12] hover:bg-[#42d494] active:translate-y-1 active:shadow-none transition-all duration-100"
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={onBack}
              className="h-[40px] px-5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#2A2A32] shadow-[0_4px_0_#18181D] text-[#EDEDED] hover:bg-[#32323C] active:translate-y-1 active:shadow-none transition-all duration-100"
            >
              Back to Games
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
