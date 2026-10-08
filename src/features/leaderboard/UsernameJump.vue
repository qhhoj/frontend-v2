<script setup lang="ts">
import { ref, useId } from 'vue';
import { useRouter } from 'vue-router';

const USERNAME_MAX_LENGTH = 30;
const router = useRouter();
const inputId = useId();
const username = ref('');

/** A blank box does nothing; any other name opens that exact profile (an unknown one shows the profile's 404). */
const openProfile = () => {
  const trimmed = username.value.trim();
  if (trimmed) void router.push({ name: 'user', params: { username: trimmed } });
};
</script>

<template>
  <form
    data-testid="username-jump"
    class="flex flex-wrap items-end gap-2"
    @submit.prevent="openProfile"
  >
    <div class="flex flex-col gap-1">
      <label :for="inputId" class="text-sm font-semibold">{{ $t('leaderboard.jumpLabel') }}</label>
      <input
        :id="inputId"
        v-model="username"
        name="username"
        type="text"
        autocomplete="off"
        :maxlength="USERNAME_MAX_LENGTH"
        :placeholder="$t('leaderboard.jumpPlaceholder')"
        class="min-h-11 min-w-0 rounded-pill border border-line bg-surface-solid px-4 text-content placeholder:text-muted"
      />
    </div>
    <button
      type="submit"
      class="min-h-11 rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
    >
      {{ $t('leaderboard.jumpSubmit') }}
    </button>
  </form>
</template>
