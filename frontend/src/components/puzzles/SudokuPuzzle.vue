<template>
  <div class="sudoku-board" role="grid" aria-label="4 by 4 sudoku board">
    <div
      v-for="(row, rowIndex) in modelValue"
      :key="`row-${rowIndex}`"
      class="sudoku-board__row"
      role="row"
    >
      <input
        v-for="(cell, columnIndex) in row"
        :key="`cell-${rowIndex}-${columnIndex}`"
        class="sudoku-board__cell"
        :class="{ 'sudoku-board__cell--fixed': puzzle.givens[rowIndex][columnIndex] !== 0 }"
        :value="cell === 0 ? '' : cell"
        :disabled="disabled || puzzle.givens[rowIndex][columnIndex] !== 0"
        inputmode="numeric"
        maxlength="1"
        @input="updateCell(rowIndex, columnIndex, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SudokuPuzzle } from "../../data/localPuzzles";

const props = defineProps<{
  puzzle: SudokuPuzzle;
  modelValue: number[][];
  disabled: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [grid: number[][]];
}>();

const updateCell = (rowIndex: number, columnIndex: number, event: Event) => {
  const target = event.target as HTMLInputElement;
  const nextValue = target.value.replace(/[^1-4]/g, "").slice(0, 1);
  const parsedValue = nextValue === "" ? 0 : Number(nextValue);

  const nextGrid = props.modelValue.map((row) => [...row]);
  nextGrid[rowIndex][columnIndex] = parsedValue;

  emit("update:modelValue", nextGrid);
};
</script>
