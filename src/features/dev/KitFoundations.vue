<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import { CUE_TEXT } from '@/components/ui/cue-tones';
import PageSection from '@/components/ui/PageSection.vue';
import { BASE_COLOURS, CUES, RADII, SPACES, TYPE_ROLES, WIDTHS } from './kit-fixtures';

/** Foundations of the kit gallery: type roles, spacing, page widths, radii, base colours and the cue map. */
defineOptions({ name: 'KitFoundations' });
const SWATCH = 'h-8 w-full rounded-cell border border-line-strong';
</script>

<template>
  <div class="flex flex-col gap-(--space-section)">
    <PageSection title="Chữ">
      <Card padding="sm" class="flex flex-col gap-2">
        <div v-for="role in TYPE_ROLES" :key="role.token" class="flex items-baseline gap-4">
          <p :class="role.token" class="min-w-0 flex-1 truncate font-semibold">Tiêu đề mẫu 2.600</p>
          <p class="shrink-0 text-meta text-muted">
            <code class="font-mono">{{ role.token }}</code> · {{ role.size }} px · {{ role.use }}
          </p>
        </div>
        <p class="font-mono text-sm">Mono (mã, con số): 1:30 · 16/11/2026 · 2.600</p>
      </Card>
    </PageSection>

    <PageSection title="Khoảng cách">
      <Card padding="sm" class="flex flex-col gap-2">
        <div v-for="space in SPACES" :key="space.token" class="flex items-center gap-4">
          <div class="w-64 shrink-0">
            <div :class="space.class" class="w-full bg-accent-soft" />
          </div>
          <p class="text-meta text-muted">
            <code class="font-mono">{{ space.token }}</code> · {{ space.use }}
          </p>
        </div>
      </Card>
    </PageSection>

    <PageSection title="Độ rộng trang và bo góc">
      <Card padding="sm" class="flex flex-col gap-3">
        <p v-for="width in WIDTHS" :key="width.token" class="text-meta text-muted">
          <code class="font-mono">{{ width.token }}</code> · {{ width.rem }} · {{ width.use }}
        </p>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="radius in RADII"
            :key="radius.name"
            :class="radius.class"
            class="flex h-12 w-28 items-center justify-center border border-line-strong bg-surface-strong text-caption"
          >
            {{ radius.name }}
          </div>
        </div>
      </Card>
    </PageSection>

    <PageSection title="Màu nền chung">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div v-for="colour in BASE_COLOURS" :key="colour.name" class="flex flex-col gap-1">
          <div :class="[SWATCH, colour.class]" />
          <code class="font-mono text-caption text-muted">{{ colour.name }}</code>
        </div>
      </div>
    </PageSection>

    <PageSection title="Bản đồ tín hiệu màu" :count="CUES.length">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card v-for="cue in CUES" :key="cue.tone" padding="sm" class="flex flex-col gap-2">
          <div class="flex gap-1">
            <div :class="[SWATCH, cue.swatch.text]" />
            <div :class="[SWATCH, cue.swatch.tint]" />
            <div :class="[SWATCH, 'border-2', cue.swatch.border]" />
          </div>
          <p :class="CUE_TEXT[cue.tone]" class="text-sm font-semibold">{{ cue.label }}</p>
          <p class="text-meta text-muted">{{ cue.meaning }}</p>
          <code class="font-mono text-caption text-muted">{{ cue.token }}, -bg, -border</code>
        </Card>
      </div>
    </PageSection>
  </div>
</template>
