import { GAME_ART } from '../art';
import type { Game, GameId } from '../types';
import { VersusBadge } from './VersusBadge';

interface Props {
  game: Game;
  onPlay: (id: GameId) => void;
  onDemo?: (id: GameId) => void;
}

export function GameCard({ game, onPlay, onDemo }: Props) {
  const Art = GAME_ART[game.id];
  return (
    <article
      className={`group relative flex flex-col bg-[#0c1622]/70 hover:bg-[#0f1e2f]/85 backdrop-blur-xl border border-white/10 hover:border-[#38C185]/60 rounded-[30px] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_35px_rgba(56,193,133,0.2)] hover:-translate-y-1 ${
        game.featured
          ? 'col-span-2 max-[620px]:col-span-1'
          : 'col-span-1'
      }`}
    >
      {/* Ambient background glow on hover */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#38C185]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#38C185]/12 transition-colors duration-500" />

      <div
        className={`relative flex-1 min-h-[190px] grid place-items-center p-7 m-[10px_10px_0] rounded-[22px] overflow-hidden border border-white/5 ${
          game.featured
            ? 'min-h-[250px] max-[1180px]:min-h-[220px] max-[620px]:min-h-[180px]'
            : ''
        }`}
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${game.tint}e6 0%, rgba(9, 15, 23, 0.95) 100%)`,
        }}
      >
        <div
          style={{ width: `min(100%, ${game.artWidth})` }}
          className="[&>svg]:w-full [&>svg]:h-auto [&>svg]:block transition-transform duration-500 group-hover:scale-[1.04]"
        >
          <Art />
        </div>
      </div>

      <div
        className={`p-[20px_24px_24px] flex ${
          game.featured
            ? 'flex-row items-center justify-between max-[640px]:flex-col max-[640px]:items-stretch'
            : 'flex-col'
        } gap-[18px] relative z-10`}
      >
        <div>
          {game.featured && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#38C185]/20 text-[#38C185] border border-[#38C185]/40 shadow-[0_0_12px_rgba(56,193,133,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38C185] animate-pulse" />
                Featured Duel
              </span>
            </div>
          )}
          <h2
            className={`font-display font-bold leading-[1.2] -tracking-[0.01em] text-white group-hover:text-[#38C185] transition-colors ${
              game.featured
                ? 'text-[28px] max-[620px]:text-[24px]'
                : 'text-xl'
            }`}
          >
            {game.name}
          </h2>
          <p
            className={`text-[#94A3B8] mt-1.5 ${
              game.featured ? 'text-[15px]' : 'text-sm'
            }`}
          >
            {game.description}
          </p>
        </div>

        <div
          className={`flex items-center justify-between gap-4 ${
            game.featured ? 'max-[640px]:w-full' : ''
          }`}
        >
          <VersusBadge />
          <div className="flex items-center gap-2">
            {(game.id === 'ttt' || game.id === 'merge' || game.id === 'clue') && onDemo && (
              <button
                type="button"
                className="h-[42px] px-5 rounded-full font-semibold text-sm transition-all duration-200 active:scale-95 bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-md hover:border-[#38C185]/50 hover:text-white"
                onClick={() => onDemo(game.id)}
              >
                Demo
              </button>
            )}
            <button
              className={`h-[42px] px-[22px] rounded-full font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                game.featured
                  ? 'bg-gradient-to-r from-[#38C185] to-[#42d494] text-[#05180f] shadow-[0_0_20px_rgba(56,193,133,0.35)] hover:shadow-[0_0_30px_rgba(56,193,133,0.6)] hover:brightness-105'
                  : 'bg-white/10 hover:bg-[#38C185] hover:text-[#05180f] border border-white/15 hover:border-[#38C185] text-white'
              }`}
              aria-label={`Play ${game.name}`}
              onClick={() => onPlay(game.id)}
            >
              Play
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
