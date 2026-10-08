<script setup lang="ts">
withDefaults(defineProps<{ size?: 'md' | 'lg' }>(), { size: 'md' });
/** `lg` is the login panel: 22 px in the phone band, 28 px beside the form. */
const SIZES = { md: 'text-xl', lg: 'text-[22px] lg:text-[28px]' } as const;
</script>

<template>
  <RouterLink
    to="/"
    class="inline-flex min-h-11 items-center font-display font-bold text-content"
    :class="SIZES[size]"
  >
    {{ $t('app.name') }}
  </RouterLink>
</template>
