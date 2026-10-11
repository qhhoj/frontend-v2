<script setup lang="ts">
import type { CreatedUser } from '@/api/types/users-admin';
import { adminIssueText } from '../ui/admin-errors';

defineProps<{ results: CreatedUser[] }>();
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[28rem] text-left text-sm">
      <caption class="sr-only">
        {{
          $t('admin.users.create.results.caption')
        }}
      </caption>
      <thead class="text-muted">
        <tr>
          <th scope="col" class="py-2 pr-3 font-semibold">
            {{ $t('admin.users.create.results.username') }}
          </th>
          <th scope="col" class="py-2 pr-3 font-semibold">
            {{ $t('admin.users.create.results.status') }}
          </th>
          <th scope="col" class="py-2 font-semibold">
            {{ $t('admin.users.create.results.detail') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in results" :key="index" class="border-t border-line">
          <th scope="row" class="py-2 pr-3 font-mono font-normal">{{ row.username }}</th>
          <td
            class="py-2 pr-3"
            :class="row.status === 'created' ? 'text-verdict-ac' : 'text-negative'"
          >
            {{ $t(`admin.users.create.results.${row.status}`) }}
          </td>
          <td class="py-2">
            <code v-if="row.generatedPassword" class="font-mono">{{ row.generatedPassword }}</code>
            <span v-else-if="row.invited">{{ $t('admin.users.create.results.invited') }}</span>
            <span v-else-if="row.issues.length">{{
              row.issues.map(adminIssueText).join(' ')
            }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
