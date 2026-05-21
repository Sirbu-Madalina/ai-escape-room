<template>
  <section class="music-control" aria-label="Ambient music controls">
    <button
      type="button"
      class="music-control__toggle"
      :class="{ 'music-control__toggle--active': isPlaying }"
      :disabled="disabled"
      :aria-label="isPlaying ? 'Pause ambient music' : 'Play ambient music'"
      @click="$emit('toggle')"
    >
      <svg
        v-if="isPlaying"
        aria-hidden="true"
        viewBox="0 0 256 256"
        fill="none"
      >
        <path
          d="M88 168H48a8 8 0 0 1-8-8V96a8 8 0 0 1 8-8h40l72-56v192l-72-56Z"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="12"
        />
        <path
          d="M196 88a56 56 0 0 1 0 80M218.6 65.4a88 88 0 0 1 0 125.2"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="12"
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
          stroke-width="12"
        />
        <path
          d="M224 64 32 224"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="12"
        />
      </svg>
    </button>

    <label class="music-control__volume">
      <span>Volume</span>
      <input
        :value="volume"
        type="range"
        min="0"
        max="1"
        step="0.05"
        :disabled="disabled"
        @input="onVolumeInput"
      />
    </label>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  disabled: boolean;
  isPlaying: boolean;
  volume: number;
}>();

const emit = defineEmits<{
  "update:volume": [value: number];
  toggle: [];
}>();

const onVolumeInput = (event: Event) => {
  emit("update:volume", Number((event.target as HTMLInputElement).value));
};
</script>
