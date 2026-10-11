<script setup lang="ts">
import { Lock } from 'lucide-vue-next';
import type { CreationOwner } from '../../creation/creation-owners';
import AdminField from '../../ui/AdminField.vue';
import OrganizationChips from '../../ui/OrganizationChips.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import { INPUT } from '../../ui/controls';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import TagChips from './TagChips.vue';
import { numberOrNaN, textOf } from './input-values';
import { usePermissionLocks } from './permission-locks';

/** Who sees the contest and its scoreboard: visibility, privacy, entry codes and bans. */
const form = defineModel<ContestForm>({ required: true });
defineProps<{
  errors: FieldErrors;
  hasCodes: { access: boolean; ranking: boolean };
  /** Set on create in an organization: members-only access is fixed, so its controls give way to one line. */
  owner?: CreationOwner | null;
}>();
const { lockedBy, hintOf } = usePermissionLocks();
const SCOREBOARD_OPTIONS = ['V', 'H', 'C', 'P'] as const;
const PRIVATE = 'judge.create_private_contest';
const ACCESS_CODE = 'judge.contest_access_code';
</script>

<template>
  <AdminFormSection
    id="contest-section-access"
    :title="$t('admin.contests.general.sections.access')"
    :description="$t('admin.contests.general.sectionLeads.access')"
  >
    <AdminCheckbox
      v-model="form.isVisible"
      input-id="contest-isVisible"
      :label="$t('admin.contests.general.fields.isVisible')"
      :description="$t('admin.contests.general.fields.isVisibleHint')"
      :locked-by="lockedBy('judge.change_contest_visibility')"
    />
    <AdminCheckbox
      v-model="form.isPrivate"
      input-id="contest-isPrivate"
      :label="$t('admin.contests.general.fields.isPrivate')"
      :description="$t('admin.contests.general.fields.isPrivateHint')"
      :locked-by="lockedBy(PRIVATE)"
    />
    <UsernameChips
      v-if="form.isPrivate"
      v-model="form.privateContestants"
      class="lg:col-span-2"
      :label="$t('admin.contests.general.fields.privateContestants')"
      :locked-by="lockedBy(PRIVATE)"
    />
    <p
      v-if="owner"
      class="m-0 flex items-center gap-2 text-sm lg:col-span-2"
      data-testid="contest-owner-access"
    >
      <Lock class="size-4 shrink-0 text-muted" aria-hidden="true" />
      {{ $t('admin.creation.contest.ownerAccess', { name: owner.name }) }}
    </p>
    <AdminCheckbox
      v-else
      v-model="form.isOrganizationPrivate"
      class="lg:col-span-2"
      input-id="contest-isOrganizationPrivate"
      :label="$t('admin.contests.general.fields.isOrganizationPrivate')"
      :description="$t('admin.contests.general.fields.isOrganizationPrivateHint')"
      :locked-by="lockedBy(PRIVATE)"
    />
    <OrganizationChips
      v-if="!owner && form.isOrganizationPrivate"
      v-model="form.organizations"
      class="lg:col-span-2"
      :label="$t('admin.contests.general.fields.organizations')"
      :locked-by="lockedBy(PRIVATE)"
    />

    <div class="flex flex-col gap-2">
      <AdminField
        input-id="contest-accessCode"
        :label="$t('admin.contests.general.fields.accessCode')"
        :hint="
          hintOf(
            ACCESS_CODE,
            hasCodes.access
              ? $t('admin.contests.general.hints.accessCodeSet')
              : $t('admin.contests.general.hints.accessCodeNone'),
          )
        "
      >
        <template #default="{ id, describedBy }">
          <input
            :id="id"
            v-model="form.accessCode"
            type="password"
            autocomplete="new-password"
            :disabled="Boolean(lockedBy(ACCESS_CODE)) || form.removeAccessCode"
            :class="INPUT"
            :aria-describedby="describedBy"
          />
        </template>
      </AdminField>
      <AdminCheckbox
        v-if="hasCodes.access && !lockedBy(ACCESS_CODE)"
        v-model="form.removeAccessCode"
        input-id="contest-removeAccessCode"
        :label="$t('admin.contests.general.fields.removeAccessCode')"
      />
    </div>
    <div class="flex flex-col gap-2">
      <AdminField
        input-id="contest-rankingAccessCode"
        :label="$t('admin.contests.general.fields.rankingAccessCode')"
        :hint="
          hasCodes.ranking
            ? $t('admin.contests.general.hints.rankingCodeSet')
            : $t('admin.contests.general.hints.accessCodeNone')
        "
      >
        <template #default="{ id, describedBy }">
          <input
            :id="id"
            v-model="form.rankingAccessCode"
            type="password"
            autocomplete="new-password"
            :disabled="form.removeRankingAccessCode"
            :class="INPUT"
            :aria-describedby="describedBy"
          />
        </template>
      </AdminField>
      <AdminCheckbox
        v-if="hasCodes.ranking"
        v-model="form.removeRankingAccessCode"
        input-id="contest-removeRankingAccessCode"
        :label="$t('admin.contests.general.fields.removeRankingAccessCode')"
      />
    </div>

    <AdminField
      input-id="contest-scoreboardVisibility"
      :label="$t('admin.contests.general.fields.scoreboardVisibility')"
    >
      <template #default="{ id, describedBy }">
        <select
          :id="id"
          v-model="form.scoreboardVisibility"
          :class="INPUT"
          :aria-describedby="describedBy"
        >
          <option v-for="option in SCOREBOARD_OPTIONS" :key="option" :value="option">
            {{ $t(`admin.contests.general.scoreboardOptions.${option}`) }}
          </option>
        </select>
      </template>
    </AdminField>
    <AdminField
      input-id="contest-scoreboardCacheTimeout"
      :label="$t('admin.contests.general.fields.scoreboardCacheTimeout')"
      :hint="$t('admin.contests.general.hints.scoreboardCacheTimeout')"
      :error="errors.scoreboardCacheTimeout"
    >
      <template #default="{ id, describedBy, invalid }">
        <input
          :id="id"
          :value="form.scoreboardCacheTimeout"
          type="number"
          min="0"
          max="86400"
          :class="[INPUT, 'font-mono tabular-nums']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          @input="form.scoreboardCacheTimeout = numberOrNaN(textOf($event))"
        />
      </template>
    </AdminField>
    <UsernameChips
      v-model="form.viewContestScoreboard"
      class="lg:col-span-2"
      :label="$t('admin.contests.general.fields.viewContestScoreboard')"
    />
    <UsernameChips
      v-model="form.bannedUsers"
      :label="$t('admin.contests.general.fields.bannedUsers')"
    />
    <TagChips
      v-model="form.bannedJudges"
      :label="$t('admin.contests.general.fields.bannedJudges')"
    />
  </AdminFormSection>
</template>
