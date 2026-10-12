import { describe, expect, it } from 'vitest';
import { problemDetail } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import ProblemFactsCard from './ProblemFactsCard.vue';

const card = (io: ReturnType<typeof problemDetail>['io']) =>
  mountComponent(ProblemFactsCard, {
    props: { problem: problemDetail({ io }), isSignedIn: false },
  });

describe('ProblemFactsCard input/output', () => {
  it('says keyboard/screen in one cell for standard I/O', () => {
    const wrapper = card({ mode: 'stdio', inputFile: null, outputFile: null });
    expect(wrapper.get('[data-testid="problem-io-stdio"]').text()).toContain('Bàn phím / màn hình');
    expect(wrapper.find('[data-testid="problem-io-input"]').exists()).toBe(false);
  });
  it('shows the exact input and output file names in their own cells for file I/O', () => {
    const wrapper = card({ mode: 'file', inputFile: 'BAI.INP', outputFile: 'BAI.OUT' });
    expect(wrapper.get('[data-testid="problem-io-input"]').text()).toContain('BAI.INP');
    expect(wrapper.get('[data-testid="problem-io-output"]').text()).toContain('BAI.OUT');
    expect(wrapper.text()).not.toContain('Bàn phím');
  });
});
