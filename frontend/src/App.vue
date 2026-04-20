<template>
  <div class="app">
    <div class="game-card">
      <h1>MindLock: Room 1</h1>
      <p class="subtitle">AI Escape Room — Cyber Lab</p>

      <button @click="generatePuzzle" :disabled="loading">
        {{ loading ? "Generating..." : "Start Escape" }}
      </button>

      <div v-if="puzzle" class="puzzle-box">
        <h2>{{ puzzle.title }}</h2>
        <p>{{ puzzle.riddle }}</p>

        <input
          v-model="answerInput"
          placeholder="Enter your answer"
        />

        <div class="button-row">
          <button @click="checkAnswer">Submit Answer</button>
          <button @click="showHint = true">Show Hint</button>
        </div>

        <p v-if="showHint" class="hint">💡 {{ puzzle.hint }}</p>
        <p v-if="message" class="message">{{ message }}</p>
        <p v-if="showExplanation" class="explanation">
          🧠 {{ puzzle.explanation }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

type Puzzle = {
  title: string;
  riddle: string;
  answer: string;
  hint: string;
  explanation: string;
};

const loading = ref(false);
const puzzle = ref<Puzzle | null>(null);
const answerInput = ref("");
const message = ref("");
const showHint = ref(false);
const showExplanation = ref(false);

const generatePuzzle = async () => {
  loading.value = true;
  message.value = "";
  showHint.value = false;
  showExplanation.value = false;
  answerInput.value = "";

  try {
    const res = await fetch("http://localhost:5001/api/riddle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        difficulty: "easy",
        theme: "cyber lab",
      }),
    });

    const data = await res.json();
    puzzle.value = data;
  } catch (err) {
    console.error(err);
    message.value = "Failed to load puzzle.";
  } finally {
    loading.value = false;
  }
};

const checkAnswer = () => {
  if (!puzzle.value) return;

  const user = answerInput.value.trim().toLowerCase();
  const correct = puzzle.value.answer.trim().toLowerCase();

  if (user === correct) {
    message.value = "✅ Correct! Room unlocked.";
    showExplanation.value = true;
  } else {
    message.value = "❌ Wrong answer. Try again.";
  }
};
</script>