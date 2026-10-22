import { useEffect, useRef } from 'react';
import type { Game } from '../types';

interface Props {
  open: boolean;
  game: Game | null;
  onSolo: () => void;
  onFriends: () => void;
  onClose: () => void;
}

export function GameModeDialog({ open, game, onSolo, onFriends, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  if (!game) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby="gamemode-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="w-[min(480px,calc(100vw-32px))] p-0 border border-white/15 rounded-[30px] bg-[#0c1622]/95 backdrop-blur-2xl text-[#EDEDED] backdrop:bg-black/80 backdrop:backdrop-blur-md open:animate-pop m-auto shadow-[0_25px_70px_rgba(0,0,0,0.7)] overflow-hidden select-none"
    >
      <div className="p-6 sm:p-7 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            {game.coverImage && (
              <img
                src={game.coverImage}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-white/15 shadow-sm"
              />
            )}
            <div>
              <h3 id="gamemode-title" className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight">
                {game.name}
              </h3>
              <p className="text-xs text-[#94A3B8]">Choose your gamemode</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {/* Option 1: Solo */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSolo();
            }}
            className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] hover:bg-amber-500/10 border border-white/10 hover:border-amber-400/60 transition-all duration-200 text-left cursor-pointer hover:shadow-[0_8px_24px_rgba(245,158,11,0.15)] hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform shadow-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-display font-bold text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors">
                  Solo
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Casual / CPU
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Play alone against the CPU AI or try to beat your highest score.
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-amber-400 group-hover:text-[#0c1622] text-[#94A3B8] flex items-center justify-center transition-all shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Option 2: Play with Friends */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onFriends();
            }}
            className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] hover:bg-[#38C185]/10 border border-white/10 hover:border-[#38C185]/70 transition-all duration-200 text-left cursor-pointer hover:shadow-[0_8px_24px_rgba(56,193,133,0.2)] hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#38C185]/15 border border-[#38C185]/35 flex items-center justify-center shrink-0 text-[#38C185] group-hover:scale-105 transition-transform shadow-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-display font-bold text-base sm:text-lg text-white group-hover:text-[#38C185] transition-colors">
                  Play with Friends
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#38C185]/20 text-[#38C185] border border-[#38C185]/35">
                  1v1 Duel • Ranked
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Invite an online friend or campus match to a real-time live duel.
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#38C185] group-hover:text-[#0c1622] text-[#94A3B8] flex items-center justify-center transition-all shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </dialog>
  );
}
