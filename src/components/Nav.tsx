import type { CSSProperties } from 'react';
import { ME } from '../data';
import { Icon, type IconName } from '../icons';
import type { View } from '../types';
import { Avatar } from './Avatar';

interface Props {
  view: View;
  onChange: (v: View) => void;
}

const ITEMS: { view: View; icon: IconName; label: string }[] = [
  { view: 'games', icon: 'games', label: 'Games' },
  { view: 'friends', icon: 'friends', label: 'Friends' },
];

function NavButtons({ view, onChange, hideLabel }: Props & { hideLabel?: boolean }) {
  return (
    <>
      {ITEMS.map((i) => (
        <button
          key={i.view}
          className="nb"
          title={i.label}
          aria-label={i.label}
          aria-current={view === i.view ? 'page' : undefined}
          onClick={() => onChange(i.view)}
        >
          <Icon name={i.icon} />
          <span className={hideLabel ? 'sr' : 'lbl'}>{i.label}</span>
        </button>
      ))}
    </>
  );
}

/** Compact left rail (desktop). */
export function Rail(props: Props) {
  return (
    <aside className="rail" aria-label="Primary">
      <div className="logo" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 22 22">
          <circle cx="8" cy="11" r="5" fill="#a99bc4" />
          <circle cx="14" cy="11" r="5" fill="#d6a25c" fillOpacity=".85" />
        </svg>
      </div>
      <NavButtons {...props} hideLabel />
      <span className="grow" />
      <span style={{ '--ring': 'var(--bg)', display: 'inline-flex' } as CSSProperties}>
        <Avatar person={ME} size="lg" />
      </span>
    </aside>
  );
}

/** Bottom navigation (mobile). */
export function TabBar(props: Props) {
  return (
    <nav className="tabs" aria-label="Primary">
      <NavButtons {...props} />
    </nav>
  );
}
