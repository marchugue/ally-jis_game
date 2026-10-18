import { useState, useMemo } from 'react';
import { AuthProvider, useGameAuth } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import { AuthGuard } from './components/AuthGuard';
import { FriendsPanel } from './components/FriendsPanel';
import { GameCard } from './components/GameCard';
import { InviteDialog } from './components/InviteDialog';
import { TicTacToeGame } from './components/TicTacToeGame';
import { NumberMergeGame } from './components/NumberMergeGame';
import { Rail, TabBar } from './components/Nav';
import { GAMES, ME } from './data';
import type { Friend, GameId, Pending, Person, View } from './types';

function GamePortal() {
  const { user } = useGameAuth();
  const [view, setView] = useState<View>('games');
  const [friendId, setFriendId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<GameId | null>(null);
  const [demoGameId, setDemoGameId] = useState<GameId | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [opponents, setOpponents] = useState<Friend[]>([]);

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

  const openDialog = (id: GameId) => {
    setGameId(id);
    setDialogOpen(true);
  };

  const sendInvite = (id: GameId | null = gameId) => {
    if (!friendId || !id) return;
    setGameId(id);
    setPending({ friendId, gameId: id });
    setDialogOpen(true);
  };

  const cancelInvite = () => {
    setPending(null);
    setDialogOpen(false);
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

  return (
    <>
      <div
        className={`grid min-h-[100dvh] grid-cols-[84px_minmax(0,1fr)_288px] max-[959px]:grid-cols-[minmax(0,1fr)] ${
          view === 'games'
            ? 'max-[959px]:[&_.friends]:hidden'
            : 'max-[959px]:[&_.main-content]:hidden'
        }`}
        data-view={view}
      >
        <Rail view={view} onChange={changeView} />

        <main className="main-content p-[40px_44px_48px] max-[1180px]:p-[36px_32px_44px] max-[959px]:p-[max(18px,env(safe-area-inset-top,0px))_18px_calc(96px+env(safe-area-inset-bottom,0px))] max-[959px]:static max-[959px]:h-auto max-[959px]:border-0">
          {demoGameId === 'ttt' ? (
            <TicTacToeGame onBack={() => setDemoGameId(null)} user={user} />
          ) : demoGameId === 'merge' ? (
            <NumberMergeGame onBack={() => setDemoGameId(null)} user={user} />
          ) : (
            <div className="grid grid-cols-2 gap-5 max-[620px]:grid-cols-1 max-[620px]:gap-4">
              {GAMES.map((g) => (
                <GameCard
                  key={g.id}
                  game={g}
                  onPlay={openDialog}
                  onDemo={(id) => setDemoGameId(id)}
                />
              ))}
            </div>
          )}
        </main>

        <FriendsPanel
          selectedId={friendId}
          pending={pending}
          onSelect={(id) => setFriendId((cur) => (cur === id ? null : id))}
          onInvite={(id) => sendInvite(id)}
          onOpponentsChange={setOpponents}
        />

        <TabBar view={view} onChange={changeView} />
      </div>

      <InviteDialog
        open={dialogOpen}
        game={game}
        friendId={friendId}
        pending={pending}
        opponents={opponents}
        mePerson={mePerson}
        onPick={setFriendId}
        onSend={() => sendInvite()}
        onCancel={cancelInvite}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <PresenceProvider>
          <GamePortal />
        </PresenceProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
