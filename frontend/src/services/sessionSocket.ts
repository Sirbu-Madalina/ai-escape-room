import { io, type Socket } from "socket.io-client";
import type { GameSession } from "./sessionClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const SOCKET_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  API_BASE_URL?.replace(/\/api\/?$/, "") ??
  (import.meta.env.DEV ? "http://localhost:5001" : window.location.origin);

export type SessionSocketHandlers = {
  onSessionState: (session: GameSession) => void;
  onChatMessage?: (message: GameSession["chatMessages"][number]) => void;
  onError?: (message: string) => void;
  onLeft?: () => void;
  onWrongAnswer?: () => void;
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

  if (handlers.onWrongAnswer) {
    socket.on("session:wrong-answer", () => {
      handlers.onWrongAnswer?.();
    });
  }

  return socket;
};
