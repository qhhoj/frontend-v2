<script setup lang="ts">
import { useNotificationAlerts } from '@/features/notifications/use-notification-alerts';

/**
 * The polite live region for a new notification ("Thông báo mới: ..."), once per page on every width. Mounting it also
 * starts the notification stream (`useNotificationAlerts`). It was part of the top bar, which a desktop no longer has.
 */
const alerts = useNotificationAlerts();
</script>

<template>
  <p class="sr-only print:hidden" aria-live="polite" data-testid="notification-arrived">
    {{ alerts.arrivedText.value }}
  </p>
</template>
