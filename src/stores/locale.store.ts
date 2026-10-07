import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { DEFAULT_LOCALE, i18n, isLocale } from '@/i18n';
import type { Locale } from '@/i18n';
import { readStorage, writeStorage } from '@/lib/storage';

const STORAGE_KEY = 'qhhoj.locale';

export const useLocaleStore = defineStore('locale', () => {
  const stored = readStorage(STORAGE_KEY);
  const locale = ref<Locale>(isLocale(stored) ? stored : DEFAULT_LOCALE);
  watch(
    locale,
    (value) => {
      i18n.global.locale.value = value;
      document.documentElement.lang = value;
      writeStorage(STORAGE_KEY, value);
    },
    { immediate: true },
  );
  const toggle = () => (locale.value = locale.value === 'vi' ? 'en' : 'vi');
  return { locale, toggle };
});
