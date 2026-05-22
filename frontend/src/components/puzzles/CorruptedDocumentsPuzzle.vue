<template>
  <div class="corrupted-documents">
    <section class="corrupted-documents__viewer" aria-label="Corrupted documents">
      <button
        v-for="document in puzzle.documents"
        :key="document.id"
        type="button"
        class="corrupted-documents__file"
        :class="{ 'corrupted-documents__file--selected': selectedDocument.id === document.id }"
        @click="selectedDocumentId = document.id"
      >
        <span>{{ document.classification }}</span>
        <strong>{{ document.title }}</strong>
        <small>{{ document.clueLabel }}</small>
      </button>
    </section>

    <section class="corrupted-documents__document">
      <div class="corrupted-documents__document-header">
        <div>
          <span>{{ selectedDocument.classification }}</span>
          <h3>{{ selectedDocument.title }}</h3>
        </div>
        <strong>Integrity {{ integrityScore }}%</strong>
      </div>

      <pre>{{ selectedDocument.corruptedText }}</pre>

      <div class="corrupted-documents__clue">
        <span>Repair task: {{ formatPuzzleType(selectedDocument.puzzleType) }}</span>
        <strong>{{ selectedDocument.clue }}</strong>
      </div>
    </section>

    <aside class="corrupted-documents__recovery">
      <p class="logic-board__label">Recovery Console</p>
      <div class="corrupted-documents__brief">
        <strong>Goal</strong>
        <p>Repair each corrupted line, recover one word, then type the three-word command.</p>
      </div>
      <ul>
        <li v-for="document in puzzle.documents" :key="document.id">
          <span>{{ document.clueLabel }}</span>
          <strong>{{ document.orderHint }}</strong>
        </li>
      </ul>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { CorruptedDocumentsPuzzle } from "../../data/localPuzzles";

const props = defineProps<{
  disabled: boolean;
  puzzle: CorruptedDocumentsPuzzle;
}>();

const selectedDocumentId = ref(props.puzzle.documents[0]?.id ?? "");

const selectedDocument = computed(() => {
  return props.puzzle.documents.find((document) => document.id === selectedDocumentId.value)
    ?? props.puzzle.documents[0];
});

const integrityScore = computed(() => {
  const selectedIndex = props.puzzle.documents.findIndex((document) => document.id === selectedDocument.value.id);
  return Math.max(18, 42 - selectedIndex * 7);
});

const formatPuzzleType = (puzzleType: string) => {
  return puzzleType
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
};
</script>
