import { cloneRooms, createInitialGameState } from "./sessionStore.js";
import { createPuzzleForRoom } from "./puzzleService.js";
import {
  getSessionRecordOrLoad,
  sanitizeSession,
  saveSessionRecord,
  touchSession,
} from "./sessionStore.js";

const getSelectedRoom = (session) => {
  return session.gameState.rooms.find((room) => room.id === session.gameState.selectedRoomId) ?? null;
};

const ensureHostAction = (session, actorPlayerId) => {
  if (!actorPlayerId || session.hostPlayerId !== actorPlayerId) {
    return {
      error: "Only the host can do that.",
    };
  }

  return null;
};

const resetTransientRoomState = (session) => {
  session.gameState.roomCleared = false;
  session.gameState.activePuzzle = null;
  session.gameState.textAnswerDraft = "";
  session.gameState.emailSearchDraft = "";
  session.gameState.emailSelectedId = "";
  session.gameState.logicBoardDraft = "";
  session.gameState.loading = false;
  session.gameState.hintUsed = false;
  session.gameState.answerUsed = false;
  session.gameState.showHint = false;
  session.gameState.showAnswerText = false;
  session.gameState.showExplanation = false;
};

const unlockNextRoom = (session) => {
  const nextRoom = session.gameState.rooms.find(
    (room) => room.id === session.gameState.selectedRoomId + 1,
  );

  if (nextRoom) {
    nextRoom.unlocked = true;
  }
};

const markRoomAsCleared = (session) => {
  if (!session.gameState.clearedRoomIds.includes(session.gameState.selectedRoomId)) {
    session.gameState.clearedRoomIds.push(session.gameState.selectedRoomId);
  }

  session.gameState.roomCleared = true;
  session.gameState.showExplanation = true;
  unlockNextRoom(session);
};

const getFailureStatusText = ({ failureMessage, lives }) => {
  return lives === 0
    ? `${failureMessage} You now have 0 lives left. You can still submit an answer or give up. A new puzzle is ready.`
    : `${failureMessage} You lost 1 life. ${lives} left. A new puzzle is ready.`;
};

const loadPuzzleForSelectedRoom = async (session, statusText) => {
  const room = getSelectedRoom(session);

  if (!room) {
    throw new Error("Room not found.");
  }

  resetTransientRoomState(session);
  session.gameState.currentScreen = "room";
  session.gameState.loading = true;
  session.gameState.secondsLeft = room.timeLimitSeconds;
  session.gameState.message = statusText ?? `Preparing ${room.title} for the team...`;
  touchSession(session);

  const puzzle = await createPuzzleForRoom(room);
  session.gameState.puzzleInstanceId += 1;
  session.gameState.activePuzzle = puzzle;
  session.gameState.emailSelectedId = puzzle.kind === "email-investigation"
    ? puzzle.emails[0]?.id ?? ""
    : "";
  session.gameState.loading = false;
  session.gameState.message = statusText ?? `${room.title} is ready. Solve it before the timer ends.`;
  touchSession(session);
};

const handleFailedAttempt = async (session, failureMessage) => {
  session.gameState.lives = Math.max(session.gameState.lives - 1, 0);
  session.gameState.showHint = false;
  session.gameState.showAnswerText = false;
  session.gameState.showExplanation = false;

  await loadPuzzleForSelectedRoom(
    session,
    getFailureStatusText({
      failureMessage,
      lives: session.gameState.lives,
    }),
  );
};

const handleSolvedRoom = (session) => {
  markRoomAsCleared(session);

  const nextRoom = session.gameState.rooms.find(
    (room) => room.id === session.gameState.selectedRoomId + 1 && room.unlocked,
  );

  session.gameState.message = nextRoom
    ? `${getSelectedRoom(session)?.title} cleared. ${nextRoom.title} is now ready.`
    : `${getSelectedRoom(session)?.title} cleared. You escaped the final room.`;

  touchSession(session);
};

export const startRoomSession = async ({ sessionId, roomId, actorPlayerId }) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  const hostError = ensureHostAction(session, actorPlayerId);
  if (hostError) {
    return hostError;
  }

  const room = session.gameState.rooms.find((candidate) => candidate.id === roomId);

  if (!room) {
    return { error: "Room not found." };
  }

  if (!room.unlocked) {
    return { error: "That room is still locked." };
  }

  session.gameState.selectedRoomId = room.id;

  try {
    await loadPuzzleForSelectedRoom(session);
    await saveSessionRecord(session);
    return { session: sanitizeSession(session) };
  } catch (error) {
    console.error("Shared room start error:", error);
    session.gameState.loading = false;
    session.gameState.activePuzzle = null;
    session.gameState.message = "Failed to load the shared puzzle.";
    touchSession(session);
    await saveSessionRecord(session);
    return {
      error: "Failed to load the shared puzzle.",
      session: sanitizeSession(session),
    };
  }
};

