<script setup lang="ts">
import { TOOLBAR_INPUT_CLASS } from '@/components/toolbar-classes';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const USERNAME_MAX_LENGTH = 30;
const router = useRouter();
const username = ref('');

/** A blank box does nothing; any other name opens that exact profile (an unknown one shows the profile's 404). */
const openProfile = () => {
  const trimmed = username.value.trim();
  if (trimmed) void router.push({ name: 'user', params: { username: trimmed } });
};
</script>

<template>
  <form data-testid="username-jump" class="flex items-center gap-2" @submit.prevent="openProfile">
    <input
      v-model="username"
      name="username"
      type="text"
      autocomplete="off"
      :maxlength="USERNAME_MAX_LENGTH"
      :aria-label="$t('leaderboard.jumpLabel')"
      :placeholder="$t('leaderboard.jumpPlaceholder')"
      :class="[TOOLBAR_INPUT_CLASS, 'min-w-0 flex-1 sm:w-64 sm:flex-none']"
    />
    <button
      type="submit"
      class="min-h-11 rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
    >
      {{ $t('leaderboard.jumpSubmit') }}
    </button>
  </form>
</template>
