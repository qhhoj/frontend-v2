<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import LanguageForm from './LanguageForm.vue';
import { useLanguagesAdminQuery } from './languages.queries';

/** One page for "new" and "edit": the route decides, and an edit finds its language in the list already loaded. */
const route = useRoute();
const isNew = computed(() => route.name === 'admin-languageNew');
const routeKey = computed(() => String(route.params.key ?? ''));
const { data, isPending, error, refetch } = useLanguagesAdminQuery({ enabled: () => !isNew.value });
const language = computed(() => data.value?.find((entry) => entry.key === routeKey.value) ?? null);
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.languages.crumbs.languages'), to: { name: 'admin-languages' } },
        { label: isNew ? $t('admin.languages.form.addTitle') : routeKey },
      ]"
      :title="
        isNew
          ? $t('admin.languages.form.addTitle')
          : $t('admin.languages.form.editTitle', { key: routeKey })
      "
    >
      <template #actions><AdminBit placement="header" /></template>
    </AdminPageHeader>
    <LanguageForm v-if="isNew" :language="null" />
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <LanguageForm v-if="language" :key="language.id" :language="language" />
      <section v-else class="glass flex flex-col items-center gap-3 rounded-panel p-6 text-center">
        <AdminBit placement="empty" />
        <p>{{ $t('admin.languages.form.notFound', { key: routeKey }) }}</p>
        <RouterLink :to="{ name: 'admin-languages' }" class="font-semibold underline">
          {{ $t('admin.languages.form.back') }}
        </RouterLink>
      </section>
    </QueryState>
  </div>
</template>
