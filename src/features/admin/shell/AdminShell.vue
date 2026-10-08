<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePermissions } from '@/stores/use-permissions';
import AdminForbidden from './AdminForbidden.vue';
import AdminNav from './AdminNav.vue';
import AdminTopBar from './AdminTopBar.vue';

const route = useRoute();
const { canAny } = usePermissions();
/** Checked before the page mounts, so a forbidden screen never asks for its data. */
const isAllowed = computed(() => canAny(route.meta.permission ?? null));
</script>

<template>
  <AdminTopBar />
  <div class="min-[900px]:grid min-[900px]:grid-cols-[248px_minmax(0,1fr)]">
    <aside class="hidden border-r border-line px-3 py-5 min-[900px]:block">
      <AdminNav />
    </aside>
    <details class="border-b border-line px-4 py-2 min-[900px]:hidden">
      <summary class="min-h-11 content-center font-semibold">
        {{ $t('admin.shell.navToggle') }}
      </summary>
      <AdminNav data-testid="admin-nav-phone" class="pt-2" />
    </details>
    <main id="main" tabindex="-1" class="relative min-w-0 focus-visible:outline-none">
      <slot v-if="isAllowed" />
      <AdminForbidden v-else />
    </main>
  </div>
</template>
