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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#1A1A1A] border border-[#262626] p-6 sm:p-8 flex flex-col text-center shadow-2xl">
        <h2
          id="auth-notice-title"
          className="text-xl font-bold text-[#EDEDED] mb-3"
        >
          Sign In Required
        </h2>

        <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
          You need an active ALLY-JIS account to access the Game Portal. Please log in through the main website to continue.
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.href = loginUrl;
          }}
          className="w-full h-11 rounded-xl bg-[#38C185] hover:bg-[#42d494] text-[#081B12] font-semibold text-sm transition-colors cursor-pointer"
        >
          Log In
        </button>
      </div>
    </div>
  );
}
