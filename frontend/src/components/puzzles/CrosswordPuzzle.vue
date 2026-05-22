<template>
  <div class="crossword-puzzle">
    <section class="crossword-puzzle__stage">
      <section class="crossword-puzzle__board" aria-label="AI crossword grid">
        <div
          class="crossword-puzzle__grid"
          :style="{
            gridTemplateColumns: `repeat(${gridBounds.cols}, 52px)`,
            gridTemplateRows: `repeat(${gridBounds.rows}, 52px)`,
          }"
        >
          <div
            v-for="cell in cells"
            :key="`${cell.row}-${cell.col}`"
            class="crossword-puzzle__cell"
            :style="{ gridColumn: cell.col + 1, gridRow: cell.row + 1 }"
            :class="{ 'crossword-puzzle__cell--prefilled': cell.prefilled }"
          >
            <span v-if="cell.number" class="crossword-puzzle__number">{{ cell.number }}</span>
            <input
              :aria-label="`Cell ${cell.row + 1}, ${cell.col + 1}`"
              :disabled="disabled || cell.prefilled"
              :maxlength="1"
              :value="cell.value"
              @input="onCellInput(cell, $event)"
            />
          </div>
        </div>
      </section>
    </section>

    <aside class="crossword-puzzle__clues">
      <section>
        <p class="logic-board__label">Clues</p>
      </section>

      <section>
        <p class="logic-board__label">Across</p>
        <button
          v-for="entry in acrossEntries"
          :key="entry.id"
          type="button"
          class="crossword-puzzle__clue"
          :class="{ 'crossword-puzzle__clue--solved': isEntrySolved(entry) }"
        >
          <span>{{ entry.number }}</span>
          <p>{{ entry.clue }}</p>
          <small>{{ entry.answer.length }}</small>
        </button>
      </section>

      <section v-if="downEntries.length > 0">
        <p class="logic-board__label">Down</p>
        <button
          v-for="entry in downEntries"
          :key="entry.id"
          type="button"
          class="crossword-puzzle__clue"
          :class="{ 'crossword-puzzle__clue--solved': isEntrySolved(entry) }"
        >
          <span>{{ entry.number }}</span>
          <p>{{ entry.clue }}</p>
          <small>{{ entry.answer.length }}</small>
        </button>
      </section>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CrosswordEntry, CrosswordPuzzle } from "../../data/localPuzzles";

const props = defineProps<{
  disabled: boolean;
  modelValue: Record<string, string>;
  puzzle: CrosswordPuzzle;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, string>];
}>();

type CrosswordCell = {
  col: number;
  key: string;
  number: number | null;
  prefilled: boolean;
  row: number;
  value: string;
};

const acrossEntries = computed(() => props.puzzle.entries.filter((entry) => entry.direction === "across"));
const downEntries = computed(() => props.puzzle.entries.filter((entry) => entry.direction === "down"));

const gridBounds = computed(() => {
  const maxRow = Math.max(
    ...props.puzzle.entries.map((entry) => (
      entry.direction === "down" ? entry.row + entry.answer.length : entry.row + 1
    )),
  );
  const maxCol = Math.max(
    ...props.puzzle.entries.map((entry) => (
      entry.direction === "across" ? entry.col + entry.answer.length : entry.col + 1
    )),
  );

  return { rows: maxRow, cols: maxCol };
});

const getCellPosition = (entry: CrosswordEntry, index: number) => {
  return {
    row: entry.direction === "down" ? entry.row + index : entry.row,
    col: entry.direction === "across" ? entry.col + index : entry.col,
  };
};

const cells = computed(() => {
  const cellMap = new Map<string, CrosswordCell>();

  props.puzzle.entries.forEach((entry) => {
    entry.answer.split("").forEach((letter, index) => {
      const position = getCellPosition(entry, index);
      const key = `${position.row}-${position.col}`;
      const existingCell = cellMap.get(key);
      const isPrefilled = entry.prefilledIndexes.includes(index);
      const value = isPrefilled ? letter.toUpperCase() : (props.modelValue[key] ?? "");

      cellMap.set(key, {
        col: position.col,
        key,
        number: existingCell?.number ?? (index === 0 ? entry.number : null),
        prefilled: existingCell?.prefilled || isPrefilled,
        row: position.row,
        value: existingCell?.value || value,
      });
    });
  });

  return [...cellMap.values()].sort((a, b) => a.row - b.row || a.col - b.col);
});

const isEntrySolved = (entry: CrosswordEntry) => {
  return entry.answer.split("").every((letter, index) => {
    const position = getCellPosition(entry, index);
    const key = `${position.row}-${position.col}`;
    const enteredValue = props.modelValue[key] ?? "";

    return entry.prefilledIndexes.includes(index) || enteredValue.toLowerCase() === letter.toLowerCase();
  });
};

const onCellInput = (cell: CrosswordCell, event: Event) => {
  const input = event.target as HTMLInputElement;
  const nextValue = input.value.replace(/[^a-z]/gi, "").slice(-1).toUpperCase();
  input.value = nextValue;

  emit("update:modelValue", {
    ...props.modelValue,
    [cell.key]: nextValue,
  });
};
</script>
