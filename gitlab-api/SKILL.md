---
name: gitlab-api
description: Direct GitLab REST API skill using local scripts only for project, merge request, issue, pipeline, repository tree/file, and note workflows.
---

# GitLab API Skill

Use this skill when a user asks to read or write GitLab resources via direct REST API calls.

## Trigger conditions

- Read project, merge request, issue, pipeline, repository tree, or file data.
- Create issues, create merge requests, or add notes/comments.
- MCP GitLab tools are unavailable and direct HTTP is required.

## Required environment checks

Before any API call, check:

1. `GITLAB_BASE_URL`
2. `GITLAB_TOKEN`

If either is missing, ask the user:

- `I need GITLAB_BASE_URL (for example https://gitlab.com) to call the GitLab API. Please provide it.`
- `I need GITLAB_TOKEN to authenticate GitLab API requests. Please provide a token with required scopes.`

## How to run

Use only local scripts in `gitlab-api/scripts`.

```bash
node gitlab-api/scripts/run-gitlab-api.mjs \
  --method GET \
  --endpoint "/projects/${PROJECT_ENCODED}"
```

- `--method`: HTTP method (default `GET`)
- `--endpoint`: GitLab API endpoint path after `/api/v4`
- `--body`: optional JSON string for write operations

Return JSON output as-is. On failure, surface `error.type`, `error.status`, and `error.message`.

## API examples

Load `gitlab-api/references/api-examples.md` for endpoint mappings and examples.

