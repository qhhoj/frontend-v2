import { useI18n } from 'vue-i18n';

/** A codename's label in the UI language (`admin.permissions.<codename>`), else the backend's English label, else the codename. */
export function usePermissionLabel() {
  const i18n = useI18n();
  return (codename: string, fallback = codename) => {
    const key = `admin.permissions.${codename}`;
    return i18n.te(key) ? i18n.t(key) : fallback;
  };
}
