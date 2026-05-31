<template>
  <audio
    ref="ambientAudio"
    loop
    preload="auto"
    src="/audio/Crime%20is%20Everywhere.mp3"
    @error="musicUnavailable = true"
  ></audio>

  <main v-if="currentScreen === 'lobby'" class="app-shell lobby-dashboard-shell">
    <FrontPageNav
      :lives="lives"
      :max-lives="maxLives"
      :selected-intensity="selectedIntensity"
      :selected-intensity-label="selectedIntensityLabel"
      :intensity-options="intensityOptions"
      :is-difficulty-menu-open="isDifficultyMenuOpen"
      :is-session-active="Boolean(session)"
      :is-music-playing="isMusicPlaying"
      :music-disabled="musicUnavailable"
      @toggle-music="toggleMusic"
      @toggle-difficulty="toggleDifficultyMenu"
      @choose-intensity="chooseIntensity"
      @replay="retryRun"
    />

    <section class="dashboard-layout">
      <div class="dashboard-main">
        <section class="dashboard-panel rooms-panel">
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
        </section>

      </div>

      <aside class="dashboard-sidebar">
        <section class="dashboard-panel lobby-session-panel">
          <SessionAccessPanel
            v-if="!session"
            :player-name="playerName"
            :join-code="joinCodeInput"
            :session-loading="sessionLoading"
            :session-error="sessionError"
            :realtime-error="realtimeError"
            @update:player-name="playerName = $event"
            @update:join-code="joinCodeInput = $event"
            @create="createSharedSession"
            @join="joinSession"
          />

          <SessionLobbyPanel
            v-else
            :session="session"
            :current-player-id="currentPlayer?.id ?? ''"
            :is-host="isHost"
            :can-replay="session.gameState.clearedRoomIds.length >= session.gameState.rooms.length"
            :invite-link="inviteLink"
            :realtime-error="realtimeError"
            @replay="retryRun"
            @leave="leaveSession"
            @copy-invite="copyInviteLink"
          />
        </section>

        <SessionChatPanel
          :session="session"
          :realtime-error="realtimeError"
          :chat-input="chatInput"
          @update:chat-input="setChatInputValue"
          @send="sendChatMessage"
        />
      </aside>
    </section>
  </main>

  <main
    v-else-if="currentScreen === 'room'"
    class="mission-shell"
    :class="`mission-shell--${selectedRoom.themeClass}`"
  >
    <RoomNav
      :subtitle="selectedRoom.subtitle"
      :room-number="selectedRoom.id"
      :time-remaining="formattedTime"
      :lives="lives"
      :max-lives="maxLives"
      :hint-disabled="!activePuzzle || hintUsed"
      :answer-disabled="!activePuzzle || answerUsed || roomCleared"
      :exit-disabled="Boolean(session && !isHost)"
      :is-music-playing="isMusicPlaying"
      :music-disabled="musicUnavailable"
      @hint="useHint"
      @answer="useAnswerReveal"
      @exit="exitRoom"
      @toggle-music="toggleMusic"
    />

    <section class="mission-frame" :class="`mission-frame--${selectedRoom.themeClass}`">
      <section class="mission-room-layout">
        <SessionChatPanel
          class="mission-room-chat"
          :session="session"
          :realtime-error="realtimeError"
          :chat-input="chatInput"
          @update:chat-input="setChatInputValue"
          @send="sendChatMessage"
        />

        <section class="mission-card mission-puzzle-card">
          <p class="panel-label">Mission</p>

        <template v-if="loading">
          <section class="puzzle-loading-state">
            <span aria-hidden="true"></span>
            <h2>Generating your puzzle...</h2>
            <p>
              AI is creating fresh words and clues for {{ selectedRoom.title }}.
            </p>
          </section>
        </template>

        <template v-else-if="activePuzzle">
          <h2>{{ activePuzzle.title }}</h2>
          <p class="puzzle-text">{{ activePuzzle.riddle }}</p>

          <template v-if="activePuzzle.kind === 'text'">
            <label class="input-label" for="answer-input">Your answer</label>
            <input
              id="answer-input"
              :value="answerInput"
              type="text"
              :placeholder="activePuzzle.inputPlaceholder"
              :disabled="roomCleared"
              @focus="emitEditingPresence('answer')"
              @blur="emitEditingPresence('')"
              @input="handleTextDraftInput"
            />
          </template>

          <template v-else-if="activePuzzle.kind === 'crossword'">
            <CrosswordPuzzleView
              v-model="crosswordDraft"
              :disabled="roomCleared"
              :puzzle="activePuzzle"
              @update:model-value="handleCrosswordDraftUpdate"
            />
          </template>

          <template v-else-if="activePuzzle.kind === 'email-investigation'">
            <EmailInvestigationPuzzleView
              :puzzle="activePuzzle"
              :search-query="emailSearchQuery"
              :selected-email-id="selectedEmailId"
              :disabled="roomCleared"
              @update:search-query="handleEmailSearchUpdate"
              @update:selected-email-id="handleEmailSelectionUpdate"
            />
          </template>

          <template v-else-if="activePuzzle.kind === 'corrupted-documents'">
            <CorruptedDocumentsPuzzleView
              :disabled="roomCleared"
              :puzzle="activePuzzle"
            />
          </template>

          <template v-else>
            <LogicBoardPuzzleView
              :model-value="logicBoardSelection"
              :puzzle="activePuzzle"
              :disabled="roomCleared"
              @update:model-value="handleLogicBoardDraftUpdate"
            />
          </template>

          <p v-if="message" class="status-message">{{ message }}</p>
          <p v-if="showHint" class="hint-text">Hint: {{ activePuzzle.hint }}</p>
          <p v-if="showAnswerText && activePuzzle.kind === 'text'" class="answer-text">
            Answer: {{ activePuzzle.answer }}
          </p>
          <p v-if="showAnswerText && activePuzzle.kind === 'crossword'" class="answer-text">
            Crossword answer: {{ activePuzzle.answer }}
          </p>
          <p v-if="showAnswerText && activePuzzle.kind === 'logic-board'" class="answer-text">
            Correct terminal:
            {{ logicBoardAnswerLabel }}
          </p>
          <p v-if="showAnswerText && activePuzzle.kind === 'email-investigation'" class="answer-text">
            Override code: {{ activePuzzle.answer }}
          </p>
          <p v-if="showAnswerText && activePuzzle.kind === 'corrupted-documents'" class="answer-text">
            Recovery phrase: {{ activePuzzle.answer }}
          </p>
          <p v-if="showExplanation" class="explanation-text">
            Explanation: {{ activePuzzle.explanation }}
          </p>

          <div class="mission-submit-row">
            <label
              v-if="(activePuzzle.kind === 'email-investigation' || activePuzzle.kind === 'corrupted-documents') && !roomCleared"
              class="mission-submit-answer-field"
            >
              <span>{{ activePuzzle.kind === "email-investigation" ? "Override code" : "Decoded phrase" }}</span>
              <input
                :id="activePuzzle.kind === 'email-investigation' ? 'email-answer-input' : 'corrupted-answer-input'"
                :value="answerInput"
                type="text"
                :placeholder="activePuzzle.inputPlaceholder"
                :disabled="roomCleared"
                @input="activePuzzle.kind === 'email-investigation'
                  ? handleEmailAnswerUpdate(($event.target as HTMLInputElement).value)
                  : handleCorruptedDocumentsAnswerUpdate(($event.target as HTMLInputElement).value)"
              />
            </label>

            <button
              v-if="roomCleared && nextUnlockedRoomId"
              class="mission-submit-inline"
              :disabled="Boolean(session && !isHost)"
              @click="goToNextRoom"
            >
              Go to {{ nextRoomTitle }}
            </button>

            <button
              v-else-if="roomCleared"
              class="mission-submit-inline"
              :disabled="Boolean(session && !isHost)"
              @click="returnToLobby"
            >
              Back to Lobby
            </button>

            <button
              v-else
              class="mission-submit-inline"
              :disabled="loading"
              @click="checkAnswer"
            >
              Submit answer
            </button>
          </div>
        </template>

        <template v-else>
          <h2>Unable to load the puzzle</h2>
          <p class="puzzle-text">{{ message }}</p>
        </template>
        </section>
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
        <button class="primary-button" :disabled="Boolean(session && !isHost)" @click="startOver">
          Start Over
        </button>
      </div>
    </section>
  </main>

  <Teleport to="body">
    <div
      v-if="wrongAnswerPopupOpen"
      class="wrong-answer-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wrong-answer-title"
      @click.self="closeWrongAnswerPopup"
    >
      <section class="wrong-answer-modal__card">
        <p class="wrong-answer-modal__eyebrow">Wrong answer</p>
        <h2 id="wrong-answer-title">You lost a life</h2>
        <p>It is the wrong answer. Give another try!</p>
        <button type="button" @click="closeWrongAnswerPopup">Try again</button>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount, onMounted } from "vue";
