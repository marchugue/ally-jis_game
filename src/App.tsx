import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useGameAuth } from './context/AuthContext';
import { getWebPortalUrl } from './lib/auth';
import { PresenceProvider } from './context/PresenceContext';
import { GameSocketProvider, useGameSocket } from './context/GameSocketContext';
import { AuthGuard } from './components/AuthGuard';
import { FriendsPanel } from './components/FriendsPanel';
import { GameCard } from './components/GameCard';
import { InviteDialog } from './components/InviteDialog';
import { GameModeDialog } from './components/GameModeDialog';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { DuelHost } from './components/DuelHost';
import { TicTacToeGame } from './components/TicTacToeGame';
import { NumberMergeGame } from './components/NumberMergeGame';
import { SecretClueGame } from './components/SecretClueGame';
import { GameModal, GameWoodButton } from './components/GameModal';
import { Avatar } from './components/Avatar';
import { Rail, TabBar } from './components/Nav';
import { GAMES, ME } from './data';
import {
  sendGameInvite,
  acceptGameInvite,
  declineGameInvite,
  cancelGameInvite,
  fetchGameSession,
  type GameSessionDto,
} from './lib/gameApi';
import type { Friend, Game, GameId, Pending, Person, View } from './types';

function GamePortal() {
  const { user, token } = useGameAuth();
  const { socket, incomingInvites, dismissInvite, resumable, clearResumable } = useGameSocket();

  const [view, setView] = useState<View>('games');
  const [friendId, setFriendId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<GameId | null>(null);
  const [demoGameId, setDemoGameId] = useState<GameId | null>(null);
  const [duelSession, setDuelSession] = useState<GameSessionDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modeSelectionGame, setModeSelectionGame] = useState<Game | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [activeInviteSessionId, setActiveInviteSessionId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [opponents, setOpponents] = useState<Friend[]>([]);

  const activeInviteRef = useRef<string | null>(null);
  activeInviteRef.current = activeInviteSessionId;

  // Prevent any page scrolling when playing a game or duel
  const isPlaying = Boolean(demoGameId || duelSession);
  useEffect(() => {
    if (isPlaying) {
      document.documentElement.classList.add('game-active');
      document.body.classList.add('game-active');
    } else {
      document.documentElement.classList.remove('game-active');
      document.body.classList.remove('game-active');
    }
    return () => {
      document.documentElement.classList.remove('game-active');
      document.body.classList.remove('game-active');
    };
  }, [isPlaying]);

  // Deep-link check on launch: ?session=<uuid> from chat message or notification
  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get('session');
    if (!sessionFromUrl) return;

    // Clean query param from URL without reload
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    void (async () => {
      try {
        const fetched = await fetchGameSession(token, sessionFromUrl);
        if (fetched.status === 'active') {
          setDuelSession(fetched);
        } else if (fetched.status === 'invited' && fetched.youAre === 'guest') {
          const started = await acceptGameInvite(token, sessionFromUrl);
          setDuelSession(started);
        }
      } catch (err) {
        console.warn('[DeepLink] Failed to resolve game session:', err);
      }
    })();
  }, [token]);

  // Listen for opponent responses to your sent invite
  useEffect(() => {
    if (!socket) return;

    const onAccepted = (payload: { session?: GameSessionDto }) => {
      if (payload?.session && payload.session.id === activeInviteRef.current) {
        setPending(null);
        setActiveInviteSessionId(null);
        setDialogOpen(false);
        setDuelSession(payload.session);
      }
    };

    const onDeclined = (payload: { session?: GameSessionDto }) => {
      if (payload?.session && payload.session.id === activeInviteRef.current) {
        setPending(null);
        setActiveInviteSessionId(null);
        setInviteError('Opponent declined the duel');
      }
    };

    socket.on('game:accepted', onAccepted);
    socket.on('game:declined', onDeclined);

    return () => {
      socket.off('game:accepted', onAccepted);
      socket.off('game:declined', onDeclined);
    };
  }, [socket]);

  const mePerson: Person = useMemo(
    () =>
      user
        ? {
          id: user.id,
          name: user.name,
          color: '#38C185',
          avatar_url: user.avatar_url,
        }
        : ME,
    [user]
  );

  const game = GAMES.find((g) => g.id === gameId) ?? null;

  const openInviteDialog = (id: GameId) => {
    setGameId(id);
    setInviteError(null);
    setDialogOpen(true);
  };

  const handlePlayClicked = (id: GameId) => {
    const selected = GAMES.find((g) => g.id === id);
    if (selected) {
      setModeSelectionGame(selected);
    }
  };

  const handleSendInvite = async (id: GameId | null = gameId) => {
    if (!friendId || !id || !token) return;
    setGameId(id);
    setPending({ friendId, gameId: id });
    setInviteError(null);
    setDialogOpen(true);

    try {
      const session = await sendGameInvite(token, friendId, id);
      setActiveInviteSessionId(session.id);
    } catch (err: any) {
      setInviteError(err?.message || 'Could not send invite');
      setPending(null);
      setActiveInviteSessionId(null);
    }
  };

  const handleCancelInvite = async () => {
    if (activeInviteSessionId && token) {
      void cancelGameInvite(token, activeInviteSessionId).catch(() => {});
    }
    setPending(null);
    setActiveInviteSessionId(null);
    setDialogOpen(false);
    setInviteError(null);
  };

  const changeView = (v: View) => {
    setView(v);
    if (v === 'games') {
      setDemoGameId(null);
    }
    if (v === 'friends' && window.matchMedia('(min-width: 960px)').matches) {
      document.querySelector<HTMLButtonElement>('.friends button:not(:disabled)')?.focus();
    }
  };

  // Incoming invite handling
  const activeIncoming = incomingInvites[0] || null;

  const handleAcceptIncoming = useCallback(async () => {
    if (!activeIncoming || !token) return;
    try {
      const session = await acceptGameInvite(token, activeIncoming.session.id);
      dismissInvite(activeIncoming.session.id);
      setDuelSession(session);
    } catch (err: any) {
      console.error('[App] Failed to accept invite:', err);
      dismissInvite(activeIncoming.session.id);
    }
  }, [activeIncoming, token, dismissInvite]);

  const handleDeclineIncoming = useCallback(async () => {
    if (!activeIncoming || !token) return;
    dismissInvite(activeIncoming.session.id);
    void declineGameInvite(token, activeIncoming.session.id).catch(() => {});
  }, [activeIncoming, token, dismissInvite]);

  return (
    <>
      {/* ═══ Global Fixed Full-Bleed Landscape Background Layer ═══ */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070d14]"
        aria-hidden="true"
      >
        <img
          src="/roadmap-bg-landscape.png"
          alt=""
          className="w-full h-full object-cover object-top filter brightness-[0.85] contrast-[1.12] saturate-[1.12] scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060c14]/50 via-[#070d16]/70 to-[#04070c]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,rgba(56,193,133,0.09)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_75%,rgba(96,165,250,0.06)_0%,transparent_50%)]" />
      </div>

      <div
        className={`relative z-10 grid min-h-[100dvh] grid-cols-[88px_minmax(0,1fr)_300px] max-[959px]:grid-cols-[minmax(0,1fr)] ${
          view === 'games' || view === 'leaderboard'
            ? 'max-[959px]:[&_.friends]:hidden'
            : 'max-[959px]:[&_.main-content]:hidden'
        }`}
        data-view={view}
      >
        <Rail view={view} onChange={changeView} />

        <main className="main-content p-[36px_40px_48px] max-[1180px]:p-[32px_28px_40px] max-[959px]:p-[max(18px,env(safe-area-inset-top,0px))_18px_calc(96px+env(safe-area-inset-bottom,0px))] max-[959px]:static max-[959px]:h-auto max-[959px]:border-0">
          {view === 'leaderboard' ? (
            <LeaderboardPanel onPlayGame={(gId) => handlePlayClicked(gId)} />
          ) : (
            <div className="max-w-[1100px] mx-auto animate-pop">
              {/* Active Resumable Duel Callout */}
              {resumable && !duelSession && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#1b354d] to-[#122435] border border-[#38C185] flex items-center justify-between shadow-lg animate-pop">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#38C185] animate-ping" />
                    <div>
                      <p className="text-sm font-bold text-white">
                        Active Duel: {resumable.gameName} against {resumable.opponent.name}
                      </p>
                      <p className="text-xs text-[#94A3B8]">Your match is in progress</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDuelSession(resumable)}
                      className="px-4 py-1.5 rounded-xl bg-[#38C185] hover:bg-[#42d494] text-[#081B12] font-black text-xs active:scale-95 transition-transform"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={clearResumable}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5 max-[620px]:grid-cols-1 max-[620px]:gap-4">
                {GAMES.map((g) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    onPlay={handlePlayClicked}
                  />
                ))}
              </div>
            </div>
          )}
        </main>

        <FriendsPanel
          selectedId={friendId}
          pending={pending}
          onSelect={(id) => setFriendId((cur) => (cur === id ? null : id))}
          onInvite={(id) => handleSendInvite(id)}
          onOpponentsChange={setOpponents}
        />

        <TabBar view={view} onChange={changeView} />
      </div>

      {/* ═══ FULLSCREEN IMMERSIVE LIVE 1V1 DUEL VIEW ═══ */}
      {duelSession && user && (
        <div className="fixed inset-0 z-50 h-[100dvh] max-h-[100dvh] w-full overflow-hidden select-none touch-none overscroll-none flex flex-col items-center justify-center">
          <DuelHost
            initial={duelSession}
            user={user}
            onExit={(next) => {
              setDuelSession(null);
              if (next === 'leaderboard') setView('leaderboard');
            }}
          />
        </div>
      )}

      {/* ═══ FULLSCREEN IMMERSIVE SOLO / CPU GAME VIEW ═══ */}
      {demoGameId && !duelSession && (
        <div className="fixed inset-0 z-50 h-[100dvh] max-h-[100dvh] w-full overflow-hidden select-none touch-none overscroll-none flex flex-col items-center justify-center">
          {demoGameId === 'ttt' && <TicTacToeGame onBack={() => setDemoGameId(null)} user={user} />}
          {demoGameId === 'merge' && <NumberMergeGame onBack={() => setDemoGameId(null)} user={user} />}
          {demoGameId === 'clue' && <SecretClueGame onBack={() => setDemoGameId(null)} user={user} />}
        </div>
      )}

      {/* ═══ INCOMING LIVE INVITE POPUP MODAL ═══ */}
      {activeIncoming && !isPlaying && (
        <GameModal
          open={Boolean(activeIncoming)}
          onClose={handleDeclineIncoming}
          maxWidthClass="max-w-[360px] sm:max-w-[390px]"
          title={
            <h3 className="font-display font-black text-xl sm:text-2xl text-[#382613] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              DUEL CHALLENGE!
            </h3>
          }
        >
          <div className="flex flex-col items-center gap-3 w-full">
            <Avatar
              person={{
                id: activeIncoming.from.id,
                name: activeIncoming.from.name,
                avatar_url: activeIncoming.from.avatar_url ?? undefined,
                avatarKey: activeIncoming.from.avatarKey,
                isAnonymous: activeIncoming.from.isAnonymous,
              }}
              size="xl"
            />
            <div className="text-center">
              <p className="font-bold text-base text-[#382613]">
                {activeIncoming.from.name}
              </p>
              <p className="text-xs text-[#6a4c28] mt-0.5 font-medium">
                invited you to play <span className="font-black text-[#1b436b]">{activeIncoming.session.gameName}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full mt-2">
              <GameWoodButton colSpan={1} onClick={handleAcceptIncoming}>
                Accept
              </GameWoodButton>
              <GameWoodButton colSpan={1} onClick={handleDeclineIncoming}>
                Decline
              </GameWoodButton>
            </div>
          </div>
        </GameModal>
      )}

      {/* ═══ INVITE OPPONENT DIALOG ═══ */}
      <InviteDialog
        open={dialogOpen}
        game={game}
        friendId={friendId}
        pending={pending}
        opponents={opponents}
        mePerson={mePerson}
        onPick={setFriendId}
        onSend={() => handleSendInvite()}
        onCancel={handleCancelInvite}
        onClose={() => {
          setDialogOpen(false);
          setInviteError(null);
        }}
        onPlaySolo={(id) => setDemoGameId(id)}
      />

      {/* ═══ GAMEMODE SELECTION DIALOG: SOLO OR PLAY WITH FRIENDS ═══ */}
      <GameModeDialog
        open={Boolean(modeSelectionGame)}
        game={modeSelectionGame}
        onSolo={() => {
          if (modeSelectionGame) setDemoGameId(modeSelectionGame.id);
          setModeSelectionGame(null);
        }}
        onFriends={() => {
          if (modeSelectionGame) openInviteDialog(modeSelectionGame.id);
          setModeSelectionGame(null);
        }}
        onClose={() => setModeSelectionGame(null)}
      />

      {/* Error alert toast if invite fails */}
      {inviteError && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-rose-600/95 text-white font-bold text-xs shadow-xl animate-pop border border-rose-400"
        >
          {inviteError}
        </div>
      )}
    </>
  );
}

export default function App() {
  // If user navigated directly to /login on the game domain, redirect them to the real web login page
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) {
      const webUrl = getWebPortalUrl();
      const redirectParam = new URLSearchParams(window.location.search).get('redirect');
      const target = redirectParam
        ? `${webUrl}/login?redirect=${encodeURIComponent(redirectParam)}`
        : `${webUrl}/login`;
      window.location.replace(target);
    }
  }, []);

  return (
    <AuthProvider>
      <AuthGuard>
        <PresenceProvider>
          <GameSocketProvider>
            <GamePortal />
          </GameSocketProvider>
        </PresenceProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
