import {
  addChatMessage,
  endSessionRun,
  getSessionById,
  leaveSession,
  markPlayerConnection,
  returnSessionToLobby,
  restartSessionRun,
  startRoomSession,
  submitAnswerSession,
  updateCrosswordDraftSession,
  updateEmailInvestigationDraftSession,
  updateLogicBoardDraftSession,
  updatePlayerPresence,
  updateTextDraftSession,
  useHintSession,
  revealAnswerSession,
} from "../services/sessionService.js";

const MAX_CHAT_LENGTH = 240;

export const registerSessionSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("session:join", async ({ sessionId, playerId }) => {
      const result = await markPlayerConnection({
        sessionId,
        playerId,
        connected: true,
      });

      if (result?.error || !result?.session) {
        socket.emit("session:error", {
          message: result?.error ?? "Unable to join realtime session.",
        });
        return;
      }

      socket.data.sessionId = sessionId;
      socket.data.playerId = playerId;
      socket.join(sessionId);

      io.to(sessionId).emit("session:state", result.session);
    });

    socket.on("chat:send", async ({ text }) => {
      const sessionId = socket.data.sessionId;
      const playerId = socket.data.playerId;
      const normalizedText = text?.trim().slice(0, MAX_CHAT_LENGTH);

      if (!sessionId || !playerId || !normalizedText) {
        return;
      }

      const result = await addChatMessage({
        sessionId,
        playerId,
        text: normalizedText,
      });

      if (!result) {
        socket.emit("session:error", {
          message: "Unable to send message.",
        });
        return;
      }

      io.to(sessionId).emit("chat:message", result.message);
      io.to(sessionId).emit("session:state", result.session);
    });

    socket.on("session:leave", async (acknowledge) => {
      const sessionId = socket.data.sessionId;
      const playerId = socket.data.playerId;

      if (!sessionId || !playerId) {
        if (typeof acknowledge === "function") {
          acknowledge({ ok: false });
        }
        return;
      }

      const result = await leaveSession({ sessionId, playerId });

      if (result?.error) {
        socket.emit("session:error", {
          message: result.error,
        });
        if (typeof acknowledge === "function") {
          acknowledge({ ok: false, error: result.error });
        }
        return;
      }

      socket.leave(sessionId);
      socket.emit("session:left", {
        sessionId,
      });
      if (typeof acknowledge === "function") {
        acknowledge({ ok: true });
      }

      if (result?.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });

    socket.on("session:refresh", async ({ sessionId }) => {
      const session = await getSessionById(sessionId);

      if (session) {
        socket.emit("session:state", session);
      }
    });

    socket.on("room:start", async ({ roomId }) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId || typeof roomId !== "number") {
        return;
      }

      const pendingSession = await getSessionById(sessionId);

      if (pendingSession && pendingSession.players.some((player) => player.id === socket.data.playerId)) {
        pendingSession.gameState.currentScreen = "room";
        pendingSession.gameState.selectedRoomId = roomId;
        pendingSession.gameState.loading = true;
        pendingSession.gameState.activePuzzle = null;
        pendingSession.gameState.message = "Preparing the shared puzzle...";
        io.to(sessionId).emit("session:state", pendingSession);
      }

      const result = await startRoomSession({
        sessionId,
        roomId,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }

      if (result.error) {
        socket.emit("session:error", {
          message: result.error,
        });
      }
    });

    socket.on("answer:submit", async (answerPayload) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = await submitAnswerSession({
        sessionId,
        answerPayload,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }

      if (result.error) {
        socket.emit("session:error", {
          message: result.error,
        });
      }
    });

    socket.on("draft:text", async ({ text }) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = await updateTextDraftSession({
        sessionId,
        text,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });

    socket.on("draft:logic-board", async ({ selection }) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = await updateLogicBoardDraftSession({
        sessionId,
        selection,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });

    socket.on("draft:crossword", async ({ draft }) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = await updateCrosswordDraftSession({
        sessionId,
        draft,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });

    socket.on("draft:email-investigation", async ({ searchQuery, selectedEmailId }) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = await updateEmailInvestigationDraftSession({
        sessionId,
        searchQuery,
        selectedEmailId,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });

    socket.on("hint:use", async () => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = await useHintSession({ sessionId });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }

      if (result.error) {
        socket.emit("session:error", {
          message: result.error,
        });
      }
    });

    socket.on("presence:chat-typing", async ({ isTyping }) => {
      const sessionId = socket.data.sessionId;
      const playerId = socket.data.playerId;

      if (!sessionId || !playerId) {
        return;
      }

      const session = await updatePlayerPresence({
        sessionId,
        playerId,
        isTypingChat: Boolean(isTyping),
      });

      if (session) {
        io.to(sessionId).emit("session:state", session);
      }
    });

    socket.on("presence:editing", async ({ editingTarget }) => {
      const sessionId = socket.data.sessionId;
      const playerId = socket.data.playerId;

      if (!sessionId || !playerId) {
        return;
      }

      const session = await updatePlayerPresence({
        sessionId,
        playerId,
        editingTarget: typeof editingTarget === "string" ? editingTarget : "",
      });

      if (session) {
        io.to(sessionId).emit("session:state", session);
      }
    });

    socket.on("answer:reveal", async () => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = await revealAnswerSession({ sessionId });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }

      if (result.error) {
        socket.emit("session:error", {
          message: result.error,
        });
      }
    });

    socket.on("session:give-up", async () => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = await endSessionRun({
        sessionId,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }

      if (result.error) {
        socket.emit("session:error", {
          message: result.error,
        });
      }
    });

    socket.on("session:restart", async () => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = await restartSessionRun({
        sessionId,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });

    socket.on("room:exit", async () => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = await returnSessionToLobby({
        sessionId,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }

      if (result.error) {
        socket.emit("session:error", {
          message: result.error,
        });
      }
    });

    socket.on("disconnect", async () => {
      const { sessionId, playerId } = socket.data;

      if (!sessionId || !playerId) {
        return;
      }

      const result = await markPlayerConnection({
        sessionId,
        playerId,
        connected: false,
      });

      if (result?.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });
  });
};
