import crypto from "crypto";
import { getIntensityOption, normalizeIntensity } from "../data/intensity.js";
import { initialRooms } from "../data/initialRooms.js";
import { getSessionsCollection, isMongoConfigured } from "./mongoService.js";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 6;
export const DISCONNECTED_SESSION_TTL_MS = 1000 * 60 * 30;
export const PRESENCE_STALE_MS = 1000 * 8;

const sessions = new Map();
const dirtySessionIds = new Set();

export const cloneRooms = (intensity = "medium") => {
  const option = getIntensityOption(intensity);

  return initialRooms.map((room) => ({
    ...room,
    difficulty: option.aiDifficulty,
    timeLimitSeconds: option.timeLimitSeconds,
  }));
};

export const createInitialGameState = (intensity = "medium") => {
  const normalizedIntensity = normalizeIntensity(intensity);
  const option = getIntensityOption(normalizedIntensity);
  const rooms = cloneRooms(normalizedIntensity);

  return {
    intensity: normalizedIntensity,
    maxLives: option.lives,
    currentScreen: "lobby",
    selectedRoomId: 1,
    lives: option.lives,
    rooms,
    clearedRoomIds: [],
    roomCleared: false,
    secondsLeft: rooms[0].timeLimitSeconds,
    activePuzzle: null,
    puzzleInstanceId: 0,
    wrongAnswerEventId: 0,
    gameOverEventId: 0,
    textAnswerDraft: "",
    emailSearchDraft: "",
    emailSelectedId: "",
    logicBoardDraft: "",
    crosswordDraft: {},
    loading: false,
    hintUsed: false,
    answerUsed: false,
    showHint: false,
    showAnswerText: false,
    showExplanation: false,
    message: "",
  };
};

const createPlayer = (name, { isHost = false } = {}) => {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    recoveryToken: crypto.randomUUID(),
    name,
    isHost,
    connected: true,
    connectionCount: 0,
    joinedAt: now,
    lastSeenAt: now,
    isTypingChat: false,
    editingTarget: "",
  };
};

const sanitizePlayer = (player) => ({
  id: player.id,
  name: player.name,
  isHost: player.isHost,
  connected: player.connected,
  joinedAt: player.joinedAt,
  lastSeenAt: player.lastSeenAt,
  isTypingChat: player.isTypingChat,
  editingTarget: player.editingTarget,
});

export const createPlayerSessionPayload = (player) => ({
  id: player.id,
  name: player.name,
  isHost: player.isHost,
  connected: player.connected,
  joinedAt: player.joinedAt,
  lastSeenAt: player.lastSeenAt,
  recoveryToken: player.recoveryToken,
  isTypingChat: player.isTypingChat,
  editingTarget: player.editingTarget,
});

const generateJoinCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  while (code.length < 6) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
};

const generateUniqueJoinCode = () => {
  let joinCode = generateJoinCode();

  while ([...sessions.values()].some((session) => session.joinCode === joinCode)) {
    joinCode = generateJoinCode();
  }

  return joinCode;
};

export const createSessionRecord = ({ playerName, intensity }) => {
  const host = createPlayer(playerName, { isHost: true });
  const now = new Date().toISOString();
  const session = {
    id: crypto.randomUUID(),
    joinCode: generateUniqueJoinCode(),
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    hostPlayerId: host.id,
    players: [host],
    chatMessages: [],
    gameState: createInitialGameState(intensity),
  };

  sessions.set(session.id, session);
  dirtySessionIds.add(session.id);

  return {
    session,
    player: host,
  };
};

export const touchSession = (session) => {
  const now = new Date();
  session.updatedAt = now.toISOString();
  session.expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
  dirtySessionIds.add(session.id);
  return session;
};

export const sanitizeSession = (session) => structuredClone({
  id: session.id,
  joinCode: session.joinCode,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  expiresAt: session.expiresAt,
  hostPlayerId: session.hostPlayerId,
  players: session.players.map(sanitizePlayer),
  chatMessages: session.chatMessages,
  gameState: session.gameState,
});

export const getSessionRecord = (sessionId) => sessions.get(sessionId);

export const listSessionRecords = () => [...sessions.values()];

export const deleteSessionRecord = (sessionId) => {
  sessions.delete(sessionId);
  dirtySessionIds.delete(sessionId);
};

export const findSessionByJoinCode = (joinCode) => {
  return [...sessions.values()].find((session) => session.joinCode === joinCode) ?? null;
};

export const addPlayerToSession = (session, playerName) => {
  const player = createPlayer(playerName);
  session.players.push(player);
  touchSession(session);
  return player;
};

export const findPlayerInSession = (session, playerId) => {
  return session.players.find((candidate) => candidate.id === playerId) ?? null;
};

