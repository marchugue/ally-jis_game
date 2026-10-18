import { useState } from 'react';
import { Avatar } from './components/Avatar';
import { FriendsPanel } from './components/FriendsPanel';
import { GameCard } from './components/GameCard';
import { InviteDialog } from './components/InviteDialog';
import { Rail, TabBar } from './components/Nav';
import { GAMES, ME } from './data';
import type { GameId, Pending, View } from './types';

export default function App() {
  const [view, setView] = useState<View>('games');
  const [friendId, setFriendId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<GameId | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);

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
    if (v === 'friends' && window.matchMedia('(min-width: 960px)').matches) {
      document.querySelector<HTMLButtonElement>('.friends button:not(:disabled)')?.focus();
    }
  };

  return (
    <>
      <div
        className={`grid min-h-[100dvh] grid-cols-[76px_minmax(0,1fr)_288px] max-[959px]:grid-cols-[minmax(0,1fr)] ${
          view === 'games'
            ? 'max-[959px]:[&_.friends]:hidden'
            : 'max-[959px]:[&_.main-content]:hidden'
        }`}
        data-view={view}
      >
        <Rail view={view} onChange={changeView} />

        <main className="main-content p-[40px_44px_48px] max-[1180px]:p-[36px_32px_44px] max-[959px]:p-[max(18px,env(safe-area-inset-top,0px))_18px_calc(96px+env(safe-area-inset-bottom,0px))] max-[959px]:static max-[959px]:h-auto max-[959px]:border-0">
          <header className="flex items-center justify-between mb-7 min-h-[40px] max-[959px]:mb-5">
            <h1 className="font-display font-semibold text-[28px] leading-[1.1] -tracking-[0.02em] max-[959px]:text-[26px]">
              Games
            </h1>
            <span className="hidden max-[959px]:inline-flex">
              <Avatar person={ME} size="lg" />
            </span>
          </header>
          <div className="grid grid-cols-[1.3fr_1fr] gap-5 max-[1180px]:grid-cols-2 max-[620px]:grid-cols-1 max-[620px]:gap-4">
            {GAMES.map((g) => (
              <GameCard key={g.id} game={g} onPlay={openDialog} />
            ))}
          </div>
        </main>

        <FriendsPanel
          selectedId={friendId}
          pending={pending}
          onSelect={(id) => setFriendId((cur) => (cur === id ? null : id))}
          onInvite={(id) => sendInvite(id)}
        />

        <TabBar view={view} onChange={changeView} />
      </div>

      <InviteDialog
        open={dialogOpen}
        game={game}
        friendId={friendId}
        pending={pending}
        onPick={setFriendId}
        onSend={() => sendInvite()}
        onCancel={cancelInvite}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
