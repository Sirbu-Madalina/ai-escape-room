import crypto from "crypto";
import {
  deleteSessionRecordPersistent,
  DISCONNECTED_SESSION_TTL_MS,
  ensureHostExists,
  findPlayerInSession,
  getSessionRecordOrLoad,
  listSessionRecords,
  PRESENCE_STALE_MS,
  saveSessionRecord,
  sanitizeSession,
  touchSession,
} from "./sessionStore.js";

export const markPlayerConnection = async ({ sessionId, playerId, connected }) => {
  const session = await getSessionRecordOrLoad(sessionId);

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
  await saveSessionRecord(session);

  return sanitizeSession(session);
};

export const leaveSession = async ({ sessionId, playerId }) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  const playerIndex = session.players.findIndex((player) => player.id === playerId);

  if (playerIndex === -1) {
    return { error: "Player not found." };
  }

  const [removedPlayer] = session.players.splice(playerIndex, 1);

  if (session.players.length === 0) {
    await deleteSessionRecordPersistent(sessionId);
    return {
      removedSession: true,
      removedPlayerId: removedPlayer.id,
    };
  }

  ensureHostExists(session);
  touchSession(session);
  await saveSessionRecord(session);

  return {
    removedPlayerId: removedPlayer.id,
    session: sanitizeSession(session),
  };
};

export const addChatMessage = async ({ sessionId, playerId, text }) => {
  const session = await getSessionRecordOrLoad(sessionId);

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
  await saveSessionRecord(session);

  return {
    message,
    session: sanitizeSession(session),
  };
};

export const updatePlayerPresence = async ({
  sessionId,
  playerId,
  isTypingChat,
  editingTarget,
}) => {
  const session = await getSessionRecordOrLoad(sessionId);

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
  await saveSessionRecord(session);

  return sanitizeSession(session);
};

export const cleanupExpiredSessions = async () => {
  const now = Date.now();
  let removed = 0;

  for (const session of listSessionRecords()) {
    const allDisconnected = session.players.every((player) => !player.connected);
    const updatedAt = new Date(session.updatedAt).getTime();
    const expiresAt = new Date(session.expiresAt).getTime();

    if (expiresAt <= now || (allDisconnected && now - updatedAt > DISCONNECTED_SESSION_TTL_MS)) {
      await deleteSessionRecordPersistent(session.id);
      removed += 1;
    }
  }

  return removed;
};

export const decayPresenceState = async () => {
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
      await saveSessionRecord(session);
      changedSessions.push(sanitizeSession(session));
    }
  }

  return changedSessions;
};
