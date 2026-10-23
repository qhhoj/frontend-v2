<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { permissionLabels } from '../ui/permission-label';
import AdminBit from './AdminBit.vue';

const route = useRoute();
/** The human names of the permissions the screen asks for; never the codenames. */
const needed = computed(() => {
  const rule = route.meta.permission;
  return permissionLabels(typeof rule === 'string' ? [rule] : [...(rule ?? [])]);
});
</script>

<template>
  <section
    data-testid="admin-forbidden"
    class="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-16 text-center"
  >
    <AdminBit placement="forbidden" />
    <h1 class="page-title">{{ $t('admin.shell.forbidden.title') }}</h1>
    <p class="text-muted">
      {{
        needed.length > 0
          ? $t('admin.shell.forbidden.body', needed.length)
          : $t('admin.shell.forbidden.generic')
      }}
    </p>
    <ul v-if="needed.length > 0" class="flex flex-wrap justify-center gap-2">
      <li
        v-for="permission in needed"
        :key="permission"
        class="rounded-pill border border-line px-3 py-1 text-sm"
      >
        {{ permission }}
      </li>
    </ul>
    <RouterLink
      :to="{ name: 'admin-dashboard' }"
      class="min-h-11 content-center font-semibold text-accent-text underline"
    >
      {{ $t('admin.shell.forbidden.back') }}
    </RouterLink>
  </section>
</template>
