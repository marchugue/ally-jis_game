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
      document.querySelector<HTMLButtonElement>('.friends .fr:not(:disabled)')?.focus();
    }
  };

  return (
    <>
      <div className="app" data-view={view}>
        <Rail view={view} onChange={changeView} />

        <main className="main">
          <header className="top">
            <h1>Games</h1>
            <span className="me"><Avatar person={ME} size="lg" /></span>
          </header>
          <div className="grid">
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
