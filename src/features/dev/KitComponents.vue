<script setup lang="ts">
import { ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import ContestTimeline from '@/components/ui/ContestTimeline.vue';
import Chip from '@/components/ui/Chip.vue';
import { CUE_TONES } from '@/components/ui/cue-tones';
import DataTable from '@/components/ui/DataTable.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import Gauge from '@/components/ui/Gauge.vue';
import Lamp from '@/components/ui/Lamp.vue';
import Menu from '@/components/ui/Menu.vue';
import Notice from '@/components/ui/Notice.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import PageSection from '@/components/ui/PageSection.vue';
import ProgressBar from '@/components/ui/ProgressBar.vue';
import Readout from '@/components/ui/Readout.vue';
import ReadoutCell from '@/components/ui/ReadoutCell.vue';
import RowMenu from '@/components/ui/RowMenu.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import StatGrid from '@/components/ui/StatGrid.vue';
import StatusDot from '@/components/ui/StatusDot.vue';
import StatusMark from '@/components/ui/StatusMark.vue';
import TestSquares from '@/components/ui/TestSquares.vue';
import Toolbar from '@/components/ui/Toolbar.vue';
import ToastItem from '@/components/ui/ToastItem.vue';
import VerdictChip from '@/components/ui/VerdictChip.vue';
import EmptyState from '@/components/EmptyState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { verdictOfCode } from '@/lib/verdicts';
import { CUES, TABLE_ROWS } from './kit-fixtures';
import {
  DISPLAY_SAMPLES,
  JUDGED_TESTS,
  JUDGING_TESTS,
  LAMP_TONES,
  TIMELINE,
  VERDICT_SAMPLES,
} from './kit-plate-fixtures';
import type { FixtureRow } from './kit-fixtures';

/** Components of the kit gallery: each kit part in its variants, with fixtures inline (no backend). */
defineOptions({ name: 'KitComponents' });

const search = ref('');
const sort = ref<string | undefined>();
const menuItems = [
  { label: 'Sửa', run: () => undefined },
  { label: 'Sao chép', run: () => undefined },
  { label: 'Xóa', run: () => undefined, danger: true },
];
const columns = [
  { key: 'code', label: 'Mã', priority: 'primary' as const, mono: true },
  { key: 'name', label: 'Tên bài', priority: 'secondary' as const },
  { key: 'points', label: 'Điểm', align: 'end' as const, sort: { desc: '-points' } },
  { key: 'length', label: 'Thời lượng', align: 'end' as const },
  { key: 'date', label: 'Ngày', align: 'end' as const },
];
const ledgerColumns = columns.map((column) => ({ ...column, grow: column.key === 'name' }));
const rowKey = (row: FixtureRow) => row.code;
</script>

<template>
  <div class="flex flex-col gap-(--space-section)">
    <PageSection title="Chip và chấm trạng thái">
      <Card padding="sm" class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <Chip v-for="cue in CUES" :key="cue.tone" :tone="cue.tone">{{ cue.label }}</Chip>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Chip tone="neutral">neutral</Chip>
          <Chip tone="accent">accent</Chip>
          <Chip tone="solid">solid</Chip>
          <Chip tone="success">success</Chip>
          <Chip tone="danger">danger</Chip>
          <Chip tone="warning">warning</Chip>
          <Chip tone="info">info</Chip>
          <Chip tone="tag-1">tag-1</Chip>
          <Chip tone="tag-5">tag-5</Chip>
          <Chip tone="live" size="md" dot>Cỡ md</Chip>
          <Chip pressed>Đang chọn</Chip>
          <Chip removable remove-label="Bỏ lọc">Lọc</Chip>
        </div>
        <div class="flex flex-wrap items-center gap-4 text-sm">
          <span v-for="cue in CUES" :key="cue.tone" class="inline-flex items-center gap-1.5">
            <StatusDot :tone="cue.tone" />{{ cue.label }}
          </span>
          <span class="inline-flex items-center gap-1.5"
            ><StatusMark tone="accent" label="Chưa lưu" />Chưa lưu</span
          >
          <span class="inline-flex items-center gap-1.5"
            ><StatusMark tone="danger" label="Cần sửa" />Cần sửa</span
          >
          <VerdictChip :verdict="verdictOfCode('AC')" named />
          <VerdictChip :verdict="verdictOfCode('WA')" named />
        </div>
        <p class="text-meta text-muted">
          {{ CUE_TONES.length }} tín hiệu. Chấm bài dùng VerdictChip (verdict-*), còn lại dùng tín
          hiệu.
        </p>
      </Card>
    </PageSection>

    <PageSection title="Chữ tiêu đề (Archivo)">
      <Card padding="sm" class="flex flex-col gap-2">
        <p class="page-title">{{ DISPLAY_SAMPLES[0] }}</p>
        <p v-for="sample in DISPLAY_SAMPLES.slice(1)" :key="sample" class="section-title">
          {{ sample }}
        </p>
      </Card>
    </PageSection>

    <PageSection title="Đèn và mã kết quả">
      <Card padding="sm" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span
            v-for="lamp in LAMP_TONES"
            :key="lamp.tone"
            class="inline-flex items-center gap-2 text-meta text-secondary"
            ><Lamp :tone="lamp.tone" />{{ lamp.label }}</span
          >
        </div>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
          <VerdictChip v-for="code in VERDICT_SAMPLES" :key="code" :verdict="verdictOfCode(code)" />
        </div>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
          <VerdictChip :verdict="verdictOfCode('AC')" named />
          <VerdictChip :verdict="verdictOfCode('TLE')" named />
          <VerdictChip :verdict="verdictOfCode('G')" named />
        </div>
        <TestSquares :tests="JUDGED_TESTS" label="Kết quả từng test (trên trang)" />
        <Gauge
          :value="0.42"
          :limit="1"
          label="Thời gian chạy"
          value-text="0,42 s trên 1,0 s"
          :scale="['0', '1,0 s']"
          class="max-w-64"
        />
      </Card>
    </PageSection>

    <PageSection title="Bảng đo (Readout)">
      <div class="flex flex-col gap-4">
        <Readout label="Kết quả chấm">
          <div class="grid grid-cols-2 items-end gap-6 lg:grid-cols-4">
            <ReadoutCell label="Kết quả" size="word" tone="tle" class="col-span-2 lg:col-span-1"
              >Quá thời gian ở test 8
              <template #below><VerdictChip :verdict="verdictOfCode('TLE')" named /></template>
            </ReadoutCell>
            <ReadoutCell label="Điểm" size="big" unit="/100" class="col-span-2 lg:col-span-1"
              >70
              <template #below
                ><TestSquares :tests="JUDGED_TESTS" label="Kết quả từng test"
              /></template>
            </ReadoutCell>
            <ReadoutCell label="Thời gian" unit=" s"
              >1,02
              <template #below
                ><Gauge
                  :value="1.02"
                  :limit="1"
                  warn
                  label="Thời gian chạy"
                  value-text="1,02 s trên 1,0 s"
                  :scale="['0', '1,0 s']"
              /></template>
            </ReadoutCell>
            <ReadoutCell label="Bộ nhớ" unit=" MB"
              >38,4
              <template #below
                ><Gauge
                  :value="38.4"
                  :limit="256"
                  label="Bộ nhớ"
                  value-text="38,4 MB trên 256 MB"
                  :scale="['0', '256 MB']"
              /></template>
            </ReadoutCell>
          </div>
        </Readout>
        <Readout label="Đang chấm">
          <div class="grid grid-cols-2 items-end gap-6">
            <ReadoutCell label="Kết quả" size="word" tone="pending"
              >Đang chấm test 5/10
              <template #below><VerdictChip :verdict="verdictOfCode('G')" named /></template>
            </ReadoutCell>
            <ReadoutCell label="Các test"
              >4<template #unit>/10</template>
              <template #below
                ><TestSquares :tests="JUDGING_TESTS" label="Các test đang chấm"
              /></template>
            </ReadoutCell>
          </div>
        </Readout>
        <Readout label="Kỳ thi đang diễn ra">
          <div class="flex flex-col gap-4">
            <div class="grid grid-cols-2 items-end gap-6 lg:grid-cols-4">
              <ReadoutCell label="Còn lại" size="big" class="col-span-2 lg:col-span-1"
                >01:15:00</ReadoutCell
              >
              <ReadoutCell label="Hạng của tôi" unit="/128">12</ReadoutCell>
              <ReadoutCell label="Điểm" unit="/500">270</ReadoutCell>
              <AppButton tone="primary" class="col-span-2 justify-self-start lg:col-span-1"
                >Vào làm bài</AppButton
              >
            </div>
            <ContestTimeline
              :start="TIMELINE.start"
              :end="TIMELINE.end"
              :now="TIMELINE.now"
              :freeze-at="TIMELINE.freezeAt"
              :ticks="TIMELINE.ticks"
              :events="TIMELINE.events"
              label="Tiến trình kỳ thi"
              now-label="Bây giờ: 1:45"
              freeze-label="Đóng băng bảng điểm từ 2:30"
            />
          </div>
        </Readout>
      </div>
    </PageSection>

    <PageSection title="Gập mở và thông báo">
      <div class="flex flex-col gap-3">
        <Card padding="sm"
          ><Disclosure label="Chi tiết (gập sẵn)" :count="3"
            ><p class="text-meta text-muted">Nội dung chỉ hiện khi mở.</p></Disclosure
          ></Card
        >
        <Notice tone="info" title="Thông tin">Nội dung thông báo.</Notice>
        <Notice tone="warning" title="Cảnh báo">Nội dung cảnh báo.</Notice>
        <Notice tone="danger" title="Lỗi">Nội dung lỗi.</Notice>
        <Notice tone="success" title="Xong">Nội dung thành công.</Notice>
        <ProgressBar :value="60" label="Tiến độ" tone="success" />
        <StatGrid
          mode="stat"
          :items="[
            { label: 'Bài đã giải', value: '2.600', tone: 'success' },
            { label: 'Điểm', value: '1:30' },
          ]"
        />
      </div>
    </PageSection>

    <PageSection title="Bảng">
      <DataTable
        v-model:sort="sort"
        :columns="columns"
        :rows="TABLE_ROWS"
        :row-key="rowKey"
        label="Bảng mẫu"
        density="compact"
      >
        <template #actions><RowMenu :items="menuItems" label="Thao tác" /></template>
      </DataTable>
    </PageSection>

    <PageSection title="Bảng không khung (ledger)" :count="TABLE_ROWS.length">
      <DataTable
        :columns="ledgerColumns"
        :rows="TABLE_ROWS"
        :row-key="rowKey"
        :row-to="() => ({ name: 'dev-kit' })"
        label="Bảng không khung mẫu"
        variant="ledger"
        density="compact"
      />
      <EmptyState inline class="mt-(--space-stack)">
        Chưa có kỳ thi nào đang diễn ra.
        <template #next>Kỳ thi tiếp theo: 21/11</template>
        <template #action><AppButton size="sm">Xem lịch thi</AppButton></template>
      </EmptyState>
    </PageSection>

    <PageSection title="Thanh công cụ, đầu trang, menu">
      <div class="flex flex-col gap-4">
        <Toolbar>
          <template #left
            ><SearchInput v-model="search" label="Tìm" placeholder="Tìm bài"
          /></template>
          <template #right><span>24 kết quả</span></template>
          <template #chips><Chip removable remove-label="Bỏ lọc">Dễ</Chip></template>
        </Toolbar>
        <Card padding="sm">
          <PageHeader
            title="Tiêu đề trang mẫu"
            :crumbs="[{ label: 'Kỳ thi' }, { label: 'lamter_1', mono: true }]"
            :meta="['16/11/2026', '2:00']"
            :facts="[
              { label: 'Giới hạn', value: '1 giây' },
              { label: 'Bộ nhớ', value: '256 MB' },
              { value: 'Đang diễn ra', mono: false, tone: 'live' },
            ]"
          >
            <template #actions><AppButton tone="primary">Hành động</AppButton></template>
          </PageHeader>
        </Card>
        <Menu :items="menuItems" label="Menu mẫu">
          <template #trigger="{ toggle, open, setOpener }"
            ><AppButton
              :ref="(el) => setOpener((el as { $el?: HTMLElement } | null)?.$el ?? null)"
              :aria-expanded="open"
              @click="toggle"
              >Mở menu</AppButton
            ></template
          >
        </Menu>
      </div>
    </PageSection>

    <PageSection title="Thông báo nổi, trạng thái trống, khung chờ">
      <div class="grid gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <ToastItem :toast="{ id: 1, text: 'Đã lưu thay đổi', tone: 'success' }" />
          <ToastItem :toast="{ id: 2, text: 'Không lưu được', tone: 'danger' }" />
        </div>
        <Card padding="sm" class="flex flex-col gap-3">
          <EmptyState compact>
            Chưa có bài nộp.
            <template #action><AppButton size="sm">Nộp bài</AppButton></template>
          </EmptyState>
          <SkeletonBlock class="h-4 w-2/3" />
          <SkeletonBlock class="h-4 w-1/2" />
        </Card>
      </div>
    </PageSection>
  </div>
</template>
