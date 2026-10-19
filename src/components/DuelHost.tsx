import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameUser } from '../lib/auth';
import type { GameSessionDto } from '../lib/gameApi';
import { useDuel, type DuelApi } from '../hooks/useDuel';
import { GameModal, GameWoodButton } from './GameModal';
import { Avatar } from './Avatar';
import { TicTacToeGame } from './TicTacToeGame';
import { NumberMergeGame } from './NumberMergeGame';
import { SecretClueDuel } from './SecretClueDuel';

export interface Series {
  you: number;
  opponent: number;
  draws: number;
}

interface HostProps {
  initial: GameSessionDto;
  user: GameUser;
  /** `leaderboard` lets the result dialog jump straight to the standings. */
  onExit: (next?: 'leaderboard') => void;
}

/**
 * Owns a live 1v1: swaps in the right game component, keeps the running
 * win/loss tally across rematches, and renders the shared result / connection
 * overlays so every game gets identical duel behaviour.
 */
export function DuelHost({ initial, user, onExit }: HostProps) {
  const [current, setCurrent] = useState(initial);
  const [series, setSeries] = useState<Series>({ you: 0, opponent: 0, draws: 0 });
  const counted = useRef(new Set<string>());

  const handleFinished = useCallback((s: GameSessionDto) => {
    if (counted.current.has(s.id)) return;
    counted.current.add(s.id);
    setSeries((cur) =>
      s.isDraw
        ? { ...cur, draws: cur.draws + 1 }
        : s.winnerId === user.id
        ? { ...cur, you: cur.you + 1 }
        : { ...cur, opponent: cur.opponent + 1 },
    );
  }, [user.id]);

  return (
    <DuelSessionView
      key={current.id}
      initial={current}
      user={user}
      series={series}
      onFinished={handleFinished}
      onRematch={setCurrent}
      onExit={onExit}
    />
  );
}

interface ViewProps {
  initial: GameSessionDto;
  user: GameUser;
  series: Series;
  onFinished: (s: GameSessionDto) => void;
  onRematch: (s: GameSessionDto) => void;
  onExit: (next?: 'leaderboard') => void;
}

