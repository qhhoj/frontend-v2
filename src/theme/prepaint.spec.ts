import { describe, expect, it } from 'vitest';
import indexHtml from '/index.html?raw';
import { createPinia, setActivePinia } from 'pinia';
import { stubMatchMedia } from '@/test/match-media';
import {
  ACCENTS,
  BACKGROUNDS,
  DEFAULT_BACKGROUND,
  LEGACY_ACCENTS,
  MORE_CONTRAST_QUERY,
} from './appearance';
import { useAppearanceStore } from './appearance.store';
import { useThemeStore } from './theme.store';
import {
  isLowPowerPreference,
  LOW_POWER_STORAGE_KEY,
  readDeviceHints,
  resolveLowPower,
  WEAK_CPU_CORES,
  WEAK_DEVICE_MEMORY_GB,
} from './low-power';
import type { HintSource } from './low-power';
import { useLowPowerStore } from './low-power.store';
import { AUTO_THEME, LEGACY_PREFERENCES, resolveTheme, THEMES } from './registry';

const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)![1]!;
const paletteFiles = import.meta.glob<string>('./palette/paper-*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const groundOfTheme = (id: string) =>
  /--qh-ground:\s*(#\w+)/.exec(paletteFiles[`./palette/paper-${id}.css`]!)![1];
/** The object literal or array the script assigns to `name`, as data. */
const listed = (name: string): unknown =>
  // The script is the page's own source under test, so evaluating its literals here is the point.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(`return ${new RegExp(`var ${name} = ([\\[{][^;]*);`).exec(script)![1]}`)();

/** Every value `siteTheme` or the browser preference can hold: current, retired, unknown and inherited-looking. */
const PREFERENCES = [
  AUTO_THEME,
  ...THEMES.map((theme) => theme.id),
  ...Object.keys(LEGACY_PREFERENCES),
  'neon-retired',
  'constructor',
  'toString',
  '__proto__',
];

/** Runs the real inline script against a stand-in page. */
function prepaint({
  stored = null as string | null,
  resolvedBy = 'account' as string | null,
  preference = null as string | null,
  painted = null as string | null,
  dark = false,
  moreContrast = false,
  lowPower = null as string | null,
  device = {} as HintSource,
  storageThrows = false,
  mediaThrows = false,
}) {
  const root = { dataset: {} as Record<string, string> };
  const themeColor = {
    content: '',
    setAttribute: (_name: string, value: string) => (themeColor.content = value),
  };
  const localStorageStub = {
    getItem: (key: string) => {
      if (storageThrows) throw new Error('storage blocked');
      if (key === 'qhhoj.resolvedTheme') return stored;
      if (key === 'qhhoj.resolvedBy') return resolvedBy;
      if (key === 'qhhoj.paintedAppearance') return painted;
      if (key === 'qhhoj.lowPower') return lowPower;
      return key === 'qhhoj.theme' ? preference : null;
    },
  };
  const matchMediaStub = (query: string) => {
    if (mediaThrows) throw new Error('no matchMedia');
    return {
      matches:
        (dark && query.includes('prefers-color-scheme: dark')) ||
        (moreContrast && query === MORE_CONTRAST_QUERY),
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('document', 'localStorage', 'matchMedia', 'navigator', script)(
    { documentElement: root, querySelector: () => themeColor },
    localStorageStub,
    matchMediaStub,
    device,
  );
  return {
    theme: root.dataset.theme,
    themeColor: themeColor.content,
    accent: root.dataset.accent,
    background: root.dataset.background,
    contrast: root.dataset.contrast,
    lowPower: root.dataset.lowPower !== undefined,
  };
}

describe('pre-paint script in index.html', () => {
  it('drift guard: lists the same themes, retired ids, accents and backgrounds as the app', () => {
    expect(Object.keys(listed('grounds') as object)).toEqual(THEMES.map((theme) => theme.id));
    expect(listed('legacy')).toEqual(LEGACY_PREFERENCES);
    expect(listed('accents')).toEqual(ACCENTS.map((accent) => accent.id));
    expect(listed('legacyAccents')).toEqual(LEGACY_ACCENTS);
    expect(listed('backgrounds')).toEqual(BACKGROUNDS.map((choice) => choice.id));
  });

  it('resolves every stored preference like the app does when nothing was painted yet', () => {
    for (const preference of PREFERENCES)
      for (const dark of [false, true])
        expect(prepaint({ preference, dark }).theme, `${preference}, OS dark ${dark}`).toBe(
          resolveTheme(preference, dark ? 'dark' : 'light').id,
        );
  });

  it('paints the last painted theme only when the account chose it, a Glass one as its successor', () => {
    expect(prepaint({ stored: 'dark', resolvedBy: 'account', dark: false }).theme).toBe('dark');
    expect(prepaint({ stored: 'glass-dark', resolvedBy: 'account', dark: false }).theme).toBe(
      'dark',
    );
    expect(prepaint({ stored: 'dark', resolvedBy: 'local', dark: false }).theme).toBe('light');
    expect(prepaint({ stored: 'dark', resolvedBy: null, dark: false }).theme).toBe('light');
  });

  it('paints what the store resolves at start-up, for every preference, cache and OS scheme', () => {
    for (const preference of [null, ...PREFERENCES])
      for (const cache of [null, 'light', 'dark', 'glass-dark', 'clay-light'])
        for (const resolvedBy of ['account', 'local', null])
          for (const dark of [false, true]) {
            localStorage.clear();
            if (preference !== null) localStorage.setItem('qhhoj.theme', preference);
            if (cache !== null) localStorage.setItem('qhhoj.resolvedTheme', cache);
            if (resolvedBy !== null) localStorage.setItem('qhhoj.resolvedBy', resolvedBy);
            delete document.documentElement.dataset.theme;
            stubMatchMedia({ dark });
            setActivePinia(createPinia());
            const fromStore = useThemeStore().theme.id;
            const painted = prepaint({ stored: cache, resolvedBy, preference, dark });
            expect(
              painted.theme,
              `preference ${preference}, cache ${cache} by ${resolvedBy}, OS dark ${dark}`,
            ).toBe(fromStore);
            expect(painted.themeColor).toBe(groundOfTheme(fromStore));
          }
  });

  it('still paints the OS theme and the site look when storage is blocked', () => {
    const result = prepaint({ storageThrows: true, dark: true });
    expect(result.theme).toBe('dark');
    expect(result.accent).toBeUndefined();
    expect(result.background).toBe(DEFAULT_BACKGROUND);
  });
});

describe('pre-paint script: personal look', () => {
  const PAINTED = [
    null,
    'null',
    'not json',
    '"teal"',
    '{"accent":"violet"}',
    '{"contrast":"high"}',
    '{"accent":"teal"}',
    '{"accent":"plum","contrast":"high","background":"halftone"}',
    '{"accent":"graphite","background":"plaid"}',
    '{"accent":"sunset","glass":40,"glow":35}',
    '{"accent":"orchid","contrast":"high"}',
  ];

  it('paints the look the store starts with, for every painted value and device contrast', () => {
    for (const painted of PAINTED)
      for (const moreContrast of [false, true]) {
        localStorage.clear();
        if (painted !== null) localStorage.setItem('qhhoj.paintedAppearance', painted);
        delete document.documentElement.dataset.accent;
        delete document.documentElement.dataset.contrast;
        const media = stubMatchMedia();
        media.setQuery(MORE_CONTRAST_QUERY, moreContrast);
        setActivePinia(createPinia());
        useAppearanceStore();
        const root = document.documentElement.dataset;
        const label = `painted ${painted}, more contrast ${moreContrast}`;
        expect(prepaint({ painted, moreContrast }), label).toMatchObject({
          accent: root.accent,
          background: root.background,
          contrast: root.contrast,
        });
      }
  });

  it('paints a Clay or Glass accent as its successor', () => {
    expect(prepaint({ painted: '{"accent":"sunset","glass":40,"glow":35}' }).accent).toBe(
      'terracotta',
    );
  });
});

describe('pre-paint script: low-power mode', () => {
  const DEVICES: HintSource[] = [
    {},
    { deviceMemory: 8, hardwareConcurrency: 8 },
    { deviceMemory: 2 },
    { deviceMemory: 4, hardwareConcurrency: 2 },
    { hardwareConcurrency: 4, connection: { saveData: true } },
    { deviceMemory: null, hardwareConcurrency: null },
    { connection: null },
  ];
  const STORED = [null, 'auto', 'on', 'off', 'turbo'];

  it('paints exactly what resolveLowPower decides for every stored value and device', () => {
    for (const lowPower of STORED)
      for (const device of DEVICES)
        expect(
          prepaint({ lowPower, device }).lowPower,
          `${lowPower} ${JSON.stringify(device)}`,
        ).toBe(
          resolveLowPower(
            isLowPowerPreference(lowPower) ? lowPower : 'auto',
            readDeviceHints(device),
          ),
        );
  });

  it('paints what the store starts with', () => {
    for (const lowPower of STORED)
      for (const device of DEVICES) {
        localStorage.clear();
        if (lowPower !== null) localStorage.setItem(LOW_POWER_STORAGE_KEY, lowPower);
        for (const name of ['deviceMemory', 'hardwareConcurrency', 'connection'] as const)
          Object.defineProperty(navigator, name, { value: device[name], configurable: true });
        setActivePinia(createPinia());
        expect(
          prepaint({ lowPower, device }).lowPower,
          `${lowPower} ${JSON.stringify(device)}`,
        ).toBe(useLowPowerStore().isOn);
      }
  });

  it('drift guard: the pre-paint script names the same storage key and thresholds as src/theme/low-power.ts', () => {
    expect(script).toContain(`localStorage.getItem('${LOW_POWER_STORAGE_KEY}')`);
    expect(script).toContain(`isAtMost(navigator.deviceMemory, ${WEAK_DEVICE_MEMORY_GB})`);
    expect(script).toContain(`isAtMost(navigator.hardwareConcurrency, ${WEAK_CPU_CORES})`);
  });
});
