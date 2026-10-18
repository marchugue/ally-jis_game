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
      className={selected ? 'fr sel' : 'fr'}
      disabled={friend.status === 'offline'}
      onClick={() => onSelect(friend.id)}
      {...a11y}
    >
      <span className="avw">
        <Avatar person={friend} size="lg" />
        <i className={`dot ${friend.status}`} />
      </span>
      <span className="nm">
        {friend.name}
        <span className="sr">, {friend.status}</span>
      </span>
      {invited && <span className="inv">Invited</span>}
    </button>
  );
}