import FrontPageNav from "./components/FrontPageNav.vue";
import RoomNav from "./components/RoomNav.vue";
import RoomCard from "./components/RoomCard.vue";
import SessionAccessPanel from "./components/SessionAccessPanel.vue";
import SessionChatPanel from "./components/SessionChatPanel.vue";
import SessionLobbyPanel from "./components/SessionLobbyPanel.vue";
import CorruptedDocumentsPuzzleView from "./components/puzzles/CorruptedDocumentsPuzzle.vue";
import CrosswordPuzzleView from "./components/puzzles/CrosswordPuzzle.vue";
import EmailInvestigationPuzzleView from "./components/puzzles/EmailInvestigationPuzzle.vue";
import LogicBoardPuzzleView from "./components/puzzles/LogicBoardPuzzle.vue";
import { useGameplay } from "./composables/useGameplay";
import { useSession } from "./composables/useSession";
import type { IntensityLevel } from "./data/intensity";

const MUSIC_ENABLED_KEY = "ai-escape-room-music-enabled";
const MUSIC_VOLUME_KEY = "ai-escape-room-music-volume";

const ambientAudio = ref<HTMLAudioElement | null>(null);
const isMusicPlaying = ref(false);
const musicUnavailable = ref(false);
const musicVolume = ref(0.35);
const isDifficultyMenuOpen = ref(false);
const wrongAnswerPopupOpen = ref(false);
const lastSeenLives = ref<number | null>(null);

