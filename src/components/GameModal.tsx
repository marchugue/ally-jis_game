import React from 'react';

/**
 * Reusable Wood Button styled for game dialogs and modals
 */
export interface GameWoodButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2;
}

export function GameWoodButton({
  children,
  className = '',
  colSpan = 2,
  ...props
}: GameWoodButtonProps) {
  const colSpanClass = colSpan === 1 ? 'col-span-1 w-full' : 'col-span-2 w-full';

  return (
    <button
      type="button"
      className={`relative h-[44px] sm:h-[48px] flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all select-none cursor-pointer filter drop-shadow-md disabled:opacity-50 disabled:pointer-events-none ${colSpanClass} ${className}`}
      {...props}
    >
      <img
        src="/ui-wood-btn.png"
        alt=""
        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
        draggable={false}
      />
      <span className="relative z-10 pt-1 font-display font-black text-xs sm:text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] tracking-wide">
        {children}
      </span>
    </button>
  );
}

/**
 * Reusable Modal Container with fantasy wood & stone frame
 * - Backdrop: pure dissolve fade-in (no slide up)
 * - Modal frame: drops in smoothly from the top
 */
export interface GameModalProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function GameModal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-[390px] sm:max-w-[410px]',
}: GameModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-dissolve select-none overflow-hidden touch-none overscroll-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full ${maxWidthClass} aspect-[994/597] flex flex-col items-center justify-center p-6 filter drop-shadow-[0_20px_45px_rgba(0,0,0,0.65)] animate-modal-from-top`}
      >
        {/* Modal Container Image */}
        <img
          src="/modal-container.png"
          alt=""
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
          draggable={false}
        />

        {/* Content Layer perfectly centered in the stone tablet area */}
        <div className="relative z-10 w-[82%] sm:w-[80%] flex flex-col items-center justify-center">
          {title && <div className="text-center mb-3">{title}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Game Settings Modal with hierarchical 3-row 2-col layout (vs CPU)
 * or 4-row vertical layout (when dueling someone).
 * Free of unnecessary labels or text.
 */
export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  isDueling?: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  onCycleDifficulty?: () => void;
  onSwitchToCpu?: () => void;
  onExitToMainMenu: () => void;
}

export function SettingsModal({
  open,
  onClose,
  isDueling = false,
  soundOn,
  onToggleSound,
  difficulty = 'medium',
  onCycleDifficulty,
  onSwitchToCpu,
  onExitToMainMenu,
}: SettingsModalProps) {
  const difficultyLabel =
    difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Medium' : 'Hard';

  return (
    <GameModal open={open} onClose={onClose}>
      {!isDueling ? (
        /* ═══ NON-DUELING (VS CPU): 3 ROWS, 2 COLUMNS ═══ */
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5 w-full">
          {/* Row 1 - Col 1: Mute Button (1 colspan) */}
          <GameWoodButton colSpan={1} onClick={onToggleSound}>
            {soundOn ? 'Mute' : 'Unmute'}
          </GameWoodButton>

          {/* Row 1 - Col 2: Mode Selection Button (1 colspan, click to toggle) */}
          <GameWoodButton colSpan={1} onClick={onCycleDifficulty}>
            {difficultyLabel}
          </GameWoodButton>

          {/* Row 2: Back to Game (2 colspan) */}
          <GameWoodButton colSpan={2} onClick={onClose}>
            Back to Game
          </GameWoodButton>

          {/* Row 3: Exit to Main Menu (2 colspan) */}
          <GameWoodButton colSpan={2} onClick={onExitToMainMenu}>
            Exit to Main Menu
          </GameWoodButton>
        </div>
      ) : (
        /* ═══ DUELING SOMEONE: VERTICALLY ALIGNED (ALL 2 COLSPAN) ═══ */
        <div className="flex flex-col gap-2.5 sm:gap-3 w-full">
          {/* Row 1: Mute (colspan 2) */}
          <GameWoodButton colSpan={2} className="!h-[38px] sm:!h-[40px]" onClick={onToggleSound}>
            {soundOn ? 'Mute' : 'Unmute'}
          </GameWoodButton>

          {/* Row 2: Play with CPU instead (colspan 2) — only offered when there is a CPU to switch to */}
          {onSwitchToCpu && (
            <GameWoodButton colSpan={2} className="!h-[38px] sm:!h-[40px]" onClick={onSwitchToCpu}>
              Play with CPU
            </GameWoodButton>
          )}

          {/* Row 3: Back to Game (colspan 2) */}
          <GameWoodButton colSpan={2} className="!h-[38px] sm:!h-[40px]" onClick={onClose}>
            Back to Game
          </GameWoodButton>

          {/* Row 4: Exit to Main Menu (colspan 2) */}
          <GameWoodButton colSpan={2} className="!h-[38px] sm:!h-[40px]" onClick={onExitToMainMenu}>
            Exit to Main Menu
          </GameWoodButton>
        </div>
      )}
    </GameModal>
  );
}

/**
 * Play Again Dialog appearing upon match conclusion
 */
export interface PlayAgainDialogProps {
  open: boolean;
  winner: 'X' | 'O' | null;
  isDraw?: boolean;
  isDueling?: boolean;
  onPlayAgain: () => void;
  onExitToMainMenu: () => void;
}

export function PlayAgainDialog({
  open,
  winner,
  isDraw = false,
  isDueling = false,
  onPlayAgain,
  onExitToMainMenu,
}: PlayAgainDialogProps) {
  const resultText = winner ? (
    <span className={winner === 'X' ? 'text-[#0284c7]' : 'text-[#ea580c]'}>
      {winner === 'X' ? '🎉 YOU WON!' : isDueling ? '🎉 P2 WON!' : '🤖 CPU WON!'}
    </span>
  ) : isDraw ? (
    <span className="text-[#5c4028]">🤝 ROUND TIED!</span>
  ) : (
    <span className="text-[#5c4028]">GAME OVER</span>
  );

  return (
    <GameModal
      open={open}
      maxWidthClass="max-w-[360px] sm:max-w-[380px]"
      title={
        <h3 className="font-display font-black text-2xl sm:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
          {resultText}
        </h3>
      }
    >
      <div className="flex flex-col gap-3 w-full">
        <GameWoodButton colSpan={2} onClick={onPlayAgain}>
          Play Again
        </GameWoodButton>
        <GameWoodButton colSpan={2} onClick={onExitToMainMenu}>
          Exit to Main Menu
        </GameWoodButton>
      </div>
    </GameModal>
  );
}
