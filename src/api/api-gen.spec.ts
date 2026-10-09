/// <reference types="node" />
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SCRIPT = join(process.cwd(), 'scripts/api-gen.mjs');
const BACKEND_SPEC = {
  openapi: '3.0.0',
  info: { title: 't', version: '1' },
  paths: {
    '/api/internal/ping': {
      get: {
        responses: {
          '200': {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data'],
                  properties: { data: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
  },
};

let dir: string;
const generatedDir = () => join(dir, 'generated');
const backendFile = () => join(dir, 'backend.json');
const run = (args: string[], env: Record<string, string> = {}) =>
  spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      API_GEN_DIR: generatedDir(),
      OPENAPI_SPEC: backendFile(),
      OPENAPI_SOURCE_SHA: '',
      ...env,
    },
  });
const git = (...args: string[]) =>
  spawnSync(
    'git',
    [
      '-C',
      dir,
      '-c',
      'user.name=t',
      '-c',
      'user.email=t@example.com',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { encoding: 'utf8' },
  );

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'api-gen-'));
  writeFileSync(backendFile(), JSON.stringify(BACKEND_SPEC));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('api:gen', { timeout: 30_000 }, () => {
  it('copies the backend document byte for byte and generates types for its routes', () => {
    expect(run([]).status).toBe(0);
    expect(readFileSync(join(generatedDir(), 'openapi.json'), 'utf8')).toBe(
      readFileSync(backendFile(), 'utf8'),
    );
    const schema = readFileSync(join(generatedDir(), 'schema.d.ts'), 'utf8');
    expect(schema).toContain('Do not edit');
    expect(schema).toContain('"/api/internal/ping"');
  });

  it('names the missing file and exits non-zero when the backend document is absent', () => {
    const result = run([], { OPENAPI_SPEC: join(dir, 'missing.json') });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('missing.json');
    expect(result.stderr).toContain('OPENAPI_SPEC');
  });

  it('records the sha it was told, one line', () => {
    run([], { OPENAPI_SOURCE_SHA: 'abc123' });
    expect(readFileSync(join(generatedDir(), 'openapi.source'), 'utf8')).toBe('abc123\n');
  });

  it('records the commit of the backend checkout, marks uncommitted changes, says unknown outside git', () => {
    run([]);
    expect(readFileSync(join(generatedDir(), 'openapi.source'), 'utf8')).toBe('unknown\n');
    git('init', '-q');
    git('add', 'backend.json');
    git('commit', '-q', '-m', 'backend');
    const sha = git('rev-parse', 'HEAD').stdout.trim();
    run([]);
    expect(readFileSync(join(generatedDir(), 'openapi.source'), 'utf8')).toBe(`${sha}\n`);
    writeFileSync(
      backendFile(),
      JSON.stringify({ ...BACKEND_SPEC, info: { title: 'u', version: '2' } }),
    );
    run([]);
    expect(readFileSync(join(generatedDir(), 'openapi.source'), 'utf8')).toBe(`${sha}-dirty\n`);
  });
});

describe('api:check', { timeout: 30_000 }, () => {
  it('passes right after a generation', () => {
    run([]);
    expect(run(['--check']).status).toBe(0);
  });

  it('fails when schema.d.ts was edited by hand', () => {
    run([]);
    writeFileSync(join(generatedDir(), 'schema.d.ts'), '// edited\n', { flag: 'a' });
    const result = run(['--check']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('stale');
  });

  it('fails when the snapshot changed but the types were not regenerated', () => {
    run([]);
    const snapshot = join(generatedDir(), 'openapi.json');
    const changed = JSON.parse(readFileSync(snapshot, 'utf8'));
    changed.paths['/api/internal/pong'] = changed.paths['/api/internal/ping'];
    writeFileSync(snapshot, JSON.stringify(changed));
    expect(run(['--check']).status).toBe(1);
  });

  it('tells the reader to run api:gen when nothing was generated yet, not a raw ENOENT', () => {
    const result = run(['--check']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('api:gen');
    expect(result.stderr).not.toContain('ENOENT');
  });

  it('with --backend passes while the snapshot equals the backend document', () => {
    run([]);
    expect(run(['--check', '--backend']).status).toBe(0);
  });

  it('with --backend fails, naming api:gen, once the backend document moved on', () => {
    run([]);
    writeFileSync(
      backendFile(),
      JSON.stringify({ ...BACKEND_SPEC, info: { title: 'u', version: '2' } }),
    );
    const result = run(['--check', '--backend']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('differs');
    expect(result.stderr).toContain('api:gen');
  });

  it('with --backend skips, and passes, when there is no backend checkout', () => {
    run([]);
    const result = run(['--check', '--backend'], { OPENAPI_SPEC: join(dir, 'absent.json') });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('skipped');
    expect(existsSync(join(dir, 'absent.json'))).toBe(false);
  });
});
