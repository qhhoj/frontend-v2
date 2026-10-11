import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { UserPage } from '@/api/types/users';
import { useSessionStore } from '@/stores/session.store';
import { usePermissions } from '@/stores/use-permissions';
import { canImpersonate, userLockOf } from './users-list';
import type { UserSection } from './users-list';

/**
 * What the viewer may do in the drawer of `page`. Nobody edits their own account here, and only a superuser edits a superuser
 * (`lock`). Editing needs `judge.change_profile`; credentials `auth.change_user`; a ban `judge.ban_user` with the staff facts.
 */
export function useUserDrawerAccess(target: MaybeRefOrGetter<UserPage | undefined>) {
  const page = computed(() => toValue(target));
  const { can, isSuperuser } = usePermissions();
  const session = useSessionStore();
  const lock = computed(() =>
    page.value
      ? userLockOf(
          { id: page.value.id, isSuperuser: page.value.staff?.isSuperuser === true },
          { id: session.user?.id, isSuperuser: isSuperuser.value },
        )
      : null,
  );
  const isOpenable = computed(() => page.value !== undefined && lock.value === null);
  const canEdit = computed(() => isOpenable.value && can('judge.change_profile'));
  const canCredentials = computed(() => can('auth.change_user'));
  const canModerate = computed(
    () => isOpenable.value && can('judge.ban_user') && Boolean(page.value?.staff),
  );
  const canImpersonateUser = computed(
    () => isOpenable.value && canImpersonate(isSuperuser.value, page.value!),
  );

  /** The tabs shown, in order; 2FA reset alone (`judge.ban_user`) still opens Bảo mật while the account has it. */
  function sectionsOf(hadTwoFactor: boolean): UserSection[] {
    const sections: UserSection[] = [];
    if (canEdit.value) sections.push('profile', 'access');
    if (canEdit.value && (canCredentials.value || (can('judge.ban_user') && hadTwoFactor)))
      sections.push('security');
    if ((canEdit.value && canCredentials.value) || canModerate.value || canImpersonateUser.value)
      sections.push('account');
    return sections;
  }

  return { lock, canEdit, canCredentials, canModerate, canImpersonateUser, sectionsOf };
}