function DuelSessionView({ initial, user, series, onFinished, onRematch, onExit }: ViewProps) {
  const duel = useDuel({ initial, myId: user.id, onRematchStarted: onRematch });
  const { session } = duel;
  const isOver = session.status === 'finished' || session.status === 'abandoned';

  const exit = useCallback(
    (next?: 'leaderboard') => {
      duel.leave();
      onExit(next);
    },
    [duel, onExit],
  );

  // Tally the result once, and give the final move a beat to land before the dialog.
  const [showResult, setShowResult] = useState(false);
  useEffect(() => {
    if (!isOver) return;
    onFinished(session);
    const t = setTimeout(() => setShowResult(true), session.gameId === 'ttt' ? 1100 : 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOver]);

  return (
    <>
      {session.gameId === 'ttt' && <TicTacToeGame onBack={() => exit()} user={user} duel={duel} series={series} />}
      {session.gameId === 'merge' && <NumberMergeGame onBack={() => exit()} user={user} duel={duel} />}
      {session.gameId === 'clue' && <SecretClueDuel onBack={() => exit()} user={user} duel={duel} />}

      <ConnectionBanner duel={duel} isOver={isOver} />

      <DuelResultDialog
        open={isOver && showResult}
        duel={duel}
        series={series}
        onExit={exit}
      />
    </>
  );
}

function ConnectionBanner({ duel, isOver }: { duel: DuelApi; isOver: boolean }) {
  if (isOver) return null;

  let text: string | null = null;
  if (!duel.connected) text = 'Connection lost — reconnecting…';
  else if (duel.opponentLink === 'disconnected') {
    text = `${duel.opponentName} disconnected — waiting up to 30s for them to return…`;
  }
  if (!text) return null;

  return (
    <div
      role="status"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] max-w-[92vw] px-4 py-2 rounded-full bg-[#2b1a0c]/95 border border-[#F0B247]/60 text-[#FFE2A8] text-xs font-bold shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-pop"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-[#F0B247] mr-2 animate-pulse align-middle" />
      {text}
    </div>
  );
}

function DuelResultDialog({
  open,
  duel,
  series,
  onExit,
}: {
  open: boolean;
  duel: DuelApi;
  series: Series;
  onExit: (next?: 'leaderboard') => void;
}) {
  const { session } = duel;
  const iWon = session.winnerId === duel.myId;
  const abandoned = session.status === 'abandoned';

  const title = abandoned
    ? 'GAME CANCELLED'
    : session.isDraw
    ? '🤝 IT’S A DRAW!'
    : iWon
    ? '🎉 YOU WON!'
    : `😤 ${duel.opponentName.toUpperCase()} WON`;

  const titleColor = session.isDraw || abandoned ? 'text-[#5c4028]' : iWon ? 'text-[#0f7a45]' : 'text-[#b4380f]';

  let detail: string | null = null;
  if (session.endReason === 'forfeit') detail = iWon ? `${duel.opponentName} left the game.` : 'You left the game.';
  else if (session.endReason === 'timeout' && session.gameId === 'ttt') {
    detail = iWon ? `${duel.opponentName} ran out of time.` : 'You ran out of time.';
  }

  const showScores = session.gameId !== 'ttt';
  const rematchDisabled = abandoned || duel.opponentLink === 'left' || duel.iRequestedRematch;
  const rematchLabel = duel.iRequestedRematch
    ? 'Waiting for opponent…'
    : duel.opponentWantsRematch
    ? 'Accept Rematch!'
    : 'Rematch';

  return (
    <GameModal
      open={open}
      maxWidthClass="max-w-[380px] sm:max-w-[420px]"
      title={
        <h3 className={`font-display font-black text-xl sm:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] ${titleColor}`}>
          {title}
        </h3>
      }
    >
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="flex items-center justify-center gap-3 text-[#3a2a17]">
          <Avatar person={{ id: duel.myId, name: 'You' }} size="md" />
          {showScores ? (
            <span className="font-display font-black text-lg tabular-nums">
              {session.scores.you} <span className="opacity-50">–</span> {session.scores.opponent}
            </span>
          ) : (
            <span className="font-display font-black text-lg tabular-nums">
              {series.you} <span className="opacity-50">–</span> {series.opponent}
            </span>
          )}
          <Avatar
            person={{
              id: session.opponent.id,
              name: session.opponent.name,
              avatar_url: session.opponent.avatar_url ?? undefined,
              avatarKey: session.opponent.avatarKey,
              isAnonymous: session.opponent.isAnonymous,
            }}
            size="md"
          />
        </div>

        {detail && <p className="text-[11px] font-bold text-[#5c4028]/90 text-center">{detail}</p>}
        {session.matchId && !abandoned && (
          <p className="text-[10px] font-semibold text-[#5c4028]/75 text-center leading-tight">
            Playing with your match counts toward today’s “Play a game” task.
          </p>
        )}
        {duel.opponentWantsRematch && !duel.iRequestedRematch && (
          <p className="text-[11px] font-black text-[#0f7a45] animate-pulse">{duel.opponentName} wants a rematch!</p>
        )}
        {duel.error && <p className="text-[10px] font-bold text-[#b4380f] text-center">{duel.error}</p>}

        <div className="grid grid-cols-2 gap-2 w-full mt-1">
          <GameWoodButton colSpan={2} disabled={rematchDisabled} onClick={duel.requestRematch}>
            {rematchLabel}
          </GameWoodButton>
          <GameWoodButton colSpan={1} onClick={() => onExit('leaderboard')}>
            Leaderboard
          </GameWoodButton>
          <GameWoodButton colSpan={1} onClick={() => onExit()}>
            Exit
          </GameWoodButton>
        </div>
      </div>
    </GameModal>
  );
}
