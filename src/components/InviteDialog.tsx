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
      className="w-[min(460px,calc(100vw-32px))] p-0 border border-white/15 rounded-[30px] bg-[#0c1622]/95 backdrop-blur-2xl text-[#EDEDED] backdrop:bg-black/75 backdrop:backdrop-blur-md open:animate-pop m-auto shadow-[0_25px_70px_rgba(0,0,0,0.7)] overflow-hidden select-none"
    >
      <div className="p-[28px_24px_22px]">
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
            <h3 id="dt" className="font-display font-bold text-[22px] leading-[1.2] pt-3.5 -tracking-[0.01em] text-white">
              Waiting for {waitingFor.name}
            </h3>
            <p className="text-[#94A3B8] mb-[18px] text-sm">{shown.name}</p>
            <button
              className="h-[42px] px-[22px] rounded-full bg-white/10 border border-white/15 text-[#EDEDED] font-semibold text-sm transition-all duration-150 hover:bg-white/20 active:scale-[0.96]"
              onClick={onCancel}
            >
              Cancel invite
            </button>
          </div>
        ) : (
          shown && (
            <>
              <h3 id="dt" className="font-display font-bold text-[22px] leading-[1.2] px-2 pb-1 -tracking-[0.01em] text-white">
                Invite to {shown.name}
              </h3>
              <p className="text-xs text-[#94A3B8] px-2 pb-4">
                Choose an online ally or anonymous match to duel
              </p>
              <div className="flex flex-col gap-1.5 max-h-[340px] overflow-y-auto pr-1" role="radiogroup" aria-label="Choose an opponent">
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
                  <div className="py-8 text-center text-xs text-[#94A3B8] bg-white/[0.03] rounded-2xl border border-white/10">
                    No online friends or matches available right now.
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-white/10">
                <button
                  className="h-[42px] px-5 rounded-full bg-transparent text-[#94A3B8] font-semibold text-sm hover:bg-white/10 hover:text-white transition-all duration-150 active:scale-95"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  className="h-[42px] px-6 rounded-full bg-gradient-to-r from-[#38C185] to-[#42d494] text-[#05180f] font-bold text-sm hover:brightness-105 shadow-[0_0_18px_rgba(56,193,133,0.35)] transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
