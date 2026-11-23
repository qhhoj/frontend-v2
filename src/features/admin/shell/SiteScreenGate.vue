<script setup lang="ts">
import AdminForbidden from './AdminForbidden.vue';
import { useScreenAccess } from './use-screen-access';

/**
 * Around a teacher's screen in the site shell (`AdminScreen.shell: 'site'`): the page column every site page has, and
 * the same permission check the admin shell runs, before the page mounts.
 */
const isAllowed = useScreenAccess();
</script>

<template>
  <div class="page-column" data-testid="site-screen">
    <slot v-if="isAllowed" />
    <AdminForbidden v-else />
  </div>
</template>
