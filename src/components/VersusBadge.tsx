import { ME } from '../data';
import { Avatar } from './Avatar';

/** Two overlapping avatars + "1 vs 1". Reused on every game card. */
export function VersusBadge() {
  return (
    <span className="inline-flex items-center gap-2.5" role="img" aria-label="Two players">
      <span className="inline-flex">
        <Avatar person={ME} />
        <span className="w-7 h-7 -ml-[9px] rounded-full bg-game-s3 text-game-mu border-[1.5px] border-dashed border-[#555a63] inline-grid place-items-center font-bold font-sans text-xs flex-none shadow-[0_0_0_2px_var(--ring,theme(colors.game.s1))]">
          ?
        </span>
      </span>
      <span className="text-[12.5px] font-medium text-game-mu tracking-[0.02em]">1 vs 1</span>
    </span>
  );
}
