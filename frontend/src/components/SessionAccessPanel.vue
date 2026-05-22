<template>
  <section class="mission-card session-setup-card">
    <p class="panel-label">Session Access</p>
    <h2>Create / Join Sessions</h2>
    <p class="puzzle-text">
      Solo play is available right away. Use this only if you want to create or join a shared co-op session.
    </p>

    <label class="input-label" for="player-name-input">Name</label>
    <input
      id="player-name-input"
      :value="playerName"
      type="text"
      maxlength="24"
      placeholder="Agent Name"
      @input="onPlayerNameInput"
    />

    <label class="input-label" for="join-code-input">Join Code</label>
    <input
      id="join-code-input"
      :value="joinCode"
      type="text"
      maxlength="6"
      placeholder="000 000"
      @input="onJoinCodeInput"
    />

    <p v-if="sessionError" class="status-message">{{ sessionError }}</p>
    <p v-if="realtimeError" class="status-message">{{ realtimeError }}</p>

    <div class="session-setup-actions">
      <button class="ghost-button ghost-button--cyan" :disabled="sessionLoading" @click="$emit('join')">
        Join Session
      </button>
      <button class="primary-button" :disabled="sessionLoading" @click="$emit('create')">
        {{ sessionLoading ? "Working..." : "Create Session" }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  playerName: string;
  joinCode: string;
  sessionLoading: boolean;
  sessionError: string;
  realtimeError: string;
}>();

const emit = defineEmits<{
  "update:playerName": [value: string];
  "update:joinCode": [value: string];
  create: [];
  join: [];
}>();

const onPlayerNameInput = (event: Event) => {
  emit("update:playerName", (event.target as HTMLInputElement).value);
};

const onJoinCodeInput = (event: Event) => {
  emit("update:joinCode", (event.target as HTMLInputElement).value);
};
</script>