export const submitAnswerSession = async ({ sessionId, answerPayload }) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  const puzzle = session.gameState.activePuzzle;

  if (!puzzle || session.gameState.roomCleared || session.gameState.loading) {
    return { error: "There is no active shared puzzle right now." };
  }

  if (puzzle.kind === "logic-board") {
    const selectedOption = answerPayload?.logicBoardSelection ?? session.gameState.logicBoardDraft;

    if (!selectedOption) {
      return { error: "Choose one terminal before submitting." };
    }

    if (selectedOption === puzzle.answer) {
      handleSolvedRoom(session);
      await saveSessionRecord(session);
      return { session: sanitizeSession(session) };
    }

    await handleFailedAttempt(session, "That terminal was not the correct choice.");
    await saveSessionRecord(session);
    return { session: sanitizeSession(session) };
  }

  if (puzzle.kind === "email-investigation") {
    const userAnswer = (answerPayload?.textAnswer ?? session.gameState.textAnswerDraft)?.trim().toLowerCase();
    const correctAnswer = puzzle.answer.trim().toLowerCase();

    if (!userAnswer) {
      return { error: "Enter the override code before submitting." };
    }

    if (userAnswer === correctAnswer) {
      handleSolvedRoom(session);
      await saveSessionRecord(session);
      return { session: sanitizeSession(session) };
    }

    await handleFailedAttempt(session, "That override code is not correct.");
    await saveSessionRecord(session);
    return { session: sanitizeSession(session) };
  }

  const userAnswer = (answerPayload?.textAnswer ?? session.gameState.textAnswerDraft)?.trim().toLowerCase();
  const correctAnswer = puzzle.answer.trim().toLowerCase();

  if (!userAnswer) {
    return { error: "Enter an answer before submitting." };
  }

  if (userAnswer === correctAnswer) {
    handleSolvedRoom(session);
    await saveSessionRecord(session);
    return { session: sanitizeSession(session) };
  }

  await handleFailedAttempt(session, "Wrong answer.");
  await saveSessionRecord(session);
  return { session: sanitizeSession(session) };
};

export const useHintSession = async ({ sessionId }) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  if (!session.gameState.activePuzzle || session.gameState.hintUsed) {
    return { error: "Hint is not available right now." };
  }

  session.gameState.hintUsed = true;
  session.gameState.showHint = true;
  touchSession(session);
  await saveSessionRecord(session);

  return { session: sanitizeSession(session) };
};

export const revealAnswerSession = async ({ sessionId }) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  const puzzle = session.gameState.activePuzzle;

  if (!puzzle || session.gameState.answerUsed || session.gameState.roomCleared) {
    return { error: "Answer reveal is not available right now." };
  }

  session.gameState.answerUsed = true;
  session.gameState.lives = Math.max(session.gameState.lives - 1, 0);

  session.gameState.showAnswerText = true;

  session.gameState.message = `You used Get answer and lost 1 life. ${session.gameState.lives} left.`;
  touchSession(session);
  await saveSessionRecord(session);

  return { session: sanitizeSession(session) };
};

export const updateTextDraftSession = async ({ sessionId, text, actorPlayerId }) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  if (
    !session.gameState.activePuzzle ||
    !["text", "email-investigation"].includes(session.gameState.activePuzzle.kind)
  ) {
    return { error: "Text draft is not available right now." };
  }

  session.gameState.textAnswerDraft = String(text ?? "").slice(0, 120);
  const player = session.players.find((candidate) => candidate.id === actorPlayerId);
  if (player) {
    player.editingTarget = "answer";
    player.lastSeenAt = new Date().toISOString();
  }
  touchSession(session);
  await saveSessionRecord(session);

  return { session: sanitizeSession(session) };
};

