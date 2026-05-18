<template>
  <section class="mission-card session-summary-card">
    <p class="panel-label">Team</p>
    <h2>Connected players</h2>
    <p class="puzzle-text">
      Host controls the run flow. Everyone can still solve together in real time.
    </p>
    <p v-if="realtimeError" class="status-message">{{ realtimeError }}</p>

    <div class="player-pill-list">
      <span
        v-for="player in session.players"
        :key="player.id"
        class="info-pill player-presence-pill"
      >
        {{ player.name }}<span v-if="currentPlayerId === player.id"> (you)</span>
        <span v-if="player.isHost"> • host</span>
        <span v-if="!player.connected"> • offline</span>
        <span v-else-if="player.isTypingChat"> • typing</span>
        <span v-else-if="player.editingTarget"> • {{ player.editingTarget }}</span>
      </span>
    </div>

    <div class="session-setup-actions">
      <button class="secondary-button" @click="$emit('copyInvite')">Copy Invite Link</button>
      <button class="secondary-button" @click="$emit('leave')">Leave Session</button>
      <button class="primary-button" :disabled="!isHost" @click="$emit('replay')">Replay</button>
    </div>

    <p class="session-invite-copy">{{ inviteLink }}</p>
  </section>
</template>

<script setup lang="ts">
import type { GameSession } from "../services/sessionClient";

defineProps<{
  session: GameSession;
  currentPlayerId: string;
  isHost: boolean;
  inviteLink: string;
  realtimeError: string;
}>();

defineEmits<{
  replay: [];
  leave: [];
  copyInvite: [];
}>();
</script>
