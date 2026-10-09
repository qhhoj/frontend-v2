<script setup lang="ts">
import AdminPageHeader from '../ui/AdminPageHeader.vue';
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-6 sm:px-8">
    <AdminPageHeader :crumbs="[]" :title="$t('admin.shell.screens.shortLinks')" />
  </div>
</template>
