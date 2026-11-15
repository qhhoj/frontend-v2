<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

/**
 * The one real link of a box that stands for one destination (a card, tile or list item with the `box-link` class). Its
 * pseudo-element covers the box, so the whole box is the click target and Ctrl, Cmd and middle click open a new tab. Put the
 * title (or an `sr-only` label) in the slot. `Card to` / `href` does all of this; use this part directly for a box that is not
 * a Card (an `<li>`, a tile). Other links and buttons inside the box stay clickable on their own.
 */
defineOptions({ name: 'UiStretchedLink' });
defineProps<{ to?: RouteLocationRaw; href?: string }>();
</script>

<template>
  <RouterLink v-if="to !== undefined" :to="to" class="stretched-link"><slot /></RouterLink>
  <a v-else :href="href" class="stretched-link"><slot /></a>
</template>
