import { describe, expect, it } from 'vitest';
import { problemDetail } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import ProblemFactsCard from './ProblemFactsCard.vue';

const ioText = (io: ReturnType<typeof problemDetail>['io']) =>
  mountComponent(ProblemFactsCard, {
    props: { problem: problemDetail({ io }), isSignedIn: false },
  })
    .get('[data-testid="problem-io"]')
    .text();

describe('ProblemFactsCard input/output', () => {
  it('says keyboard/screen for standard I/O', () => {
    expect(ioText({ mode: 'stdio', inputFile: null, outputFile: null })).toContain(
      'Bàn phím / màn hình',
    );
  });
  it('shows the exact input and output file names for file I/O', () => {
    const text = ioText({ mode: 'file', inputFile: 'BAI.INP', outputFile: 'BAI.OUT' });
    expect(text).toContain('BAI.INP / BAI.OUT');
    expect(text).not.toContain('Bàn phím');
  });
});
