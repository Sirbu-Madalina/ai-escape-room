<template>
  <section class="mission-card session-summary-card">
    <div class="session-team-card__header">
      <h2>Current team ({{ session.players.length }})</h2>
      <strong>{{ session.joinCode }}</strong>
    </div>

    <p v-if="realtimeError" class="status-message">{{ realtimeError }}</p>

    <div class="player-pill-list session-team-card__players" aria-label="Current team players">
      <span
        v-for="player in session.players"
        :key="player.id"
        class="info-pill player-presence-pill"
      >
        {{ player.name }}<span v-if="currentPlayerId === player.id"> (me)</span>
      </span>
    </div>

    <div class="session-setup-actions">
      <button class="secondary-button" @click="$emit('copyInvite')">Copy link</button>
      <button class="secondary-button" @click="$emit('leave')">Leave Team</button>
      <button
        class="primary-button session-team-card__replay"
        :disabled="!isHost || !canReplay"
        @click="$emit('replay')"
      >
        Replay
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { GameSession } from "../services/sessionClient";

defineProps<{
  session: GameSession;
  currentPlayerId: string;
  isHost: boolean;
  canReplay: boolean;
  inviteLink: string;
  realtimeError: string;
}>();

defineEmits<{
  replay: [];
  leave: [];
  copyInvite: [];
}>();
</script>
