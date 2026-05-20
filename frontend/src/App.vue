<template>
  <audio
    ref="ambientAudio"
    loop
    preload="auto"
    src="/audio/Crime%20is%20Everywhere.mp3"
    @error="musicUnavailable = true"
  ></audio>

  <section class="music-control" aria-label="Ambient music controls">
    <button
      type="button"
      class="music-control__toggle"
      :disabled="musicUnavailable"
      @click="toggleMusic"
    >
      {{ isMusicPlaying ? "Music On" : "Music Off" }}
    </button>

    <label class="music-control__volume">
      <span>Volume</span>
      <input
        v-model.number="musicVolume"
        type="range"
        min="0"
        max="1"
        step="0.05"
        :disabled="musicUnavailable"
        @input="applyMusicVolume"
      />
    </label>
  </section>

  <main v-if="currentScreen === 'lobby'" class="app-shell lobby-dashboard-shell">
    <section class="dashboard-hero">
      <div class="dashboard-hero__copy">
        <p class="eyebrow">AI Escape Room Experience</p>
        <h1>MindLock Protocol</h1>
        <p class="hero-copy">
          <template v-if="session">
            Solve together in one shared run. Host controls the flow while the team cracks clues live.
          </template>
          <template v-else>
            Solve solo immediately, or create a shared session when you want friends in the room.
          </template>
        </p>
      </div>

      <section class="dashboard-stats" aria-label="Run status">
        <article class="dashboard-stat">
          <span class="dashboard-stat__icon dashboard-stat__icon--life" aria-hidden="true"></span>
          <div>
            <span class="status-chip__label">Lives</span>
            <strong>{{ lives }} / {{ maxLives }}</strong>
            <p>{{ selectedIntensityLabel }} pressure</p>
          </div>
        </article>

        <article class="dashboard-stat">
          <span class="dashboard-stat__ring" :style="{ '--progress': `${progressPercent}%` }" aria-hidden="true"></span>
          <div>
            <span class="status-chip__label">Progress</span>
            <strong>{{ progressPercent }}%</strong>
            <p>{{ clearedRoomsCount }} / {{ rooms.length }} rooms cleared</p>
            <span class="progress-track">
              <span :style="{ width: `${progressPercent}%` }"></span>
            </span>
          </div>
        </article>

        <article class="dashboard-stat">
          <span class="dashboard-stat__icon dashboard-stat__icon--session" aria-hidden="true"></span>
          <div>
            <span class="status-chip__label">{{ session ? "Session Code" : "Mode" }}</span>
            <strong>{{ session?.joinCode ?? "Solo Ready" }}</strong>
            <p>{{ session ? "Share with friends" : "Co-op is optional" }}</p>
          </div>
        </article>
      </section>
    </section>

    <section class="dashboard-layout">
      <div class="dashboard-main">
        <section class="dashboard-panel rooms-panel">
          <div class="dashboard-panel__header">
            <div>
              <p class="panel-label">Escape Rooms</p>
              <h2>Choose your challenge</h2>
            </div>
            <span>{{ availableRoomCount }} available</span>
          </div>

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

        <SessionChatPanel
          v-if="session"
          :session="session"
          :realtime-error="realtimeError"
          :chat-input="chatInput"
          @update:chat-input="setChatInputValue"
          @send="sendChatMessage"
        />
      </div>

      <aside class="dashboard-sidebar">
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
          :invite-link="inviteLink"
          :realtime-error="realtimeError"
          @replay="retryRun"
          @leave="leaveSession"
          @copy-invite="copyInviteLink"
        />

        <section class="intensity-panel" aria-label="Intensity level">
          <div>
            <p class="panel-label">Intensity</p>
            <h2>Pressure level</h2>
          </div>

          <div class="intensity-options">
            <button
              v-for="option in intensityOptions"
              :key="option.id"
              type="button"
              class="intensity-option"
              :class="{ 'intensity-option--selected': selectedIntensity === option.id }"
              :disabled="Boolean(session)"
              @click="setIntensity(option.id)"
            >
              <strong>{{ option.label }}</strong>
              <span>{{ option.description }}</span>
            </button>
          </div>
        </section>

        <button class="secondary-button lobby-replay-button" @click="retryRun">
          Replay Run
        </button>
      </aside>
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
            <span>{{ lives }}/{{ maxLives }}</span>
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
          <button
            class="primary-button"
            :class="`primary-button--${selectedRoom.themeClass}`"
            :disabled="Boolean(session && !isHost)"
            @click="exitRoom"
          >
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
              :value="answerInput"
              type="text"
              :placeholder="activePuzzle.inputPlaceholder"
              :disabled="roomCleared"
              @focus="emitEditingPresence('answer')"
              @blur="emitEditingPresence('')"
              @input="handleTextDraftInput"
            />
          </template>

          <template v-else-if="activePuzzle.kind === 'email-investigation'">
            <EmailInvestigationPuzzleView
              :puzzle="activePuzzle"
              :search-query="emailSearchQuery"
              :selected-email-id="selectedEmailId"
              :answer="answerInput"
              :disabled="roomCleared"
              @update:search-query="handleEmailSearchUpdate"
              @update:selected-email-id="handleEmailSelectionUpdate"
              @update:answer="handleEmailAnswerUpdate"
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
          <p v-if="showAnswerText && activePuzzle.kind === 'logic-board'" class="answer-text">
            Correct terminal:
            {{ logicBoardAnswerLabel }}
          </p>
          <p v-if="showAnswerText && activePuzzle.kind === 'email-investigation'" class="answer-text">
            Override code: {{ activePuzzle.answer }}
          </p>
          <p v-if="showExplanation" class="explanation-text">
            Explanation: {{ activePuzzle.explanation }}
          </p>

          <div class="mission-footer">
            <div class="timer-pill">
              <span class="timer-ring" aria-hidden="true"></span>
              <span>{{ formattedTime }}</span>
            </div>

            <button
              v-if="roomCleared && nextUnlockedRoomId"
              class="primary-button mission-submit"
              :class="`primary-button--${selectedRoom.themeClass}`"
              :disabled="Boolean(session && !isHost)"
              @click="goToNextRoom"
            >
              Go to {{ nextRoomTitle }}
            </button>

            <button
              v-else-if="roomCleared"
              class="primary-button mission-submit"
              :class="`primary-button--${selectedRoom.themeClass}`"
              :disabled="Boolean(session && !isHost)"
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
                :disabled="Boolean(session && !isHost)"
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

      <SessionChatPanel
        :session="session"
        :realtime-error="realtimeError"
        :chat-input="chatInput"
        @update:chat-input="setChatInputValue"
        @send="sendChatMessage"
      />
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
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount, onMounted } from "vue";
import RoomCard from "./components/RoomCard.vue";
import SessionAccessPanel from "./components/SessionAccessPanel.vue";
import SessionChatPanel from "./components/SessionChatPanel.vue";
import SessionLobbyPanel from "./components/SessionLobbyPanel.vue";
import EmailInvestigationPuzzleView from "./components/puzzles/EmailInvestigationPuzzle.vue";
import LogicBoardPuzzleView from "./components/puzzles/LogicBoardPuzzle.vue";
import { useGameplay } from "./composables/useGameplay";
import { useSession } from "./composables/useSession";

