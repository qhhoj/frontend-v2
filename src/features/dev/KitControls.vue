<script setup lang="ts">
import { Copy, FileUp, Pencil, Trash2, X } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import Chip from '@/components/ui/Chip.vue';
import FormField from '@/components/ui/FormField.vue';
import IconButton from '@/components/ui/IconButton.vue';
import PageSection from '@/components/ui/PageSection.vue';
import Readout from '@/components/ui/Readout.vue';
import SaveBar from '@/components/ui/SaveBar.vue';
import RadioGroup from '@/components/ui/RadioGroup.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import SelectField from '@/components/ui/SelectField.vue';
import StatusStepper from '@/components/ui/StatusStepper.vue';
import Tabs from '@/components/ui/Tabs.vue';
import TextArea from '@/components/ui/TextArea.vue';
import Switch from '@/components/ui/Switch.vue';
import TextInput from '@/components/ui/TextInput.vue';
import VerdictChip from '@/components/ui/VerdictChip.vue';
import { verdictOfCode } from '@/lib/verdicts';
import { CONTROL_FILTERS, CONTROL_TABS, PLACEMENT, SCALES } from './kit-control-fixtures';
import { VERDICT_SAMPLES } from './kit-plate-fixtures';

/**
 * The one control set of the site ("Sơn mài" controls), every kind with all its states in one place and in a fixed order:
 * buttons, sizes and states, the plate, filter toggles, status tags, fields, tabs, verdicts, cards and headers, the
 * placement table, the scales, the save bar. A reviewer checks consistency here before looking at a page.
 */
defineOptions({ name: 'KitControls' });

const filter = ref('all');
const view = ref('all');
const tab = ref('statement');
const search = ref('');
const name = ref('Dãy con đối xứng');
const note = ref('Ghi chú của giáo viên');
const isPartial = ref(true);
const language = ref('cpp17');
const order = ref('new');
const isLive = ref(true);
const scoring = ref('best');
const isLocked = ref(true);
const dirtyCount = ref(2);
/** A button row drawn by `v-for` over items that are replaced as a whole: each button must show the new item. */
const buttonRows = [
  [
    { id: 'a', label: 'Sao chép', icon: Copy },
    { id: 'b', label: 'Tải lên', icon: FileUp },
  ],
  [
    { id: 'a', label: 'Chỉnh sửa', icon: Pencil },
    { id: 'b', label: 'Xóa bỏ', icon: Trash2 },
  ],
];
const buttonRowIndex = ref(0);
const buttonRowItems = computed(() =>
  buttonRows[buttonRowIndex.value].map((item) => ({ ...item })),
);
</script>

