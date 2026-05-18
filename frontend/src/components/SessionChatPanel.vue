<template>
  <section v-if="session" class="mission-card session-summary-card">
    <p class="panel-label">Squad Chat</p>
    <h2>Coordinate live</h2>
    <p class="puzzle-text">
      Use chat to compare clues and keep everyone aligned while solving the room.
    </p>
    <p v-if="realtimeError" class="status-message">{{ realtimeError }}</p>

    <div class="chat-message-list">
      <p v-if="session.chatMessages.length === 0" class="puzzle-text">
        No messages yet. Say something to the team.
      </p>
      <div v-for="chatMessage in session.chatMessages" :key="chatMessage.id" class="chat-message">
        <strong>{{ chatMessage.playerName }}</strong>
        <p>{{ chatMessage.text }}</p>
      </div>
    </div>

    <label class="input-label" for="room-chat-input">Team message</label>
    <input
      id="room-chat-input"
      :value="chatInput"
      type="text"
      maxlength="240"
      placeholder="Share your clue or idea"
      @input="onChatInput"
      @keyup.enter="$emit('send')"
    />

    <div class="session-setup-actions">
      <button class="primary-button" @click="$emit('send')">Send</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { GameSession } from "../services/sessionClient";

defineProps<{
  session: GameSession | null;
  realtimeError: string;
  chatInput: string;
}>();

const emit = defineEmits<{
  "update:chatInput": [value: string];
  send: [];
}>();

const onChatInput = (event: Event) => {
  emit("update:chatInput", (event.target as HTMLInputElement).value);
};
</script>
