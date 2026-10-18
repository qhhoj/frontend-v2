import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import { judge } from '@/test/admin-fixtures/judges';
import { LANGUAGES } from '@/test/admin-fixtures/languages';
import LanguageCoverageNotice from './LanguageCoverageNotice.vue';
import { singleJudgeLanguages, unservedLanguages, withCoverage } from './languages';

const OFFERED = ['CPP17', 'CPP20', 'PY3', 'PAS'];
/** A judge named `name` running `languages` (default: every language problems offer). */
const judgeRunning = (name: string, options: { online?: boolean; languages?: string[] } = {}) =>
  judge({
    name,
    online: options.online ?? true,
    runtimes: (options.languages ?? OFFERED).map((language) => ({
      language,
      name: 'rt',
      version: '1',
      priority: 1,
    })),
  });
const mountFor = (fleet: ReturnType<typeof judge>[]) => {
  const rows = withCoverage(LANGUAGES, fleet);
  return mountComponent(LanguageCoverageNotice, {
    props: { unserved: unservedLanguages(rows), singles: singleJudgeLanguages(rows) },
  });
};

describe('LanguageCoverageNotice', () => {
  it('is one warning that lists the languages a single judge runs', () => {
    const wrapper = mountFor([
      judgeRunning('a'),
      judgeRunning('b', { languages: ['CPP17', 'CPP20', 'PY3'] }),
    ]);
    expect(wrapper.classes()).toContain('bg-warning-bg');
    expect(wrapper.findAll('li')).toHaveLength(1);
    expect(wrapper.get('li').text()).toContain('PAS');
    expect(wrapper.get('li').text()).not.toContain('CPP20');
    expect(wrapper.text()).toContain('1 ngôn ngữ cần thêm máy chấm');
  });

  it('turns danger when a language has no online judge, and lists it once, not again as a single-judge one', () => {
    const wrapper = mountFor([
      judgeRunning('a', { languages: ['CPP17', 'CPP20', 'PY3'] }),
      judgeRunning('b', { languages: ['CPP17', 'CPP20', 'PY3'] }),
      judgeRunning('c', { languages: ['PAS'], online: false }),
    ]);
    expect(wrapper.classes()).toContain('bg-verdict-wa-bg');
    expect(wrapper.findAll('li')).toHaveLength(1);
    expect(wrapper.get('li').text()).toContain('PAS');
  });

  it('lists an unserved language and a single-judge one as two lines, each naming only its own language', () => {
    const wrapper = mountFor([
      judgeRunning('a', { languages: ['CPP17', 'CPP20', 'PY3'] }),
      judgeRunning('b', { languages: ['CPP17', 'CPP20'] }),
      judgeRunning('c', { languages: ['PAS'], online: false }),
    ]);
    const [unserved, single] = wrapper.findAll('li');
    expect(wrapper.classes()).toContain('bg-verdict-wa-bg');
    expect(wrapper.findAll('li')).toHaveLength(2);
    expect(unserved!.text()).toBe('Không máy chấm trực tuyến nào chạy PAS: bài nộp sẽ nằm chờ.');
    expect(single!.text()).toBe(
      'Chỉ một máy chạy PY3: bài nộp sẽ chờ nếu máy đó tắt hoặc bị chặn.',
    );
    expect(wrapper.text()).toContain('2 ngôn ngữ cần thêm máy chấm');
  });

  it('renders nothing when every offered language has two judges', () => {
    const wrapper = mountFor([judgeRunning('a'), judgeRunning('b')]);
    expect(wrapper.find('li').exists()).toBe(false);
    expect(wrapper.text()).toBe('');
  });
});
