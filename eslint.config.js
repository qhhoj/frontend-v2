import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import { WRAPPER_IMPORT_PATTERNS, WRAPPER_IMPORTERS } from './scripts/wrapper-imports.mjs';

export default defineConfigWithVueTs(
  {
    ignores: ['dist/', 'coverage/', 'docs/', 'src/api/generated/', '.superpowers/'],
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommendedTypeChecked,
  {
    rules: {
      'id-length': ['error', { min: 2, properties: 'never' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'vue/multi-word-component-names': ['error', { ignores: ['App'] }],
    },
  },
  {
    files: ['src/**/*.{ts,vue}'],
    ignores: WRAPPER_IMPORTERS,
    rules: { 'no-restricted-imports': ['error', { patterns: WRAPPER_IMPORT_PATTERNS }] },
  },
  skipFormatting,
);
