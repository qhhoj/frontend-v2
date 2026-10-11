import type { Component } from 'vue';
import ExternalJudgeConnectionCheck from './ExternalJudgeConnectionCheck.vue';
import PolygonConnectionCheck from './PolygonConnectionCheck.vue';

/** A block that needs more than its fields gets a component here; it renders under the fields and takes `settings`. */
export const SETTING_BLOCK_EXTRAS: Partial<Record<string, Component>> = {
  polygon: PolygonConnectionCheck,
  externalJudge: ExternalJudgeConnectionCheck,
};
