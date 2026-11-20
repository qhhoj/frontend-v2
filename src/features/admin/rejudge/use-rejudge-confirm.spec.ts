import { defineComponent } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { RejudgeBody } from '@/api/types/submission-actions';
import { mockApi, ok } from '@/test/mock-api';
import type { ApiCall, MockResponse } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import {
  checkContestScope,
  contestScopedFilter,
  emptyRejudgeFilter,
  toRejudgeBody,
} from './rejudge-filter';
import type { ContestRejudgeScope, RejudgeFilter } from './rejudge-filter';
import { useRejudgeConfirm } from './use-rejudge-confirm';

/**
 * The bodies the rejudge screen sent to `POST /submissions/rejudge` before the contest workbench had a form of its own,
 * logged from the staging build (2026-11-21) for `/admin/rejudge?contest=ktgk11tin` with a problem code typed, a
 * username typed, and neither. The workbench form must send the same text for the same choice.
 */
const OLD_BODIES: Record<ContestRejudgeScope, string> = {
  problem: '{"problem":"tower_of_hanoi","contest":"ktgk11tin"}',
  user: '{"contest":"ktgk11tin","user":"bitcoder2"}',
  contest: '{"contest":"ktgk11tin"}',
};
/** What the teacher left in the form: a problem picked and a contestant typed, each under its own scope. */
const typed = (): RejudgeFilter => ({
  ...emptyRejudgeFilter(),
  problem: 'tower_of_hanoi',
  user: 'bitcoder2',
});
const bodyOf = (scope: ContestRejudgeScope) =>
  toRejudgeBody(contestScopedFilter(typed(), 'ktgk11tin', scope));

const counted = (count: number, allowed = true) => ok({ count, dryRun: true, allowed, sample: [] });
const queued = (count: number) => ok({ count, dryRun: false, allowed: true, sample: [] });

/** The composable inside a component (its mutation needs the app's query client) and the rejudge requests it sent. */
function mountConfirm(answerDryRun: MockResponse = counted(14)) {
  const calls = mockApi({
    ...anonymousViewer,
    'POST /submissions/rejudge': (call: ApiCall) =>
      (call.body as RejudgeBody).dryRun ? answerDryRun : queued(14),
  });
  let confirmer!: ReturnType<typeof useRejudgeConfirm>;
  mountComponent(
    defineComponent({
      setup() {
        confirmer = useRejudgeConfirm();
        return () => null;
      },
    }),
  );
  const sent = () =>
    calls.filter((call) => call.path === '/submissions/rejudge').map((call) => call.body);
  return { confirmer, sent };
}

describe('a contest rejudge: the request', () => {
  it.each(['problem', 'user', 'contest'] as const)(
    'for scope "%s" counts with a dry run, then sends the body the rejudge screen sent',
    async (scope) => {
      const { confirmer, sent } = mountConfirm();
      await confirmer.ask(bodyOf(scope));
      const old = JSON.parse(OLD_BODIES[scope]) as RejudgeBody;
      expect(sent()).toEqual([{ ...old, dryRun: true }]);

      const outcome = await confirmer.confirm();
      await flushPromises();
      expect(outcome?.kind).toBe('done');
      expect(sent()).toHaveLength(2);
      expect(JSON.stringify(sent()[1])).toBe(OLD_BODIES[scope]);
    },
  );

  it('keeps the verdict filter and the locked choice, and nothing typed under another scope', () => {
    const filter: RejudgeFilter = { ...typed(), results: ['IE', 'CE'], force: true };
    expect(toRejudgeBody(contestScopedFilter(filter, 'ktgk11tin', 'user'))).toEqual({
      contest: 'ktgk11tin',
      user: 'bitcoder2',
      results: ['IE', 'CE'],
      force: true,
    });
  });

  it('refuses a scope whose field is blank: the request would reach the whole contest', () => {
    const blank = { ...emptyRejudgeFilter(), problem: '  ', user: '' };
    expect(Object.keys(checkContestScope(blank, 'problem'))).toEqual(['problem']);
    expect(Object.keys(checkContestScope(blank, 'user'))).toEqual(['user']);
    expect(checkContestScope(blank, 'contest')).toEqual({});
    expect(checkContestScope(typed(), 'problem')).toEqual({});
  });
});

describe('a rejudge: the dry run always comes first', () => {
  it('sends nothing when confirmed before anything was counted', async () => {
    const { confirmer, sent } = mountConfirm();
    expect(await confirmer.confirm()).toBeNull();
    expect(sent()).toEqual([]);
  });

  it('sends nothing while the count has not answered', async () => {
    const { confirmer, sent } = mountConfirm();
    const counting = confirmer.ask(bodyOf('contest'));
    expect(await confirmer.confirm()).toBeNull();
    await counting;
    expect(sent()).toEqual([{ contest: 'ktgk11tin', dryRun: true }]);
  });

  it.each([
    { name: 'no submission matches', answer: counted(0) },
    { name: 'the batch is over the limit without the permission', answer: counted(40, false) },
  ])('sends nothing when $name', async ({ answer }) => {
    const { confirmer, sent } = mountConfirm(answer);
    await confirmer.ask(bodyOf('contest'));
    expect(await confirmer.confirm()).toBeNull();
    expect(sent()).toHaveLength(1);
  });

  it('sends nothing after the dialog closed', async () => {
    const { confirmer, sent } = mountConfirm();
    await confirmer.ask(bodyOf('contest'));
    confirmer.close();
    expect(await confirmer.confirm()).toBeNull();
    expect(sent()).toHaveLength(1);
  });

  it('sends the body that was counted when the page changes its filter afterwards', async () => {
    const { confirmer, sent } = mountConfirm();
    const body = bodyOf('problem');
    await confirmer.ask(body);
    body.problem = '11tin_chiakeo';
    delete body.contest;
    await confirmer.confirm();
    expect(JSON.stringify(sent()[1])).toBe(OLD_BODIES.problem);
  });
});
