import { Fragment } from 'react';
import { FRIENDS, GAMES, ME } from '../data';
import { Icon } from '../icons';
import type { GameId, Pending } from '../types';
import { Avatar } from './Avatar';
import { FriendRow } from './FriendRow';

interface Props {
  selectedId: string | null;
  pending: Pending | null;
  onSelect: (id: string) => void;
  onInvite: (gameId: GameId) => void;
}

export function FriendsPanel({ selectedId, pending, onSelect, onInvite }: Props) {
  return (
    <aside
      className="friends sticky top-0 h-[100dvh] overflow-y-auto p-[40px_20px_24px] border-l border-game-line [--ring:theme(colors.game.bg)] max-[959px]:static max-[959px]:h-auto max-[959px]:border-0 max-[959px]:p-[max(18px,env(safe-area-inset-top,0px))_18px_calc(96px+env(safe-area-inset-bottom,0px))]"
      aria-label="Friends"
    >
      <header className="flex items-center justify-between mb-7 min-h-[40px] px-2 max-[959px]:mb-5 max-[959px]:px-0">
        <h2 className="font-display font-semibold text-xl leading-[1.1] -tracking-[0.02em] max-[959px]:text-[26px]">
          Friends
        </h2>
        <span className="hidden max-[959px]:inline-flex">
          <Avatar person={ME} size="lg" />
        </span>
      </header>
      <div className="flex flex-col gap-1 max-[959px]:max-w-[520px]">
        {FRIENDS.map((f) => {
          const selected = f.id === selectedId;
          const canInvite = selected && !pending && f.status !== 'offline';
          return (
            <Fragment key={f.id}>
              <FriendRow
                friend={f}
                mode="panel"
                selected={selected}
                invited={pending?.friendId === f.id}
                onSelect={onSelect}
              />
              {canInvite && (
                <div className="flex gap-2 py-0.5 pb-2.5 pl-[62px]">
                  {GAMES.map((g) => (
                    <button
                      key={g.id}
                      className="w-[38px] h-[38px] rounded-xl bg-game-s2 border border-game-line grid place-items-center text-game-tx transition-all duration-150 hover:bg-game-s3 hover:text-game-lav active:scale-[0.92]"
                      title={g.name}
                      aria-label={`Invite ${f.name} to ${g.name}`}
                      onClick={() => onInvite(g.id)}
                    >
                      <Icon name={g.id} className="w-[18px] h-[18px]" />
                    </button>
                  ))}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </aside>
  );
}