const gameplay = useGameplay();
const {
  playerName,
  joinCodeInput,
  session,
  currentPlayer,
  sessionLoading,
  sessionError,
  realtimeError,
  chatInput,
  isHost,
  inviteLink,
  createSession,
  joinSession,
  restorePersistedSession,
  setChatInputValue,
  sendChatMessage,
  copyInviteLink,
  emitRoomStart,
  emitRoomExit,
  emitRestart,
  emitHint,
  emitReveal,
  emitSubmitAnswer,
  emitDraftText,
  emitDraftEmail,
  emitDraftLogic,
  emitDraftCrossword,
  emitEditingPresence,
  leaveSession,
  disconnectRealtime,
} = useSession({
  onSessionState: gameplay.syncLocalStateFromSession,
  onSessionLeft: () => {
    gameplay.resetRoomUi();
    gameplay.resetRoomActions();
    gameplay.currentScreen.value = "lobby";
    gameplay.rooms.value = gameplay.rooms.value.map((room, index) => ({
      ...room,
      unlocked: index === 0,
    }));
  },
});

const {
  intensityOptions,
  selectedIntensity,
  maxLives,
  rooms,
  currentScreen,
  selectedRoomId,
  loading,
  activePuzzle,
  answerInput,
  emailSearchQuery,
  selectedEmailId,
  logicBoardSelection,
  crosswordDraft,
  message,
  showHint,
  hintUsed,
  answerUsed,
  showAnswerText,
  showExplanation,
  lives,
  clearedRoomIds,
  roomCleared,
  selectedRoom,
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
} = gameplay;

const selectedIntensityLabel = computed(() => {
  return intensityOptions.find((option) => option.id === selectedIntensity.value)?.label ?? "Medium";
});

const createSharedSession = () => {
  void createSession(selectedIntensity.value);
};

const readStoredBoolean = (key: string, fallback: boolean) => {
  const storedValue = window.localStorage.getItem(key);

  if (storedValue === null) {
    return fallback;
  }

  return storedValue === "true";
};

const applyMusicVolume = () => {
  const nextVolume = Math.min(Math.max(musicVolume.value, 0), 1);
  musicVolume.value = nextVolume;

  if (ambientAudio.value) {
    ambientAudio.value.volume = nextVolume;
  }

  window.localStorage.setItem(MUSIC_VOLUME_KEY, String(nextVolume));
};

