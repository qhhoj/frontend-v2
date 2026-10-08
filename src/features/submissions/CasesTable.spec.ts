import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { submissionCase } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import CasesTable from './CasesTable.vue';

const mountTable = (props: Record<string, unknown>) =>
  mountComponent(CasesTable, {
    props: { cases: null, batches: null, totalCases: null, running: false, ...props },
  }) as unknown as VueWrapper<{ running: boolean }>;

describe('CasesTable', () => {
  it('shows one row per case with the verdict code and name as text, and formatted time and memory', () => {
    const wrapper = mountTable({
      cases: [submissionCase({ position: 1 }), submissionCase({ position: 2, status: 'WA' })],
    });
    const rows = wrapper.findAll('[data-testid="case-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.text()).toContain('AC · Chấp nhận');
    expect(rows[1]!.text()).toContain('WA · Sai kết quả');
    expect(rows[0]!.text()).toContain('0.01s');
    expect(rows[0]!.text()).toContain('3.2 MB');
  });

  it('lists the tests still waiting after the graded ones only while running', async () => {
    const graded = [1, 2, 3].map((position) => submissionCase({ position }));
    const wrapper = mountTable({ cases: graded, totalCases: 5, running: true });
    const pending = wrapper.findAll('[data-testid="pending-row"]');
    expect(pending.map((row) => row.text())).toEqual([
      expect.stringContaining('4'),
      expect.stringContaining('5'),
    ]);
    for (const row of pending) expect(row.text()).toContain('Chờ chấm');
    await wrapper.setProps({ running: false });
    expect(wrapper.findAll('[data-testid="pending-row"]')).toHaveLength(0);
  });

  it('falls back to one row per batch', () => {
    const wrapper = mountTable({
      batches: [
        { batch: 1, status: 'AC', points: 10, total: 10 },
        { batch: 2, status: 'WA', points: 0, total: 10 },
      ],
    });
    const rows = wrapper.findAll('[data-testid="case-row"]');
    expect(rows.map((row) => row.text())).toEqual([
      expect.stringContaining('Nhóm 1'),
      expect.stringContaining('Nhóm 2'),
    ]);
  });

  it('shows only the hidden message when neither cases nor batches are visible', () => {
    const wrapper = mountTable({});
    expect(wrapper.text()).toContain('Người xem không được xem kết quả từng test');
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it('shows the compile log instead of the hidden message for a compile error', () => {
    const wrapper = mountTable({ compileError: 'main.cpp:3: error: expected ;' });
    expect(wrapper.get('pre').text()).toBe('main.cpp:3: error: expected ;');
    expect(wrapper.text()).not.toContain('Người xem không được xem');
  });

  it('renders judge text, the compile log and output as text, never as HTML', () => {
    const wrapper = mountTable({
      cases: [submissionCase({ feedback: '<b>x</b>', output: '<i>y</i>' })],
      compileError: '<u>z</u>',
    });
    for (const literal of ['<b>x</b>', '<i>y</i>', '<u>z</u>'])
      expect(wrapper.text()).toContain(literal);
    expect(wrapper.find('b, i, u').exists()).toBe(false);
  });
});