<template>
  <PageSection title="Bộ điều khiển" data-kit-controls>
    <p class="mb-4 max-w-prose text-body text-secondary">
      Mọi trang chỉ dùng các điều khiển ở đây. Hình dạng cho biết loại: hình chữ nhật bo góc thì bấm
      được, hình viên thuốc là nhãn. Có hai chiều cao (40 và 32 px) và một bán kính bo góc.
    </p>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card as="div" padding="md" class="flex flex-col gap-3">
        <h3 class="eyebrow">Nút · 3 kiểu</h3>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton tone="primary">Nộp bài</AppButton>
          <span class="text-small text-muted">Chính: một hành động chính của trang.</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton>Về đề bài</AppButton>
          <span class="text-small text-muted">Phụ: mọi hành động khác.</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton tone="quiet">Sửa</AppButton>
          <span class="text-small text-muted">Nhẹ: việc nhỏ trong một dòng hoặc đầu khung.</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton tone="link" href="#kit-controls">Xem tất cả</AppButton>
          <span class="text-small text-muted">Liên kết: sang trang khác, gạch chân khi rê.</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton tone="danger"
            ><template #icon><Trash2 aria-hidden="true" /></template>Xóa bài</AppButton
          >
          <span class="text-small text-muted"
            >Nguy hiểm: hình nút phụ, chữ và biểu tượng đỏ. Đỏ là một họ: sai, lỗi, xóa.</span
          >
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton tone="ghost">ghost</AppButton>
          <AppButton size="lg">lg</AppButton>
          <span class="text-small text-muted">Tên cũ: vẽ thành nhẹ, 40 px.</span>
        </div>
      </Card>

      <Card as="div" padding="md" class="flex flex-col gap-3">
        <h3 class="eyebrow">Cỡ và trạng thái</h3>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton tone="primary">40 px</AppButton>
          <AppButton>40 px</AppButton>
          <AppButton tone="primary" size="sm">32 px</AppButton>
          <AppButton size="sm">32 px</AppButton>
          <AppButton tone="quiet" size="sm">32 px</AppButton>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton tone="primary" disabled>Không dùng được</AppButton>
          <AppButton disabled disabled-reason="Kỳ thi đã kết thúc">Không dùng được</AppButton>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton tone="primary" loading>Đang lưu</AppButton>
          <AppButton loading>Đang tải</AppButton>
          <AppButton :pressed="isLocked" @click="isLocked = !isLocked">Bật / tắt</AppButton>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton
            ><template #icon><Copy aria-hidden="true" /></template>Sao chép</AppButton
          >
          <AppButton size="sm"
            ><template #icon><FileUp aria-hidden="true" /></template>Chọn tệp</AppButton
          >
          <IconButton label="Đóng"><X aria-hidden="true" /></IconButton>
          <IconButton label="Đóng" tone="secondary" size="sm"><X aria-hidden="true" /></IconButton>
          <IconButton label="Xóa" tone="danger"><Trash2 aria-hidden="true" /></IconButton>
        </div>
        <p class="text-small text-muted">
          Biểu tượng đứng trước chữ. Nút chỉ có biểu tượng: mực trung tính, không viền, không tím;
          luôn có tên và chú thích khi rê.
        </p>
      </Card>

      <Card as="div" padding="md" class="flex flex-col gap-3" data-kit-button-rows>
        <h3 class="eyebrow">Nút trong danh sách đổi dữ liệu</h3>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton
            v-for="item in buttonRowItems"
            :key="`to-${item.id}`"
            to="/dev/kit"
            data-row="to"
            ><template #icon><component :is="item.icon" aria-hidden="true" /></template
            >{{ item.label }}</AppButton
          >
          <AppButton
            v-for="item in buttonRowItems"
            :key="`href-${item.id}`"
            href="#kit-controls"
            data-row="href"
            ><template #icon><component :is="item.icon" aria-hidden="true" /></template
            >{{ item.label }}</AppButton
          >
          <AppButton v-for="item in buttonRowItems" :key="`plain-${item.id}`" data-row="plain"
            ><template #icon><component :is="item.icon" aria-hidden="true" /></template
            >{{ item.label }}</AppButton
          >
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton
            v-for="item in buttonRowItems"
            :key="`to-r-${item.id}`"
            to="/dev/kit"
            disabled-reason="Lý do"
            data-row="to-reason"
            ><template #icon><component :is="item.icon" aria-hidden="true" /></template
            >{{ item.label }}</AppButton
          >
          <AppButton
            v-for="item in buttonRowItems"
            :key="`href-r-${item.id}`"
            href="#kit-controls"
            disabled-reason="Lý do"
            data-row="href-reason"
            ><template #icon><component :is="item.icon" aria-hidden="true" /></template
            >{{ item.label }}</AppButton
          >
          <AppButton
            v-for="item in buttonRowItems"
            :key="`plain-r-${item.id}`"
            disabled-reason="Lý do"
            data-row="plain-reason"
            ><template #icon><component :is="item.icon" aria-hidden="true" /></template
            >{{ item.label }}</AppButton
          >
        </div>
        <div>
          <AppButton
            size="sm"
            data-row-toggle
            @click="buttonRowIndex = buttonRowIndex === 0 ? 1 : 0"
            >Đổi dữ liệu</AppButton
          >
        </div>
      </Card>

      <Readout as="div" label="Nút trên bảng đo" class="flex flex-col gap-3 self-start">
        <h3 class="eyebrow">Trên bảng đo</h3>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton tone="primary">Vào làm bài</AppButton>
          <AppButton>Rời kỳ thi</AppButton>
          <AppButton tone="primary" size="sm">32 px</AppButton>
          <AppButton size="sm" disabled>Không dùng được</AppButton>
        </div>
      </Readout>

      <Card as="div" padding="md" class="flex flex-col gap-3">
        <h3 class="eyebrow">Bộ lọc (bật / tắt)</h3>
        <div class="flex flex-wrap items-center gap-2">
          <Chip
            v-for="item in CONTROL_FILTERS"
            :key="item.value"
            :pressed="filter === item.value"
            @click="filter = item.value"
            >{{ item.label }} <span class="font-mono text-kbd">{{ item.count }}</span></Chip
          >
          <Chip removable remove-label="Bỏ lọc ngôn ngữ C++17">C++17</Chip>
        </div>
        <SegmentedControl
          v-model="view"
          size="sm"
          label="Chọn một trong vài kiểu xem"
          :options="CONTROL_FILTERS"
        />
        <p class="text-small text-muted">
          Bật = nền tím nhạt, viền tím, chữ tím, giống mục đang mở của menu. Không bao giờ giống nút
          chính.
        </p>
      </Card>

      <Card as="div" padding="md" class="flex flex-col gap-3">
        <h3 class="eyebrow">Nhãn trạng thái (không bấm được)</h3>
        <div class="flex flex-wrap items-center gap-3">
          <Chip strong>Công khai</Chip>
          <Chip>Nháp</Chip>
          <Chip>Quy hoạch động</Chip>
          <Chip tone="success" dot>Đang diễn ra</Chip>
          <Chip tone="warning" dot>Sắp hết giờ</Chip>
          <Chip tone="danger" dot>Bị khóa</Chip>
        </div>
        <p class="text-small text-muted">
          Viên thuốc là nhãn: một nền, không viền, không đổi khi rê. Màu trạng thái chỉ nằm ở chấm.
        </p>
      </Card>

      <Card as="div" padding="md" class="flex flex-col gap-3">
        <h3 class="eyebrow">Ô nhập</h3>
        <div class="flex flex-wrap items-center gap-3">
          <SearchInput v-model="search" label="Tên hoặc mã bài" class="min-w-48 flex-1" />
          <SelectField v-model="language" aria-label="Ngôn ngữ"
            ><option value="cpp17">C++17</option>
            <option value="py">Python 3</option></SelectField
          >
          <SelectField
            v-model="order"
            prefix="Sắp xếp"
            :options="[
              { value: 'new', label: 'Mới nhất' },
              { value: 'points', label: 'Điểm cao nhất' },
            ]"
            :active="order !== 'new'"
          />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <FormField label="Tên bài"><TextInput v-model="name" /></FormField>
          <FormField label="Mã bài" error="Mã bài đã có"
            ><TextInput model-value="day con"
          /></FormField>
          <FormField label="Giới hạn bộ nhớ"
            ><TextInput model-value="256" disabled
              ><template #suffix>MB</template></TextInput
            ></FormField
          >
          <FormField label="Ghi chú"><TextArea v-model="note" rows="1" /></FormField>
        </div>
        <Checkbox v-model="isPartial" label="Chấm điểm từng phần" />
        <Switch v-model="isLive" label="Hiện cho học sinh" />
        <RadioGroup
          v-model="scoring"
          legend="Cách tính điểm"
          name="kit-scoring"
          inline
          :options="[
            { value: 'best', label: 'Lần cao nhất' },
            { value: 'last', label: 'Lần cuối' },
          ]"
        />
        <p class="text-small text-muted">
          Tất cả cao 40 px, cùng viền và bo góc với nút. Đang nhập = viền tím.
        </p>
      </Card>

      <Card as="div" padding="md" class="flex flex-col gap-3">
        <h3 class="eyebrow">Tab</h3>
        <Tabs v-model="tab" :items="CONTROL_TABS" label="Tab mẫu" />
        <p class="text-small text-muted">
          Tab đổi cách xem của cùng một thứ. Chỉ gạch chân, không đóng khung.
        </p>
      </Card>

      <Card as="div" padding="md" class="flex flex-col gap-3">
        <h3 class="eyebrow">Kết quả chấm</h3>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <VerdictChip v-for="code in VERDICT_SAMPLES" :key="code" :verdict="verdictOfCode(code)" />
        </div>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <StatusStepper status="QU" />
          <StatusStepper status="G" :test="3" :total="10" />
          <StatusStepper status="G" :test="3" :total="10" compact />
        </div>
        <p class="text-small text-muted">Một đèn và một mã, giống nhau ở mọi trang.</p>
      </Card>

      <Card as="div" padding="md" class="flex flex-col gap-3">
        <h3 class="eyebrow">Khung</h3>
        <p class="text-body">Một kiểu khung: viền 1 px, bo 6 px, đệm 16 px.</p>
        <Card as="div" variant="inset" padding="md" class="text-meta text-secondary"
          >Ô lồng trong khung: nền nổi, không viền.</Card
        >
      </Card>

      <Card as="div" panel title="Khung có đầu mục">
        <template #actions>
          <span class="text-small text-muted">3 bài</span>
          <AppButton tone="quiet" size="sm">Sửa</AppButton>
        </template>
        <PageSection title="Đầu mục" :count="12">
          <template #actions
            ><AppButton tone="link" class="text-meta" to="/dev/kit">Xem tất cả</AppButton></template
          >
          <p class="text-meta text-secondary">
            Bên trái là tên mục; bên phải là ghi chú, liên kết hoặc một nút nhẹ.
          </p>
        </PageSection>
      </Card>

      <Card as="div" padding="md" class="flex flex-col gap-3 md:col-span-2">
        <h3 class="eyebrow">Vị trí · mỗi thứ luôn ở một chỗ</h3>
        <dl class="m-0 grid">
          <div
            v-for="row in PLACEMENT"
            :key="row.zone"
            class="grid gap-x-4 gap-y-1 border-b border-line py-3 md:grid-cols-5"
          >
            <dt class="font-semibold">{{ row.zone }}</dt>
            <dd class="m-0 text-secondary md:col-span-2">{{ row.left }}</dd>
            <dd class="m-0 text-secondary md:col-span-2">{{ row.right }}</dd>
          </div>
        </dl>
        <p class="text-small text-muted">
          Cột giữa là bên trái, cột cuối là bên phải. Trang cần ngoại lệ là một lỗi thiết kế.
        </p>
      </Card>

      <Card as="div" padding="md" class="flex flex-col gap-3 md:col-span-2">
        <h3 class="eyebrow">Thang giá trị · không có số tự đặt</h3>
        <dl class="m-0 grid">
          <div
            v-for="scale in SCALES"
            :key="scale.name"
            class="grid gap-x-4 gap-y-1 border-b border-line py-3 md:grid-cols-5"
          >
            <dt class="font-semibold">{{ scale.name }}</dt>
            <dd class="m-0 font-mono text-meta text-secondary md:col-span-4">{{ scale.steps }}</dd>
          </div>
        </dl>
      </Card>

      <Card as="div" padding="md" class="flex flex-col gap-3 md:col-span-2">
        <h3 class="eyebrow">Thanh lưu (chỉ hiện khi có thay đổi chưa lưu)</h3>
        <!-- Its own box, so the sticky bar has nowhere to float inside the gallery. -->
        <div>
          <SaveBar :dirty-count="dirtyCount" note="tệp vào, tệp ra" @discard="dirtyCount = 0" />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <AppButton size="sm" @click="dirtyCount += 1">Sửa thêm một ô</AppButton>
          <span class="text-small text-muted"
            >Mỗi trang một thanh lưu. Khi nó hiện, "Lưu" là nút chính của trang.</span
          >
        </div>
      </Card>
    </div>
  </PageSection>
</template>
