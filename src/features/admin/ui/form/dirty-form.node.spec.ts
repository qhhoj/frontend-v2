import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import { countChanges, useDirtyForm } from './dirty-form';

describe('countChanges', () => {
  it('counts each changed top-level field once, however deep the change', () => {
    const saved = { name: 'A', limits: [{ lang: 'py', time: 2 }], tags: ['dp'], at: new Date(0) };
    expect(countChanges(structuredClone(saved), saved)).toBe(0);
    expect(
      countChanges(
        { ...saved, name: 'B', limits: [{ lang: 'py', time: 3 }], at: new Date(1) },
        saved,
      ),
    ).toBe(3);
  });

  it('treats a missing key as undefined and array order as a change', () => {
    expect(countChanges({ a: 1 }, { a: 1, b: undefined })).toBe(0);
    expect(countChanges({ tags: ['a', 'b'] }, { tags: ['b', 'a'] })).toBe(1);
    expect(countChanges({ v: null }, { v: 0 })).toBe(1);
  });
});

describe('useDirtyForm', () => {
  it('tracks edits, discards back to the baseline and commits a save', () => {
    const form = useDirtyForm(reactive({ name: 'A', public: false, tags: ['dp'] }));
    form.draft.value.name = 'B';
    form.draft.value.tags.push('graph');
    expect(form.dirtyCount.value).toBe(2);

    form.discard();
    expect(form.isDirty.value).toBe(false);
    expect(form.draft.value.tags).toEqual(['dp']);

    form.draft.value.public = true;
    form.commit();
    expect(form.dirtyCount.value).toBe(0);
    form.draft.value.tags.push('x');
    expect(form.baseline.value.tags).toEqual(['dp']);
  });

  it('takes the server answer as the new baseline', () => {
    const form = useDirtyForm({ name: 'A' });
    form.draft.value.name = 'a ';
    form.commit({ name: 'a' });
    expect(form.draft.value.name).toBe('a');
    expect(form.isDirty.value).toBe(false);
  });
});
