<script setup lang="ts">
import { computed } from 'vue';
import BitMascot from '@/components/BitMascot.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { formatNumber } from '@/lib/format';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { useLocaleStore } from '@/stores/locale.store';
import { useHomeQuery } from '@/features/community/community.queries';

/**
 * The visitor's page header: Bit, the H1, the lead, the sign-up actions and one meta line with the four totals. The
 * counts come from `GET /home`; the header never waits for them and leaves them out when the request fails. On phones
 * there are no counts, one primary ("Đăng ký tài khoản") and a text "Đăng nhập" (the menu sheet has the sign-in too).
 */
const locale = useLocaleStore();
const { data: home, isPending, isError } = useHomeQuery();
const COUNT_KEYS = ['users', 'problems', 'submissions', 'contests'] as const;
const counts = computed(() =>
  home.value
    ? COUNT_KEYS.map((key) => [key, formatNumber(home.value.counts[key], locale.locale)] as const)
    : [],
);
</script>

<template>
  <PageHeader
    :title="$t('home.anon.title')"
    :lead="$t('home.anon.body')"
    data-testid="anonymous-header"
  >
    <template #start>
      <BitMascot
        data-testid="home-bit"
        :look="PLACEMENT_LOOKS.hero"
        blinks
        :label="$t('home.anon.bit')"
        class="[--bit-px:3px]"
      />
    </template>
    <template #meta>
      <!-- Phones skip the totals so the sign-up button stays on the first screen. -->
      <SkeletonBlock
        v-if="isPending && !isError"
        text
        data-skeleton-region="counts"
        class="w-64 max-sm:hidden"
      />
      <template v-for="([key, value], index) in counts" :key="key">
        <span v-if="index > 0" aria-hidden="true" class="max-sm:hidden">·</span>
        <span class="max-sm:hidden">{{ value }} {{ $t(`home.anon.counts.${key}`) }}</span>
      </template>
    </template>
    <template #actions>
      <AppButton tone="primary" to="/register">{{ $t('home.anon.register') }}</AppButton>
      <AppButton to="/login" class="max-sm:hidden">{{ $t('home.anon.signIn') }}</AppButton>
      <RouterLink
        to="/login"
        class="inline-flex min-h-11 items-center px-3 font-semibold text-accent-text hover:underline sm:hidden"
        >{{ $t('home.anon.signIn') }}</RouterLink
      >
      <RouterLink
        to="/problems"
        class="inline-flex min-h-11 items-center px-3 font-semibold text-accent-text hover:underline"
        >{{ $t('home.anon.problems') }}</RouterLink
      >
    </template>
  </PageHeader>
</template>
