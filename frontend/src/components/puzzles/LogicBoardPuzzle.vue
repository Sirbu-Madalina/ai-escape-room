<template>
  <div class="logic-board">
    <section>
      <p class="logic-board__label">Clues</p>
      <ul class="logic-board__list">
        <li v-for="(statement, index) in puzzle.statements" :key="statement" class="logic-board__statement">
          <span class="logic-board__index">0{{ index + 1 }}</span>
          <span>{{ statement }}</span>
        </li>
      </ul>
    </section>

    <section>
      <p class="logic-board__label">Choose the correct terminal</p>
      <div class="logic-board__options">
        <button
          v-for="option in puzzle.options"
          :key="option.id"
          type="button"
          class="logic-board__option"
          :class="{ 'logic-board__option--selected': modelValue === option.id }"
          :disabled="disabled"
          @click="$emit('update:modelValue', option.id)"
        >
          <strong>{{ option.label }}</strong>
          <span>{{ option.description }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { LogicBoardPuzzle } from "../../data/localPuzzles";

defineProps<{
  puzzle: LogicBoardPuzzle;
  modelValue: string;
  disabled: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>
