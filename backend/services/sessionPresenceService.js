import crypto from "crypto";
import {
  deleteSessionRecord,
  DISCONNECTED_SESSION_TTL_MS,
  ensureHostExists,
  findPlayerInSession,
  getSessionRecord,
  listSessionRecords,
  PRESENCE_STALE_MS,
  sanitizeSession,
  touchSession,
} from "./sessionStore.js";

export const markPlayerConnection = ({ sessionId, playerId, connected }) => {
  const session = getSessionRecord(sessionId);

  if (!session) {
    return null;
  }

  const player = findPlayerInSession(session, playerId);

  if (!player) {
    return null;
  }

  if (connected) {
    player.connectionCount += 1;
    player.connected = true;
  } else {
    player.connectionCount = Math.max(player.connectionCount - 1, 0);
    player.connected = player.connectionCount > 0;
    if (!player.connected) {
      player.isTypingChat = false;
      player.editingTarget = "";
    }
  }

  player.lastSeenAt = new Date().toISOString();
  touchSession(session);

  return sanitizeSession(session);
};

export const leaveSession = ({ sessionId, playerId }) => {
  const session = getSessionRecord(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  const playerIndex = session.players.findIndex((player) => player.id === playerId);

  if (playerIndex === -1) {
    return { error: "Player not found." };
  }

  const [removedPlayer] = session.players.splice(playerIndex, 1);

  if (session.players.length === 0) {
    deleteSessionRecord(sessionId);
    return {
      removedSession: true,
      removedPlayerId: removedPlayer.id,
    };
  }

  ensureHostExists(session);
  touchSession(session);

  return {
    removedPlayerId: removedPlayer.id,
    session: sanitizeSession(session),
  };
};

export const addChatMessage = ({ sessionId, playerId, text }) => {
  const session = getSessionRecord(sessionId);

  if (!session) {
    return null;
  }

  const player = findPlayerInSession(session, playerId);

  if (!player) {
    return null;
  }

  const message = {
    id: crypto.randomUUID(),
    playerId: player.id,
    playerName: player.name,
    text,
    sentAt: new Date().toISOString(),
  };

  player.isTypingChat = false;
  player.lastSeenAt = new Date().toISOString();
  session.chatMessages.push(message);

  if (session.chatMessages.length > 40) {
    session.chatMessages.splice(0, session.chatMessages.length - 40);
  }

  touchSession(session);

  return {
    message,
    session: sanitizeSession(session),
  };
};

export const updatePlayerPresence = ({
  sessionId,
  playerId,
  isTypingChat,
  editingTarget,
}) => {
  const session = getSessionRecord(sessionId);

  if (!session) {
    return null;
  }

  const player = findPlayerInSession(session, playerId);

  if (!player) {
    return null;
  }

  if (typeof isTypingChat === "boolean") {
    player.isTypingChat = isTypingChat;
  }

  if (typeof editingTarget === "string") {
    player.editingTarget = editingTarget;
  }

  player.lastSeenAt = new Date().toISOString();
  touchSession(session);

  return sanitizeSession(session);
};

export const cleanupExpiredSessions = () => {
  const now = Date.now();
  let removed = 0;

  for (const session of listSessionRecords()) {
    const allDisconnected = session.players.every((player) => !player.connected);
    const updatedAt = new Date(session.updatedAt).getTime();
    const expiresAt = new Date(session.expiresAt).getTime();

    if (expiresAt <= now || (allDisconnected && now - updatedAt > DISCONNECTED_SESSION_TTL_MS)) {
      deleteSessionRecord(session.id);
      removed += 1;
    }
  }

  return removed;
};

export const decayPresenceState = () => {
  const changedSessions = [];
  const cutoff = Date.now() - PRESENCE_STALE_MS;

  for (const session of listSessionRecords()) {
    let changed = false;

    for (const player of session.players) {
      if (new Date(player.lastSeenAt).getTime() < cutoff) {
        if (player.isTypingChat) {
          player.isTypingChat = false;
          changed = true;
        }

        if (player.editingTarget) {
          player.editingTarget = "";
          changed = true;
        }
      }
    }

    if (changed) {
      touchSession(session);
      changedSessions.push(sanitizeSession(session));
    }
  }

  return changedSessions;
};
