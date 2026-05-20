import {
  addPlayerToSession,
  createPlayerSessionPayload,
  createSessionRecord,
  findPlayerByRecoveryToken,
  findSessionByJoinCodeOrLoad,
  getSessionRecordOrLoad,
  saveSessionRecord,
  sanitizeSession,
  touchSession,
} from "./sessionStore.js";

export const createSession = async ({ playerName }) => {
  const result = createSessionRecord({ playerName });
  await saveSessionRecord(result.session);

  return {
    session: sanitizeSession(result.session),
    player: createPlayerSessionPayload(result.player),
  };
};

export const joinSession = async ({ joinCode, playerName }) => {
  const session = await findSessionByJoinCodeOrLoad(joinCode);

  if (!session) {
    return null;
  }

  const player = addPlayerToSession(session, playerName);
  await saveSessionRecord(session);

  return {
    session: sanitizeSession(session),
    player: createPlayerSessionPayload(player),
  };
};

export const restoreSessionPlayer = async ({ sessionId, recoveryToken }) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return null;
  }

  const player = findPlayerByRecoveryToken(session, recoveryToken);

  if (!player) {
    return null;
  }

  touchSession(session);
  await saveSessionRecord(session);

  return {
    session: sanitizeSession(session),
    player: createPlayerSessionPayload(player),
  };
};

export const getSessionById = async (sessionId) => {
  const session = await getSessionRecordOrLoad(sessionId);
  return session ? sanitizeSession(session) : null;
};
