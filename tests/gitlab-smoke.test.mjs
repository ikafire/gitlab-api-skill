import test from 'node:test';
import assert from 'node:assert/strict';

import { cleanupSmoke, requireEnv, runSmoke } from '../scripts/ci/gitlab-smoke.mjs';

test('requireEnv throws on missing value', () => {
  assert.throws(() => requireEnv('MISSING', {}), /Missing required environment variable: MISSING/);
});

test('runSmoke executes read/write flow and records cleanup', async () => {
  const calls = [];
  const requestFn = async (config) => {
    calls.push(config);
    if (config.endpoint.endsWith('/pipelines')) {
      return { ok: true, data: [{ id: 1 }] };
    }
    if (config.endpoint.includes('/issues/') && config.endpoint.endsWith('/notes')) {
      return { ok: true, data: { id: 300 } };
    }
    if (config.endpoint.endsWith('/issues')) {
      return { ok: true, data: { iid: 11 } };
    }
    if (config.endpoint.endsWith('/merge_requests')) {
      return { ok: true, data: { iid: 22 } };
    }
    if (config.endpoint.includes('/merge_requests/') && config.endpoint.endsWith('/notes')) {
      return { ok: true, data: { id: 400 } };
    }
    return { ok: true, data: { id: 99 } };
  };

  const paginateFn = async (cfg) => {
    calls.push({ type: 'paginate', ...cfg });
    return { ok: true, data: [{ id: 1 }, { id: 2 }] };
  };

  const result = await runSmoke({
    baseUrl: 'https://gitlab.com',
    token: 'token',
    project: 'group/project',
    sourceBranch: 's',
    targetBranch: 't',
    requestFn,
    paginateFn,
    now: () => 42
  });

  assert.equal(result.ok, true);
  assert.equal(result.checks.issueIid, 11);
  assert.equal(result.checks.mergeRequest.skipped, false);
  assert.deepEqual(result.cleanup, { issues: [11], mergeRequests: [22] });
});

test('runSmoke skips MR when branches are missing', async () => {
  const requestFn = async (config) => {
    if (config.endpoint.endsWith('/issues')) return { ok: true, data: { iid: 1 } };
    if (config.endpoint.includes('/issues/') && config.endpoint.endsWith('/notes')) {
      return { ok: true, data: { id: 2 } };
    }
    return { ok: true, data: { id: 3 } };
  };

  const paginateFn = async () => ({ ok: true, data: [] });

  const result = await runSmoke({
    baseUrl: 'https://gitlab.com',
    token: 'token',
    project: 'group/project',
    requestFn,
    paginateFn
  });

  assert.equal(result.ok, true);
  assert.equal(result.checks.mergeRequest.skipped, true);
  assert.deepEqual(result.cleanup, { issues: [1], mergeRequests: [] });
});

test('cleanupSmoke closes created artifacts', async () => {
  const calls = [];
  await cleanupSmoke({
    project: 'group/project',
    cleanup: { issues: [7], mergeRequests: [8] },
    requestFn: async (config) => {
      calls.push(config);
      return { ok: true };
    }
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].method, 'PUT');
  assert.match(calls[0].endpoint, /issues\/7$/);
  assert.match(calls[1].endpoint, /merge_requests\/8$/);
});
