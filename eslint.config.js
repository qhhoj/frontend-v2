import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import { readBaselines } from './scripts/raw-elements.mjs';
import { eslintImportBlocks } from './scripts/wrapper-imports.mjs';

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
  // Old wrappers and direct PrimeVue parts: a file may keep the imports its raw-element baseline counts (docs/wrapper-migration.md).
  ...eslintImportBlocks(readBaselines().merged),
  skipFormatting,
);
