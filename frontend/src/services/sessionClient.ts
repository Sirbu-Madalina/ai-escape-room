import type { EmailInvestigationPuzzle, LogicBoardPuzzle, TextPuzzle } from "../data/localPuzzles";
import type { IntensityLevel } from "../data/intensity";
import type { Room } from "../data/rooms";

const API_BASE_URL = "http://localhost:5001/api";

export type SessionPuzzle = TextPuzzle | EmailInvestigationPuzzle | LogicBoardPuzzle;

export type SessionPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  joinedAt: string;
  lastSeenAt: string;
  isTypingChat: boolean;
  editingTarget: string;
};

export type SessionGameState = {
  intensity: IntensityLevel;
  maxLives: number;
  currentScreen: "lobby" | "room" | "game-over";
  selectedRoomId: number;
  lives: number;
  rooms: Room[];
  clearedRoomIds: number[];
  roomCleared: boolean;
  secondsLeft: number;
  activePuzzle: SessionPuzzle | null;
  puzzleInstanceId: number;
  textAnswerDraft: string;
  emailSearchDraft: string;
  emailSelectedId: string;
  logicBoardDraft: string;
  loading: boolean;
  hintUsed: boolean;
  answerUsed: boolean;
  showHint: boolean;
  showAnswerText: boolean;
  showExplanation: boolean;
  message: string;
};

export type GameSession = {
  id: string;
  joinCode: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  hostPlayerId: string;
  players: SessionPlayer[];
  chatMessages: Array<{
    id?: string;
    playerId?: string;
    playerName?: string;
    text?: string;
    sentAt?: string;
  }>;
  gameState: SessionGameState;
};

export type SessionJoinResponse = {
  session: GameSession;
  player: SessionPlayer & {
    recoveryToken: string;
  };
};

const parseJson = async <T>(response: Response): Promise<T> => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Session request failed.");
  }

  return data as T;
};

export const createSession = async (playerName: string, intensity: IntensityLevel) => {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ playerName, intensity }),
  });

  return parseJson<SessionJoinResponse>(response);
};

export const joinSession = async (playerName: string, joinCode: string) => {
  const response = await fetch(`${API_BASE_URL}/sessions/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ playerName, joinCode }),
  });

  return parseJson<SessionJoinResponse>(response);
};

export const getSession = async (sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
  return parseJson<GameSession>(response);
};

export const restoreSession = async (sessionId: string, recoveryToken: string) => {
  const response = await fetch(`${API_BASE_URL}/sessions/restore`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId, recoveryToken }),
  });

  return parseJson<SessionJoinResponse>(response);
};
