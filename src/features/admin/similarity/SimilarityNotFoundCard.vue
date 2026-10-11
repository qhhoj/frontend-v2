<script setup lang="ts">
import { useRouter } from 'vue-router';
import AdminBit from '../shell/AdminBit.vue';
import { buttonClass } from '../ui/controls';

const router = useRouter();
/** The server answers 404 for an unknown scope and for one the viewer may not edit, so the card names neither. */
const backToList = () => router.push({ name: 'admin-similarity' });
</script>

<template>
  <section class="flex flex-col items-center gap-3 px-6 py-8 text-center">
    <AdminBit placement="refused" />
    <h2 class="font-display text-xl font-bold">{{ $t('admin.similarity.notFound.title') }}</h2>
    <p class="max-w-prose text-sm text-muted">{{ $t('admin.similarity.notFound.body') }}</p>
    <button type="button" :class="buttonClass()" @click="backToList">
      {{ $t('admin.similarity.notFound.back') }}
    </button>
  </section>
</template>
