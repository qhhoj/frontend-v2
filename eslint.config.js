import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';

export default defineConfigWithVueTs(
  { ignores: ['dist/', 'coverage/', 'playwright-report/', 'test-results/', 'docs/', '.superpowers/'] },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommendedTypeChecked,
  {
    rules: {
      'id-length': ['error', { min: 2, properties: 'never' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'vue/multi-word-component-names': ['error', { ignores: ['App'] }],
    },
  },
  skipFormatting,
);
