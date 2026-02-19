# CI Setup for gitlab-api

To run integration tests in GitLab CI, configure the following **masked** CI/CD variables:

- `GITLAB_BASE_URL` (example: `https://gitlab.com`)
- `GITLAB_TOKEN` (PAT with API scope and permissions to read/write in test project)
- `GITLAB_TEST_PROJECT` (project path, example: `ikafire1230/skill-test-ground`)

Optional variables:

- `GITLAB_HTTP_TRANSPORT` (default in CI job is `curl`)
- `GITLAB_MAX_PAGES`
- `GITLAB_PER_PAGE`

## Recommended variable protection

- Mark all GitLab credential variables as **Masked**.
- Mark as **Protected** if integration should only run on protected branches.
- Use a dedicated sandbox project for write tests.

## Branch behavior

- `integration-gitlab` runs automatically on `main`.
- It can also run manually for `web` and merge-request pipelines.
- It can run on schedules for regular smoke/integration checks.

## Runner requirements

- Node 20 image support (job uses `node:20`).
- Network access to `GITLAB_BASE_URL`.

## Notes

The integration suite creates and then cleans up issues, merge requests, and temporary branches.
