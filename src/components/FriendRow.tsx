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
            ? 'bg-game-s2 border-game-lav'
            : 'bg-game-s1 border-[#4a4560]'
          : mode === 'pick'
          ? 'border-transparent hover:not(:disabled):bg-game-s2'
          : 'border-transparent hover:not(:disabled):bg-game-s1'
      }`}
      disabled={friend.status === 'offline'}
      onClick={() => onSelect(friend.id)}
      {...a11y}
    >
      <span className="relative inline-flex">
        <Avatar person={friend} size="lg" />
        <i
          className={`absolute -right-[1px] -bottom-[1px] w-[11px] h-[11px] rounded-full border-[2.5px] border-[var(--ring,theme(colors.game.bg))] ${
            friend.status === 'online'
              ? 'bg-game-sage'
              : friend.status === 'away'
              ? 'bg-game-amb'
              : 'bg-[#5b5f67]'
          }`}
        />
      </span>
      <span className="font-medium flex-1 text-game-tx">
        {friend.name}
        <span className="sr-only">, {friend.status}</span>
      </span>
      {invited && <span className="text-[12.5px] text-game-amb font-medium">Invited</span>}
    </button>
  );
}
