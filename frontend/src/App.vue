<template>
  <main v-if="currentScreen === 'lobby'" class="app-shell">
    <section class="hero-section">
      <p class="eyebrow">MindLock Protocol</p>
      <h1>Choose Your Escape Room</h1>
      <p class="hero-copy">
        Your lives are shared across the whole game. Clear one room to unlock the next.
      </p>
    </section>

    <section class="game-status-bar">
      <div class="status-chip">
        <span class="status-chip__label">Lives</span>
        <strong>{{ lives }}/{{ MAX_LIVES }}</strong>
      </div>

      <div class="status-chip">
        <span class="status-chip__label">Progress</span>
        <strong>{{ clearedRoomsCount }}/{{ rooms.length }} rooms cleared</strong>
      </div>

      <button class="secondary-button lobby-replay-button" @click="retryRun">
        Replay
      </button>
    </section>

    <section class="room-grid" aria-label="Escape rooms">
      <RoomCard
        v-for="room in rooms"
        :key="room.id"
        :room="room"
        :is-selected="selectedRoom.id === room.id"
        :is-unlocked="room.unlocked"
        :is-cleared="clearedRoomIds.includes(room.id)"
        @start="startRoom"
      />
    </section>

  </main>

  <main v-else-if="currentScreen === 'room'" class="mission-shell">
    <section class="mission-frame" :class="`mission-frame--${selectedRoom.themeClass}`">
      <header class="mission-topbar">
        <div>
          <h1>{{ selectedRoom.title }}</h1>
          <p class="mission-subtitle">{{ selectedRoom.subtitle }}</p>
        </div>

        <div class="mission-actions">
          <div class="info-pill">
            <span>{{ lives }}/{{ MAX_LIVES }}</span>
            <span aria-hidden="true">♥</span>
          </div>

          <button
            class="ghost-button"
            :class="`ghost-button--${selectedRoom.themeClass}`"
            :disabled="!activePuzzle || hintUsed"
            @click="useHint"
          >
            Show hint
          </button>
          <button
            class="ghost-button"
            :class="`ghost-button--${selectedRoom.themeClass}`"
            :disabled="!activePuzzle || answerUsed || roomCleared"
            @click="useAnswerReveal"
          >
            Get answer
          </button>
          <button class="primary-button" :class="`primary-button--${selectedRoom.themeClass}`" @click="exitRoom">
            Exit
          </button>
        </div>
      </header>

      <section class="mission-card">
        <p class="panel-label">Mission</p>

        <template v-if="loading">
          <h2>Generating your puzzle...</h2>
          <p class="puzzle-text">
            The system is preparing a challenge for {{ selectedRoom.title }}.
          </p>
        </template>

        <template v-else-if="activePuzzle">
          <h2>{{ activePuzzle.title }}</h2>
          <p class="puzzle-text">{{ activePuzzle.riddle }}</p>

          <template v-if="activePuzzle.kind === 'text'">
            <label class="input-label" for="answer-input">Your answer</label>
            <input
              id="answer-input"
              v-model="answerInput"
              type="text"
              :placeholder="activePuzzle.inputPlaceholder"
              :disabled="roomCleared"
            />
          </template>

          <template v-else-if="activePuzzle.kind === 'sudoku'">
            <label class="input-label">Fill the 4x4 vault grid</label>
            <SudokuPuzzleBoard
              v-model="sudokuGrid"
              :puzzle="activePuzzle"
              :disabled="roomCleared"
            />
          </template>

          <template v-else>
            <LogicBoardPuzzleView
              v-model="logicBoardSelection"
              :puzzle="activePuzzle"
              :disabled="roomCleared"
            />
          </template>

          <p v-if="message" class="status-message">{{ message }}</p>
          <p v-if="showHint" class="hint-text">Hint: {{ activePuzzle.hint }}</p>
          <p v-if="showAnswerText && activePuzzle.kind === 'text'" class="answer-text">
            Answer: {{ activePuzzle.answer }}
          </p>
          <p v-if="showAnswerText && activePuzzle.kind === 'logic-board'" class="answer-text">
            Correct terminal:
            {{ logicBoardAnswerLabel }}
          </p>
          <p v-if="showExplanation" class="explanation-text">
            Explanation: {{ activePuzzle.explanation }}
          </p>

          <div v-if="showSudokuSolution && activePuzzle.kind === 'sudoku'" class="solution-block">
            <p class="solution-label">Solution grid</p>
            <SudokuPuzzleBoard
              :model-value="activePuzzle.solution"
              :puzzle="{ ...activePuzzle, givens: activePuzzle.solution }"
              :disabled="true"
            />
          </div>

          <div class="mission-footer">
            <div class="timer-pill">
              <span class="timer-ring" aria-hidden="true"></span>
              <span>{{ formattedTime }}</span>
            </div>

            <button
              v-if="roomCleared && nextUnlockedRoomId"
              class="primary-button mission-submit"
              :class="`primary-button--${selectedRoom.themeClass}`"
              @click="goToNextRoom"
            >
              Go to {{ nextRoomTitle }}
            </button>

            <button
              v-else-if="roomCleared"
              class="primary-button mission-submit"
              :class="`primary-button--${selectedRoom.themeClass}`"
              @click="returnToLobby"
            >
              Back to Lobby
            </button>

            <template v-else>
              <button
                class="primary-button mission-submit"
                :class="`primary-button--${selectedRoom.themeClass}`"
                :disabled="loading"
                @click="checkAnswer"
              >
                Submit answer
              </button>

              <button
                v-if="lives === 0"
                class="danger-button mission-submit mission-submit--secondary"
                @click="triggerGameOver"
              >
                Give up
              </button>
            </template>
          </div>
        </template>

        <template v-else>
          <h2>Unable to load the puzzle</h2>
          <p class="puzzle-text">{{ message }}</p>
        </template>
      </section>
    </section>
  </main>

  <main v-else class="game-over-shell">
    <section class="game-over-card">
      <p class="eyebrow">Session Ended</p>
      <h1>Game Over</h1>
      <p class="hero-copy">
        You ran out of lives. Start over to reset the rooms, puzzles, timer, and shared lives.
      </p>

      <div class="game-over-actions">
        <button class="primary-button" @click="startOver">Start Over</button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import LogicBoardPuzzleView from "./components/puzzles/LogicBoardPuzzle.vue";
