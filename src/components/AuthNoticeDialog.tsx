import { useGameAuth } from '../context/AuthContext';

interface Props {
  open: boolean;
}

export function AuthNoticeDialog({ open }: Props) {
  const { loginUrl } = useGameAuth();

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#0c1622]/95 backdrop-blur-2xl border border-white/15 p-6 sm:p-8 flex flex-col text-center shadow-2xl animate-pop">
        <h2
          id="auth-notice-title"
          className="text-2xl font-display font-bold text-white mb-3"
        >
          Sign In Required
        </h2>

        <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
          You need an active ALLY-JIS account to access the Game Arena. Please log in through the main website to continue.
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.href = loginUrl;
          }}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#38C185] to-[#42d494] hover:brightness-105 text-[#05180f] font-bold text-sm shadow-[0_0_20px_rgba(56,193,133,0.35)] transition-all cursor-pointer active:scale-95"
        >
          Log In
        </button>
      </div>
    </div>
  );
}