const MUSIC_ENABLED_KEY = "ai-escape-room-music-enabled";
const MUSIC_VOLUME_KEY = "ai-escape-room-music-volume";

const ambientAudio = ref<HTMLAudioElement | null>(null);
const isMusicPlaying = ref(false);
const musicUnavailable = ref(false);
const musicVolume = ref(0.35);

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
  emitGiveUp,
  emitHint,
  emitReveal,
  emitSubmitAnswer,
  emitDraftText,
  emitDraftEmail,
  emitDraftLogic,
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
} = gameplay;

const selectedIntensityLabel = computed(() => {
  return intensityOptions.find((option) => option.id === selectedIntensity.value)?.label ?? "Medium";
});

const progressPercent = computed(() => {
  return Math.round((clearedRoomsCount.value / rooms.value.length) * 100);
});

const availableRoomCount = computed(() => {
  return rooms.value.filter((room) => room.unlocked).length;
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

const handleLogicBoardDraftUpdate = (nextValue: string) => {
  if (session.value) {
    emitDraftLogic(nextValue);
    emitEditingPresence(nextValue ? "logic board" : "");
    return;
  }

  logicBoardSelection.value = nextValue;
};

const handleFailedAttempt = async (failureMessage: string) => {
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
  if (session.value) {
    if (!isHost.value) {
      return;
    }

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

const triggerGameOver = () => {
  if (session.value) {
    if (!isHost.value) {
      return;
    }

    emitGiveUp();
    return;
  }

  stopTimer();
  currentScreen.value = "game-over";
  resetRoomUi();
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
      textAnswer: answerInput.value,
      logicBoardSelection: logicBoardSelection.value,
    });
    return;
  }

  if (!activePuzzle.value || roomCleared.value) {
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

onBeforeUnmount(() => {
  stopTimer();
  pauseAmbientMusic();
  disconnectRealtime();
});
</script>