import RoomCard from "./components/RoomCard.vue";
import SudokuPuzzleBoard from "./components/puzzles/SudokuPuzzle.vue";
import type { LogicBoardPuzzle, SudokuPuzzle, TextPuzzle } from "./data/localPuzzles";
import type { Room } from "./data/rooms";
import { initialRooms } from "./data/rooms";

type AiPuzzle = TextPuzzle & {
  answer: string;
};

type Puzzle = AiPuzzle | SudokuPuzzle | LogicBoardPuzzle;
type Screen = "lobby" | "room" | "game-over";

const API_BASE_URL = "http://localhost:5001/api";
const MAX_LIVES = 3;

const rooms = ref(createInitialRooms());
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
const lives = ref(MAX_LIVES);
const secondsLeft = ref(initialRooms[0].timeLimitSeconds);
const clearedRoomIds = ref<number[]>([]);
const roomCleared = ref(false);
let timerId: number | null = null;

function createInitialRooms() {
  return initialRooms.map((room) => ({ ...room }));
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
  rooms.value = initialRooms.map((room, index) => ({
    ...room,
    unlocked: index === 0,
  }));
};

const stopTimer = () => {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
};

const startTimer = (room: Room) => {
  stopTimer();
  secondsLeft.value = room.timeLimitSeconds;

  timerId = window.setInterval(() => {
    if (secondsLeft.value <= 1) {
      stopTimer();
      secondsLeft.value = 0;
      void handleFailedAttempt("Time is up. A new puzzle is loading.");
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
  // Send request to backend endpoint that generates a riddle
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
  // If request fails (server error, network issue), throw error
  if (!response.ok) {
    throw new Error("Backend request failed");
  }
 // Parse JSON response from backend (AI-generated puzzle)
  const data = await response.json();
  
 // Extend backend data with frontend-specific properties
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
  startTimer(room);

  try {
    // Load puzzle depending on type:
    // - AI-generated puzzle (calls backend)
    // - Local puzzle (predefined logic like Sudoku)
    activePuzzle.value = room.puzzleType === "ai-riddle"
      ? await buildAiPuzzle(room)
      : await buildLocalPuzzle(room);

    // If the puzzle is Sudoku, initialize the editable grid
    if (activePuzzle.value.kind === "sudoku") {
      sudokuGrid.value = activePuzzle.value.givens.map((row) => [...row]);
    }
  
    // Set user message (custom or default)
    message.value = statusText ?? `${room.title} is ready. Solve it before the timer ends.`;
  } catch (error) {
    console.error(error);
    stopTimer();
    message.value = "Failed to load puzzle. Check that the backend is running.";
  } finally {
    loading.value = false;
  }
};

const startRoom = (roomId: number) => {
  // Find the room object based on the given roomId
  const room = rooms.value.find((item) => item.id === roomId);
 // If the room does not exist OR is still locked → stop execution
  if (!room || !room.unlocked) {
    return;
  }
  // Set the currently selected room (used across the UI)
  selectedRoomId.value = roomId;
  // Switch UI to "room" screen (from menu/landing page)
  currentScreen.value = "room";
  // Reset any previous state (answers, hints, timers, etc.)
  resetRoomActions();
  // Load the puzzle for the selected room
  void loadPuzzleForRoom(room);
};

const returnToLobby = () => {
  stopTimer();
  currentScreen.value = "lobby";
  resetRoomUi();
};

const exitRoom = () => {
  returnToLobby();
};

const triggerGameOver = () => {
  stopTimer();
  currentScreen.value = "game-over";
  resetRoomUi();
};

const startOver = () => {
  stopTimer();
  rooms.value = createInitialRooms();
  currentScreen.value = "lobby";
  selectedRoomId.value = 1;
  lives.value = MAX_LIVES;
  secondsLeft.value = initialRooms[0].timeLimitSeconds;
  clearedRoomIds.value = [];
  resetRoomUi();
  resetRoomActions();
};

const retryRun = () => {
  stopTimer();
  resetProgressionRooms();
  currentScreen.value = "lobby";
  selectedRoomId.value = 1;
  clearedRoomIds.value = [];
  resetRoomUi();
  resetRoomActions();
};

const handleFailedAttempt = async (failureMessage: string) => {
  lives.value = Math.max(lives.value - 1, 0);
  showHint.value = false;
  showAnswerText.value = false;
  showSudokuSolution.value = false;

  await loadPuzzleForRoom(
    selectedRoom.value,
    lives.value === 0
      ? `${failureMessage} You now have 0 lives left. You can still submit an answer or give up. A new puzzle is ready.`
      : `${failureMessage} You lost 1 life. ${lives.value} left. A new puzzle is ready.`,
  );
};

const handleSolvedRoom = () => {
  stopTimer();
  showExplanation.value = true;
  markRoomAsCleared();

  if (nextUnlockedRoomId.value) {
    message.value = `${selectedRoom.value.title} cleared. ${nextRoomTitle.value} is now ready.`;
  } else {
    message.value = `${selectedRoom.value.title} cleared. You escaped the final room.`;
  }
};

const useHint = () => {
  if (!activePuzzle.value || hintUsed.value) {
    return;
  }

  hintUsed.value = true;
  showHint.value = true;
};

const useAnswerReveal = () => {
  if (!activePuzzle.value || answerUsed.value || roomCleared.value) {
    return;
  }

  answerUsed.value = true;
  lives.value = Math.max(lives.value - 1, 0);

  if (activePuzzle.value.kind === "text" || activePuzzle.value.kind === "logic-board") {
    showAnswerText.value = true;
  } else {
    showSudokuSolution.value = true;
  }

  message.value = `You used Get answer and lost 1 life. ${Math.max(lives.value, 0)} left.`;
};

const checkAnswer = () => {
  if (!activePuzzle.value || roomCleared.value) {
    return;
  }

  if (activePuzzle.value.kind === "sudoku") {
    const sudokuPuzzle = activePuzzle.value;
    const isComplete = sudokuGrid.value.every((row) => row.every((cell) => cell >= 1 && cell <= 4));

    if (!isComplete) {
      message.value = "Fill every empty cell before submitting.";
      return;
    }

    const isCorrect = sudokuGrid.value.every((row, rowIndex) =>
      row.every((cell, columnIndex) => cell === sudokuPuzzle.solution[rowIndex][columnIndex]),
    );

    if (isCorrect) {
      handleSolvedRoom();
      return;
    }

    void handleFailedAttempt("That Sudoku grid is not correct.");
    return;
  }

  if (activePuzzle.value.kind === "logic-board") {
    if (!logicBoardSelection.value) {
      message.value = "Choose one terminal before submitting.";
      return;
    }

    if (logicBoardSelection.value === activePuzzle.value.answer) {
      handleSolvedRoom();
      return;
    }

    void handleFailedAttempt("That terminal was not the correct choice.");
    return;
  }

  const userAnswer = answerInput.value.trim().toLowerCase();
  const correctAnswer = activePuzzle.value.answer.trim().toLowerCase();

  if (userAnswer === correctAnswer) {
    handleSolvedRoom();
    return;
  }

  void handleFailedAttempt("Wrong answer.");
};

const goToNextRoom = () => {
  if (nextUnlockedRoomId.value) {
    startRoom(nextUnlockedRoomId.value);
  } else {
    returnToLobby();
  }
};

onBeforeUnmount(() => {
  stopTimer();
});
</script>
