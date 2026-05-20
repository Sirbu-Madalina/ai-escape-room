import {
  addPlayerToSession,
  createPlayerSessionPayload,
  createSessionRecord,
  findPlayerByRecoveryToken,
  findSessionByJoinCode,
  getSessionRecord,
  sanitizeSession,
  touchSession,
} from "./sessionStore.js";

export const createSession = ({ playerName, intensity }) => {
  const result = createSessionRecord({ playerName, intensity });

  return {
    session: sanitizeSession(result.session),
    player: createPlayerSessionPayload(result.player),
  };
};

export const joinSession = ({ joinCode, playerName }) => {
  const session = findSessionByJoinCode(joinCode);

  if (!session) {
    return null;
  }

  const player = addPlayerToSession(session, playerName);

  return {
    session: sanitizeSession(session),
    player: createPlayerSessionPayload(player),
  };
};

export const restoreSessionPlayer = ({ sessionId, recoveryToken }) => {
  const session = getSessionRecord(sessionId);

  if (!session) {
    return null;
  }

  const player = findPlayerByRecoveryToken(session, recoveryToken);

  if (!player) {
    return null;
  }

  touchSession(session);

  return {
    session: sanitizeSession(session),
    player: createPlayerSessionPayload(player),
  };
};

export const getSessionById = (sessionId) => {
  const session = getSessionRecord(sessionId);
  return session ? sanitizeSession(session) : null;
};
