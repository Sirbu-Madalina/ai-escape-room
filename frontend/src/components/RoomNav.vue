<template>
  <nav class="room-nav" aria-label="Room navigation">
    <div class="room-nav__brand">
      <span class="room-nav__brand-mark" aria-hidden="true">
        <svg viewBox="0 0 256 256" fill="none">
          <path
            d="M92 48a44 44 0 0 0-44 44c0 8.4 2.4 16.2 6.4 22.8A44 44 0 0 0 84 196a42 42 0 0 0 44-40V80A32 32 0 0 0 92 48Z"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="18"
          />
          <path
            d="M164 48a44 44 0 0 1 44 44c0 8.4-2.4 16.2-6.4 22.8A44 44 0 0 1 172 196a42 42 0 0 1-44-40V80a32 32 0 0 1 36-32Z"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="18"
          />
          <path
            d="M80 108h24m-12 0v32m84-32h-24m12 0v32m-36-20h-28"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="18"
          />
        </svg>
      </span>
      <div>
        <strong>MINDLOCK</strong>
        <span>{{ subtitle }}</span>
      </div>
    </div>

    <div class="room-nav__stats" aria-label="Room status">
      <div class="room-nav__stat">
        <svg aria-hidden="true" viewBox="0 0 256 256" fill="none">
          <path
            d="M56 216h144M80 216V48h96v168M104 132h4"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="22"
          />
        </svg>
        <div>
          <span>Room</span>
          <strong>{{ roomNumber }}</strong>
        </div>
      </div>

      <div class="room-nav__stat">
        <svg aria-hidden="true" viewBox="0 0 256 256" fill="none">
          <circle
            cx="128"
            cy="128"
            r="88"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="22"
          />
          <path
            d="M128 72v56l40 24"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="22"
          />
        </svg>
        <div>
          <span>Time remaining</span>
          <strong>{{ timeRemaining }}</strong>
        </div>
      </div>

      <div class="room-nav__stat">
        <svg aria-hidden="true" viewBox="0 0 256 256" fill="none">
          <path
            d="M128 216S32 160 32 92a52 52 0 0 1 96-28 52 52 0 0 1 96 28c0 68-96 124-96 124Z"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="22"
          />
        </svg>
        <div>
          <span>Lives</span>
          <strong>{{ lives }}/{{ maxLives }}</strong>
        </div>
      </div>
    </div>

    <div class="room-nav__actions">
      <button
        type="button"
        class="room-nav__button room-nav__button--answer"
        :disabled="answerDisabled"
        @click="$emit('answer')"
      >
        <svg aria-hidden="true" viewBox="0 0 256 256" fill="none">
          <path
            d="m40 136 56 56L216 72"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="24"
          />
        </svg>
        <span>Answer</span>
      </button>

      <button
        type="button"
        class="room-nav__button room-nav__button--hint"
        :disabled="hintDisabled"
        @click="$emit('hint')"
      >
        <svg aria-hidden="true" viewBox="0 0 256 256" fill="none">
          <path
            d="M96 216h64M104 184h48M88 152a72 72 0 1 1 80 0c-10 8-16 18-16 32h-48c0-14-6-24-16-32Z"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="20"
          />
        </svg>
        <span>Hint</span>
      </button>

      <button
        type="button"
        class="room-nav__button room-nav__button--exit"
        :disabled="exitDisabled"
        @click="$emit('exit')"
      >
        <svg aria-hidden="true" viewBox="0 0 256 256" fill="none">
          <path
            d="M96 216H48V40h104v176h-16M152 128h56m0 0-24-24m24 24-24 24"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="22"
          />
        </svg>
        <span>Leave Room</span>
      </button>

      <button
        type="button"
        class="room-nav__sound"
        :class="{ 'room-nav__sound--active': isMusicPlaying }"
        :disabled="musicDisabled"
        :aria-label="isMusicPlaying ? 'Pause ambient music' : 'Play ambient music'"
        @click="$emit('toggle-music')"
      >
        <svg
          v-if="isMusicPlaying"
          aria-hidden="true"
          viewBox="0 0 256 256"
          fill="none"
        >
          <path
            d="M88 168H48a8 8 0 0 1-8-8V96a8 8 0 0 1 8-8h40l72-56v192l-72-56Z"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="18"
          />
          <path
            d="M196 88a56 56 0 0 1 0 80M218 64a88 88 0 0 1 0 128"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="18"
          />
        </svg>
        <svg
          v-else
          aria-hidden="true"
          viewBox="0 0 256 256"
          fill="none"
        >
          <path
            d="M88 168H48a8 8 0 0 1-8-8V96a8 8 0 0 1 8-8h40l72-56v192l-72-56Z"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="18"
          />
          <path
            d="M224 64 32 224"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="18"
          />
        </svg>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  subtitle: string;
  roomNumber: number;
  timeRemaining: string;
  lives: number;
  maxLives: number;
  hintDisabled: boolean;
  answerDisabled: boolean;
  exitDisabled: boolean;
  isMusicPlaying: boolean;
  musicDisabled: boolean;
}>();

defineEmits<{
  hint: [];
  answer: [];
  exit: [];
  "toggle-music": [];
}>();
</script>
