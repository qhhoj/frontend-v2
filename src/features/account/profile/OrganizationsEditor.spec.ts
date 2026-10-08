import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { profileOrganization } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import OrganizationsEditor from './OrganizationsEditor.vue';

const LHP = profileOrganization();
const HCM = profileOrganization({
  id: 'org-hcm',
  name: 'Đội tuyển Tin học TP.HCM',
  shortName: 'HCM-TEAM',
});
const CLB = profileOrganization({
  id: 'org-clb',
  name: 'CLB Lập trình HCMUS',
  shortName: 'HCMUS-CLB',
  isAdmin: true,
});

function mountEditor(ids: string[] = [LHP.id, HCM.id, CLB.id]) {
  const wrapper: VueWrapper = mountComponent(OrganizationsEditor, {
    props: {
      organizations: [LHP, HCM, CLB],
      modelValue: ids,
      'onUpdate:modelValue': (value: string[]) => wrapper.setProps({ modelValue: value }),
    },
  });
  return wrapper;
}
/** The ids the editor now holds, as its parent would see them after the `update:modelValue` round trip. */
const modelIds = (wrapper: VueWrapper): string[] =>
  (wrapper.vm.$props as { modelValue: string[] }).modelValue;
const names = (wrapper: VueWrapper) => wrapper.findAll('li strong').map((name) => name.text());
const button = (wrapper: VueWrapper, label: string) => wrapper.get(`button[aria-label="${label}"]`);

describe('OrganizationsEditor', () => {
  it('lists the organizations in the chosen order and marks the first as shown beside the name', () => {
    const wrapper = mountEditor([HCM.id, LHP.id, CLB.id]);
    expect(names(wrapper)).toEqual([
      'Đội tuyển Tin học TP.HCM',
      'THPT Chuyên Lê Hồng Phong',
      'CLB Lập trình HCMUS',
    ]);
    expect(wrapper.findAll('li')[0]!.text()).toContain('Hiển thị cạnh tên');
    expect(wrapper.findAll('li')[1]!.text()).not.toContain('Hiển thị cạnh tên');
  });

  it('moves an organization up and announces where it went', async () => {
    const wrapper = mountEditor();
    await button(wrapper, 'Chuyển Đội tuyển Tin học TP.HCM lên').trigger('click');
    expect(modelIds(wrapper)).toEqual([HCM.id, LHP.id, CLB.id]);
    expect(wrapper.get('[aria-live="polite"]').text()).toBe(
      'Đã chuyển Đội tuyển Tin học TP.HCM tới vị trí 1.',
    );
  });

  it('cannot move the first up or the last down, and keeps focus on the pressed button', async () => {
    const wrapper = mountEditor();
    const up = button(wrapper, 'Chuyển THPT Chuyên Lê Hồng Phong lên');
    expect(up.attributes('aria-disabled')).toBe('true');
    (up.element as HTMLButtonElement).focus();
    await up.trigger('click');
    expect(modelIds(wrapper)).toEqual([LHP.id, HCM.id, CLB.id]);
    expect(document.activeElement).toBe(up.element);
    expect(button(wrapper, 'Chuyển CLB Lập trình HCMUS xuống').attributes('aria-disabled')).toBe(
      'true',
    );
  });

  it('removes an organization, says how to undo, and moves focus to the list', async () => {
    const wrapper = mountEditor();
    await button(wrapper, 'Rời Đội tuyển Tin học TP.HCM khỏi danh sách').trigger('click');
    expect(modelIds(wrapper)).toEqual([LHP.id, CLB.id]);
    expect(wrapper.get('[aria-live="polite"]').text()).toContain('Bấm Lưu để rời hẳn');
    expect(document.activeElement).toBe(wrapper.get('ul').element);
  });

  it('offers an admin no way to leave, and says why', () => {
    const wrapper = mountEditor();
    expect(
      wrapper.find('button[aria-label="Rời CLB Lập trình HCMUS khỏi danh sách"]').exists(),
    ).toBe(false);
    expect(wrapper.findAll('li')[2]!.text()).toContain('Quản trị viên');
  });

  it('says when there is no organization, and links to the list', () => {
    const wrapper = mountEditor([]);
    expect(wrapper.text()).toContain('Bạn chưa tham gia tổ chức nào.');
    expect(wrapper.get('a').attributes('href')).toBe('/organizations');
  });

  it('moves focus to the browse link when the last organization is removed, not to the vanished list', async () => {
    const wrapper = mountEditor([LHP.id]);
    await button(wrapper, 'Rời THPT Chuyên Lê Hồng Phong khỏi danh sách').trigger('click');
    expect(wrapper.find('ul').exists()).toBe(false);
    expect(document.activeElement).toBe(wrapper.get('a').element);
  });

  it('keeps the organizations anchor on one element whether or not a row renders', () => {
    const empty = mountEditor([]);
    expect(empty.findAll('[id="profile-organizations"]')).toHaveLength(1);
    expect(empty.get('[id="profile-organizations"]').element.tagName).toBe('A');
    const filled = mountEditor();
    expect(filled.findAll('[id="profile-organizations"]')).toHaveLength(1);
    expect(filled.get('[id="profile-organizations"]').element.tagName).toBe('UL');
  });
});
