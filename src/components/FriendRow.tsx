import type { Friend } from '../types';
import { Avatar } from './Avatar';

interface Props {
  friend: Friend;
  mode: 'panel' | 'pick';
  selected: boolean;
  invited: boolean;
  onSelect: (id: string) => void;
}

export function FriendRow({ friend, mode, selected, invited, onSelect }: Props) {
  const a11y =
    mode === 'pick' ? { role: 'radio', 'aria-checked': selected } : { 'aria-pressed': selected };

  const isOnline = friend.status === 'online';

  return (
    <button
      className={`w-full flex items-center gap-3 p-[9px_10px] rounded-2xl border text-left transition-all duration-150 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 ${
        selected
          ? mode === 'pick'
            ? 'bg-[#152638] border-[#38C185] shadow-[0_0_16px_rgba(56,193,133,0.25)]'
            : 'bg-[#132335]/90 border-[#38C185]/70 shadow-[0_0_18px_rgba(56,193,133,0.22)]'
          : mode === 'pick'
          ? 'border-transparent hover:not(:disabled):bg-white/5'
          : 'border-transparent hover:not(:disabled):bg-white/5'
      }`}
      disabled={!isOnline}
      onClick={() => onSelect(friend.id)}
      {...a11y}
    >
      <span className="relative inline-flex flex-none">
        <Avatar person={friend} size="lg" />
        <i
          className={`absolute -right-[1px] -bottom-[1px] w-[11px] h-[11px] rounded-full border-[2.5px] border-[#0a121c] ${
            isOnline
              ? 'bg-[#38C185] shadow-[0_0_6px_#38C185]'
              : friend.status === 'away'
              ? 'bg-[#F0B247]'
              : 'bg-[#5b5f67]'
          }`}
        />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[#EDEDED] truncate flex items-center gap-1.5">
          <span className="truncate">{friend.name}</span>
          {friend.isAnonymous && (
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[#38C185]/15 text-[#38C185] border border-[#38C185]/30 flex-none leading-normal">
              Match
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#94A3B8]">
          <span className={isOnline ? 'text-[#38C185]' : 'text-[#64748B]'}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {friend.streak !== undefined && friend.streak > 0 && (
            <span className="text-[#F0B247] font-medium flex items-center gap-0.5">
              🔥 {friend.streak}d
            </span>
          )}
        </div>
      </div>
      {invited && <span className="text-[12.5px] text-[#F0B247] font-semibold flex-none">Invited</span>}
    </button>
  );
}
