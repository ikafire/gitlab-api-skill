import { apiRequest, paginatedRequest } from '../../gitlab-api/scripts/gitlab-thin-client.mjs';

export function requireEnv(name, env = process.env) {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function ensureOk(result, label) {
  if (!result.ok) {
    throw new Error(`${label} failed: ${JSON.stringify(result)}`);
  }
}

export async function runSmoke({
  baseUrl,
  token,
  project,
  sourceBranch,
  targetBranch,
  requestFn,
  paginateFn,
  now = () => Date.now()
}) {
  const cleanup = {
    issues: [],
    mergeRequests: []
  };

  const request =
    requestFn ||
    (async (config) =>
      apiRequest({
        ...config,
        baseUrl,
        token
      }));

  const paginate =
    paginateFn ||
    ((config) =>
      paginatedRequest({
        ...config,
        requestFn: (cfg) => request(cfg)
      }));

  const encodedProject = encodeURIComponent(project);

  try {
    const projectResult = await request({ endpoint: `/projects/${encodedProject}` });
    ensureOk(projectResult, 'Read project');

    const pipelineResult = await paginate({ endpoint: `/projects/${encodedProject}/pipelines` });
    ensureOk(pipelineResult, 'List pipelines');

    const issueCreate = await request({
      method: 'POST',
      endpoint: `/projects/${encodedProject}/issues`,
      body: {
        title: `CI smoke issue ${now()}`,
        description: 'Created by CI smoke test.'
      }
    });
    ensureOk(issueCreate, 'Create issue');
    cleanup.issues.push(issueCreate.data.iid);

    const noteCreate = await request({
      method: 'POST',
      endpoint: `/projects/${encodedProject}/issues/${issueCreate.data.iid}/notes`,
      body: {
        body: 'CI smoke note'
      }
    });
    ensureOk(noteCreate, 'Create issue note');

    let mrCreate;
    if (!sourceBranch || !targetBranch) {
      mrCreate = {
        skipped: true,
        reason: 'Set GITLAB_TEST_SOURCE_BRANCH and GITLAB_TEST_TARGET_BRANCH to enable MR creation smoke.'
      };
    } else {
      const mrResult = await request({
        method: 'POST',
        endpoint: `/projects/${encodedProject}/merge_requests`,
        body: {
          source_branch: sourceBranch,
          target_branch: targetBranch,
          title: `CI smoke MR ${now()}`,
          remove_source_branch: false
        }
      });
      ensureOk(mrResult, 'Create merge request');
      cleanup.mergeRequests.push(mrResult.data.iid);

      const mrNoteResult = await request({
        method: 'POST',
        endpoint: `/projects/${encodedProject}/merge_requests/${mrResult.data.iid}/notes`,
        body: {
          body: 'CI smoke MR note'
        }
      });
      ensureOk(mrNoteResult, 'Create merge request note');

      mrCreate = {
        skipped: false,
        iid: mrResult.data.iid,
        noteId: mrNoteResult.data.id
      };
    }

    return {
      ok: true,
      checks: {
        projectId: projectResult.data.id,
        pipelines: pipelineResult.data.length,
        issueIid: issueCreate.data.iid,
        issueNoteId: noteCreate.data.id,
        mergeRequest: mrCreate
      },
      cleanup
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      cleanup
    };
  }
}

export async function cleanupSmoke({ project, cleanup, requestFn }) {
  const encodedProject = encodeURIComponent(project);

  for (const iid of cleanup.issues) {
    await requestFn({
      method: 'PUT',
      endpoint: `/projects/${encodedProject}/issues/${iid}`,
      body: { state_event: 'close' }
    });
  }

  for (const iid of cleanup.mergeRequests) {
    await requestFn({
      method: 'PUT',
      endpoint: `/projects/${encodedProject}/merge_requests/${iid}`,
      body: { state_event: 'close' }
    });
  }
}

async function main() {
  const baseUrl = requireEnv('GITLAB_BASE_URL');
  const token = requireEnv('GITLAB_TOKEN');
  const project = requireEnv('GITLAB_TEST_PROJECT');
  const sourceBranch = process.env.GITLAB_TEST_SOURCE_BRANCH;
  const targetBranch = process.env.GITLAB_TEST_TARGET_BRANCH;

  const request = async (config) =>
    apiRequest({
      ...config,
      baseUrl,
      token
    });

  const result = await runSmoke({ baseUrl, token, project, sourceBranch, targetBranch, requestFn: request });

  if (!result.ok) {
    console.error(`Smoke test failed: ${result.error}`);
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ ok: true, checks: result.checks }, null, 2));
  }

  await cleanupSmoke({ project, cleanup: result.cleanup, requestFn: request });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