export const findPlayerByRecoveryToken = (session, recoveryToken) => {
  return session.players.find((candidate) => candidate.recoveryToken === recoveryToken) ?? null;
};

export const ensureHostExists = (session) => {
  const host = session.players.find((player) => player.id === session.hostPlayerId);

  if (host) {
    session.players.forEach((player) => {
      player.isHost = player.id === host.id;
    });
    return host;
  }

  const nextHost = session.players[0] ?? null;

  if (!nextHost) {
    session.hostPlayerId = "";
    return null;
  }

  session.hostPlayerId = nextHost.id;
  session.players.forEach((player) => {
    player.isHost = player.id === nextHost.id;
  });

  return nextHost;
};

const serializeSessionRecord = (session) => ({
  _id: session.id,
  id: session.id,
  joinCode: session.joinCode,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  expiresAt: session.expiresAt,
  hostPlayerId: session.hostPlayerId,
  players: session.players,
  chatMessages: session.chatMessages,
  gameState: session.gameState,
});

const hydrateSessionRecord = (sessionDocument) => {
  if (!sessionDocument) {
    return null;
  }

  const session = {
    id: sessionDocument.id ?? sessionDocument._id,
    joinCode: sessionDocument.joinCode,
    createdAt: sessionDocument.createdAt,
    updatedAt: sessionDocument.updatedAt,
    expiresAt: sessionDocument.expiresAt,
    hostPlayerId: sessionDocument.hostPlayerId,
    players: sessionDocument.players ?? [],
    chatMessages: sessionDocument.chatMessages ?? [],
    gameState: sessionDocument.gameState ?? createInitialGameState(),
  };

  sessions.set(session.id, session);
  dirtySessionIds.delete(session.id);
  return session;
};

export const getSessionRecordOrLoad = async (sessionId) => {
  const inMemorySession = sessions.get(sessionId);

  if (inMemorySession) {
    if (new Date(inMemorySession.expiresAt).getTime() <= Date.now()) {
      await deleteSessionRecordPersistent(sessionId);
      return null;
    }

    return inMemorySession;
  }

  if (!isMongoConfigured()) {
    return null;
  }

  const collection = await getSessionsCollection();

  if (!collection) {
    return null;
  }

  const sessionDocument = await collection.findOne({ _id: sessionId });
  const hydratedSession = hydrateSessionRecord(sessionDocument);

  if (hydratedSession && new Date(hydratedSession.expiresAt).getTime() <= Date.now()) {
    await deleteSessionRecordPersistent(hydratedSession.id);
    return null;
  }

  return hydratedSession;
};

export const findSessionByJoinCodeOrLoad = async (joinCode) => {
  const inMemorySession = findSessionByJoinCode(joinCode);

  if (inMemorySession) {
    if (new Date(inMemorySession.expiresAt).getTime() <= Date.now()) {
      await deleteSessionRecordPersistent(inMemorySession.id);
      return null;
    }

    return inMemorySession;
  }

  if (!isMongoConfigured()) {
    return null;
  }

  const collection = await getSessionsCollection();

  if (!collection) {
    return null;
  }

  const sessionDocument = await collection.findOne({ joinCode });
  const hydratedSession = hydrateSessionRecord(sessionDocument);

  if (hydratedSession && new Date(hydratedSession.expiresAt).getTime() <= Date.now()) {
    await deleteSessionRecordPersistent(hydratedSession.id);
    return null;
  }

  return hydratedSession;
};

export const saveSessionRecord = async (session) => {
  if (!isMongoConfigured()) {
    return;
  }

  const collection = await getSessionsCollection();

  if (!collection) {
    return;
  }

  await collection.replaceOne(
    { _id: session.id },
    serializeSessionRecord(session),
    { upsert: true },
  );

  dirtySessionIds.delete(session.id);
};

export const deleteSessionRecordPersistent = async (sessionId) => {
  deleteSessionRecord(sessionId);

  if (!isMongoConfigured()) {
    return;
  }

  const collection = await getSessionsCollection();

  if (!collection) {
    return;
  }

  await collection.deleteOne({ _id: sessionId });
};

export const persistDirtySessions = async () => {
  if (!isMongoConfigured() || dirtySessionIds.size === 0) {
    return 0;
  }

  const collection = await getSessionsCollection();

  if (!collection) {
    return 0;
  }

  const sessionIds = [...dirtySessionIds];

  for (const sessionId of sessionIds) {
    const session = sessions.get(sessionId);

    if (!session) {
      dirtySessionIds.delete(sessionId);
      continue;
    }

    await collection.replaceOne(
      { _id: session.id },
      serializeSessionRecord(session),
      { upsert: true },
    );

    dirtySessionIds.delete(sessionId);
  }

  return sessionIds.length;
};
