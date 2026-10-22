import { useState } from 'react';
import { GAME_ART } from '../art';
import type { Game, GameId } from '../types';
import { VersusBadge } from './VersusBadge';

interface Props {
  game: Game;
  onPlay: (id: GameId) => void;
  onDemo?: (id: GameId) => void;
}

export function GameCard({ game, onPlay }: Props) {
  const [imageError, setImageError] = useState(false);
  const Art = GAME_ART[game.id];

  return (
    <article
      className={`group relative flex flex-col justify-between rounded-[28px] sm:rounded-[32px] overflow-hidden border border-white/10 hover:border-[#38C185]/60 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_40px_rgba(56,193,133,0.25)] hover:-translate-y-1 select-none ${
        game.featured
          ? 'col-span-2 max-[620px]:col-span-1 min-h-[300px] sm:min-h-[340px]'
          : 'col-span-1 min-h-[270px] sm:min-h-[300px]'
      }`}
    >
      {/* ═══ Full Screen Background Thumbnail ═══ */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#0c1622]">
        {game.coverImage && !imageError ? (
          <img
            src={game.coverImage}
            alt={game.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-end p-8"
            style={{
              background: `radial-gradient(ellipse at 70% 50%, ${game.tint}e6 0%, rgba(9, 15, 23, 0.98) 100%)`,
            }}
          >
            {Art && (
              <div style={{ width: `min(100%, ${game.artWidth})` }} className="opacity-90">
                <Art />
              </div>
            )}
          </div>
        )}

        {/* ═══ Dimmed on the left side, transitioning to not dimmed on the right ═══ */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#060c14]/95 via-[#060c14]/85 sm:via-[#070e17]/80 via-40% sm:to-transparent to-[#060c14]/40 pointer-events-none transition-opacity duration-300"
          aria-hidden="true"
        />

        {/* Subtle vertical vignette for crisp legibility */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#060c14]/80 via-transparent to-black/20 pointer-events-none"
          aria-hidden="true"
        />

        {/* Ambient glow highlight on hover */}
        <div
          className="absolute -top-20 -left-20 w-64 h-64 bg-[#38C185]/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          aria-hidden="true"
        />
      </div>

      {/* ═══ Left Side Content: Title, Description, and Play button on the bottom ═══ */}
      <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-8 max-w-[340px] sm:max-w-[420px] gap-6">
        {/* Left-side header & description */}
        <div className="flex flex-col items-start text-left">
          {game.featured && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full text-xs font-semibold bg-[#38C185]/20 text-[#38C185] border border-[#38C185]/40 shadow-[0_0_12px_rgba(56,193,133,0.25)] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38C185] animate-pulse" />
              <span>Featured Duel</span>
            </div>
          )}

          <h2
            className={`font-display font-bold leading-tight -tracking-[0.01em] text-white group-hover:text-[#38C185] transition-colors drop-shadow-md ${
              game.featured ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
            }`}
          >
            {game.name}
          </h2>

          <p className="text-[#CBD5E1] text-xs sm:text-sm leading-relaxed mt-2.5 drop-shadow-sm font-medium">
            {game.description}
          </p>
        </div>

        {/* Play button directly on the bottom of the description */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            className="h-[44px] px-7 rounded-full font-bold text-sm transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-[#38C185] to-[#42d494] text-[#05180f] shadow-[0_0_20px_rgba(56,193,133,0.35)] hover:shadow-[0_0_30px_rgba(56,193,133,0.6)] hover:brightness-105"
            aria-label={`Play ${game.name}`}
            onClick={() => onPlay(game.id)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Play</span>
          </button>

          <VersusBadge />
        </div>
      </div>
    </article>
  );
}