const playAmbientMusic = async () => {
  const audio = ambientAudio.value;

  if (!audio || musicUnavailable.value) {
    return;
  }

  try {
    await audio.play();
    isMusicPlaying.value = true;
    window.localStorage.setItem(MUSIC_ENABLED_KEY, "true");
  } catch {
    isMusicPlaying.value = false;
    window.localStorage.setItem(MUSIC_ENABLED_KEY, "false");
  }
};

const pauseAmbientMusic = () => {
  ambientAudio.value?.pause();
  isMusicPlaying.value = false;
  window.localStorage.setItem(MUSIC_ENABLED_KEY, "false");
};

const toggleMusic = () => {
  if (isMusicPlaying.value) {
    pauseAmbientMusic();
    return;
  }

  void playAmbientMusic();
};

const handleTextDraftInput = (event: Event) => {
  const nextValue = (event.target as HTMLInputElement).value;

  if (session.value) {
    emitDraftText(nextValue);
    emitEditingPresence("answer");
    return;
  }

  answerInput.value = nextValue;
};

const handleEmailSearchUpdate = (nextValue: string) => {
  if (session.value) {
    emitDraftEmail({ searchQuery: nextValue });
    emitEditingPresence("email inbox");
    return;
  }

  emailSearchQuery.value = nextValue;
};

const handleEmailSelectionUpdate = (nextValue: string) => {
  if (session.value) {
    emitDraftEmail({ selectedEmailId: nextValue });
    emitEditingPresence("email inbox");
    return;
  }

  selectedEmailId.value = nextValue;
};

const handleEmailAnswerUpdate = (nextValue: string) => {
  if (session.value) {
    emitDraftText(nextValue);
    emitEditingPresence("override code");
    return;
  }

  answerInput.value = nextValue;
};

const handleCrosswordDraftUpdate = (nextValue: Record<string, string>) => {
  if (session.value) {
    emitDraftCrossword(nextValue);
    emitEditingPresence("crossword grid");
    return;
  }

  crosswordDraft.value = nextValue;
};

const handleCorruptedDocumentsAnswerUpdate = (nextValue: string) => {
  if (session.value) {
    emitDraftText(nextValue);
    emitEditingPresence("recovery console");
    return;
  }

  answerInput.value = nextValue;
};

const handleLogicBoardDraftUpdate = (nextValue: string) => {
  if (session.value) {
    emitDraftLogic(nextValue);
    emitEditingPresence(nextValue ? "logic board" : "");
    return;
  }

  logicBoardSelection.value = nextValue;
};

const showWrongAnswerPopup = () => {
  wrongAnswerPopupOpen.value = true;
};

const closeWrongAnswerPopup = () => {
  wrongAnswerPopupOpen.value = false;
};

const isSubmitFailureMessage = (nextMessage: string) => {
  const normalizedMessage = nextMessage.toLowerCase();

  return [
    "not correct",
    "wrong answer",
    "not the correct choice",
    "crossword letters",
  ].some((pattern) => normalizedMessage.includes(pattern));
};

