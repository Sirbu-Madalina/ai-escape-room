import { io, type Socket } from "socket.io-client";
import type { GameSession } from "./sessionClient";

const SOCKET_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001";

export type SessionSocketHandlers = {
  onSessionState: (session: GameSession) => void;
  onChatMessage?: (message: GameSession["chatMessages"][number]) => void;
  onError?: (message: string) => void;
  onLeft?: () => void;
};

export const connectSessionSocket = ({
  sessionId,
  playerId,
  handlers,
}: {
  sessionId: string;
  playerId: string;
  handlers: SessionSocketHandlers;
}) => {
  const socket: Socket = io(SOCKET_URL, {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    socket.emit("session:join", { sessionId, playerId });
  });

  socket.on("session:state", handlers.onSessionState);

  if (handlers.onChatMessage) {
    socket.on("chat:message", handlers.onChatMessage);
  }

  if (handlers.onError) {
    socket.on("session:error", (payload: { message?: string }) => {
      handlers.onError?.(payload.message ?? "Realtime session error.");
    });
  }

  if (handlers.onLeft) {
    socket.on("session:left", () => {
      handlers.onLeft?.();
    });
  }

  return socket;
};
