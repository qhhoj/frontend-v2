<script setup lang="ts">
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminField from '../../ui/AdminField.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import OrganizationChips from '../../ui/OrganizationChips.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import TagChips from './TagChips.vue';
import { numberOrNaN, textOf } from './input-values';
import { usePermissionLocks } from './permission-locks';

const form = defineModel<ContestForm>({ required: true });
defineProps<{ errors: FieldErrors; hasCodes: { access: boolean; ranking: boolean } }>();
const { lockedBy, hintOf } = usePermissionLocks();
</script>

<template>
  <SettingsCard :title="$t('admin.contests.general.sections.access')">
    <div class="grid gap-5 sm:grid-cols-2">
      <AdminField
        input-id="contest-scoreboardVisibility"
        :label="$t('admin.contests.general.fields.scoreboardVisibility')"
        :hint="$t('admin.contests.general.hints.scoreboardVisibility')"
      >
        <template #default="{ id, describedBy }">
          <select
            :id="id"
            v-model="form.scoreboardVisibility"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
          >
            <option value="V">{{ $t('admin.contests.general.scoreboardOptions.V') }}</option>
            <option value="H">{{ $t('admin.contests.general.scoreboardOptions.H') }}</option>
            <option value="C">{{ $t('admin.contests.general.scoreboardOptions.C') }}</option>
            <option value="P">{{ $t('admin.contests.general.scoreboardOptions.P') }}</option>
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
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            @input="form.scoreboardCacheTimeout = numberOrNaN(textOf($event))"
          />
        </template>
      </AdminField>
    </div>
    <UsernameChips
      v-model="form.viewContestScoreboard"
      :label="$t('admin.contests.general.fields.viewContestScoreboard')"
    />

    <AdminField
      input-id="contest-accessCode"
      :label="$t('admin.contests.general.fields.accessCode')"
      :hint="
        hintOf(
          'judge.contest_access_code',
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
          :disabled="Boolean(lockedBy('judge.contest_access_code'))"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
        />
      </template>
    </AdminField>
    <label v-if="hasCodes.access" class="flex min-h-11 items-center gap-2">
      <input
        id="contest-removeAccessCode"
        v-model="form.removeAccessCode"
        type="checkbox"
        :disabled="Boolean(lockedBy('judge.contest_access_code'))"
      />
      {{ $t('admin.contests.general.fields.removeAccessCode') }}
    </label>

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
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
        />
      </template>
    </AdminField>
    <label v-if="hasCodes.ranking" class="flex min-h-11 items-center gap-2">
      <input
        id="contest-removeRankingAccessCode"
        v-model="form.removeRankingAccessCode"
        type="checkbox"
      />
      {{ $t('admin.contests.general.fields.removeRankingAccessCode') }}
    </label>

    <AdminSwitch
      v-model="form.isVisible"
      :label="$t('admin.contests.general.fields.isVisible')"
      :locked-by="lockedBy('judge.change_contest_visibility')"
    />
    <AdminSwitch
      v-model="form.isPrivate"
      :label="$t('admin.contests.general.fields.isPrivate')"
      :description="$t('admin.contests.general.fields.isPrivateHint')"
      :locked-by="lockedBy('judge.create_private_contest')"
    />
    <UsernameChips
      v-model="form.privateContestants"
      :label="$t('admin.contests.general.fields.privateContestants')"
      :locked-by="lockedBy('judge.create_private_contest')"
    />
    <AdminSwitch
      v-model="form.isOrganizationPrivate"
      :label="$t('admin.contests.general.fields.isOrganizationPrivate')"
      :locked-by="lockedBy('judge.create_private_contest')"
    />
    <OrganizationChips
      v-model="form.organizations"
      :label="$t('admin.contests.general.fields.organizations')"
      :locked-by="lockedBy('judge.create_private_contest')"
    />
    <UsernameChips
      v-model="form.bannedUsers"
      :label="$t('admin.contests.general.fields.bannedUsers')"
    />
    <TagChips
      v-model="form.bannedJudges"
      :label="$t('admin.contests.general.fields.bannedJudges')"
    />
  </SettingsCard>
</template>
