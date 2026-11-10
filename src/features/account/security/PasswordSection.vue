<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import Notice from '@/components/ui/Notice.vue';
import { nextTick, ref } from 'vue';
import ChangePasswordForm from '@/features/auth/ChangePasswordForm.vue';
import { useSessionStore } from '@/stores/session.store';

/** The change is accepted before the reload, so "changed" shows at once; a failed reload swaps it for the retry hint. A finished change remounts the form clean (`formKey`). */
const session = useSessionStore();
const changed = ref(false);
const reloadFailed = ref(false);
const formKey = ref(0);
const reloadSession = () => session.refresh();

const card = ref<{ $el: HTMLElement } | null>(null);
/** The card's `h2` takes the focus, so a screen reader reads the heading, not the whole card. */
function focusHeading() {
  const heading = card.value?.$el.querySelector<HTMLElement>('h2');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus();
}

/** The remounted form takes the focus with it, so the focus goes to the card heading instead. */
function finished() {
  reloadFailed.value = false;
  formKey.value += 1;
  void nextTick(() => focusHeading());
}
</script>

<template>
  <Card
    ref="card"
    padding="lg"
    class="flex flex-col gap-5 [&>header]:mb-0"
    :title="$t('settings.password.title')"
    :lead="$t('settings.password.lead')"
  >
    <Notice v-if="reloadFailed" tone="success">{{
      $t('auth.changePassword.changedNotLoaded')
    }}</Notice>
    <Notice v-else-if="changed" tone="success">{{ $t('settings.password.changed') }}</Notice>
    <ChangePasswordForm
      :key="formKey"
      :after-change="reloadSession"
      @accepted="changed = true"
      @reload-failed="reloadFailed = true"
      @changed="finished"
    />
  </Card>
</template>
