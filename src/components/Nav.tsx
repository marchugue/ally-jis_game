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

/** Desktop center vertical nav buttons with active vertical expansion */
function DesktopNavButtons({ view, onChange }: Props) {
  return (
    <>
      {ITEMS.map((i) => {
        const isActive = view === i.view;
        return (
          <button
            key={i.view}
            className={`relative transition-all duration-300 ease-out flex flex-col items-center justify-center ${
              isActive
                ? 'w-11 min-h-[96px] py-3.5 px-1 rounded-xl bg-[#38C185] text-[#081B12] font-bold shadow-[0_0_20px_rgba(56,193,133,0.35)] gap-2'
                : 'w-11 h-11 rounded-xl text-[#94A3B8] hover:text-[#EDEDED] hover:bg-[#252528]'
            }`}
            title={i.label}
            aria-label={i.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(i.view)}
          >
            <Icon
              name={i.icon}
              className={`flex-none transition-transform duration-200 ${
                isActive ? 'w-5 h-5 scale-105 stroke-[2]' : 'w-5 h-5'
              }`}
            />
            {isActive && (
              <span className="[writing-mode:vertical-rl] text-[10px] uppercase font-bold tracking-[0.2em] leading-none select-none py-0.5 animate-fadeIn">
                {i.label}
              </span>
            )}
          </button>
        );
      })}
    </>
  );
}

/** Mobile bottom dock buttons */
function MobileNavButtons({ view, onChange }: Props) {
  return (
    <>
      {ITEMS.map((i) => {
        const isActive = view === i.view;
        return (
          <button
            key={i.view}
            className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2 font-medium text-xs transition-all duration-200 ${
              isActive
                ? 'bg-[#38C185] text-[#081B12] font-bold shadow-[0_0_16px_rgba(56,193,133,0.3)]'
                : 'text-[#94A3B8] hover:text-[#EDEDED]'
            }`}
            title={i.label}
            aria-label={i.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(i.view)}
          >
            <Icon name={i.icon} className="w-[19px] h-[19px]" />
            <span>{i.label}</span>
          </button>
        );
      })}
    </>
  );
}

/** Floating disconnected rail with 3 distinct floating sections (desktop) */
export function Rail(props: Props) {
  return (
    <aside
      className="rail sticky top-0 h-[100dvh] flex flex-col items-center justify-between py-6 px-3.5 max-[959px]:hidden select-none z-20 pointer-events-none"
      aria-label="Primary"
    >
      {/* SECTION 1: Top Floating Logo / Icon Container */}
      <div className="flex-none pointer-events-auto">
        <div
          className="w-12 h-12 rounded-2xl bg-[#1A1A1A]/90 backdrop-blur-md border border-[#262626] shadow-xl shadow-black/50 flex items-center justify-center transition-all duration-200 hover:border-[#38C185]/60 hover:shadow-[0_0_20px_rgba(56,193,133,0.2)] group cursor-pointer"
          title="ALLY-JIS Game Portal"
        >
          <svg width="24" height="24" viewBox="0 0 22 22">
            <circle cx="8" cy="11" r="5" fill="#38C185" />
            <circle cx="14" cy="11" r="5" fill="#F0B247" fillOpacity="0.85" />
          </svg>
        </div>
      </div>

      {/* SECTION 2: Center Floating Navlinks Container (Centered with space on both sides) */}
      <div className="my-auto pointer-events-auto">
        <nav
          className="p-1.5 rounded-2xl bg-[#1A1A1A]/90 backdrop-blur-md border border-[#262626] shadow-2xl shadow-black/60 flex flex-col items-center gap-1.5"
          aria-label="Navigation"
        >
          <DesktopNavButtons {...props} />
        </nav>
      </div>

      {/* SECTION 3: Bottom Floating Avatar Container */}
      <div className="flex-none pointer-events-auto">
        <div
          className="p-1 rounded-2xl bg-[#1A1A1A]/90 backdrop-blur-md border border-[#262626] shadow-xl shadow-black/50 flex items-center justify-center transition-all duration-200 hover:border-[#38C185]/60 hover:shadow-[0_0_20px_rgba(56,193,133,0.2)] cursor-pointer"
          title={ME.name}
        >
          <Avatar person={ME} size="lg" />
        </div>
      </div>
    </aside>
  );
}

/** Bottom floating dock navigation (mobile) */
export function TabBar(props: Props) {
  return (
    <nav
      className="tabs hidden max-[959px]:flex fixed left-4 right-4 bottom-4 z-30 bg-[#1A1A1A]/95 backdrop-blur-lg border border-[#262626] rounded-2xl shadow-2xl p-1.5 justify-around items-center gap-2"
      aria-label="Primary"
    >
      <MobileNavButtons {...props} />
    </nav>
  );
}
