import { describe, expect, it } from 'vitest';
import { RULES_HTML, RULES_MARKDOWN } from '@/test/contest-extras-fixtures';
import { contestDetail } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import ContestJoinRulesCard from './ContestJoinRulesCard.vue';

const ruled = contestDetail({ rules: RULES_MARKDOWN, rulesHtml: RULES_HTML, rulesRevision: 3 });

describe('contest "Quy định" card', () => {
  it('shows the revision, a one-line excerpt and when the viewer will be asked', () => {
    const card = mountComponent(ContestJoinRulesCard, { props: { contest: ruled } });
    expect(card.get('h2').text()).toBe('Quy định');
    expect(card.text()).toContain('bản 3');
    expect(card.text()).toContain('Trung thực · Tự làm bài');
    expect(card.text()).toContain('Bạn sẽ được hỏi đồng ý khi đăng ký hoặc tham gia ảo.');
    expect(card.find('.user-content').exists()).toBe(false);
  });

  it('opens and closes the full rules from one disclosure button', async () => {
    const card = mountComponent(ContestJoinRulesCard, { props: { contest: ruled } });
    const toggle = card.get('button');
    expect(toggle.attributes('aria-expanded')).toBe('false');
    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(card.get('.user-content').html()).toContain('Trung thực');
    expect(card.find(`#${toggle.attributes('aria-controls')}`).exists()).toBe(true);
    await toggle.trigger('click');
    expect(card.find('.user-content').exists()).toBe(false);
  });

  it("shows the viewer's accepted revision instead of the note when it is known", () => {
    const card = mountComponent(ContestJoinRulesCard, {
      props: { contest: ruled, acceptance: { revision: 3, at: '2026-10-08T12:58:00.000Z' } },
    });
    expect(card.text()).toContain('Đã đồng ý bản 3 lúc');
    expect(card.text()).not.toContain('Bạn sẽ được hỏi đồng ý');
  });

  it('renders nothing for a contest without rules', () => {
    const card = mountComponent(ContestJoinRulesCard, {
      props: { contest: contestDetail({ rules: ' ' }) },
    });
    expect(card.find('section').exists()).toBe(false);
  });
});
