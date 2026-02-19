import test from 'node:test';
import assert from 'node:assert/strict';

import { apiRequest, paginatedRequest } from '../gitlab-api/scripts/gitlab-thin-client.mjs';

function buildResponse({ status = 200, body = {}, headers = {} }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return headers[name.toLowerCase()] ?? null;
      }
    },
    async text() {
      return body === null ? '' : JSON.stringify(body);
    }
  };
}

test('returns auth error when token is missing', async () => {
  const result = await apiRequest({
    endpoint: '/projects',
    token: '',
    baseUrl: 'https://gitlab.example.com'
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.type, 'auth');
});

test('sends bearer token in authorization header', async () => {
  let captured;
  const result = await apiRequest({
    endpoint: '/projects',
    token: 'abc123',
    baseUrl: 'https://gitlab.example.com',
    fetchImpl: async (_url, init) => {
      captured = init.headers.Authorization;
      return buildResponse({ status: 200, body: [] });
    }
  });

  assert.equal(result.ok, true);
  assert.equal(captured, 'Bearer abc123');
});

test('normalizes 404 to not_found', async () => {
  const result = await apiRequest({
    endpoint: '/projects/123',
    token: 'abc123',
    baseUrl: 'https://gitlab.example.com',
    fetchImpl: async () => buildResponse({ status: 404, body: { message: '404 Project Not Found' } })
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.type, 'not_found');
  assert.equal(result.error.status, 404);
});

test('retries 429 responses until success', async () => {
  let calls = 0;
  const result = await apiRequest({
    endpoint: '/projects',
    token: 'abc123',
    baseUrl: 'https://gitlab.example.com',
    retries: 2,
    fetchImpl: async () => {
      calls += 1;
      if (calls < 3) {
        return buildResponse({ status: 429, body: { message: 'Too many requests' } });
      }
      return buildResponse({ status: 200, body: [{ id: 1 }] });
    }
  });

  assert.equal(result.ok, true);
  assert.equal(calls, 3);
});

test('pagination collects results within max page bound', async () => {
  const pages = [
    [{ id: 1 }, { id: 2 }],
    [{ id: 3 }]
  ];
  let idx = 0;

  const result = await paginatedRequest({
    endpoint: '/projects',
    perPage: 2,
    maxPages: 4,
    requestFn: async () => {
      const data = pages[idx] ?? [];
      idx += 1;
      return { ok: true, status: 200, data };
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.page_count, 2);
  assert.deepEqual(result.data.map((x) => x.id), [1, 2, 3]);
});

test('returns structured JSON envelope for failures', async () => {
  const result = await apiRequest({
    endpoint: '/projects',
    token: 'abc123',
    baseUrl: 'https://gitlab.example.com',
    fetchImpl: async () => buildResponse({ status: 401, body: { message: 'Unauthorized' } })
  });

  assert.equal(result.ok, false);
  assert.ok(result.error);
  assert.equal(typeof result.error.message, 'string');
  assert.equal(result.error.type, 'auth');
});
