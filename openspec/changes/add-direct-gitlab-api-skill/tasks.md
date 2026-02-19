## Implementation Tasks

- [x] 1. Add CI unit-test job for thin GitLab client
  - [x] 1.1 Add a blocking test-stage job that runs Node thin-client tests in CI.
  - [x] 1.2 Add unit tests for auth headers, missing token behavior, error normalization, retry policy, pagination bounds, and structured JSON envelopes.
  - [x] 1.3 Ensure tests use mocked HTTP responses for deterministic, offline execution.

- [x] 2. Add CI integration job for sandbox GitLab examples
  - [x] 2.1 Add a separate integration-stage job configured for manual/scheduled execution.
  - [x] 2.2 Add integration checks for read operations and write operations against sandbox configuration.
  - [x] 2.3 Add cleanup logic to close created test issues/MRs and delete test branches.

- [x] 3. Validate both jobs after implementation
  - [x] 3.1 Run thin-client unit tests locally to verify CI command behavior.
  - [x] 3.2 Run integration tests against configured GitLab sandbox credentials.
  - [ ] 3.3 Confirm CI integration job behavior in GitLab pipeline (manual/scheduled).

- [x] 4. Add skill package for direct GitLab API access
  - [x] 4.1 Add `SKILL.md` with environment prompts for missing `GITLAB_BASE_URL`/`GITLAB_TOKEN`.
  - [x] 4.2 Add references with API examples for all V1 read/write workflows.
  - [x] 4.3 Ensure every example is covered by integration tests.

  - [x] 4.4 Add unit tests for scripts/ci/gitlab-smoke.mjs behavior.
