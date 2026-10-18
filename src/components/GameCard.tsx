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
      className={`group flex flex-col bg-[#1A1A1A] border border-[#262626] rounded-[26px] overflow-hidden transition-all duration-200 hover:border-[#38C185]/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] [--ring:theme(colors.game.s1)] ${
        game.featured
          ? 'col-span-2 max-[620px]:col-span-1'
          : 'col-span-1'
      }`}
    >
      <div
        className={`flex-1 min-h-[190px] grid place-items-center p-7 m-[8px_8px_0] rounded-[19px] max-[620px]:min-h-[180px] max-[620px]:p-[22px] ${
          game.featured
            ? 'min-h-[250px] max-[1180px]:min-h-[220px] max-[620px]:min-h-[180px]'
            : ''
        }`}
        style={{ backgroundColor: game.tint }}
      >
        <div style={{ width: `min(100%, ${game.artWidth})` }} className="[&>svg]:w-full [&>svg]:h-auto [&>svg]:block">
          <Art />
        </div>
      </div>
      <div
        className={`p-[20px_22px_22px] flex ${
          game.featured
            ? 'flex-row items-center justify-between max-[640px]:flex-col max-[640px]:items-stretch'
            : 'flex-col'
        } gap-[18px]`}
      >
        <div>
          {game.featured && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#38C185]/15 text-[#38C185] border border-[#38C185]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38C185] animate-pulse" />
                Featured Duel
              </span>
            </div>
          )}
          <h2
            className={`font-display font-semibold leading-[1.2] -tracking-[0.01em] text-[#EDEDED] ${
              game.featured
                ? 'text-[28px] max-[620px]:text-[24px]'
                : 'text-xl'
            }`}
          >
            {game.name}
          </h2>
          <p
            className={`text-[#94A3B8] mt-1 ${
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
            {(game.id === 'ttt' || game.id === 'merge') && onDemo && (
              <button
                type="button"
                className="h-[42px] px-5 rounded-full font-semibold text-sm transition-all duration-150 active:scale-[0.96] bg-[#252528] border border-[#333338] text-[#EDEDED] hover:bg-[#2D2D32] hover:border-[#38C185]/50 hover:text-white"
                onClick={() => onDemo(game.id)}
              >
                Demo
              </button>
            )}
            <button
              className={`h-[42px] px-[22px] rounded-full font-semibold text-sm transition-all duration-150 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed ${
                game.featured
                  ? 'bg-[#38C185] border border-[#38C185] text-[#081B12] hover:bg-[#42d494] shadow-[0_0_20px_rgba(56,193,133,0.3)]'
                  : 'bg-[#252528] border border-[#333338] text-[#EDEDED] hover:bg-[#2D2D32] hover:border-[#38C185]/50'
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
