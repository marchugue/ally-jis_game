import { useState, useEffect, useCallback } from 'react';
import type { GameId } from '../types';
import { GAMES } from '../data';
import { useGameAuth } from '../context/AuthContext';
import { fetchLeaderboard, type LeaderboardResponse } from '../lib/gameApi';
import { Avatar } from './Avatar';
import { Icon } from '../icons';

interface Props {
  onPlayGame?: (id: GameId) => void;
}

export function LeaderboardPanel({ onPlayGame }: Props) {
  const { token, user } = useGameAuth();
  const [selectedGame, setSelectedGame] = useState<GameId>('clue');
  const [scope, setScope] = useState<'global' | 'friends'>('global');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeScope = (!token && scope === 'friends') ? 'global' : scope;
      const res = await fetchLeaderboard(token, selectedGame, activeScope);
      setData(res);
    } catch (err: any) {
      console.warn('[Leaderboard] Load error:', err);
      setError(err?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [token, selectedGame, scope]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const currentGame = GAMES.find((g) => g.id === selectedGame) ?? GAMES[0];

  return (
    <div className="w-full max-w-[1000px] mx-auto animate-pop select-none">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2.5">
            <Icon name="trophy" className="w-7 h-7 text-[#F0B247]" />
            <span>Leaderboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Duel standings, win records, and top scores across campus
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Scope Toggle: Global vs Friends/Allies */}
          <div className="flex items-center p-1 rounded-full bg-[#0c1622]/90 border border-white/10 backdrop-blur-md shadow-inner">
            <button
              type="button"
              onClick={() => setScope('global')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                scope === 'global'
                  ? 'bg-gradient-to-r from-[#38C185] to-[#42d494] text-[#081B12] shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Global Campus
            </button>
            <button
              type="button"
              onClick={() => {
                if (!token) return;
                setScope('friends');
              }}
              disabled={!token}
              title={!token ? 'Sign in to view ally standings' : undefined}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                !token ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              } ${
                scope === 'friends'
                  ? 'bg-gradient-to-r from-[#38C185] to-[#42d494] text-[#081B12] shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Allies & Friends
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadLeaderboard()}
            disabled={loading}
            className="p-2 rounded-full bg-[#0c1622]/90 hover:bg-[#152638] border border-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Rankings"
          >
            <span className={`inline-block ${loading ? 'animate-spin' : ''}`}>🔄</span>
          </button>
        </div>
      </div>

      {/* ═══ Game Filter Tabs ═══ */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {GAMES.map((g) => {
          const isSelected = g.id === selectedGame;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGame(g.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-200 whitespace-nowrap cursor-pointer flex-shrink-0 ${
                isSelected
                  ? 'bg-[#152638] border-[#38C185] shadow-[0_0_20px_rgba(56,193,133,0.3)] text-white font-bold scale-[1.02]'
                  : 'bg-[#0c1622]/70 hover:bg-[#122233] border-white/10 text-[#94A3B8] hover:text-white'
              }`}
            >
              <Icon name={g.id} className={`w-4 h-4 ${isSelected ? 'text-[#38C185]' : 'text-[#94A3B8]'}`} />
              <span className="text-xs sm:text-sm">{g.name}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ My Standing Banner (if user has played) ═══ */}
      {data?.me && (
        <div className="mb-6 p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-[#112437]/90 via-[#0e1d2e]/90 to-[#14293f]/90 border border-[#38C185]/40 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#38C185]/20 border border-[#38C185]/50 flex items-center justify-center flex-none">
              <span className="font-display font-black text-lg text-[#38C185]">
                #{data.me.rank}
              </span>
            </div>
            <Avatar
              person={{
                id: user?.id || 'me',
                name: user?.name || 'You',
                avatar_url: user?.avatar_url,
              }}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base truncate">You</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#38C185]/20 text-[#38C185] border border-[#38C185]/40 uppercase tracking-wider">
                  Ranked
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {data.me.wins} Wins • {data.me.draws} Ties • {data.me.losses} Losses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-around sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
            <div className="text-center px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                POINTS
              </span>
              <span className="font-display font-black text-xl text-[#F0B247]">
                {data.me.points}
              </span>
            </div>
            {selectedGame === 'merge' && (
              <div className="text-center px-3 border-l border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                  BEST TILE
                </span>
                <span className="font-display font-black text-xl text-white">
                  {data.me.bestScore}
                </span>
              </div>
            )}
            {onPlayGame && (
              <button
                type="button"
                onClick={() => onPlayGame(selectedGame)}
                className="px-4 py-2 rounded-xl bg-[#38C185] hover:bg-[#42d494] text-[#081B12] font-black text-xs transition-transform active:scale-95 shadow-sm cursor-pointer"
              >
                Duel Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ Leaderboard Table ═══ */}
      <div className="rounded-[26px] bg-[#0c1622]/85 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Table Head */}
        <div className="grid grid-cols-[60px_minmax(0,1fr)_80px_100px] sm:grid-cols-[70px_minmax(0,1fr)_100px_120px_100px] items-center px-4 py-3.5 bg-white/[0.02] border-b border-white/10 text-[10px] font-extrabold uppercase tracking-widest text-[#94A3B8]">
          <div className="text-center">RANK</div>
          <div>PLAYER</div>
          <div className="text-center">RECORD</div>
          <div className="text-center">POINTS</div>
          <div className="hidden sm:block text-right pr-2">
            {selectedGame === 'merge' ? 'BEST SCORE' : 'DUELS'}
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="py-16 text-center text-xs text-[#94A3B8] flex flex-col items-center gap-2">
            <span className="w-5 h-5 border-2 border-[#38C185] border-t-transparent rounded-full animate-spin" />
            <span>Loading {currentGame.name} rankings...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-rose-300">
            {error}
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="divide-y divide-white/5">
            {data.items.map((entry) => {
              const displayName =
                entry.fullName?.trim() ||
                entry.username?.trim() ||
                (entry.isMe ? 'You' : 'Anonymous Peer');

              const isTop1 = entry.rank === 1;
              const isTop2 = entry.rank === 2;
              const isTop3 = entry.rank === 3;

              return (
                <div
                  key={entry.userId}
                  className={`grid grid-cols-[60px_minmax(0,1fr)_80px_100px] sm:grid-cols-[70px_minmax(0,1fr)_100px_120px_100px] items-center px-4 py-3 transition-colors ${
                    entry.isMe
                      ? 'bg-[#38C185]/10 hover:bg-[#38C185]/15'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Rank Column with Badges for Top 3 */}
                  <div className="flex items-center justify-center">
                    {isTop1 ? (
                      <span className="w-7 h-7 rounded-full bg-[#F0B247] text-[#081B12] font-black text-xs flex items-center justify-center shadow-[0_0_12px_rgba(240,178,71,0.5)]">
                        🥇
                      </span>
                    ) : isTop2 ? (
                      <span className="w-7 h-7 rounded-full bg-[#CBD5E1] text-[#081B12] font-black text-xs flex items-center justify-center shadow-[0_0_10px_rgba(203,213,225,0.4)]">
                        🥈
                      </span>
                    ) : isTop3 ? (
                      <span className="w-7 h-7 rounded-full bg-[#D97706] text-[#081B12] font-black text-xs flex items-center justify-center shadow-[0_0_10px_rgba(217,119,6,0.4)]">
                        🥉
                      </span>
                    ) : (
                      <span className="font-display font-bold text-xs sm:text-sm text-[#94A3B8]">
                        #{entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <Avatar
                      person={{
                        id: entry.userId,
                        name: displayName,
                        avatar_url: entry.avatarUrl ?? undefined,
                        avatarKey: entry.avatarKey,
                      }}
                      size="md"
                    />
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs sm:text-sm truncate font-semibold ${entry.isMe ? 'text-[#38C185] font-bold' : 'text-white'}`}>
                          {displayName}
                        </span>
                        {entry.isMe && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#38C185]/20 text-[#38C185] font-bold border border-[#38C185]/40 flex-none">
                            YOU
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* W - L - D */}
                  <div className="text-center text-xs text-[#CBD5E1] font-mono">
                    <span className="text-[#38C185] font-bold">{entry.wins}W</span>
                    <span className="opacity-50 mx-1">-</span>
                    <span className="text-rose-400 font-bold">{entry.losses}L</span>
                    {entry.draws > 0 && (
                      <span className="text-[#94A3B8] font-bold ml-1">({entry.draws}T)</span>
                    )}
                  </div>

                  {/* Points */}
                  <div className="text-center">
                    <span className="font-display font-black text-sm sm:text-base text-[#F0B247] drop-shadow-sm">
                      {entry.points}
                    </span>
                    <span className="text-[9px] text-[#94A3B8] block sm:inline sm:ml-1">pts</span>
                  </div>

                  {/* Extra Stats */}
                  <div className="hidden sm:block text-right pr-2 font-mono text-xs text-[#94A3B8]">
                    {selectedGame === 'merge' ? entry.bestScore : `${entry.gamesPlayed} games`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-[#94A3B8] px-4">
            <p className="font-medium text-sm text-white mb-1">No matches recorded yet</p>
            <p>Be the first to challenge a friend or match and claim the #1 spot!</p>
          </div>
        )}
      </div>
    </div>
  );
}
