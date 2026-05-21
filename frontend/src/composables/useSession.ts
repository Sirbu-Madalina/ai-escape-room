import { computed, ref } from "vue";
import type { Socket } from "socket.io-client";
import {
  createSession as createSessionRequest,
  joinSession as joinSessionRequest,
  restoreSession as restoreSessionRequest,
  type GameSession,
  type SessionPlayer,
} from "../services/sessionClient";
import type { IntensityLevel } from "../data/intensity";
import { connectSessionSocket } from "../services/sessionSocket";

const STORED_SESSION_KEY = "ai-escape-room-session";

type StoredSessionIdentity = {
  sessionId: string;
  playerId: string;
  playerName: string;
  joinCode: string;
  recoveryToken: string;
};

export const useSession = ({
  onSessionState,
  onSessionLeft,
}: {
  onSessionState: (session: GameSession) => void;
  onSessionLeft: () => void;
}) => {
  const playerName = ref("");
  const joinCodeInput = ref("");
  const session = ref<GameSession | null>(null);
  const currentPlayer = ref<SessionPlayer | null>(null);
  const sessionLoading = ref(false);
  const sessionError = ref("");
  const realtimeError = ref("");
  const chatInput = ref("");
  const isRestoring = ref(false);
  let sessionSocket: Socket | null = null;

  const isHost = computed(() => {
    return Boolean(session.value && currentPlayer.value && session.value.hostPlayerId === currentPlayer.value.id);
  });

  const inviteLink = computed(() => {
    if (!session.value || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}${window.location.pathname}?join=${session.value.joinCode}`;
  });

  const persistSessionIdentity = (nextSession: GameSession, nextPlayer: SessionPlayer & { recoveryToken?: string }) => {
    if (!nextPlayer.recoveryToken) {
      return;
    }

    const payload: StoredSessionIdentity = {
      sessionId: nextSession.id,
      playerId: nextPlayer.id,
      playerName: nextPlayer.name,
      joinCode: nextSession.joinCode,
      recoveryToken: nextPlayer.recoveryToken,
    };

    window.localStorage.setItem(STORED_SESSION_KEY, JSON.stringify(payload));
  };

  const clearStoredSessionIdentity = () => {
    window.localStorage.removeItem(STORED_SESSION_KEY);
  };

  const readStoredSessionIdentity = () => {
    const rawValue = window.localStorage.getItem(STORED_SESSION_KEY);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as StoredSessionIdentity;
    } catch {
      clearStoredSessionIdentity();
      return null;
    }
  };

  const clearLocalSession = () => {
    session.value = null;
    currentPlayer.value = null;
    chatInput.value = "";
    realtimeError.value = "";
    clearStoredSessionIdentity();
    sessionSocket?.disconnect();
    sessionSocket = null;
    onSessionLeft();
  };

  const applyJoinedSession = (
    nextSession: GameSession,
    nextPlayer: SessionPlayer & { recoveryToken?: string },
  ) => {
    currentPlayer.value = nextPlayer;
    playerName.value = nextPlayer.name;
    joinCodeInput.value = nextSession.joinCode;
    session.value = nextSession;
    onSessionState(nextSession);
    sessionSocket?.disconnect();
    realtimeError.value = "";

    sessionSocket = connectSessionSocket({
      sessionId: nextSession.id,
      playerId: nextPlayer.id,
      handlers: {
        onSessionState: (incomingSession) => {
          session.value = incomingSession;
          onSessionState(incomingSession);
        },
        onError: (errorMessage) => {
          realtimeError.value = errorMessage;
        },
        onLeft: () => {
          clearLocalSession();
        },
      },
    });

    persistSessionIdentity(nextSession, nextPlayer);
  };

  const ensurePlayerName = () => {
    const normalized = playerName.value.trim();

    if (!normalized) {
      sessionError.value = "Enter a display name first.";
      return null;
    }

    return normalized;
  };

  const restorePersistedSession = async () => {
    const storedIdentity = readStoredSessionIdentity();

    if (!storedIdentity) {
      const joinParam = new URLSearchParams(window.location.search).get("join");
      if (joinParam) {
        joinCodeInput.value = joinParam.toUpperCase();
      }
      return;
    }

    sessionLoading.value = true;
    sessionError.value = "";
    isRestoring.value = true;

    try {
      const result = await restoreSessionRequest(storedIdentity.sessionId, storedIdentity.recoveryToken);
      applyJoinedSession(result.session, result.player);
    } catch (error) {
      clearStoredSessionIdentity();
      sessionError.value = error instanceof Error ? error.message : "Failed to restore your previous session.";
    } finally {
      sessionLoading.value = false;
      isRestoring.value = false;
    }

    const joinParam = new URLSearchParams(window.location.search).get("join");
    if (joinParam) {
      joinCodeInput.value = joinParam.toUpperCase();
    }
  };

  const createSession = async (intensity: IntensityLevel) => {
    const normalizedPlayerName = ensurePlayerName();

    if (!normalizedPlayerName) {
      return;
    }

    sessionLoading.value = true;
    sessionError.value = "";

    try {
      const result = await createSessionRequest(normalizedPlayerName, intensity);
      applyJoinedSession(result.session, result.player);
    } catch (error) {
      sessionError.value = error instanceof Error ? error.message : "Failed to create session.";
    } finally {
      sessionLoading.value = false;
    }
  };

  const joinSession = async () => {
    const normalizedPlayerName = ensurePlayerName();
    const normalizedJoinCode = joinCodeInput.value.trim().toUpperCase();

    if (!normalizedPlayerName) {
      return;
    }

    if (!normalizedJoinCode) {
      sessionError.value = "Enter a join code to join an existing session.";
      return;
    }

    sessionLoading.value = true;
    sessionError.value = "";

    try {
      const result = await joinSessionRequest(normalizedPlayerName, normalizedJoinCode);
      applyJoinedSession(result.session, result.player);
    } catch (error) {
      sessionError.value = error instanceof Error ? error.message : "Failed to join session.";
    } finally {
      sessionLoading.value = false;
    }
  };

  const sendChatMessage = () => {
    const normalizedText = chatInput.value.trim();

    if (!normalizedText || !sessionSocket) {
      return;
    }

    sessionSocket.emit("chat:send", {
      text: normalizedText,
    });
    chatInput.value = "";
    sessionSocket.emit("presence:chat-typing", {
      isTyping: false,
    });
  };

  const setChatInputValue = (value: string) => {
    chatInput.value = value;

    if (sessionSocket) {
      sessionSocket.emit("presence:chat-typing", {
        isTyping: value.trim().length > 0,
      });
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink.value) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink.value);
  };

  return {
    playerName,
    joinCodeInput,
    session,
    currentPlayer,
    sessionLoading,
    sessionError,
    realtimeError,
    chatInput,
    isHost,
    inviteLink,
    sessionSocketRef: () => sessionSocket,
    clearLocalSession,
    createSession,
    joinSession,
    restorePersistedSession,
    setChatInputValue,
    sendChatMessage,
    copyInviteLink,
    disconnectRealtime: () => {
      sessionSocket?.disconnect();
      sessionSocket = null;
    },
    emitRoomStart: (roomId: number) => sessionSocket?.emit("room:start", { roomId }),
    emitRoomExit: () => sessionSocket?.emit("room:exit"),
    emitRestart: () => sessionSocket?.emit("session:restart"),
    emitGiveUp: () => sessionSocket?.emit("session:give-up"),
    emitHint: () => sessionSocket?.emit("hint:use"),
    emitReveal: () => sessionSocket?.emit("answer:reveal"),
    emitSubmitAnswer: (payload: {
      crosswordDraft?: Record<string, string>;
      textAnswer: string;
      logicBoardSelection: string;
    }) =>
      sessionSocket?.emit("answer:submit", payload),
    emitDraftText: (text: string) => sessionSocket?.emit("draft:text", { text }),
    emitDraftEmail: (payload: { searchQuery?: string; selectedEmailId?: string }) =>
      sessionSocket?.emit("draft:email-investigation", payload),
    emitDraftLogic: (selection: string) => sessionSocket?.emit("draft:logic-board", { selection }),
    emitDraftCrossword: (draft: Record<string, string>) => sessionSocket?.emit("draft:crossword", { draft }),
    emitEditingPresence: (editingTarget: string) => sessionSocket?.emit("presence:editing", { editingTarget }),
    leaveSession: () => sessionSocket?.emit("session:leave"),
  };
};
