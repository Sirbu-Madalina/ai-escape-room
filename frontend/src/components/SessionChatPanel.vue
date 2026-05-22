<template>
  <section class="mission-card session-summary-card lobby-chat-card">
    <template v-if="!session">
      <div class="lobby-chat-card__empty">
        <strong>Chat box</strong>
        <span>Create a session to chat with your friends.</span>
      </div>
    </template>

    <template v-else>
    <h2>Chat</h2>
    <p v-if="realtimeError" class="status-message">{{ realtimeError }}</p>

    <div class="chat-message-list">
      <p v-if="session.chatMessages.length === 0" class="lobby-chat-card__first-message">
        Write the first message
      </p>
      <div v-for="chatMessage in session.chatMessages" :key="chatMessage.id" class="chat-message">
        <strong>{{ chatMessage.playerName }}</strong>
        <p>{{ chatMessage.text }}</p>
      </div>
    </div>

    <div class="lobby-chat-card__composer">
      <input
        id="room-chat-input"
        :value="chatInput"
        type="text"
        maxlength="240"
        placeholder="Type a message"
        aria-label="Type a message"
        @input="onChatInput"
        @keyup.enter="$emit('send')"
      />

      <button type="button" aria-label="Send message" @click="$emit('send')">
        <svg aria-hidden="true" viewBox="0 0 256 256" fill="none">
          <path
            d="M24 128 220 36 164 220l-40-80-100-12Z"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="18"
          />
          <path
            d="m124 140 96-104"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="18"
          />
        </svg>
      </button>
    </div>
    </template>
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
