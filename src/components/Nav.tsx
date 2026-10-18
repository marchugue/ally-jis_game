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

/** Desktop center vertical nav buttons with active vertical expansion and sliding morphing indicator */
function DesktopNavButtons({ view, onChange }: Props) {
  const isGames = view === 'games';

  return (
    <>
      {/* Sliding morphing active indicator pill */}
      <div
        className={`absolute left-[10px] w-11 rounded-full bg-[#38C185] shadow-[0_0_24px_rgba(56,193,133,0.4)] pointer-events-none transition-all duration-500 ease-spring ${
          isGames ? 'top-[10px] h-[108px]' : 'top-[64px] h-[108px]'
        }`}
      />

      {ITEMS.map((i) => {
        const isActive = view === i.view;
        return (
          <button
            key={i.view}
            className={`relative z-10 w-11 rounded-full flex flex-col items-center justify-center select-none transition-all duration-500 ease-spring ${
              isActive
                ? 'h-[108px] text-[#081B12] font-bold py-3.5'
                : 'h-11 text-[#94A3B8] hover:text-[#EDEDED] hover:bg-white/5 active:scale-95'
            }`}
            title={i.label}
            aria-label={i.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(i.view)}
          >
            <Icon
              name={i.icon}
              className={`flex-none transition-all duration-300 ${
                isActive ? 'w-5 h-5 scale-110 stroke-[2.3]' : 'w-5 h-5'
              }`}
            />
            <div
              className={`overflow-hidden transition-all duration-500 ease-spring flex items-center justify-center ${
                isActive
                  ? 'max-h-16 opacity-100 mt-2 translate-y-0'
                  : 'max-h-0 opacity-0 mt-0 -translate-y-2 pointer-events-none'
              }`}
            >
              <span className="[writing-mode:vertical-rl] text-[10px] uppercase font-extrabold tracking-[0.22em] leading-none select-none py-0.5">
                {i.label}
              </span>
            </div>
          </button>
        );
      })}
    </>
  );
}

/** Mobile bottom dock buttons with sliding morphing indicator */
function MobileNavButtons({ view, onChange }: Props) {
  const isGames = view === 'games';

  return (
    <div className="relative w-full flex items-center gap-2">
      {/* Sliding morphing indicator pill */}
      <div
        className={`absolute top-0 bottom-0 w-[calc(50%-4px)] rounded-full bg-[#38C185] shadow-[0_0_20px_rgba(56,193,133,0.35)] pointer-events-none transition-all duration-500 ease-spring ${
          isGames ? 'left-0' : 'left-[calc(50%+4px)]'
        }`}
      />

      {ITEMS.map((i) => {
        const isActive = view === i.view;
        return (
          <button
            key={i.view}
            className={`relative z-10 flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-xs font-semibold transition-colors duration-300 ${
              isActive
                ? 'text-[#081B12] font-bold'
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
    </div>
  );
}

/** Floating disconnected rail with 3 distinct floating sections (desktop) */
export function Rail(props: Props) {
  return (
    <aside
      className="rail sticky top-0 h-[100dvh] flex flex-col items-center justify-between py-6 px-2.5 max-[959px]:hidden select-none z-20 pointer-events-none"
      aria-label="Primary"
    >
      {/* SECTION 1: Top Floating Logo / Icon Container */}
      <div className="flex-none pointer-events-auto">
        <div
          className="w-[64px] h-[64px] rounded-full p-[10px] bg-[#1A1A1A]/90 backdrop-blur-md border border-[#262626] shadow-xl shadow-black/50 flex items-center justify-center transition-all duration-300 hover:border-[#38C185]/60 hover:shadow-[0_0_24px_rgba(56,193,133,0.25)] hover:scale-105 cursor-pointer group"
          title="ALLY-JIS Game Portal"
        >
          <div className="w-11 h-11 rounded-full bg-[#121212] border border-[#262626]/80 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <svg width="22" height="22" viewBox="0 0 22 22">
              <circle cx="8" cy="11" r="5" fill="#38C185" />
              <circle cx="14" cy="11" r="5" fill="#F0B247" fillOpacity="0.85" />
            </svg>
          </div>
        </div>
      </div>

      {/* SECTION 2: Center Floating Navlinks Container (Centered with space on both sides) */}
      <div className="my-auto pointer-events-auto">
        <nav
          className="w-[64px] rounded-full p-[10px] bg-[#1A1A1A]/90 backdrop-blur-md border border-[#262626] shadow-2xl shadow-black/60 flex flex-col items-center gap-[10px] relative"
          aria-label="Navigation"
        >
          <DesktopNavButtons {...props} />
        </nav>
      </div>

      {/* SECTION 3: Bottom Floating Avatar Container */}
      <div className="flex-none pointer-events-auto">
        <div
          className="w-[64px] h-[64px] rounded-full p-[10px] bg-[#1A1A1A]/90 backdrop-blur-md border border-[#262626] shadow-xl shadow-black/50 flex items-center justify-center transition-all duration-300 hover:border-[#38C185]/60 hover:shadow-[0_0_24px_rgba(56,193,133,0.25)] hover:scale-105 cursor-pointer"
          title={ME.name}
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center">
            <Avatar person={ME} size="lg" />
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Bottom floating dock navigation (mobile) */
export function TabBar(props: Props) {
  return (
    <nav
      className="tabs hidden max-[959px]:flex fixed left-4 right-4 bottom-4 z-30 bg-[#1A1A1A]/95 backdrop-blur-lg border border-[#262626] rounded-full shadow-2xl p-[10px] items-center"
      aria-label="Primary"
    >
      <MobileNavButtons {...props} />
    </nav>
  );
}
