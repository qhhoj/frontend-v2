import { showToast } from '@/components/ui/toasts';
import { translate } from '@/i18n';

/** Tells a visitor whose Clay or Glass choices moved to palette A where to change them (once: `migrateStoredLook`). */
export const announceMigratedLook = () =>
  showToast({ text: translate('appearance.migrated'), tone: 'info' });
