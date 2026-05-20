import { computed, ref } from "vue";
import {
  DEFAULT_INTENSITY,
  getIntensityOption,
  intensityOptions,
  type IntensityLevel,
} from "../data/intensity";
import type { LogicBoardPuzzle, SudokuPuzzle, TextPuzzle } from "../data/localPuzzles";
import type { Room } from "../data/rooms";
import { initialRooms } from "../data/rooms";
import type { GameSession } from "../services/sessionClient";

type AiPuzzle = TextPuzzle & {
  answer: string;
};

type Puzzle = AiPuzzle | SudokuPuzzle | LogicBoardPuzzle;
type Screen = "lobby" | "room" | "game-over";

const API_BASE_URL = "http://localhost:5001/api";

export const useGameplay = () => {
  const selectedIntensity = ref<IntensityLevel>(DEFAULT_INTENSITY);
  const rooms = ref(createInitialRooms(selectedIntensity.value));
  const currentScreen = ref<Screen>("lobby");
  const selectedRoomId = ref(1);
  const loading = ref(false);
  const activePuzzle = ref<Puzzle | null>(null);
  const answerInput = ref("");
  const sudokuGrid = ref<number[][]>([]);
  const logicBoardSelection = ref("");
  const message = ref("");
  const showHint = ref(false);
  const hintUsed = ref(false);
  const answerUsed = ref(false);
  const showAnswerText = ref(false);
  const showSudokuSolution = ref(false);
  const showExplanation = ref(false);
  const maxLives = ref(getIntensityOption(selectedIntensity.value).lives);
  const lives = ref(maxLives.value);
  const secondsLeft = ref(rooms.value[0].timeLimitSeconds);
  const clearedRoomIds = ref<number[]>([]);
  const roomCleared = ref(false);
  const activePuzzleInstanceId = ref(0);
  let timerId: number | null = null;

  function createInitialRooms(intensity: IntensityLevel) {
    const option = getIntensityOption(intensity);

    return initialRooms.map((room) => ({
      ...room,
      difficulty: option.aiDifficulty,
      timeLimitSeconds: Math.max(30, Math.round(room.timeLimitSeconds * option.timeMultiplier)),
    }));
  }

  const selectedRoom = computed(() => {
    return rooms.value.find((room) => room.id === selectedRoomId.value) ?? rooms.value[0];
  });

  const clearedRoomsCount = computed(() => clearedRoomIds.value.length);

  const nextUnlockedRoomId = computed(() => {
    const nextRoom = rooms.value.find((room) => room.id === selectedRoom.value.id + 1 && room.unlocked);
    return nextRoom?.id ?? null;
  });

  const nextRoomTitle = computed(() => {
    const nextRoom = rooms.value.find((room) => room.id === nextUnlockedRoomId.value);
    return nextRoom?.title ?? "Next Room";
  });

  const logicBoardAnswerLabel = computed(() => {
    const puzzle = activePuzzle.value;

    if (!puzzle || puzzle.kind !== "logic-board") {
      return "";
    }

    return puzzle.options.find((option) => option.id === puzzle.answer)?.label ?? "";
  });

  const formattedTime = computed(() => {
    const minutes = Math.floor(secondsLeft.value / 60);
    const seconds = secondsLeft.value % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  });

  const resetRoomUi = () => {
    activePuzzle.value = null;
    answerInput.value = "";
    sudokuGrid.value = [];
    logicBoardSelection.value = "";
    message.value = "";
    showExplanation.value = false;
    roomCleared.value = false;
    showAnswerText.value = false;
    showSudokuSolution.value = false;
  };

  const resetRoomActions = () => {
    showHint.value = false;
    hintUsed.value = false;
    answerUsed.value = false;
    showAnswerText.value = false;
    showSudokuSolution.value = false;
  };

  const resetProgressionRooms = () => {
    rooms.value = createInitialRooms(selectedIntensity.value).map((room, index) => ({
      ...room,
      unlocked: index === 0,
    }));
  };

  const setIntensity = (intensity: IntensityLevel) => {
    selectedIntensity.value = intensity;
    const option = getIntensityOption(intensity);
    maxLives.value = option.lives;
    lives.value = option.lives;
    resetProgressionRooms();
    selectedRoomId.value = 1;
    secondsLeft.value = rooms.value[0].timeLimitSeconds;
    clearedRoomIds.value = [];
    resetRoomUi();
    resetRoomActions();
  };

  const stopTimer = () => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  const startTimer = (room: Room, onTimeout: () => void) => {
    stopTimer();
    secondsLeft.value = room.timeLimitSeconds;

    timerId = window.setInterval(() => {
      if (secondsLeft.value <= 1) {
        stopTimer();
        secondsLeft.value = 0;
        onTimeout();
        return;
      }

      secondsLeft.value -= 1;
    }, 1000);
  };

  const unlockNextRoom = () => {
    const nextRoom = rooms.value.find((room) => room.id === selectedRoom.value.id + 1);

    if (nextRoom) {
      nextRoom.unlocked = true;
    }
  };

  const markRoomAsCleared = () => {
    if (!clearedRoomIds.value.includes(selectedRoom.value.id)) {
      clearedRoomIds.value.push(selectedRoom.value.id);
    }

    roomCleared.value = true;
    unlockNextRoom();
  };

  const buildAiPuzzle = async (room: Room) => {
    const response = await fetch(`${API_BASE_URL}/riddle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        difficulty: room.difficulty,
        theme: room.theme,
      }),
    });

    if (!response.ok) {
      throw new Error("Backend request failed");
    }

    const data = await response.json();

    return {
      ...data,
      kind: "text",
      inputPlaceholder: "Type the answer",
    } as AiPuzzle;
  };

  const buildLocalPuzzle = (room: Room) => {
    if (room.puzzleType === "sudoku") {
      return fetch(`${API_BASE_URL}/sudoku`).then(async (response) => {
        if (!response.ok) {
          throw new Error("Sudoku request failed");
        }

        return response.json() as Promise<SudokuPuzzle>;
      });
    }

    if (room.puzzleType === "logic-board") {
      return fetch(`${API_BASE_URL}/logic-board`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficulty: room.difficulty,
          theme: room.theme,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error("Logic board request failed");
        }

        return response.json() as Promise<LogicBoardPuzzle>;
      });
    }

    throw new Error("Unknown local puzzle type");
  };

  const loadPuzzleForRoom = async (room: Room, statusText?: string) => {
    loading.value = true;
    resetRoomUi();

    try {
      activePuzzle.value = room.puzzleType === "ai-riddle"
        ? await buildAiPuzzle(room)
        : await buildLocalPuzzle(room);

      if (activePuzzle.value.kind === "sudoku") {
        sudokuGrid.value = activePuzzle.value.givens.map((row) => [...row]);
      }

      message.value = statusText ?? `${room.title} is ready. Solve it before the timer ends.`;
    } catch (error) {
      console.error(error);
      stopTimer();
      message.value = "Failed to load puzzle. Check that the backend is running.";
    } finally {
      loading.value = false;
    }
  };

  const syncLocalStateFromSession = (nextSession: GameSession) => {
    rooms.value = nextSession.gameState.rooms.map((room) => ({ ...room }));
    selectedIntensity.value = nextSession.gameState.intensity ?? DEFAULT_INTENSITY;
    maxLives.value = nextSession.gameState.maxLives ?? getIntensityOption(selectedIntensity.value).lives;
    currentScreen.value = nextSession.gameState.currentScreen;
    lives.value = nextSession.gameState.lives;
    secondsLeft.value = nextSession.gameState.secondsLeft;
    clearedRoomIds.value = [...nextSession.gameState.clearedRoomIds];
    selectedRoomId.value = nextSession.gameState.selectedRoomId;
    roomCleared.value = nextSession.gameState.roomCleared;
    loading.value = nextSession.gameState.loading;
    const nextPuzzleInstanceId = nextSession.gameState.puzzleInstanceId;
    const puzzleChanged = nextPuzzleInstanceId !== activePuzzleInstanceId.value;
    activePuzzleInstanceId.value = nextPuzzleInstanceId;
    activePuzzle.value = nextSession.gameState.activePuzzle as Puzzle | null;
    hintUsed.value = nextSession.gameState.hintUsed;
    answerUsed.value = nextSession.gameState.answerUsed;
    showHint.value = nextSession.gameState.showHint;
    showAnswerText.value = nextSession.gameState.showAnswerText;
    showSudokuSolution.value = nextSession.gameState.showSudokuSolution;
    showExplanation.value = nextSession.gameState.showExplanation;
    message.value = nextSession.gameState.message;
    answerInput.value = nextSession.gameState.textAnswerDraft;
    logicBoardSelection.value = nextSession.gameState.logicBoardDraft;

    if (puzzleChanged) {
      answerInput.value = nextSession.gameState.textAnswerDraft;
      logicBoardSelection.value = nextSession.gameState.logicBoardDraft;
    }

    if (activePuzzle.value?.kind === "sudoku") {
      sudokuGrid.value = nextSession.gameState.sudokuDraft.map((row) => [...row]);
    } else {
      sudokuGrid.value = [];
    }

    stopTimer();
  };

  return {
    intensityOptions,
    selectedIntensity,
    maxLives,
    rooms,
    currentScreen,
    selectedRoomId,
    loading,
    activePuzzle,
    answerInput,
    sudokuGrid,
    logicBoardSelection,
    message,
    showHint,
    hintUsed,
    answerUsed,
    showAnswerText,
    showSudokuSolution,
    showExplanation,
    lives,
    secondsLeft,
    clearedRoomIds,
    roomCleared,
    selectedRoom,
    clearedRoomsCount,
    nextUnlockedRoomId,
    nextRoomTitle,
    logicBoardAnswerLabel,
    formattedTime,
    resetRoomUi,
    resetRoomActions,
    resetProgressionRooms,
    setIntensity,
    stopTimer,
    startTimer,
    markRoomAsCleared,
    loadPuzzleForRoom,
    syncLocalStateFromSession,
  };
};
