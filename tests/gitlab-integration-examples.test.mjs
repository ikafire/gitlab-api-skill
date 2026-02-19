import test from 'node:test';
import assert from 'node:assert/strict';

import { apiRequest } from '../gitlab-api/scripts/gitlab-thin-client.mjs';

function required(name) {
  const value = process.env[name];
  assert.ok(value, `Missing ${name}`);
  return value;
}

const baseUrl = required('GITLAB_BASE_URL');
const token = required('GITLAB_TOKEN');
const projectPath = required('GITLAB_TEST_PROJECT');
const encodedProject = encodeURIComponent(projectPath);

const created = {
  issues: [],
  mergeRequests: [],
  branches: []
};

async function request({ method = 'GET', endpoint, body }) {
  return apiRequest({
    method,
    endpoint,
    body,
    baseUrl,
    token,
    transport: process.env.GITLAB_HTTP_TRANSPORT || 'curl'
  });
}

function ensureOk(result, label) {
  assert.equal(result.ok, true, `${label}: ${JSON.stringify(result)}`);
}

let issueIid;
let mrIid;
let sourceBranch;

test('example 1: read project by path', async () => {
  const res = await request({ endpoint: `/projects/${encodedProject}` });
  ensureOk(res, 'read project');
  assert.equal(res.data.path_with_namespace.toLowerCase(), projectPath.toLowerCase());
});

test('example 2: list merge requests for project', async () => {
  const res = await request({ endpoint: `/projects/${encodedProject}/merge_requests?state=opened&per_page=20` });
  ensureOk(res, 'list merge requests');
  assert.ok(Array.isArray(res.data));
});

test('example 3: list issues for project', async () => {
  const res = await request({ endpoint: `/projects/${encodedProject}/issues?state=opened&per_page=20` });
  ensureOk(res, 'list issues');
  assert.ok(Array.isArray(res.data));
});

test('example 4: list pipelines for project', async () => {
  const res = await request({ endpoint: `/projects/${encodedProject}/pipelines?per_page=20` });
  ensureOk(res, 'list pipelines');
  assert.ok(Array.isArray(res.data));
});

test('example 5: read repository tree', async () => {
  const res = await request({ endpoint: `/projects/${encodedProject}/repository/tree?ref=main&per_page=20` });
  ensureOk(res, 'read repository tree');
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length > 0);
});

test('example 6: read repository file content metadata', async () => {
  const res = await request({ endpoint: `/projects/${encodedProject}/repository/files/README.md?ref=main` });
  ensureOk(res, 'read repository file');
  assert.equal(res.data.file_path, 'README.md');
});

test('example 7: create issue', async () => {
  const res = await request({
    method: 'POST',
    endpoint: `/projects/${encodedProject}/issues`,
    body: {
      title: `Example issue from API ${Date.now()}`,
      description: 'Created by integration test examples.'
    }
  });
  ensureOk(res, 'create issue');
  issueIid = res.data.iid;
  created.issues.push(issueIid);
  assert.ok(issueIid > 0);
});

test('example 8: add note to issue', async () => {
  assert.ok(issueIid, 'issueIid must exist from example 7');
  const res = await request({
    method: 'POST',
    endpoint: `/projects/${encodedProject}/issues/${issueIid}/notes`,
    body: { body: 'Example issue note from integration tests.' }
  });
  ensureOk(res, 'add issue note');
  assert.ok(res.data.id > 0);
});

test('example 9: create merge request', async () => {
  const projectRes = await request({ endpoint: `/projects/${encodedProject}` });
  ensureOk(projectRes, 'read project before mr');
  const defaultBranch = projectRes.data.default_branch || 'main';

  sourceBranch = `ci-example-${Date.now()}`;

  const branchRes = await request({
    method: 'POST',
    endpoint: `/projects/${encodedProject}/repository/branches`,
    body: {
      branch: sourceBranch,
      ref: defaultBranch
    }
  });
  ensureOk(branchRes, 'create source branch');
  created.branches.push(sourceBranch);

  const mrRes = await request({
    method: 'POST',
    endpoint: `/projects/${encodedProject}/merge_requests`,
    body: {
      source_branch: sourceBranch,
      target_branch: defaultBranch,
      title: `Example MR from API ${Date.now()}`
    }
  });
  ensureOk(mrRes, 'create merge request');
  mrIid = mrRes.data.iid;
  created.mergeRequests.push(mrIid);
  assert.ok(mrIid > 0);
});

test('example 10: add note to merge request', async () => {
  assert.ok(mrIid, 'mrIid must exist from example 9');
  const res = await request({
    method: 'POST',
    endpoint: `/projects/${encodedProject}/merge_requests/${mrIid}/notes`,
    body: { body: 'Example MR note from integration tests.' }
  });
  ensureOk(res, 'add merge request note');
  assert.ok(res.data.id > 0);
});

test.after(async () => {
  for (const iid of created.mergeRequests) {
    await request({
      method: 'PUT',
      endpoint: `/projects/${encodedProject}/merge_requests/${iid}`,
      body: { state_event: 'close' }
    });
  }

  for (const iid of created.issues) {
    await request({
      method: 'PUT',
      endpoint: `/projects/${encodedProject}/issues/${iid}`,
      body: { state_event: 'close' }
    });
  }

  for (const branch of created.branches) {
    await request({
      method: 'DELETE',
      endpoint: `/projects/${encodedProject}/repository/branches/${encodeURIComponent(branch)}`
    });
  }
});
