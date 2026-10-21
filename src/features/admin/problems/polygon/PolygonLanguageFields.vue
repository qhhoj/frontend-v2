<script setup lang="ts">
import { computed } from 'vue';
import FormField from '@/components/ui/FormField.vue';
import SelectField from '@/components/ui/SelectField.vue';
import type { PolygonProblem } from '@/api/types/polygon';
import {
  SITE_LANGUAGE_CHOICES,
  settleLanguageChoice,
  tutorialCandidates,
} from './polygon-languages';
import type { LanguageChoice, SiteLanguageChoice } from './polygon-languages';

/**
 * The statement languages of the package (configure option A): the main statement, what each other statement becomes
 * (a translation or skipped) and, when two or more count, which tutorial is the editorial. Every change is settled, so the
 * choice always fits the statements; an empty main or tutorial (a refused save in the link drawer) shows "Chọn một đề"
 * until picked. `errors` holds `main`, `tutorial`, `others` and `other:<language>`.
 */
const props = defineProps<{
  statements: PolygonProblem['statements'];
  errors: Record<string, string>;
}>();
const choice = defineModel<LanguageChoice>({ required: true });
const languages = computed(() => props.statements.map(({ language }) => language));
const tutorials = computed(() => tutorialCandidates(props.statements, choice.value));
const others = computed(() => Object.keys(choice.value.others));

const settle = (next: LanguageChoice) =>
  (choice.value = settleLanguageChoice(props.statements, next));
const setMain = (main: string | number | undefined) =>
  settle({ ...choice.value, main: String(main) });
const setOther = (language: string, site: string | number | undefined) =>
  settle({
    ...choice.value,
    others: { ...choice.value.others, [language]: site as SiteLanguageChoice },
  });
const setTutorial = (tutorial: string | number | undefined) =>
  settle({ ...choice.value, tutorial: String(tutorial) });
const statementLabel = ({ language, title }: PolygonProblem['statements'][number]) =>
  title ? `${language} · ${title}` : language;
</script>

<template>
  <section
    v-if="statements.length > 0"
    class="flex flex-col gap-4 border-t border-line pt-4"
    data-testid="polygon-languages"
  >
    <h3 class="font-display font-semibold">
      {{ $t('admin.polygonLink.configure.languages.title') }}
    </h3>
    <p v-if="statements.length === 1" class="text-sm text-muted">
      {{ $t('admin.polygonLink.configure.languages.single', { language: languages[0] }) }}
    </p>
    <template v-else>
      <FormField
        scale="admin"
        :label="$t('admin.polygonLink.configure.languages.main')"
        :hint="
          $t('admin.polygonLink.configure.languages.mainHint', {
            count: languages.length,
            languages: languages.join(', '),
          })
        "
        :error="errors.main"
      >
        <SelectField
          :model-value="choice.main"
          :placeholder="choice.main ? undefined : $t('admin.polygonLink.configure.languages.pick')"
          @update:model-value="setMain"
        >
          <option
            v-for="statement in statements"
            :key="statement.language"
            :value="statement.language"
          >
            {{ statementLabel(statement) }}
          </option>
        </SelectField>
      </FormField>

      <fieldset class="flex flex-col gap-2">
        <legend class="mb-1.5 text-sm font-semibold">
          {{ $t('admin.polygonLink.configure.languages.others') }}
        </legend>
        <p v-if="errors.others" class="text-sm text-negative">{{ errors.others }}</p>
        <div class="@container grid gap-4 @md:grid-cols-2">
          <FormField
            v-for="language in others"
            :key="language"
            scale="admin"
            :label="language"
            :error="errors[`other:${language}`]"
          >
            <SelectField
              :model-value="choice.others[language]"
              @update:model-value="setOther(language, $event)"
            >
              <option v-for="site in SITE_LANGUAGE_CHOICES" :key="site" :value="site">
                {{ $t(`admin.polygonLink.configure.languages.site.${site}`) }}
              </option>
            </SelectField>
          </FormField>
        </div>
      </fieldset>

      <FormField
        v-if="tutorials.length > 1"
        scale="admin"
        :label="$t('admin.polygonLink.configure.languages.tutorial')"
        :hint="
          $t('admin.polygonLink.configure.languages.tutorialHint', { count: tutorials.length })
        "
        :error="errors.tutorial"
      >
        <SelectField
          :model-value="choice.tutorial"
          :placeholder="
            choice.tutorial ? undefined : $t('admin.polygonLink.configure.languages.pick')
          "
          @update:model-value="setTutorial"
        >
          <option v-for="language in tutorials" :key="language" :value="language">
            {{ language }}
          </option>
        </SelectField>
      </FormField>
      <p v-else class="text-sm text-muted" data-testid="polygon-tutorial-line">
        {{
          tutorials.length === 1
            ? $t('admin.polygonLink.configure.languages.tutorialOne', { language: tutorials[0] })
            : $t('admin.polygonLink.configure.languages.tutorialNone')
        }}
      </p>
    </template>
  </section>
</template>
