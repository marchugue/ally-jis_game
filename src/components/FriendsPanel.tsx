import { Fragment, useEffect, useState, useMemo, useCallback } from 'react';
import { GAMES, ME } from '../data';
import { Icon } from '../icons';
import type { Friend, GameId, Pending, Person, Presence } from '../types';
import { Avatar } from './Avatar';
import { FriendRow } from './FriendRow';
import { useGameAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import {
  getCachedAllies,
  getCachedAnonymousMatches,
  fetchAlliedConnections,
  fetchAnonymousMatches,
} from '../lib/friends';

interface Props {
  selectedId: string | null;
  pending: Pending | null;
  onSelect: (id: string) => void;
  onInvite: (gameId: GameId) => void;
  onOpponentsChange?: (opponents: Friend[]) => void;
}

export function FriendsPanel({
  selectedId,
  pending,
  onSelect,
  onInvite,
  onOpponentsChange,
}: Props) {
  const { user, token } = useGameAuth();
  const { isOnline } = usePresence();

  const [allies, setAllies] = useState<Friend[]>(() =>
    user ? getCachedAllies(user.id) : []
  );
  const [anonymousMatches, setAnonymousMatches] = useState<Friend[]>(() =>
    user ? getCachedAnonymousMatches(user.id) : []
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return user ? getCachedAllies(user.id).length === 0 && getCachedAnonymousMatches(user.id).length === 0 : false;
  });

  // Attach live presence from PresenceContext and prioritize online players
  const activeAllies = useMemo(() => {
    return allies
      .map((f) => ({
        ...f,
        status: (isOnline(f.id) ? 'online' : 'offline') as Presence,
      }))
      .sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [allies, isOnline]);

  const activeMatches = useMemo(() => {
    return anonymousMatches
      .map((m) => ({
        ...m,
        status: (isOnline(m.id) ? 'online' : 'offline') as Presence,
      }))
      .sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [anonymousMatches, isOnline]);

  const allOpponents = useMemo(() => {
    return [...activeAllies, ...activeMatches];
  }, [activeAllies, activeMatches]);

  useEffect(() => {
    if (onOpponentsChange) {
      onOpponentsChange(allOpponents);
    }
  }, [allOpponents, onOpponentsChange]);

  const loadData = useCallback(async () => {
    if (!user || !token) return;

    try {
      const [fetchedAllies, fetchedMatches] = await Promise.allSettled([
        fetchAlliedConnections(user.id, token),
        fetchAnonymousMatches(user.id, token),
      ]);

      if (fetchedAllies.status === 'fulfilled') {
        setAllies(fetchedAllies.value);
      }
      if (fetchedMatches.status === 'fulfilled') {
        setAnonymousMatches(fetchedMatches.value);
      }
    } catch (err) {
      console.warn('[FriendsPanel] Failed to fetch connections/matches:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;

    // Synchronously hydrate from cache when user changes
    setAllies(getCachedAllies(user.id));
    setAnonymousMatches(getCachedAnonymousMatches(user.id));

    // Fresh fetch from API
    loadData();

    // Periodically refresh active matches and connections
    const interval = setInterval(loadData, 25000);
    return () => clearInterval(interval);
  }, [user, token, loadData]);

  const mePerson: Person = user
    ? {
      id: user.id,
      name: user.name,
      color: '#38C185',
      avatar_url: user.avatar_url,
    }
    : ME;

  return (
    <aside
      className="friends sticky top-0 h-[100dvh] overflow-y-auto p-[36px_20px_28px] border-l border-white/10 bg-[#09111b]/65 backdrop-blur-2xl shadow-[-12px_0_40px_rgba(0,0,0,0.35)] max-[959px]:static max-[959px]:h-auto max-[959px]:border-0 max-[959px]:bg-transparent max-[959px]:backdrop-blur-none max-[959px]:shadow-none max-[959px]:p-[max(18px,env(safe-area-inset-top,0px))_18px_calc(96px+env(safe-area-inset-bottom,0px))]"
      aria-label="Friends and Matches"
    >
      <header className="flex items-center justify-between mb-6 min-h-[40px] px-2 max-[959px]:mb-5 max-[959px]:px-0">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-bold text-xl leading-none text-white tracking-tight">
            Opponents
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#38C185]/20 text-[#38C185] border border-[#38C185]/30">
            {allOpponents.filter((o) => o.status === 'online').length} Online
          </span>
        </div>
        <span className="hidden max-[959px]:inline-flex">
          <Avatar person={mePerson} size="lg" />
        </span>
      </header>

      <div className="flex flex-col gap-6 max-[959px]:max-w-[520px]">
        {/* ═══ Section 1: Allied Connections ═══ */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
              <span>Allied Connections</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 border border-white/10 text-[#94A3B8]">
                {activeAllies.length}
              </span>
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {activeAllies.length > 0 ? (
              activeAllies.map((f) => {
                const selected = f.id === selectedId;
                const canInvite = selected && !pending && f.status !== 'offline';
                return (
                  <Fragment key={f.id}>
                    <FriendRow
                      friend={f}
                      mode="panel"
                      selected={selected}
                      invited={pending?.friendId === f.id}
                      onSelect={onSelect}
                    />
                    {canInvite && (
                      <div className="flex gap-2 py-1 pb-2 pl-[56px] animate-pop">
                        {GAMES.map((g) => (
                          <button
                            key={g.id}
                            className="w-[38px] h-[38px] rounded-xl bg-white/10 border border-white/15 grid place-items-center text-white transition-all duration-150 hover:bg-[#38C185] hover:text-[#06180f] hover:border-[#38C185] active:scale-95 shadow-sm"
                            title={g.name}
                            aria-label={`Invite ${f.name} to ${g.name}`}
                            onClick={() => onInvite(g.id)}
                          >
                            <Icon name={g.id} className="w-[18px] h-[18px]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </Fragment>
                );
              })
            ) : isLoading ? (
              <div className="py-4 text-center text-xs text-[#94A3B8]">Loading allies...</div>
            ) : (
              <div className="p-3 text-center rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-[#94A3B8]">
                No allied connections yet.
              </div>
            )}
          </div>
        </div>

        {/* ═══ Section 2: Anonymous Matches ═══ */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
              <span>Campus Matches</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 border border-white/10 text-[#94A3B8]">
                {activeMatches.length}
              </span>
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {activeMatches.length > 0 ? (
              activeMatches.map((m) => {
                const selected = m.id === selectedId;
                const canInvite = selected && !pending && m.status !== 'offline';
                return (
                  <Fragment key={m.id}>
                    <FriendRow
                      friend={m}
                      mode="panel"
                      selected={selected}
                      invited={pending?.friendId === m.id}
                      onSelect={onSelect}
                    />
                    {canInvite && (
                      <div className="flex gap-2 py-1 pb-2 pl-[56px] animate-pop">
                        {GAMES.map((g) => (
                          <button
                            key={g.id}
                            className="w-[38px] h-[38px] rounded-xl bg-white/10 border border-white/15 grid place-items-center text-white transition-all duration-150 hover:bg-[#38C185] hover:text-[#06180f] hover:border-[#38C185] active:scale-95 shadow-sm"
                            title={g.name}
                            aria-label={`Invite ${m.name} to ${g.name}`}
                            onClick={() => onInvite(g.id)}
                          >
                            <Icon name={g.id} className="w-[18px] h-[18px]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </Fragment>
                );
              })
            ) : isLoading ? (
              <div className="py-4 text-center text-xs text-[#94A3B8]">Loading matches...</div>
            ) : (
              <div className="p-3 text-center rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-[#94A3B8]">
                No active anonymous matches.
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
