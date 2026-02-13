## Why

The current GitLab access path depends on MCP tools, which limits portability and makes the skill unusable when MCP is unavailable. We need a direct GitLab API skill so agents can query and act on GitLab with standard HTTP authentication in more environments.

## What Changes

- Add a new agent skill that uses GitLab REST APIs directly instead of MCP transport.
- Define authentication expectations (for example personal access token via environment variable) and required permission scopes.
- Implement a minimum-scripting model with one thin shared HTTP client only (auth, retries, pagination, normalized JSON output).
- Provide workflow-first documentation and references so the agent can compose operations from docs rather than many dedicated helper scripts.
- Cover core workflows: listing/reading projects, issues, merge requests, pipelines, repository reads, plus creating issue, creating MR, and creating comments.
- Preserve existing MCP-based workflows as-is; this change introduces an alternative path, not a removal.

## Capabilities

### New Capabilities
- `direct-gitlab-api-access`: Define behavior for the thin shared client plus workflow documentation contract, covering core reads and create issue/MR/comment workflows with reliability/error guarantees.

### Modified Capabilities
- None.

## Impact

- Affected areas: skill definitions and references in this repository, plus a minimal shared helper script.
- External dependencies: GitLab HTTP APIs and an access token provided by runtime environment.
- Operational impact: reduced dependency on MCP availability, low scripting footprint, and higher dependence on high-quality workflow documentation.
