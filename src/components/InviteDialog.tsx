import { useEffect, useRef } from 'react';
import { GAMES, ME } from '../data';
import type { Friend, Game, Pending, Person } from '../types';
import { Avatar } from './Avatar';
import { FriendRow } from './FriendRow';

interface Props {
  open: boolean;
  game: Game | null;
  friendId: string | null;
  pending: Pending | null;
  opponents?: Friend[];
  mePerson?: Person;
  onPick: (id: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export function InviteDialog({
  open,
  game,
  friendId,
  pending,
  opponents = [],
  mePerson = ME,
  onPick,
  onSend,
  onCancel,
  onClose,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const shown = pending ? GAMES.find((g) => g.id === pending.gameId) : game;
  const waitingFor = pending ? opponents.find((f) => f.id === pending.friendId) : undefined;
  const canSend = opponents.some((f) => f.id === friendId && f.status !== 'offline');

  return (
    <dialog
      ref={ref}
      aria-labelledby="dt"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="w-[min(440px,calc(100vw-32px))] p-0 border border-[#262626] rounded-[28px] bg-[#1A1A1A] text-[#EDEDED] backdrop:bg-black/70 backdrop:backdrop-blur-sm open:animate-pop m-auto shadow-2xl [--ring:theme(colors.game.s1)]"
    >
      <div className="p-[26px_22px_20px]">
        {shown && waitingFor ? (
          <div className="text-center py-[14px] pb-1 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-4">
              <Avatar person={mePerson} size="xl" />
              <span className="flex gap-1.5" aria-hidden="true">
                <i className="w-1.5 h-1.5 rounded-full bg-[#F0B247] animate-blink" />
                <i className="w-1.5 h-1.5 rounded-full bg-[#F0B247] animate-blink [animation-delay:0.2s]" />
                <i className="w-1.5 h-1.5 rounded-full bg-[#F0B247] animate-blink [animation-delay:0.4s]" />
              </span>
              <Avatar person={waitingFor} size="xl" />
            </div>
            <h3 id="dt" className="font-display font-semibold text-[22px] leading-[1.2] pt-3.5 -tracking-[0.01em] text-[#EDEDED]">
              Waiting for {waitingFor.name}
            </h3>
            <p className="text-[#94A3B8] mb-[18px] text-sm">{shown.name}</p>
            <button
              className="h-[42px] px-[22px] rounded-full bg-[#252528] border border-[#333338] text-[#EDEDED] font-semibold text-sm transition-all duration-150 hover:bg-[#2e2e33] active:scale-[0.96]"
              onClick={onCancel}
            >
              Cancel invite
            </button>
          </div>
        ) : (
          shown && (
            <>
              <h3 id="dt" className="font-display font-semibold text-[22px] leading-[1.2] px-2 pb-1 -tracking-[0.01em] text-[#EDEDED]">
                Invite to {shown.name}
              </h3>
              <p className="text-xs text-[#94A3B8] px-2 pb-4">
                Choose an online ally or anonymous match to duel
              </p>
              <div className="flex flex-col gap-1 max-h-[340px] overflow-y-auto pr-1" role="radiogroup" aria-label="Choose an opponent">
                {opponents.length > 0 ? (
                  opponents.map((f) => (
                    <FriendRow
                      key={f.id}
                      friend={f}
                      mode="pick"
                      selected={f.id === friendId}
                      invited={false}
                      onSelect={onPick}
                    />
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-[#94A3B8] bg-[#121212] rounded-xl border border-[#262626]">
                    No online friends or matches available right now.
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-[18px]">
                <button
                  className="h-[42px] px-[22px] rounded-full bg-transparent text-[#94A3B8] font-semibold text-sm hover:bg-[#252528] hover:text-[#EDEDED] transition-all duration-150 active:scale-[0.96]"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  className="h-[42px] px-[22px] rounded-full bg-[#38C185] border border-[#38C185] text-[#081B12] font-semibold text-sm hover:bg-[#42d494] shadow-[0_0_16px_rgba(56,193,133,0.3)] transition-all duration-150 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!canSend}
                  onClick={onSend}
                >
                  Send invite
                </button>
              </div>
            </>
          )
        )}
      </div>
    </dialog>
  );
}
