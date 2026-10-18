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
      <div className="min-h-[100dvh] w-full bg-[#121212] flex flex-col items-center justify-center p-6 select-none">
        <div className="relative mb-6">
          <img
            src={allyjisIcon}
            alt="ALLY-JIS"
            className="w-14 h-14 rounded-xl object-cover shadow-lg"
            draggable={false}
          />
        </div>

        <div className="flex items-center gap-3 text-sm font-sans text-[#94A3B8]">
          <div className="w-5 h-5 border-2 border-[#38C185]/30 border-t-[#38C185] rounded-full animate-spin" />
          <span>Verifying campus session...</span>
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
