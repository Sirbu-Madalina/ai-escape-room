<template>
  <nav class="frontpage-nav" aria-label="Front page navigation">
    <div class="frontpage-nav__brand">
      <span class="frontpage-nav__brand-mark" aria-hidden="true">
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
        <span>AI ESCAPE ROOM EXPERIENCE</span>
      </div>
    </div>

    <div class="frontpage-nav__lives" aria-label="Lives remaining">
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

    <div class="frontpage-nav__actions">
      <div class="frontpage-nav__difficulty">
        <button
          type="button"
          class="frontpage-nav__button frontpage-nav__difficulty-button"
          :class="{ 'frontpage-nav__difficulty-button--open': isDifficultyMenuOpen }"
          :disabled="isSessionActive"
          aria-haspopup="listbox"
          :aria-expanded="isDifficultyMenuOpen"
          @click="$emit('toggle-difficulty')"
        >
          <span>{{ selectedIntensityLabel }}</span>
          <svg aria-hidden="true" viewBox="0 0 256 256" fill="none">
            <path
              d="m48 96 80 80 80-80"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="24"
            />
          </svg>
        </button>

        <div
          v-if="isDifficultyMenuOpen"
          class="frontpage-nav__difficulty-menu"
          role="listbox"
        >
          <button
            v-for="option in intensityOptions"
            :key="option.id"
            type="button"
            class="frontpage-nav__difficulty-option"
            :class="{ 'frontpage-nav__difficulty-option--selected': selectedIntensity === option.id }"
            role="option"
            :aria-selected="selectedIntensity === option.id"
            @click="$emit('choose-intensity', option.id)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <button
        type="button"
        class="frontpage-nav__button frontpage-nav__replay"
        @click="$emit('replay')"
      >
        <svg aria-hidden="true" viewBox="0 0 256 256" fill="none">
          <path
            d="M204 84a88 88 0 1 0 16 44"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="22"
          />
          <path
            d="M204 36v48h-48"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="22"
          />
        </svg>
        <span>Replay</span>
      </button>

      <button
        type="button"
        class="frontpage-nav__sound"
        :class="{ 'frontpage-nav__sound--active': isMusicPlaying }"
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
import type { IntensityLevel, IntensityOption } from "../data/intensity";

defineProps<{
  lives: number;
  maxLives: number;
  selectedIntensity: IntensityLevel;
  selectedIntensityLabel: string;
  intensityOptions: IntensityOption[];
  isDifficultyMenuOpen: boolean;
  isSessionActive: boolean;
  isMusicPlaying: boolean;
  musicDisabled: boolean;
}>();

defineEmits<{
  "toggle-music": [];
  "toggle-difficulty": [];
  "choose-intensity": [intensity: IntensityLevel];
  replay: [];
}>();
</script>
