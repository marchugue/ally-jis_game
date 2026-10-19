import type { ReactNode } from 'react';
import { useGameAuth } from '../context/AuthContext';
import { AuthNoticeDialog } from './AuthNoticeDialog';
import allyjisIcon from '../assets/icon.png';

interface Props {
  children: ReactNode;
}

export function AuthGuard({ children }: Props) {
  const { session, loading } = useGameAuth();

  // Loading state while checking URL tokens, localStorage, or silent refresh
  if (loading) {
    return (
      <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 select-none">
        {/* Full-bleed landscape background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070d14]" aria-hidden="true">
          <img
            src="/roadmap-bg-landscape.png"
            alt=""
            className="w-full h-full object-cover object-top filter brightness-[0.85] contrast-[1.12] saturate-[1.12]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060c14]/60 via-[#070d16]/75 to-[#04070c]/90" />
        </div>

        <div className="relative z-10 p-8 rounded-3xl bg-[#0c1622]/85 backdrop-blur-2xl border border-white/15 shadow-2xl flex flex-col items-center animate-pop">
          <div className="relative mb-5">
            <img
              src={allyjisIcon}
              alt="ALLY-JIS"
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-white/20"
              draggable={false}
            />
          </div>

          <div className="flex items-center gap-3 text-sm font-sans text-white/90">
            <div className="w-5 h-5 border-2 border-[#38C185]/30 border-t-[#38C185] rounded-full animate-spin" />
            <span className="font-semibold tracking-wide">Connecting to ALLY-JIS Arena...</span>
          </div>
        </div>
      </div>
    );
  }

  // If no session exists or session was revoked, show notice dialog and lock content
  if (!session) {
    return (
      <>
        {/* Blurred backdrop with inert content for aesthetic depth */}
        <div className="filter blur-md pointer-events-none select-none opacity-40" aria-hidden="true">
          {children}
        </div>
        <AuthNoticeDialog open={true} />
      </>
    );
  }

  // User is authenticated
  return <>{children}</>;
}
