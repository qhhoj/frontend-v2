<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
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
    <SearchInput
      v-model="username"
      name="username"
      autocomplete="off"
      :maxlength="USERNAME_MAX_LENGTH"
      :label="$t('leaderboard.jumpLabel')"
      :placeholder="$t('leaderboard.jumpPlaceholder')"
      class="min-w-0 flex-1 sm:w-64 sm:flex-none"
    />
    <AppButton type="submit">{{ $t('leaderboard.jumpSubmit') }}</AppButton>
  </form>
</template>
