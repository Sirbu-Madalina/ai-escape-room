<template>
  <div class="email-investigation">
    <section class="email-investigation__toolbar">
      <label class="input-label" for="email-search-input">Search inbox</label>
      <input
        id="email-search-input"
        :value="searchQuery"
        type="search"
        placeholder="Search Hayes, birthday, override..."
        :disabled="disabled"
        @input="onSearchInput"
      />
    </section>

    <div class="email-investigation__workspace">
      <aside class="email-investigation__inbox" aria-label="Inbox">
        <button
          v-for="email in filteredEmails"
          :key="email.id"
          type="button"
          class="email-investigation__email"
          :class="{ 'email-investigation__email--selected': selectedEmailId === email.id }"
          :disabled="disabled"
          @click="$emit('update:selectedEmailId', email.id)"
        >
          <span>{{ email.from }}</span>
          <strong>{{ email.subject }}</strong>
          <small>{{ email.preview }}</small>
        </button>

        <p v-if="filteredEmails.length === 0" class="email-investigation__empty">
          No messages match that search.
        </p>
      </aside>

      <section class="email-investigation__content">
        <template v-if="selectedEmail">
          <p class="email-investigation__meta">
            From {{ selectedEmail.from }} to {{ selectedEmail.to }}
          </p>
          <h3>{{ selectedEmail.subject }}</h3>
          <p>{{ selectedEmail.body }}</p>
          <div class="email-investigation__tags">
            <span v-for="tag in selectedEmail.tags" :key="tag">{{ tag }}</span>
          </div>
        </template>

        <template v-else>
          <h3>No email selected</h3>
          <p>Open a message from the inbox to inspect its clues.</p>
        </template>
      </section>
    </div>

    <section class="email-investigation__profile">
      <p class="logic-board__label">Employee Profile</p>
      <dl>
        <div>
          <dt>Name</dt>
          <dd>{{ puzzle.employeeProfile.name }}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{{ puzzle.employeeProfile.role }}</dd>
        </div>
        <div>
          <dt>Birthday</dt>
          <dd>{{ puzzle.employeeProfile.birthday }}</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd>{{ puzzle.employeeProfile.notes }}</dd>
        </div>
      </dl>
    </section>

    <label class="input-label" for="email-answer-input">Override code</label>
    <input
      id="email-answer-input"
      :value="answer"
      type="text"
      :placeholder="puzzle.inputPlaceholder"
      :disabled="disabled"
      @input="onAnswerInput"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EmailInvestigationPuzzle } from "../../data/localPuzzles";

const props = defineProps<{
  puzzle: EmailInvestigationPuzzle;
  searchQuery: string;
  selectedEmailId: string;
  answer: string;
  disabled: boolean;
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "update:selectedEmailId": [value: string];
  "update:answer": [value: string];
}>();

const normalizedSearch = computed(() => props.searchQuery.trim().toLowerCase());

const filteredEmails = computed(() => {
  if (!normalizedSearch.value) {
    return props.puzzle.emails;
  }

  return props.puzzle.emails.filter((email) => {
    return [
      email.from,
      email.to,
      email.subject,
      email.preview,
      email.body,
      email.tags.join(" "),
    ].some((value) => value.toLowerCase().includes(normalizedSearch.value));
  });
});

const selectedEmail = computed(() => {
  return props.puzzle.emails.find((email) => email.id === props.selectedEmailId) ?? filteredEmails.value[0] ?? null;
});

const onSearchInput = (event: Event) => {
  emit("update:searchQuery", (event.target as HTMLInputElement).value);
};

const onAnswerInput = (event: Event) => {
  emit("update:answer", (event.target as HTMLInputElement).value);
};
</script>
