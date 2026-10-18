import { ME } from '../data';
import { Avatar } from './Avatar';

/** Two overlapping avatars + "1 vs 1". Reused on every game card. */
export function VersusBadge() {
  return (
    <span className="vsb" role="img" aria-label="Two players">
      <span className="avs">
        <Avatar person={ME} />
        <span className="av open">?</span>
      </span>
      <span className="vst">1 vs 1</span>
    </span>
  );
}
