<script setup lang="ts">
import { ref } from 'vue';
import { BadgeCheck, Trash2 } from 'lucide-vue-next';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import { failureTextOf } from '../../ui/admin-errors';
import {
  ADMIN_BUTTON_CLASS,
  ADMIN_DANGER_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_PRIMARY_CLASS,
} from '../../ui/classes';
import ExternalJudgeNotConnected from './ExternalJudgeNotConnected.vue';
import ExternalJudgeSearch from './ExternalJudgeSearch.vue';
import ExternalLanguageTable from './ExternalLanguageTable.vue';
import { useExternalJudgeLinkQuery } from './external-judge.queries';
import { useExternalJudgeForm } from './use-external-judge-form';

/** Where a problem is judged on a remote OJ: the link, the language table, Save and Remove. */
const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const query = useExternalJudgeLinkQuery(() => props.problem.code);
const { form, remoteLanguages, mapping, duplicates, canVerify, canSave, verify, save, remove } =
  useExternalJudgeForm(
    () => props.problem.code,
    () => query.data.value,
  );
const isRemoveOpen = ref(false);
async function confirmRemove() {
  await remove.run(undefined);
  if (!remove.failure.value) isRemoveOpen.value = false;
}
</script>

<template>
  <QueryState
    :loading="query.isPending.value"
    :error="query.error.value"
    @retry="() => void query.refetch()"
  >
    <template #skeleton>
      <SkeletonBlock class="h-72 w-full rounded-panel" />
    </template>
    <ExternalJudgeNotConnected v-if="query.data.value && !query.data.value.connected" />
    <GlassCard v-else-if="query.data.value" class="flex flex-col gap-5 rounded-panel p-5">
      <form class="flex flex-col gap-5" novalidate @submit.prevent="save.run(undefined)">
        <AdminSwitch
          v-model="form.isActive"
          :label="$t('admin.externalJudge.active.label')"
          :description="$t('admin.externalJudge.active.description')"
        />
        <div class="grid gap-4 sm:grid-cols-2">
          <AdminField v-slot="{ id }" :label="$t('admin.externalJudge.oj')">
            <input :id="id" v-model="form.oj" type="text" :class="ADMIN_INPUT_CLASS" />
          </AdminField>
          <AdminField v-slot="{ id }" :label="$t('admin.externalJudge.problemId')">
            <input :id="id" v-model="form.problemId" type="text" :class="ADMIN_INPUT_CLASS" />
          </AdminField>
        </div>
        <ExternalJudgeSearch
          :code="problem.code"
          :oj="form.oj"
          :problem-id="form.problemId"
          @pick="(item) => ((form.oj = item.oj), (form.problemId = item.problemId))"
        />
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            :class="ADMIN_BUTTON_CLASS"
            :disabled="!canVerify"
            :aria-busy="verify.isPending.value || undefined"
            @click="verify.run(undefined)"
          >
            <BadgeCheck aria-hidden="true" class="size-4" />{{
              $t('admin.externalJudge.verify.button')
            }}
          </button>
          <p v-if="form.title" class="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">
            {{ $t('admin.externalJudge.verify.title', { title: form.title }) }}
          </p>
        </div>
        <AdminStatus
          v-if="verify.failure.value"
          kind="refused"
          :text="failureTextOf(verify.failure.value)"
        />
        <ExternalLanguageTable
          v-if="remoteLanguages.length > 0"
          v-model="mapping"
          :remote-languages="remoteLanguages"
          :languages="meta.languages"
          :duplicates="duplicates"
        />
        <AdminStatus
          v-if="duplicates.size > 0"
          kind="refused"
          :text="$t('admin.externalJudge.languages.duplicate')"
        />
        <AdminStatus
          v-if="save.failure.value"
          kind="refused"
          :text="failureTextOf(save.failure.value)"
        />
        <AdminStatus
          v-else-if="save.isDone.value"
          kind="done"
          :text="$t('admin.externalJudge.saved')"
        />
        <div class="flex flex-wrap gap-3">
          <button
            type="submit"
            :class="ADMIN_PRIMARY_CLASS"
            :disabled="!canSave"
            :aria-busy="save.isPending.value || undefined"
          >
            {{ $t('admin.externalJudge.save') }}
          </button>
          <button
            v-if="query.data.value.link"
            type="button"
            :class="ADMIN_DANGER_CLASS"
            @click="isRemoveOpen = true"
          >
            <Trash2 aria-hidden="true" class="size-4" />{{
              $t('admin.externalJudge.remove.button')
            }}
          </button>
        </div>
      </form>
    </GlassCard>
  </QueryState>
  <ConfirmDialog
    v-model:visible="isRemoveOpen"
    :title="$t('admin.externalJudge.remove.title')"
    :body="$t('admin.externalJudge.remove.body')"
    :confirm-label="$t('admin.externalJudge.remove.confirm')"
    tone="danger"
    :busy="remove.isPending.value"
    @confirm="confirmRemove"
  >
    <template #error>
      <AdminStatus
        v-if="remove.failure.value"
        kind="refused"
        :text="failureTextOf(remove.failure.value)"
      />
    </template>
  </ConfirmDialog>
</template>
