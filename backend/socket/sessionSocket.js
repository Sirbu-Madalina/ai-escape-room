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
  updateLogicBoardDraftSession,
  updatePlayerPresence,
  updateSudokuDraftCellSession,
  updateTextDraftSession,
  useHintSession,
  revealAnswerSession,
} from "../services/sessionService.js";

const MAX_CHAT_LENGTH = 240;

export const registerSessionSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("session:join", ({ sessionId, playerId }) => {
      const session = markPlayerConnection({
        sessionId,
        playerId,
        connected: true,
      });

      if (!session) {
        socket.emit("session:error", {
          message: "Unable to join realtime session.",
        });
        return;
      }

      socket.data.sessionId = sessionId;
      socket.data.playerId = playerId;
      socket.join(sessionId);

      io.to(sessionId).emit("session:state", session);
    });

    socket.on("chat:send", ({ text }) => {
      const sessionId = socket.data.sessionId;
      const playerId = socket.data.playerId;
      const normalizedText = text?.trim().slice(0, MAX_CHAT_LENGTH);

      if (!sessionId || !playerId || !normalizedText) {
        return;
      }

      const result = addChatMessage({
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

    socket.on("session:leave", () => {
      const sessionId = socket.data.sessionId;
      const playerId = socket.data.playerId;

      if (!sessionId || !playerId) {
        return;
      }

      const result = leaveSession({ sessionId, playerId });

      if (result?.error) {
        socket.emit("session:error", {
          message: result.error,
        });
        return;
      }

      socket.leave(sessionId);
      socket.emit("session:left", {
        sessionId,
      });

      if (result?.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });

    socket.on("session:refresh", ({ sessionId }) => {
      const session = getSessionById(sessionId);

      if (session) {
        socket.emit("session:state", session);
      }
    });

    socket.on("room:start", async ({ roomId }) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId || typeof roomId !== "number") {
        return;
      }

      const pendingSession = getSessionById(sessionId);

      if (pendingSession && pendingSession.hostPlayerId === socket.data.playerId) {
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

    socket.on("draft:text", ({ text }) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = updateTextDraftSession({
        sessionId,
        text,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });

    socket.on("draft:logic-board", ({ selection }) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = updateLogicBoardDraftSession({
        sessionId,
        selection,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });

    socket.on("draft:sudoku-cell", ({ rowIndex, columnIndex, value }) => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = updateSudokuDraftCellSession({
        sessionId,
        rowIndex,
        columnIndex,
        value,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });

    socket.on("hint:use", () => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = useHintSession({ sessionId });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }

      if (result.error) {
        socket.emit("session:error", {
          message: result.error,
        });
      }
    });

    socket.on("presence:chat-typing", ({ isTyping }) => {
      const sessionId = socket.data.sessionId;
      const playerId = socket.data.playerId;

      if (!sessionId || !playerId) {
        return;
      }

      const session = updatePlayerPresence({
        sessionId,
        playerId,
        isTypingChat: Boolean(isTyping),
      });

      if (session) {
        io.to(sessionId).emit("session:state", session);
      }
    });

    socket.on("presence:editing", ({ editingTarget }) => {
      const sessionId = socket.data.sessionId;
      const playerId = socket.data.playerId;

      if (!sessionId || !playerId) {
        return;
      }

      const session = updatePlayerPresence({
        sessionId,
        playerId,
        editingTarget: typeof editingTarget === "string" ? editingTarget : "",
      });

      if (session) {
        io.to(sessionId).emit("session:state", session);
      }
    });

    socket.on("answer:reveal", () => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = revealAnswerSession({ sessionId });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }

      if (result.error) {
        socket.emit("session:error", {
          message: result.error,
        });
      }
    });

    socket.on("session:give-up", () => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = endSessionRun({
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

    socket.on("session:restart", () => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = restartSessionRun({
        sessionId,
        actorPlayerId: socket.data.playerId,
      });

      if (result.session) {
        io.to(sessionId).emit("session:state", result.session);
      }
    });

    socket.on("room:exit", () => {
      const sessionId = socket.data.sessionId;

      if (!sessionId) {
        return;
      }

      const result = returnSessionToLobby({
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

    socket.on("disconnect", () => {
      const { sessionId, playerId } = socket.data;

      if (!sessionId || !playerId) {
        return;
      }

      const session = markPlayerConnection({
        sessionId,
        playerId,
        connected: false,
      });

      if (session) {
        io.to(sessionId).emit("session:state", session);
      }
    });
  });
};
