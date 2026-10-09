<script setup lang="ts">
import type { JudgeRuntime } from '@/api/types/judges-admin';

defineProps<{ runtimes: JudgeRuntime[] }>();
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-max text-left text-sm">
      <caption class="pb-2 text-left text-muted">
        {{
          $t('admin.judges.runtimes.caption')
        }}
      </caption>
      <thead>
        <tr class="border-b border-line text-muted">
          <th scope="col" class="py-2 pr-4 font-semibold">
            {{ $t('admin.judges.runtimes.language') }}
          </th>
          <th scope="col" class="py-2 pr-4 font-semibold">
            {{ $t('admin.judges.runtimes.compiler') }}
          </th>
          <th scope="col" class="py-2 pr-4 font-semibold">
            {{ $t('admin.judges.runtimes.version') }}
          </th>
          <th scope="col" class="py-2 pr-4 font-semibold">
            {{ $t('admin.judges.runtimes.priority') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="runtime in runtimes" :key="runtime.language" class="border-b border-line">
          <td class="py-2 pr-4 font-mono">{{ runtime.language }}</td>
          <td class="py-2 pr-4">{{ runtime.name }}</td>
          <td class="py-2 pr-4 font-mono">{{ runtime.version }}</td>
          <td class="py-2 pr-4">{{ runtime.priority }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
