<script setup lang="ts">
import CreatePageShell from '../../creation/CreatePageShell.vue';
import ContestCreateForm from './ContestCreateForm.vue';
</script>

<template>
  <CreatePageShell
    :title="$t('admin.contests.create.title')"
    :lead="$t('admin.contests.create.lead')"
    :back="{ to: { name: 'admin-contests' }, label: $t('admin.contests.index.title') }"
  >
    <ContestCreateForm />
  </CreatePageShell>
</template>
