# CI Setup for gitlab-api

To run integration tests in GitHub Actions, configure the following repository secrets:

- `GITLAB_BASE_URL` (example: `https://gitlab.com`)
- `GITLAB_TOKEN` (PAT with API scope and permissions to read/write in test project)
- `GITLAB_TEST_PROJECT` (project path, example: `ikafire1230/skill-test-ground`)

Optional runtime variables are configured directly in `.github/workflows/ci.yml`:

- `GITLAB_HTTP_TRANSPORT` (set to `curl`)
- `GITLAB_MAX_PAGES`
- `GITLAB_PER_PAGE`

## Recommended secret protection

- Keep all GitLab credentials in GitHub **Actions secrets**.
- Use a dedicated sandbox project for write tests.
- Restrict repository/environment access so only trusted workflows can read secrets.

## Workflow behavior

- `unit-tests` runs on every push.
- `integration-gitlab` runs automatically on pushes to `main`.
- `integration-gitlab` can also be run manually through `workflow_dispatch`.

## Runner requirements

- Ubuntu runner with Node.js 20 support (`actions/setup-node@v4`).
- Network access to `GITLAB_BASE_URL`.

## Notes

The integration suite creates and then cleans up issues, merge requests, and temporary branches.
