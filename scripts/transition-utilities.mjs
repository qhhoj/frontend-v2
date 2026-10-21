// Motion is colour, border and opacity only (docs/design-language.md, Motion). Tailwind's bare `transition`, `transition-all` and `transition-transform`
// also animate transform, filter and layout properties, so a hover or focus change slides or blurs. Use `transition-colors` (or `transition-opacity`).
// Real motion, a thing that moves on purpose, keeps `transition-transform`: list it in ALLOWED with the reason.
import { classTokens, utilityOf } from './class-tokens.mjs';

const BARE = /^transition(?:-all|-transform)?$/;

const CHEVRON = 'the disclosure chevron turns with the open state';

/** Known exceptions, by file (path under src/), class and the reason it is real motion. */
export const ALLOWED = {
  'components/ui/Switch.vue': {
    'transition-transform': 'the thumb slides between the ends of the track',
  },
  'features/contests/replay/ReplayTable.vue': {
    'transition-transform':
      'rows that change rank slide to their place (FLIP); off under reduced motion',
  },
  'components/ui/DataTable.vue': { 'transition-transform': CHEVRON },
  'components/ui/Notice.vue': { 'transition-transform': CHEVRON },
  'features/admin/problems/ProblemSetupChecklist.vue': { 'transition-transform': CHEVRON },
  'features/admin/problems/import/ImportOptionsForm.vue': { 'transition-transform': CHEVRON },
  'features/admin/problems/polygon/PolygonLinkPanel.vue': { 'transition-transform': CHEVRON },
  'features/admin/problems/polygon/PolygonLinkStep.vue': { 'transition-transform': CHEVRON },
  'features/admin/problems/polygon/PolygonProgressStep.vue': { 'transition-transform': CHEVRON },
  'features/admin/problems/polygon/PolygonWizardPage.vue': { 'transition-transform': CHEVRON },
  'features/admin/shell/AdminNav.vue': { 'transition-transform': CHEVRON },
  'features/admin/tickets/TicketHandlingSection.vue': { 'transition-transform': CHEVRON },
  'features/blog/editor/PostEditorPage.vue': { 'transition-transform': CHEVRON },
  'features/organizations/manage/OrganizationInfoForm.vue': { 'transition-transform': CHEVRON },
};

/** The bare transition classes in the string literals of one source line, without their variants; comment lines are ignored. */
export const bareTransitions = (line) =>
  classTokens(line)
    .map(utilityOf)
    .filter((name) => BARE.test(name));
