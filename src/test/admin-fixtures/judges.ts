import type { Judge } from '../../api/types/judges-admin';

const RUNTIMES = [
  { language: 'CPP20', name: 'g++', version: '13.2.0', priority: 10 },
  { language: 'CPP17', name: 'g++', version: '13.2.0', priority: 20 },
  { language: 'PY3', name: 'CPython', version: '3.12.3', priority: 30 },
];

export const judge = (overrides: Partial<Judge> = {}): Judge => ({
  id: '0192a000-0000-7000-8000-00000000a101',
  name: 'qhh-judge-01',
  description: 'Phòng máy A, 16 lõi',
  online: true,
  isBlocked: false,
  isDisabled: false,
  startTime: '2026-10-08T00:41:00.000Z',
  ping: 0.011,
  load: 0.62,
  lastIp: '10.20.0.11',
  slots: 4,
  busy: 1,
  build: '1.4.2',
  protocolMinor: 1,
  features: ['sandbox_isolate'],
  runtimes: RUNTIMES,
  ...overrides,
});

export const JUDGE_FLEET: Judge[] = [
  judge(),
  judge({
    id: '0192a000-0000-7000-8000-00000000a102',
    name: 'qhh-judge-02',
    load: 0.18,
    ping: 0.014,
    lastIp: '10.20.0.12',
  }),
  judge({
    id: '0192a000-0000-7000-8000-00000000a103',
    name: 'qhh-judge-03',
    load: 0.04,
    ping: 0.023,
    busy: 3,
    runtimes: [...RUNTIMES, { language: 'PAS', name: 'fpc', version: '3.2.2', priority: 90 }],
  }),
  judge({
    id: '0192a000-0000-7000-8000-00000000a104',
    name: 'qhh-judge-04',
    online: false,
    isDisabled: true,
    load: null,
    ping: null,
    busy: 0,
  }),
  judge({
    id: '0192a000-0000-7000-8000-00000000a105',
    name: 'thu-nghiem',
    online: false,
    isBlocked: true,
    load: null,
    ping: null,
    slots: 2,
    busy: 0,
    build: '',
    lastIp: '113.161.40.7',
    runtimes: RUNTIMES.slice(0, 2),
  }),
];
