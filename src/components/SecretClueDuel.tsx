import React, { useState, useEffect, useRef } from 'react';
import type { GameUser } from '../lib/auth';
import type { DuelApi } from '../hooks/useDuel';
import { GameModal, GameWoodButton } from './GameModal';

interface Props {
  onBack: () => void;
  user: GameUser;
  duel: DuelApi;
}

class ClueSoundFx {
  private ctx: AudioContext | null = null;
  public enabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ally_clue_sound');
      if (saved !== null) this.enabled = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playKey() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(560 + Math.random() * 40, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch { }
  }

  playClueReveal() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [659.25, 880, 1174.66];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + i * 0.05;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch { }
  }

  playCorrect() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + i * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.38);
      });
    } catch { }
  }

  playWrong() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [220, 196];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + i * 0.1;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.06, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch { }
  }

  playTimeout() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [440, 392, 349.23, 293.66];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = this.ctx!.currentTime + i * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.07, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.28);
      });
    } catch { }
  }

  playTick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch { }
  }
}

const sfx = new ClueSoundFx();

export function SecretClueDuel({ onBack, duel }: Props) {
  const [guessInput, setGuessInput] = useState('');
  const [inputFeedback, setInputFeedback] = useState<string | null>(null);
  const [isInputShaking, setIsInputShaking] = useState(false);
  const [soundOn, setSoundOn] = useState(() => sfx.enabled);
  const [showSettings, setShowSettings] = useState(false);

  // Ticking for clock & countdowns
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 350);
    return () => clearInterval(id);
  }, []);

  const state = (duel.session.state || {}) as {
    round?: number;
    totalRounds?: number;
    role?: 'guesser' | 'giver';
    phase?: 'playing' | 'resolved';
    roundStartsAt?: number;
    roundEndsAt?: number;
    nextRoundAt?: number | null;
    category?: string;
    word?: string;
    wordLength?: number;
    revealedClues?: Array<{ index: number; text: string }>;
    allClues?: Array<{ index: number; text: string; revealed: boolean }>;
    clueRequested?: boolean;
    clueRequestedAt?: number | null;
    wrongGuesses?: string[];
    result?: {
      type: 'solved' | 'timeout';
      word: string;
      funFact?: string | null;
      guesserPoints: number;
      giverPoints: number;
      breakdown?: {
        base: number;
        time: number;
        clueBonus: number;
      };
    } | null;
  };

  const role = state.role ?? 'guesser';
  const isGiver = role === 'giver';
  const isGuesser = role === 'guesser';
  const phase = state.phase ?? 'playing';
  const isResolved = phase === 'resolved';

  const roundNum = (state.round ?? 0) + 1;
  const totalRounds = state.totalRounds ?? 6;

  const now = duel.now();
  const startsAt = state.roundStartsAt ?? now;
  const isIntro = now < startsAt;
  const endsAt = state.roundEndsAt ?? now;
  const timeLeft = Math.max(0, Math.ceil((endsAt - now) / 1000));

  // Only the giver or anyone when the round is resolved gets the target word
  const targetWord = (isGiver || isResolved) && state.word ? state.word.toUpperCase() : '';
  const wordLength = state.wordLength || (targetWord ? targetWord.length : 5);

  // Clue bonus: 60 with 1 clue, drops by 20 for each additional clue asked (60 -> 40 -> 20 -> 0)
  const revealedCount = state.revealedClues?.length || 1;
  const currentClueBonus = revealedCount <= 1 ? 60 : revealedCount === 2 ? 40 : revealedCount === 3 ? 20 : 0;

  // Clear guess input whenever the round, phase, or role transitions
  useEffect(() => {
    setGuessInput('');
    setInputFeedback(null);
  }, [state.round, phase, role]);

  const toggleSound = () => {
    const next = !soundOn;
    sfx.enabled = next;
    setSoundOn(next);
    localStorage.setItem('ally_clue_sound', String(next));
  };

  // Sound triggers on phase or wrong guesses changes
  const prevPhase = useRef(phase);
  const prevWrongCount = useRef(state.wrongGuesses?.length || 0);
  const prevClueCount = useRef(state.revealedClues?.length || 0);

  useEffect(() => {
    if (phase !== prevPhase.current) {
      if (phase === 'resolved') {
        if (state.result?.type === 'solved') sfx.playCorrect();
        else sfx.playTimeout();
      }
      prevPhase.current = phase;
    }

    const wrongCount = state.wrongGuesses?.length || 0;
    if (wrongCount > prevWrongCount.current) {
      sfx.playWrong();
      prevWrongCount.current = wrongCount;
    }

    const clueCount = state.revealedClues?.length || 0;
    if (clueCount > prevClueCount.current) {
      sfx.playClueReveal();
      prevClueCount.current = clueCount;
    }
  }, [phase, state.result, state.wrongGuesses, state.revealedClues]);

  // Tick sound when time <= 6s
  useEffect(() => {
    if (phase === 'playing' && !isIntro && timeLeft <= 6 && timeLeft > 0) {
      sfx.playTick();
    }
  }, [timeLeft, phase, isIntro]);

  const handleGuessSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phase !== 'playing' || !isGuesser || !guessInput.trim() || isIntro) return;

    sfx.playKey();
    const clean = guessInput.trim().toUpperCase().replace(/[^A-Z]/g, '');
    const res = await duel.sendMove({ type: 'guess', word: clean });
    if (!res.ok) {
      setIsInputShaking(true);
      setInputFeedback(res.message || 'Guess failed');
      setTimeout(() => {
        setIsInputShaking(false);
        setInputFeedback(null);
      }, 1000);
    } else {
      setGuessInput('');
      setInputFeedback(null);
    }
  };

  const handleRequestClue = async () => {
    if (phase !== 'playing' || !isGuesser || state.clueRequested) return;
    sfx.playKey();
    await duel.sendMove({ type: 'request_clue' });
  };

  const handleGiveClue = async (index: number) => {
    if (phase !== 'playing' || !isGiver) return;
    sfx.playClueReveal();
    await duel.sendMove({ type: 'give_clue', clueIndex: index });
  };

  return (
    <>
      {/* ═══ Immersive Background Layer ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070d14]" aria-hidden="true">
        <img
          src="/roadmap-bg-landscape.png"
          alt=""
          className="w-full h-full object-cover object-top filter brightness-[0.8] contrast-[1.12] saturate-[1.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060c14]/60 via-[#070d16]/75 to-[#04070c]/90" />
      </div>

      {/* ═══ Main Game Container ═══ */}
      <div className="relative z-10 w-full max-w-[480px] h-[100dvh] max-h-[100dvh] mx-auto py-2 sm:py-3 px-3.5 flex flex-col items-center justify-between overflow-hidden select-none touch-none overscroll-none">

        {/* TOP ROW: Back button & Settings */}
        <div className="w-full flex items-center justify-between mb-1 px-1 flex-shrink-0">
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
            <span className="tracking-wide">Exit Duel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-100 cursor-pointer"
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
              className="relative z-10 w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#4a3219] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* STATS PODS: YOU / ROUND + TIMER / OPPONENT */}
        <div className="w-full max-w-[430px] grid grid-cols-3 gap-2 px-1 mb-1.5 flex-shrink-0 select-none">
          {/* YOU */}
          <div className="relative aspect-[1.56/1] flex flex-col items-center justify-center p-1.5 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]">
            <img
              src="/ui-pod.png"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
              draggable={false}
            />
            <span className="relative z-10 text-[9px] font-black uppercase tracking-wider text-[#6a4c28] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              YOU
            </span>
            <span className="relative z-10 text-base sm:text-lg font-black font-display text-[#382613] leading-none mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {duel.session.scores.you}
            </span>
          </div>

          {/* TIMER + ROUND */}
          <div className="relative aspect-[1.56/1] flex flex-col items-center justify-center p-1.5 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]">
            <img
              src="/ui-pod.png"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
              draggable={false}
            />
            <span className="relative z-10 text-[8px] font-black uppercase tracking-wider text-[#6a4c28] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              ROUND {roundNum}/{totalRounds}
            </span>
            <span
              className={`relative z-10 text-base sm:text-lg font-black font-mono leading-none mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] ${
                timeLeft <= 15 ? 'text-[#DC2626] animate-pulse' : 'text-[#382613]'
              }`}
            >
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>

          {/* OPPONENT */}
          <div className="relative aspect-[1.56/1] flex flex-col items-center justify-center p-1.5 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]">
            <img
              src="/ui-pod.png"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
              draggable={false}
            />
            <span className="relative z-10 text-[9px] font-black uppercase tracking-wider text-[#6a4c28] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] truncate max-w-[80px]">
              {duel.opponentName.toUpperCase()}
            </span>
            <span className="relative z-10 text-base sm:text-lg font-black font-display text-[#382613] leading-none mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {duel.session.scores.opponent}
            </span>
          </div>
        </div>

        {/* ROLE BADGE */}
        <div className="w-full max-w-[430px] flex items-center justify-center mb-1">
          <div className="px-3 py-1 rounded-full bg-[#152638]/90 border border-[#38C185]/40 text-center shadow-sm">
            <span className="text-[11px] font-extrabold tracking-wide text-white">
              {isGuesser ? '🔍 YOU ARE GUESSING' : '💡 YOU ARE GIVING CLUES'}
            </span>
          </div>
        </div>

        {/* SECRET WORD TABLET (Wood Container) */}
        <div className="relative w-full max-w-[430px] aspect-[994/340] sm:aspect-[994/310] flex flex-col items-center justify-center filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] my-auto">
          <img
            src="/secret-word-wood.png"
            alt=""
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
            draggable={false}
          />

          <div className="relative z-10 w-[84%] flex flex-col items-center justify-center text-center">
            <span className="font-display font-black text-[10px] sm:text-xs uppercase tracking-widest text-[#5a3e20] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] mb-1">
              {isGiver || isResolved ? 'SECRET WORD' : `CATEGORY: ${state.category?.toUpperCase() || 'MYSTERY'}`}
            </span>

            {/* Letter Slots */}
            <div className={`flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap ${isInputShaking ? 'animate-shake' : ''}`}>
              {isGiver || isResolved
                ? targetWord.split('').map((char, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-7 sm:w-7 sm:h-8 rounded-md flex items-center justify-center font-display font-black text-xs sm:text-sm bg-[#382613] text-white shadow-sm"
                    >
                      {char}
                    </div>
                  ))
                : Array.from({ length: wordLength }).map((_, idx) => {
                    const typed = guessInput[idx];
                    return (
                      <div
                        key={idx}
                        className={`w-6 h-7 sm:w-7 sm:h-8 rounded-md flex items-center justify-center font-display font-black text-xs sm:text-sm ${
                          typed
                            ? 'bg-[#382613] text-[#F0B247] border-b-2 border-[#F0B247]'
                            : 'bg-[#5c4024]/30 text-transparent border-b-2 border-[#382613]'
                        }`}
                      >
                        {typed || '_'}
                      </div>
                    );
                  })}
            </div>

            {/* Sub-label */}
            <div className="mt-1 text-[10px] font-bold text-[#5c4024]">
              {isResolved ? (
                <div className="flex flex-col items-center">
                  <span className="text-[#38C185] font-black text-xs">
                    {state.result?.type === 'solved'
                      ? `🎉 Word Cracked! +${state.result.guesserPoints} PTS`
                      : '⏰ Time Expired! Giver earned stump bonus'}
                  </span>
                  {state.result?.type === 'solved' && state.result.breakdown && (
                    <span className="text-[9px] text-[#7a5732] font-semibold mt-0.5">
                      Base: {state.result.breakdown.base} • Time: +{state.result.breakdown.time} • Clue Bonus: +{state.result.breakdown.clueBonus} pts
                    </span>
                  )}
                  <span className="text-[9px] text-[#5c4024]/80 mt-0.5">Next round soon...</span>
                </div>
              ) : isGiver ? (
                <span>Category: {state.category || 'Clue'} • {wordLength} letters</span>
              ) : (
                <div className="flex items-center gap-1.5 justify-center flex-wrap">
                  <span>{wordLength} Letters • Type your guess</span>
                  <span className="text-[9px] font-black text-[#1b432a] bg-[#38C185]/30 border border-[#38C185]/60 px-1.5 py-0.5 rounded-full" title="Asking for another clue reduces this bonus by 20 pts">
                    Clue Bonus: +{currentClueBonus} pts
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CLUES LIST SECTION */}
        <div className="w-full max-w-[430px] flex flex-col gap-1.5 my-1 overflow-y-auto max-h-[190px] pr-1">
          {state.revealedClues && state.revealedClues.length > 0 ? (
            state.revealedClues.map((c, i) => (
              <div
                key={c.index}
                className="p-2 sm:p-2.5 rounded-xl bg-[#0c1622]/90 border border-[#38C185]/35 shadow-sm text-left flex items-start gap-2"
              >
                <span className="px-1.5 py-0.5 rounded-md bg-[#38C185]/20 text-[#38C185] font-black text-[9px] uppercase tracking-wider flex-none">
                  Clue #{i + 1}
                </span>
                <p className="text-xs sm:text-[13px] text-white/95 font-medium leading-snug">{c.text}</p>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-xs text-[#94A3B8] bg-black/20 rounded-xl border border-white/5">
              No clues revealed yet.
            </div>
          )}
        </div>

        {/* GIVER: CLUE REQUESTED CALLOUT */}
        {isGiver && state.clueRequested && phase === 'playing' && (
          <div className="w-full max-w-[430px] p-2 rounded-xl bg-[#F0B247]/20 border border-[#F0B247] text-center animate-bounce mb-1">
            <span className="text-xs font-black text-[#FFE2A8]">
              🔔 {duel.opponentName} requested an extra clue! Pick one below to reveal:
            </span>
          </div>
        )}

        {/* GIVER: PICK A CLUE TO REVEAL */}
        {isGiver && state.allClues && phase === 'playing' && state.clueRequested && (
          <div className="w-full max-w-[430px] flex flex-col gap-1 mb-1">
            {state.allClues
              .filter((c) => !c.revealed)
              .map((c) => (
                <button
                  key={c.index}
                  type="button"
                  onClick={() => handleGiveClue(c.index)}
                  className="w-full p-2 text-left text-xs bg-white/10 hover:bg-[#38C185]/30 hover:border-[#38C185] border border-white/20 rounded-xl text-white font-medium transition-all active:scale-95"
                >
                  <span className="font-bold text-[#F0B247] mr-1.5">Reveal:</span>
                  {c.text}
                </button>
              ))}
          </div>
        )}

        {/* WRONG GUESSES STREAM */}
        {state.wrongGuesses && state.wrongGuesses.length > 0 && (
          <div className="w-full max-w-[430px] flex items-center gap-1.5 flex-wrap px-1 my-0.5">
            <span className="text-[10px] font-bold text-[#94A3B8]">Misses:</span>
            {state.wrongGuesses.map((w, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold line-through"
              >
                {w}
              </span>
            ))}
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="w-full max-w-[430px] flex-shrink-0 mt-1">
          {isGuesser && phase === 'playing' ? (
            <div className="flex flex-col gap-1.5">
              <form onSubmit={handleGuessSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, wordLength))}
                  placeholder={`GUESS (${wordLength} LETTERS)`}
                  disabled={isIntro}
                  maxLength={wordLength}
                  className="flex-1 h-11 px-3.5 rounded-full bg-[#0c1622]/90 border border-white/20 text-white font-display font-black text-sm tracking-wider uppercase focus:outline-none focus:border-[#38C185] placeholder:text-[#64748B]"
                />
                <button
                  type="submit"
                  disabled={!guessInput.trim() || isIntro}
                  className="h-11 px-5 rounded-full bg-gradient-to-r from-[#38C185] to-[#42d494] text-[#05180f] font-black text-sm hover:brightness-105 active:scale-95 disabled:opacity-40 shadow-md"
                >
                  Guess
                </button>
              </form>
              {inputFeedback && (
                <p className="text-[10px] font-bold text-rose-400 text-center">{inputFeedback}</p>
              )}

              <button
                type="button"
                onClick={handleRequestClue}
                disabled={(state.revealedClues?.length || 0) >= 4 || state.clueRequested || isIntro}
                className="w-full h-9 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition-all active:scale-95 disabled:opacity-40"
              >
                {state.clueRequested
                  ? `Waiting for ${duel.opponentName} to reveal a clue...`
                  : (state.revealedClues?.length || 0) >= 4
                  ? 'All 4 clues revealed (0 clue bonus)'
                  : `💡 Ask for Extra Clue (-20 pts bonus) • ${4 - (state.revealedClues?.length || 1)} left`}
              </button>
            </div>
          ) : isGiver && phase === 'playing' ? (
            <div className="text-center py-2 px-3 rounded-full bg-black/30 border border-white/10 text-xs text-[#94A3B8]">
              {duel.opponentName} is investigating clues and preparing a deduction...
            </div>
          ) : (
            <div className="text-center py-2 px-3 rounded-full bg-black/30 border border-white/10 text-xs text-[#38C185] font-bold">
              Preparing next turn...
            </div>
          )}
        </div>
      </div>

      {/* SETTINGS MODAL */}
      <GameModal open={showSettings} onClose={() => setShowSettings(false)}>
        <div className="flex flex-col gap-2.5 w-full">
          <GameWoodButton colSpan={2} onClick={toggleSound}>
            {soundOn ? 'Sound: ON' : 'Sound: OFF'}
          </GameWoodButton>
          <GameWoodButton colSpan={2} onClick={() => setShowSettings(false)}>
            Back to Game
          </GameWoodButton>
          <GameWoodButton colSpan={2} onClick={onBack}>
            Exit to Games
          </GameWoodButton>
        </div>
      </GameModal>
    </>
  );
}
