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
    <aside className="friends" aria-label="Friends">
      <header className="top">
        <h2>Friends</h2>
        <span className="me">
          <Avatar person={ME} size="lg" />
        </span>
      </header>
      <div className="fl">
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
                <div className="ex">
                  {GAMES.map((g) => (
                    <button
                      key={g.id}
                      className="ib"
                      title={g.name}
                      aria-label={`Invite ${f.name} to ${g.name}`}
                      onClick={() => onInvite(g.id)}
                    >
                      <Icon name={g.id} />
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
