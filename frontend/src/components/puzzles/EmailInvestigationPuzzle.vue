<template>
  <div class="email-investigation">
    <div class="email-investigation__workspace">
      <aside class="email-investigation__inbox" aria-label="Company inbox">
        <div class="email-investigation__panel-header">
          <div>
            <p class="logic-board__label">Company Inbox</p>
            <strong>{{ filteredEmails.length }} emails</strong>
          </div>
        </div>

        <div class="email-investigation__search">
          <input
            id="email-search-input"
            :value="searchQuery"
            type="search"
            placeholder="Search emails..."
            :disabled="disabled"
            @input="onSearchInput"
          />
          <span aria-hidden="true">?</span>
        </div>

        <div class="email-investigation__email-list">
          <button
            v-for="email in filteredEmails"
            :key="email.id"
            type="button"
            class="email-investigation__email"
            :class="{ 'email-investigation__email--selected': activeEmailId === email.id }"
            :disabled="disabled"
            @click="$emit('update:selectedEmailId', email.id)"
          >
            <span class="email-investigation__sender">
              <i :class="getEmailToneClass(email)" aria-hidden="true"></i>
              {{ email.from }}
            </span>
            <span class="email-investigation__time">{{ email.time ?? "" }}</span>
            <strong>{{ email.subject }}</strong>
            <small>{{ email.preview }}</small>
          </button>

          <p v-if="filteredEmails.length === 0" class="email-investigation__empty">
            No messages match that search.
          </p>
        </div>
      </aside>

      <section class="email-investigation__reader">
        <header class="email-investigation__actions">
          <span>Reply</span>
          <span>Forward</span>
          <span>Mark unread</span>
          <span>Delete</span>
          <strong>{{ selectedEmail?.time ?? "10:42 AM" }}</strong>
        </header>

        <div class="email-investigation__reader-body">
          <article class="email-investigation__content">
            <template v-if="selectedEmail">
              <div class="email-investigation__author-row">
                <span class="email-investigation__avatar">{{ senderInitials }}</span>
                <div>
                  <strong>{{ senderName }}</strong>
                  <p>to: {{ selectedEmail.to }}</p>
                </div>
              </div>

              <h3>{{ selectedEmail.subject }}</h3>
              <p>{{ selectedEmail.body }}</p>

              <div v-if="selectedEmail.attachmentName" class="email-investigation__attachment">
                <span aria-hidden="true">FILE</span>
                <div>
                  <strong>{{ selectedEmail.attachmentName }}</strong>
                  <small>245 KB</small>
                </div>
              </div>

              <div v-if="selectedEmail.priority !== 'normal'" class="email-investigation__clue-callout">
                <strong>Potential clue</strong>
                <p>{{ selectedEmail.clueSummary || "This message connects to the case." }}</p>
              </div>
            </template>

            <template v-else>
              <h3>No email selected</h3>
              <p>Open a message from the inbox to inspect its clues.</p>
            </template>
          </article>

          <aside class="email-investigation__profile">
            <p class="logic-board__label">Sender Profile</p>
            <div class="email-investigation__profile-name">
              <span class="email-investigation__avatar">{{ profileInitials }}</span>
              <strong>{{ puzzle.employeeProfile.name }}</strong>
            </div>
            <dl>
              <div>
                <dt>Role</dt>
                <dd>{{ puzzle.employeeProfile.role }}</dd>
              </div>
              <div>
                <dt>{{ profileDetailLabel }}</dt>
                <dd>{{ profileDetailValue }}</dd>
              </div>
              <div>
                <dt>Note</dt>
                <dd>{{ puzzle.employeeProfile.notes }}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EmailInvestigationPuzzle } from "../../data/localPuzzles";

const props = defineProps<{
  puzzle: EmailInvestigationPuzzle;
  searchQuery: string;
  selectedEmailId: string;
  disabled: boolean;
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "update:selectedEmailId": [value: string];
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
      email.clueSummary ?? "",
      email.tags.join(" "),
    ].some((value) => value.toLowerCase().includes(normalizedSearch.value));
  });
});

const selectedEmail = computed(() => {
  return props.puzzle.emails.find((email) => email.id === props.selectedEmailId) ?? filteredEmails.value[0] ?? null;
});

const activeEmailId = computed(() => selectedEmail.value?.id ?? "");

const profileDetailLabel = computed(() => props.puzzle.employeeProfile.detailLabel ?? "Birthday");

const profileDetailValue = computed(() => (
  props.puzzle.employeeProfile.detailValue ??
  props.puzzle.employeeProfile.birthday ??
  ""
));

const senderName = computed(() => {
  return selectedEmail.value?.from.split("@")[0].replace(/[._-]/g, " ") ?? "Unknown Sender";
});

const senderInitials = computed(() => {
  return senderName.value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
});

const profileInitials = computed(() => {
  return props.puzzle.employeeProfile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
});

const getEmailToneClass = (email: EmailInvestigationPuzzle["emails"][number]) => {
  if (email.priority === "clue") {
    return "email-investigation__dot email-investigation__dot--clue";
  }

  if (email.priority === "danger" || email.from.toLowerCase().includes("unknown")) {
    return "email-investigation__dot email-investigation__dot--danger";
  }

  return "email-investigation__dot";
};

const onSearchInput = (event: Event) => {
  emit("update:searchQuery", (event.target as HTMLInputElement).value);
};

</script>
