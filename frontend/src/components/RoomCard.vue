<template>
  <article
    class="room-card"
    :class="[
      `theme-${room.themeClass}`,
      { 'is-selected': isSelected, 'is-locked': !isUnlocked, 'is-cleared': isCleared }
    ]"
  >
    <div class="room-card__glow"></div>

    <div class="room-card__content">
      <div v-if="!isUnlocked" class="room-card__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M7 10V7a5 5 0 0 1 10 0v3" />
          <rect x="5" y="10" width="14" height="10" rx="1.5" />
        </svg>
      </div>

      <div>
        <p v-if="isCleared" class="room-card__status">Cleared</p>
        <h2>{{ room.title }}</h2>
        <p>{{ room.subtitle }}</p>
      </div>

      <button
        class="room-card__button"
        :disabled="!isUnlocked"
        @click="$emit('start', room.id)"
      >
        {{ !isUnlocked ? "Locked" : isCleared ? "Replay Room" : "Start Escape" }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Room } from "../data/rooms";

defineProps<{
  room: Room;
  isSelected: boolean;
  isUnlocked: boolean;
  isCleared: boolean;
}>();

defineEmits<{
  start: [roomId: number];
}>();
</script>
