import { useState, useRef, useEffect } from 'react';
import allyjisIcon from '../assets/icon.png';
import { ME } from '../data';
import { Icon, type IconName } from '../icons';
import type { Person, View } from '../types';
import { Avatar } from './Avatar';
import { useGameAuth } from '../context/AuthContext';

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
        className={`absolute left-[10px] w-11 rounded-full bg-[#38C185] shadow-[0_0_24px_rgba(56,193,133,0.4)] pointer-events-none transition-all duration-500 ease-spring ${isGames ? 'top-[10px] h-[108px]' : 'top-[64px] h-[108px]'
          }`}
      />

      {ITEMS.map((i) => {
        const isActive = view === i.view;
        return (
          <button
            key={i.view}
            className={`relative z-10 w-11 rounded-full flex flex-col items-center justify-center select-none transition-all duration-500 ease-spring ${isActive
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
              className={`flex-none transition-all duration-300 ${isActive ? 'w-5 h-5 scale-110 stroke-[2.3]' : 'w-5 h-5'
                }`}
            />
            <div
              className={`overflow-hidden transition-all duration-500 ease-spring flex items-center justify-center ${isActive
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
        className={`absolute top-0 bottom-0 w-[calc(50%-4px)] rounded-full bg-[#38C185] shadow-[0_0_20px_rgba(56,193,133,0.35)] pointer-events-none transition-all duration-500 ease-spring ${isGames ? 'left-0' : 'left-[calc(50%+4px)]'
          }`}
      />

      {ITEMS.map((i) => {
        const isActive = view === i.view;
        return (
          <button
            key={i.view}
            className={`relative z-10 flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-xs font-semibold transition-colors duration-300 ${isActive
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
  const { user, webUrl } = useGameAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const currentPerson: Person = user
    ? {
      id: user.id,
      name: user.name,
      color: '#38C185',
      avatar_url: user.avatar_url,
    }
    : ME;

  return (
    <aside
      className="rail sticky top-0 h-[100dvh] flex flex-col items-center justify-between py-6 px-2.5 max-[959px]:hidden select-none z-20 pointer-events-none"
      aria-label="Primary"
    >
      {/* SECTION 1: Top Logo / Return to Web */}
      <div className="flex-none pointer-events-auto">
        <a
          href={webUrl}
          className="w-11 h-11 rounded-xl overflow-hidden shadow-md flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#38C185]/20 cursor-pointer group block"
          title="Return to ALLY-JIS Web"
        >
          <img
            src={allyjisIcon}
            alt="ALLY-JIS"
            className="w-full h-full object-cover rounded-xl select-none"
            draggable={false}
          />
        </a>
      </div>

      {/* SECTION 2: Center Floating Navlinks Container */}
      <div className="my-auto pointer-events-auto">
        <nav
          className="w-[64px] rounded-full p-[10px] bg-[#1A1A1A]/90 backdrop-blur-md border border-[#262626] shadow-2xl shadow-black/60 flex flex-col items-center gap-[10px] relative"
          aria-label="Navigation"
        >
          <DesktopNavButtons {...props} />
        </nav>
      </div>

      {/* SECTION 3: Bottom Floating Avatar Container & Profile Popover */}
      <div className="flex-none pointer-events-auto relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className={`w-[64px] h-[64px] rounded-full p-[10px] bg-[#1A1A1A]/90 backdrop-blur-md border shadow-xl shadow-black/50 flex items-center justify-center transition-all duration-300 hover:border-[#38C185]/60 hover:shadow-[0_0_24px_rgba(56,193,133,0.25)] hover:scale-105 cursor-pointer ${menuOpen ? 'border-[#38C185] ring-2 ring-[#38C185]/30' : 'border-[#262626]'
            }`}
          title={`Signed in as ${currentPerson.name}`}
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center">
            <Avatar person={currentPerson} size="lg" />
          </div>
        </button>

        {/* Profile Dropdown Popover */}
        {menuOpen && (
          <div className="absolute left-[76px] bottom-0 w-64 rounded-2xl bg-[#1A1A1A]/95 backdrop-blur-xl border border-[#2E2E32] shadow-2xl p-4 flex flex-col gap-3 animate-pop z-50 text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-[#262626]">
              <Avatar person={currentPerson} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#EDEDED] truncate">{user?.name || currentPerson.name}</p>
                <p className="text-xs text-[#94A3B8] truncate">@{user?.username || 'player'}</p>
              </div>
            </div>


            <div className="flex flex-col gap-1 pt-1">
              <a
                href={webUrl}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#EDEDED] hover:bg-white/5 flex items-center gap-2 transition-colors"
              >
                <span>Back to ALLY-JIS Web</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/** Bottom floating dock navigation (mobile) */
export function TabBar(props: Props) {
  const { user, logout, webUrl } = useGameAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentPerson: Person = user
    ? {
      id: user.id,
      name: user.name,
      color: '#38C185',
      avatar_url: user.avatar_url,
    }
    : ME;

  return (
    <>
      <nav
        className="tabs hidden max-[959px]:flex fixed left-4 right-4 bottom-4 z-30 bg-[#1A1A1A]/95 backdrop-blur-lg border border-[#262626] rounded-full shadow-2xl p-[10px] items-center gap-2"
        aria-label="Primary"
      >
        <MobileNavButtons {...props} />
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex-none w-11 h-11 rounded-full flex items-center justify-center p-0.5 border border-[#262626] hover:border-[#38C185]/60 transition-colors"
          title="Account Menu"
        >
          <Avatar person={currentPerson} size="md" />
        </button>
      </nav>

      {/* Mobile user bottom sheet */}
      {sheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center p-4"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#1A1A1A] border border-[#262626] p-5 flex flex-col gap-4 animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <Avatar person={currentPerson} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-[#EDEDED] truncate">{user?.name || currentPerson.name}</p>
                <p className="text-xs text-[#94A3B8] truncate">@{user?.username || 'player'}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-[#262626]">
              <a
                href={webUrl}
                className="w-full h-11 rounded-xl bg-[#202024] text-[#EDEDED] font-semibold text-xs flex items-center justify-center gap-2"
              >
                Return to ALLY-JIS Web
              </a>
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                  logout();
                }}
                className="w-full h-11 rounded-xl bg-rose-500/10 text-rose-400 font-semibold text-xs flex items-center justify-center gap-2"
              >
                Sign Out Everywhere
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