export const updateEmailInvestigationDraftSession = async ({
  sessionId,
  searchQuery,
  selectedEmailId,
  actorPlayerId,
}) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  const puzzle = session.gameState.activePuzzle;

  if (!puzzle || puzzle.kind !== "email-investigation") {
    return { error: "Email investigation draft is not available right now." };
  }

  if (typeof searchQuery === "string") {
    session.gameState.emailSearchDraft = searchQuery.slice(0, 80);
  }

  if (typeof selectedEmailId === "string") {
    const isValidEmail = selectedEmailId === "" || puzzle.emails.some((email) => email.id === selectedEmailId);

    if (!isValidEmail) {
      return { error: "That email is not available." };
    }

    session.gameState.emailSelectedId = selectedEmailId;
  }

  const player = session.players.find((candidate) => candidate.id === actorPlayerId);
  if (player) {
    player.editingTarget = "email inbox";
    player.lastSeenAt = new Date().toISOString();
  }

  touchSession(session);
  await saveSessionRecord(session);

  return { session: sanitizeSession(session) };
};

export const updateLogicBoardDraftSession = async ({ sessionId, selection, actorPlayerId }) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  const puzzle = session.gameState.activePuzzle;

  if (!puzzle || puzzle.kind !== "logic-board") {
    return { error: "Logic board draft is not available right now." };
  }

  const nextSelection = typeof selection === "string" ? selection : "";
  const isValidSelection = nextSelection === "" || puzzle.options.some((option) => option.id === nextSelection);

  if (!isValidSelection) {
    return { error: "That selection is not valid." };
  }

  session.gameState.logicBoardDraft = nextSelection;
  const player = session.players.find((candidate) => candidate.id === actorPlayerId);
  if (player) {
    player.editingTarget = nextSelection ? "logic board" : "";
    player.lastSeenAt = new Date().toISOString();
  }
  touchSession(session);
  await saveSessionRecord(session);

  return { session: sanitizeSession(session) };
};

export const endSessionRun = async ({ sessionId, actorPlayerId }) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  const hostError = ensureHostAction(session, actorPlayerId);
  if (hostError) {
    return hostError;
  }

  session.gameState.currentScreen = "game-over";
  resetTransientRoomState(session);
  session.gameState.message = "The team gave up on this run.";
  touchSession(session);
  await saveSessionRecord(session);

  return { session: sanitizeSession(session) };
};

export const restartSessionRun = async ({ sessionId, actorPlayerId }) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  const hostError = ensureHostAction(session, actorPlayerId);
  if (hostError) {
    return hostError;
  }

  const resetRooms = cloneRooms(session.gameState.intensity).map((room, index) => ({ ...room, unlocked: index === 0 }));

  session.gameState = {
    ...session.gameState,
    ...{
      currentScreen: "lobby",
      selectedRoomId: 1,
      maxLives: session.gameState.maxLives,
      lives: session.gameState.maxLives,
      rooms: resetRooms,
      clearedRoomIds: [],
      roomCleared: false,
      secondsLeft: resetRooms[0].timeLimitSeconds,
      activePuzzle: null,
      puzzleInstanceId: 0,
      textAnswerDraft: "",
      emailSearchDraft: "",
      emailSelectedId: "",
      logicBoardDraft: "",
      loading: false,
      hintUsed: false,
      answerUsed: false,
      showHint: false,
      showAnswerText: false,
      showExplanation: false,
      message: "",
    },
  };
  touchSession(session);
  await saveSessionRecord(session);

  return { session: sanitizeSession(session) };
};

export const returnSessionToLobby = async ({ sessionId, actorPlayerId }) => {
  const session = await getSessionRecordOrLoad(sessionId);

  if (!session) {
    return { error: "Session not found." };
  }

  const hostError = ensureHostAction(session, actorPlayerId);
  if (hostError) {
    return hostError;
  }

  const selectedRoom = getSelectedRoom(session);
  session.gameState.currentScreen = "lobby";
  resetTransientRoomState(session);
  session.gameState.secondsLeft = selectedRoom?.timeLimitSeconds ?? createInitialGameState(session.gameState.intensity).secondsLeft;
  session.gameState.message = "The team returned to the lobby.";
  touchSession(session);
  await saveSessionRecord(session);

  return { session: sanitizeSession(session) };
};

export const tickActiveSessions = async ({ sessions }) => {
  const changedSessions = [];

  for (const session of sessions) {
    const state = session.gameState;

    if (
      state.currentScreen !== "room"
      || state.loading
      || !state.activePuzzle
      || state.roomCleared
      || state.showAnswerText
    ) {
      continue;
    }

    if (state.secondsLeft <= 1) {
      await handleFailedAttempt(session, "Time is up.");
      changedSessions.push(sanitizeSession(session));
      continue;
    }

    state.secondsLeft -= 1;
    touchSession(session);
    changedSessions.push(sanitizeSession(session));
  }

  return changedSessions;
};
