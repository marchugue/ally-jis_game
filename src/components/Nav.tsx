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
      {ITEMS.map((i) => {
        const isActive = view === i.view;
        return (
          <button
            key={i.view}
            className={`transition-all duration-150 active:scale-[0.94] ${
              hideLabel
                ? `w-11 h-11 rounded-[14px] grid place-items-center ${
                    isActive
                      ? 'bg-game-s2 text-game-lav'
                      : 'text-game-mu hover:bg-game-s2 hover:text-game-tx'
                  }`
                : `w-auto h-[52px] mx-auto px-7 flex flex-col items-center justify-center gap-0.5 text-[11.5px] font-medium rounded-xl ${
                    isActive
                      ? 'bg-game-s2 text-game-lav'
                      : 'text-game-mu hover:bg-game-s2 hover:text-game-tx'
                  }`
            }`}
            title={i.label}
            aria-label={i.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(i.view)}
          >
            <Icon name={i.icon} className={hideLabel ? 'w-[22px] h-[22px]' : 'w-[21px] h-[21px]'} />
            <span className={hideLabel ? 'sr-only' : 'leading-tight'}>{i.label}</span>
          </button>
        );
      })}
    </>
  );
}

/** Compact left rail (desktop). */
export function Rail(props: Props) {
  return (
    <aside
      className="rail sticky top-0 h-[100dvh] flex flex-col items-center gap-2.5 py-[22px] border-r border-game-line max-[959px]:hidden"
      aria-label="Primary"
    >
      <div className="w-10 h-10 rounded-[14px] bg-game-s3 grid place-items-center mb-[18px]" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 22 22">
          <circle cx="8" cy="11" r="5" fill="#a99bc4" />
          <circle cx="14" cy="11" r="5" fill="#d6a25c" fillOpacity=".85" />
        </svg>
      </div>
      <NavButtons {...props} hideLabel />
      <span className="flex-1" />
      <span className="inline-flex [--ring:theme(colors.game.bg)]">
        <Avatar person={ME} size="lg" />
      </span>
    </aside>
  );
}

/** Bottom navigation (mobile). */
export function TabBar(props: Props) {
  return (
    <nav
      className="tabs hidden max-[959px]:grid max-[959px]:grid-cols-2 fixed left-0 right-0 bottom-0 z-10 bg-game-bg border-t border-game-line px-4 pt-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))]"
      aria-label="Primary"
    >
      <NavButtons {...props} />
    </nav>
  );
}