const handleFailedAttempt = async (failureMessage: string) => {
  if (!failureMessage.toLowerCase().includes("time is up")) {
    showWrongAnswerPopup();
  }

  lives.value = Math.max(lives.value - 1, 0);
  showHint.value = false;
  showAnswerText.value = false;

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

const startRoom = (roomId: number) => {
  closeWrongAnswerPopup();

  if (session.value) {
    resetRoomActions();
    resetRoomUi();
    loading.value = true;
    currentScreen.value = "room";
    selectedRoomId.value = roomId;
    emitRoomStart(roomId);
    return;
  }

  const room = rooms.value.find((item) => item.id === roomId);

  if (!room || !room.unlocked) {
    return;
  }

  selectedRoomId.value = roomId;
  currentScreen.value = "room";
  resetRoomActions();
  startTimer(room, () => {
    void handleFailedAttempt("Time is up. A new puzzle is loading.");
  });
  void loadPuzzleForRoom(room);
};

const returnToLobby = () => {
  if (session.value) {
    if (!isHost.value) {
      return;
    }

    emitRoomExit();
    return;
  }

  stopTimer();
  currentScreen.value = "lobby";
  resetRoomUi();
};

const exitRoom = () => {
  returnToLobby();
};

const startOver = () => {
  if (session.value) {
    if (!isHost.value) {
      return;
    }

    emitRestart();
    return;
  }

  stopTimer();
  resetProgressionRooms();
  currentScreen.value = "lobby";
  selectedRoomId.value = 1;
  lives.value = maxLives.value;
  clearedRoomIds.value = [];
  resetRoomUi();
  resetRoomActions();
};

const retryRun = () => {
  if (session.value) {
    if (!isHost.value) {
      return;
    }

    emitRestart();
    return;
  }

  stopTimer();
  resetProgressionRooms();
  currentScreen.value = "lobby";
  selectedRoomId.value = 1;
  lives.value = maxLives.value;
  clearedRoomIds.value = [];
  resetRoomUi();
  resetRoomActions();
};

const toggleDifficultyMenu = () => {
  if (session.value) {
    return;
  }

  isDifficultyMenuOpen.value = !isDifficultyMenuOpen.value;
};

const chooseIntensity = (intensity: IntensityLevel) => {
  setIntensity(intensity);
  isDifficultyMenuOpen.value = false;
};

const useHint = () => {
  if (session.value) {
    emitHint();
    return;
  }

  if (!activePuzzle.value || hintUsed.value) {
    return;
  }

  hintUsed.value = true;
  showHint.value = true;
};

const useAnswerReveal = () => {
  if (session.value) {
    emitReveal();
    return;
  }

  if (!activePuzzle.value || answerUsed.value || roomCleared.value) {
    return;
  }

  answerUsed.value = true;
  lives.value = Math.max(lives.value - 1, 0);

  showAnswerText.value = true;

  message.value = `You used Get answer and lost 1 life. ${Math.max(lives.value, 0)} left.`;
};

const checkAnswer = () => {
  if (session.value) {
    emitSubmitAnswer({
      crosswordDraft: crosswordDraft.value,
      textAnswer: answerInput.value,
      logicBoardSelection: logicBoardSelection.value,
    });
    return;
  }

  if (!activePuzzle.value || roomCleared.value) {
    return;
  }

  if (activePuzzle.value.kind === "crossword") {
    const isSolved = activePuzzle.value.entries.every((entry) => {
      return entry.answer.split("").every((letter, index) => {
        const row = entry.direction === "down" ? entry.row + index : entry.row;
        const col = entry.direction === "across" ? entry.col + index : entry.col;
        const key = `${row}-${col}`;

        return entry.prefilledIndexes.includes(index) ||
          crosswordDraft.value[key]?.toLowerCase() === letter.toLowerCase();
      });
    });

    if (isSolved) {
      handleSolvedRoom();
      return;
    }

    void handleFailedAttempt("Some crossword letters are not correct yet.");
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

  if (activePuzzle.value.kind === "email-investigation") {
    const userAnswer = answerInput.value.trim().toLowerCase();
    const correctAnswer = activePuzzle.value.answer.trim().toLowerCase();

    if (!userAnswer) {
      message.value = "Enter the override code before submitting.";
      return;
    }

    if (userAnswer === correctAnswer) {
      handleSolvedRoom();
      return;
    }

    void handleFailedAttempt("That override code is not correct.");
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

onMounted(() => {
  const storedVolume = Number(window.localStorage.getItem(MUSIC_VOLUME_KEY));
  musicVolume.value = Number.isFinite(storedVolume) ? storedVolume : musicVolume.value;
  applyMusicVolume();

  if (readStoredBoolean(MUSIC_ENABLED_KEY, false)) {
    void playAmbientMusic();
  }

  void restorePersistedSession();
});

watch(musicUnavailable, (isUnavailable) => {
  if (isUnavailable) {
    pauseAmbientMusic();
  }
});

watch([lives, message], ([nextLives, nextMessage]) => {
  const previousLives = lastSeenLives.value;

  if (
    !session.value &&
    currentScreen.value === "room" &&
    previousLives !== null &&
    nextLives < previousLives &&
    isSubmitFailureMessage(nextMessage)
  ) {
    showWrongAnswerPopup();
  }

  lastSeenLives.value = nextLives;
}, { immediate: true });

onBeforeUnmount(() => {
  stopTimer();
  pauseAmbientMusic();
  disconnectRealtime();
});
</script>
