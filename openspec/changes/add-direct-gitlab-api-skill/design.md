## Context

The current GitLab workflow in this environment depends on MCP-backed GitLab tools. This change introduces a direct GitLab API skill that works without MCP transport and remains usable in constrained environments where MCP is unavailable. The proposal defines a new capability, `direct-gitlab-api-access`, and explicitly keeps MCP deprecation/removal out of this change.

The design targets an agent-skill implementation that is practical in this repository and cross-platform for common agent runtimes. The GitLab instance is self-hosted and exposes REST v4 and GraphQL endpoints.

## Goals / Non-Goals

**Goals:**
- Provide a new skill that can read and write key GitLab resources directly via HTTP APIs.
- Standardize authentication and request handling for direct API calls via a single thin shared client.
- Deliver a reliable core surface for day-to-day workflows with minimal scripting:
  - Read: projects, merge requests, issues, pipelines, repository metadata/files.
  - Write: create issue, create merge request, and issue/MR comments (notes).
- Make workflow behavior documentation-first so the agent can infer and compose operations from references.
- Keep outputs structured and machine-parseable for predictable agent behavior.

**Non-Goals:**
- Deprecating or removing existing MCP GitLab tools in this change.
- Full parity with every MCP operation in V1.
- Implementing high-risk write operations (merge, branch mutation, release management) in V1.

## Decisions

### 1) Runtime and execution model
- Decision: Use one Node-based thin HTTP client invoked via `shell_command`; avoid workflow-specific script proliferation.
- Rationale: Node is already a baseline runtime in this environment, gives consistent cross-OS behavior, and avoids shell-specific quoting pitfalls for JSON-heavy API usage while keeping scripting minimal.
- Alternatives considered:
  - PowerShell/curl-only approach: lower setup but higher quoting/parsing complexity across OSes.
  - Python helper: maintainable but adds a separate runtime dependency not guaranteed in all agent environments.

### 2) API strategy
- Decision: REST-first with selective GraphQL usage.
- Rationale: GitLab REST v4 provides straightforward, stable coverage for core CRUD and note operations. GraphQL is reserved for read-heavy aggregation where REST requires excessive round-trips.
- Alternatives considered:
  - REST-only: simplest, but less efficient for nested views.
  - GraphQL-heavy: flexible retrieval but higher schema coupling and complexity for writes.

### 3) Skill structure
- Decision: Create one primary skill for direct access with progressive disclosure:
  - `SKILL.md` for trigger guidance and operational workflow.
  - `scripts/` containing only one shared thin client.
  - `references/` as the main source of workflow mapping and endpoint examples.
- Rationale: Keeps context lean, minimizes implementation surface area, and lets the agent derive workflows from documentation.

### 4) Authentication and configuration contract
- Decision: Environment-variable based configuration.
  - `GITLAB_BASE_URL` (default self-hosted URL)
  - `GITLAB_TOKEN` (PAT/project/group token)
  - Optional `GITLAB_API_VERSION` (default `v4`)
- Rationale: Aligns with existing agent workflows and avoids hardcoded secrets.

### 5) Error and response contract
- Decision: Normalize failures and always emit JSON responses from helper scripts.
- Rationale: Predictable behavior for downstream agent reasoning.
- Standard error envelope fields:
  - `error.type` (`auth`, `rate_limit`, `not_found`, `validation`, `network`, `unknown`)
  - `error.status`
  - `error.message`
  - `error.request_id` (when provided by GitLab)

### 6) Reliability controls
- Decision: Add pagination, timeout, and retry policy in request layer.
- Proposed defaults:
  - Pagination with explicit `per_page` and bounded traversal.
  - Retry for `429` and `5xx` with exponential backoff and cap.
  - No retry for `4xx` validation/auth errors.
- Rationale: Balances resilience and predictable failure.

### 7) V1 operation scope
- Decision: Implement core reads plus create-issue, create-MR, and note/comment writes in V1.
- Included reads:
  - Resolve project by path/id.
  - List/get MRs, issues, pipelines.
  - Retrieve notes/discussions for MR/issue.
  - Repository tree and file-content reads.
- Included writes:
  - Create issue.
  - Create merge request.
  - Create MR note.
  - Create issue note.
- Rationale: Covers core collaboration flows while still preserving a minimum-scripting architecture.

## Risks / Trade-offs

- [Scope gap vs MCP surface] -> Mitigation: Publish explicit V1 scope and include extension references for additional endpoints.
- [Doc quality directly impacts behavior under minimum-scripting approach] -> Mitigation: Require workflow references to define endpoint, required params, and example request/response patterns for each supported workflow.
- [Token scope misconfiguration causes write failures] -> Mitigation: Document minimum required scopes and add clear auth error messages.
- [API rate limits and transient failures] -> Mitigation: Centralized retry/backoff and normalized rate-limit errors.
- [GraphQL schema drift or complexity] -> Mitigation: Keep GraphQL selective and optional; maintain REST as primary path.
- [Cross-platform command invocation differences] -> Mitigation: Keep HTTP logic inside Node scripts; keep shell invocations thin.

## Migration Plan

1. Add the new direct-access skill scaffold and one shared thin client script.
2. Implement shared HTTP client behavior (auth headers, retries, pagination, normalized errors).
3. Add workflow references for V1 operations (core reads + create issue/MR + note writes) with required parameters and examples.
4. Implement invocation patterns that route workflow calls through the thin client.
5. Validate with representative scenarios against the self-hosted GitLab instance.
6. Keep MCP workflow untouched during this change; adoption/migration to replacement occurs in a separate change.

Rollback strategy:
- If regressions appear, disable usage of the new skill and continue using current MCP-based workflow, since no MCP removal is included here.

## Open Questions

- None for this change scope.
