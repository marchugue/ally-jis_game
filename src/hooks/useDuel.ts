import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameSocket } from '../context/GameSocketContext';
import type { GameSessionDto } from '../lib/gameApi';

export type OpponentLink = 'ok' | 'disconnected' | 'left';

export interface MoveResult {
  ok: boolean;
  message?: string;
}

/** Everything a game component needs to play a live 1v1 against another person. */
export interface DuelApi {
  session: GameSessionDto;
  myId: string;
  opponentName: string;
  isMyTurn: boolean;
  connected: boolean;
  opponentLink: OpponentLink;
  /** Epoch ms on the SERVER's clock (corrected for local clock skew). */
  now: () => number;
  /** Last error from the server (e.g. "It's not your turn"). Cleared on the next state update. */
  error: string | null;
  sendMove: (move: Record<string, unknown>) => Promise<MoveResult>;
  sendScore: (score: number, over?: boolean) => void;
  requestRematch: () => void;
  opponentWantsRematch: boolean;
  iRequestedRematch: boolean;
  leave: () => void;
}

interface Options {
  initial: GameSessionDto;
  myId: string;
  /** Called when both players accepted a rematch — host swaps to the new session. */
  onRematchStarted: (session: GameSessionDto) => void;
}

export function useDuel({ initial, myId, onRematchStarted }: Options): DuelApi {
  const { socket, connected } = useGameSocket();
  const [session, setSession] = useState<GameSessionDto>(initial);
  const [opponentLink, setOpponentLink] = useState<OpponentLink>('ok');
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  const [iRequestedRematch, setIRequestedRematch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(initial.serverNow - Date.now());
  const rematchCb = useRef(onRematchStarted);
  rematchCb.current = onRematchStarted;
  const sessionId = initial.id;

  const adopt = useCallback((next: GameSessionDto) => {
    offsetRef.current = next.serverNow - Date.now();
    setSession(next);
    setError(null);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const join = () => {
      socket.emit('game:join', { sessionId }, (res: { ok: boolean; session?: GameSessionDto; message?: string }) => {
        if (res?.ok && res.session) {
          adopt(res.session);
          setOpponentLink('ok');
        } else if (res?.message) {
          setError(res.message);
        }
      });
    };

    const onState = (payload: { session: GameSessionDto }) => {
      if (payload?.session?.id === sessionId) adopt(payload.session);
    };
    const onDisconnected = (p: { sessionId: string }) => p.sessionId === sessionId && setOpponentLink('disconnected');
    const onBack = (p: { sessionId: string }) => p.sessionId === sessionId && setOpponentLink('ok');
    const onLeft = (p: { sessionId: string }) => p.sessionId === sessionId && setOpponentLink('left');
    const onRematchRequested = (p: { sessionId: string }) => p.sessionId === sessionId && setOpponentWantsRematch(true);
    const onRematchStartedEvt = (p: { session: GameSessionDto; previousSessionId: string }) => {
      if (p.previousSessionId === sessionId) rematchCb.current(p.session);
    };

    socket.on('connect', join);
    socket.on('game:state', onState);
    socket.on('game:opponent_disconnected', onDisconnected);
    socket.on('game:opponent_back', onBack);
    socket.on('game:opponent_left', onLeft);
    socket.on('game:rematch_requested', onRematchRequested);
    socket.on('game:rematch_started', onRematchStartedEvt);

    if (socket.connected) join();

    return () => {
      socket.off('connect', join);
      socket.off('game:state', onState);
      socket.off('game:opponent_disconnected', onDisconnected);
      socket.off('game:opponent_back', onBack);
      socket.off('game:opponent_left', onLeft);
      socket.off('game:rematch_requested', onRematchRequested);
      socket.off('game:rematch_started', onRematchStartedEvt);
    };
  }, [socket, sessionId, adopt]);

  const sendMove = useCallback(
    (move: Record<string, unknown>) =>
      new Promise<MoveResult>((resolve) => {
        if (!socket || !socket.connected) {
          const message = 'Reconnecting… try again in a moment';
          setError(message);
          resolve({ ok: false, message });
          return;
        }
        socket.emit('game:move', { sessionId, move }, (res: MoveResult) => {
          if (!res?.ok) setError(res?.message ?? 'Move rejected');
          resolve(res ?? { ok: false });
        });
      }),
    [socket, sessionId],
  );

  const sendScore = useCallback(
    (score: number, over = false) => {
      socket?.emit('game:score', { sessionId, score, over });
    },
    [socket, sessionId],
  );

  const requestRematch = useCallback(() => {
    setIRequestedRematch(true);
    socket?.emit('game:rematch', { sessionId }, (res: { ok: boolean; message?: string }) => {
      if (!res?.ok) {
        setIRequestedRematch(false);
        setError(res?.message ?? 'Could not start a rematch');
      }
    });
  }, [socket, sessionId]);

  const leave = useCallback(() => {
    if (session.status === 'active') socket?.emit('game:leave', { sessionId });
  }, [socket, sessionId, session.status]);

  return {
    session,
    myId,
    opponentName: session.opponent.name,
    isMyTurn: session.turnUserId === myId,
    connected,
    opponentLink,
    now: () => Date.now() + offsetRef.current,
    error,
    sendMove,
    sendScore,
    requestRematch,
    opponentWantsRematch,
    iRequestedRematch,
    leave,
  };
}
