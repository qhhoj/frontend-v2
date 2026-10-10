<script setup lang="ts">
import AdminBit from './AdminBit.vue';
</script>

<template>
  <section class="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-16 text-center">
    <AdminBit placement="placeholder" />
    <h1 class="page-title">
      {{ $t($route.meta.titleKey ?? 'pages.admin') }}
    </h1>
    <p class="text-muted">{{ $t('admin.shell.placeholder') }}</p>
  </section>
</template>
