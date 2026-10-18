import { GAME_ART } from '../art';
import type { Game, GameId } from '../types';
import { VersusBadge } from './VersusBadge';

interface Props {
  game: Game;
  onPlay: (id: GameId) => void;
}

export function GameCard({ game, onPlay }: Props) {
  const Art = GAME_ART[game.id];
  return (
    <article
      className={`group flex flex-col bg-game-s1 border border-game-line rounded-[26px] overflow-hidden transition-colors duration-200 hover:border-[#454a52] [--ring:theme(colors.game.s1)] ${
        game.featured
          ? 'row-span-2 max-[1180px]:col-span-full max-[1180px]:row-auto'
          : ''
      }`}
    >
      <div
        className={`flex-1 min-h-[190px] grid place-items-center p-7 m-[8px_8px_0] rounded-[19px] max-[620px]:min-h-[180px] max-[620px]:p-[22px] ${
          game.featured
            ? 'min-h-[340px] max-[1180px]:min-h-[300px] max-[620px]:min-h-[250px]'
            : ''
        }`}
        style={{ backgroundColor: game.tint }}
      >
        <div style={{ width: `min(100%, ${game.artWidth})` }} className="[&>svg]:w-full [&>svg]:h-auto [&>svg]:block">
          <Art />
        </div>
      </div>
      <div className="p-[20px_22px_22px] flex flex-col gap-[18px]">
        <div>
          <h2
            className={`font-display font-semibold leading-[1.2] -tracking-[0.01em] ${
              game.featured
                ? 'text-[28px] max-[620px]:text-[24px]'
                : 'text-xl'
            }`}
          >
            {game.name}
          </h2>
          <p
            className={`text-game-mu mt-1 ${
              game.featured ? 'text-[15px]' : 'text-sm'
            }`}
          >
            {game.description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <VersusBadge />
          <button
            className={`h-[42px] px-[22px] rounded-full font-semibold text-sm transition-all duration-150 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed ${
              game.featured
                ? 'bg-game-amb border border-game-amb text-[#1c1710] hover:bg-[#e0ad69]'
                : 'bg-game-s3 border border-[#3a3e45] text-game-tx hover:bg-[#383c43]'
            }`}
            aria-label={`Play ${game.name}`}
            onClick={() => onPlay(game.id)}
          >
            Play
          </button>
        </div>
      </div>
    </article>
  );
}
