import { describe, expect, it } from 'vitest';
import type { VueWrapper } from '@vue/test-utils';
import { mountComponent } from '@/test/mount';
import ProblemPointsPicker from './ProblemPointsPicker.vue';

/** The popover rendered inline, so the sliders can be driven. */
const InlinePopover = { template: '<div><slot /></div>', methods: { toggle() {} } };
const open = (min: number | null = null, max: number | null = null) =>
  mountComponent(ProblemPointsPicker, {
    props: { min, max },
    stubs: { Popover: InlinePopover },
  });
const slider = (picker: VueWrapper, name: string) =>
  picker.get(`input[name="${name}"]`).element as HTMLInputElement;
async function drag(picker: VueWrapper, name: string, value: number) {
  const input = slider(picker, name);
  input.value = String(value);
  await picker.get(`input[name="${name}"]`).trigger('input');
}

describe('ProblemPointsPicker', () => {
  it('shows the range while dragging and changes the filter once, on release', async () => {
    const picker = open();
    await drag(picker, 'pointsMinSlider', 1200);
    await drag(picker, 'pointsMinSlider', 1500);
    expect(picker.get('button').text()).toContain('1500');
    expect(picker.emitted('change')).toBeUndefined();
    await picker.get('input[name="pointsMinSlider"]').trigger('change');
    expect(picker.emitted('change')).toEqual([[{ pointsMin: 1500, pointsMax: null }]]);
  });

  it('keeps a handle from passing the other one, thumb included', async () => {
    const picker = open(null, 2000);
    await drag(picker, 'pointsMinSlider', 3000);
    expect(slider(picker, 'pointsMinSlider').value).toBe('2000');
    await picker.get('input[name="pointsMinSlider"]').trigger('change');
    expect(picker.emitted('change')).toEqual([[{ pointsMin: 2000, pointsMax: 2000 }]]);
  });

  it('treats a handle at its end of the track as no bound', async () => {
    const picker = open(1000, 2000);
    await drag(picker, 'pointsMinSlider', 800);
    await drag(picker, 'pointsMaxSlider', 3500);
    await picker.get('input[name="pointsMaxSlider"]').trigger('change');
    expect(picker.emitted('change')).toEqual([[{ pointsMin: null, pointsMax: null }]]);
  });
});
