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
  return (
    <button
      className={`w-full flex items-center gap-3 p-[9px_10px] rounded-2xl border text-left transition-all duration-150 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 ${
        selected
          ? mode === 'pick'
            ? 'bg-[#202024] border-[#38C185]'
            : 'bg-[#1A1A1A] border-[#38C185]/60 shadow-[0_0_12px_rgba(56,193,133,0.15)]'
          : mode === 'pick'
          ? 'border-transparent hover:not(:disabled):bg-[#202024]'
          : 'border-transparent hover:not(:disabled):bg-[#1A1A1A]'
      }`}
      disabled={friend.status === 'offline'}
      onClick={() => onSelect(friend.id)}
      {...a11y}
    >
      <span className="relative inline-flex">
        <Avatar person={friend} size="lg" />
        <i
          className={`absolute -right-[1px] -bottom-[1px] w-[11px] h-[11px] rounded-full border-[2.5px] border-[#121212] ${
            friend.status === 'online'
              ? 'bg-[#38C185]'
              : friend.status === 'away'
              ? 'bg-[#F0B247]'
              : 'bg-[#5b5f67]'
          }`}
        />
      </span>
      <span className="font-medium flex-1 text-[#EDEDED]">
        {friend.name}
        <span className="sr-only">, {friend.status}</span>
      </span>
      {invited && <span className="text-[12.5px] text-[#F0B247] font-semibold">Invited</span>}
    </button>
  );
}
