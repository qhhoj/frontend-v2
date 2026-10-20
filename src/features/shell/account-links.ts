import { Settings, Shield, UserRound } from 'lucide-vue-next';
import type { Component } from 'vue';
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { canEnterAdmin } from '@/features/admin/admin-access';
import { useSessionStore } from '@/stores/session.store';

export interface AccountLink {
  labelKey: string;
  icon: Component;
  to: RouteLocationRaw;
}

/**
 * The account's pages, for the desktop user menu and the phone menu sheet alike (sign-out is each one's own button):
 * the viewer's public profile first, then settings, then administration for staff.
 */
export function useAccountLinks() {
  const session = useSessionStore();
  return computed<AccountLink[]>(() => [
    ...(session.user
      ? [
          {
            labelKey: 'account.profile',
            icon: UserRound,
            to: { name: 'user', params: { username: session.user.username } },
          },
        ]
      : []),
    { labelKey: 'account.settings', icon: Settings, to: { name: 'settings' } },
    ...(canEnterAdmin(session.user)
      ? [{ labelKey: 'account.admin', icon: Shield, to: '/admin' }]
      : []),
  ]);
}
