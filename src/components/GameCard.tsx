import type { CSSProperties } from 'react';
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
      className={game.featured ? 'card big' : 'card'}
      style={{ '--tint': game.tint, '--aw': game.artWidth } as CSSProperties}
    >
      <div className="art">
        <Art />
      </div>
      <div className="cb">
        <div className="ct">
          <h2>{game.name}</h2>
          <p>{game.description}</p>
        </div>
        <div className="cf">
          <VersusBadge />
          <button
            className={game.featured ? 'btn primary' : 'btn'}
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
