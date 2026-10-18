import { useEffect, useRef } from 'react';
import { FRIENDS, GAMES, ME } from '../data';
import type { Game, Pending } from '../types';
import { Avatar } from './Avatar';
import { FriendRow } from './FriendRow';

interface Props {
  open: boolean;
  game: Game | null;
  friendId: string | null;
  pending: Pending | null;
  onPick: (id: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export function InviteDialog({ open, game, friendId, pending, onPick, onSend, onCancel, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const shown = pending ? GAMES.find((g) => g.id === pending.gameId) : game;
  const waitingFor = pending ? FRIENDS.find((f) => f.id === pending.friendId) : undefined;
  const canSend = FRIENDS.some((f) => f.id === friendId && f.status !== 'offline');

  return (
    <dialog
      ref={ref}
      aria-labelledby="dt"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dlg">
        {shown && waitingFor ? (
          <div className="pend">
            <div className="pair">
              <Avatar person={ME} size="xl" />
              <span className="wait" aria-hidden="true"><i /><i /><i /></span>
              <Avatar person={waitingFor} size="xl" />
            </div>
            <h3 id="dt">Waiting for {waitingFor.name}</h3>
            <p>{shown.name}</p>
            <button className="btn" onClick={onCancel}>Cancel invite</button>
          </div>
        ) : (
          shown && (
            <>
              <h3 id="dt">{shown.name}</h3>
              <div className="fl" role="radiogroup" aria-label="Choose an opponent">
                {FRIENDS.map((f) => (
                  <FriendRow key={f.id} friend={f} mode="pick" selected={f.id === friendId} invited={false} onSelect={onPick} />
                ))}
              </div>
              <div className="acts">
                <button className="btn ghost" onClick={onClose}>Close</button>
                <button className="btn lav" disabled={!canSend} onClick={onSend}>Send invite</button>
              </div>
            </>
          )
        )}
      </div>
    </dialog>
  );
}
