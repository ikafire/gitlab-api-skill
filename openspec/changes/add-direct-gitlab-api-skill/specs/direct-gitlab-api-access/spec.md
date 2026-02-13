## ADDED Requirements

### Requirement: Skill MUST support token-based authentication
The direct GitLab API skill SHALL authenticate requests using a single token from environment configuration (`GITLAB_TOKEN`) and SHALL reject execution when the token is missing.

#### Scenario: Token is present
- **WHEN** the skill executes an API operation and `GITLAB_TOKEN` is set
- **THEN** the request is sent with token authentication headers

#### Scenario: Token is missing
- **WHEN** the skill executes an API operation and `GITLAB_TOKEN` is not set
- **THEN** the skill returns a structured authentication error without making the API call

### Requirement: Skill MUST be REST-first
The skill SHALL use GitLab REST API as the baseline for all V1 workflows and MUST NOT require GraphQL for core operations.

#### Scenario: GraphQL availability
- **WHEN** GraphQL is unavailable or not configured
- **THEN** V1 workflows continue to function using REST only

### Requirement: Skill MUST use a single shared thin client
The skill SHALL route GitLab API execution through one shared thin client script and MUST avoid workflow-specific helper scripts in V1.

#### Scenario: Workflow invocation
- **WHEN** any supported workflow is executed
- **THEN** the request is executed through the shared thin client interface

#### Scenario: Script footprint enforcement
- **WHEN** V1 implementation is reviewed
- **THEN** workflow behavior is defined in documentation and references rather than dedicated per-workflow scripts

### Requirement: Skill MUST normalize errors
The skill SHALL return errors in a stable envelope including error type, status code, and message.

#### Scenario: Authentication failure
- **WHEN** GitLab returns unauthorized/forbidden
- **THEN** the skill maps the response to a normalized `auth` error type

#### Scenario: Resource not found
- **WHEN** GitLab returns not found for project/resource identifiers
- **THEN** the skill maps the response to a normalized `not_found` error type

### Requirement: Skill MUST implement reliability controls
The skill SHALL implement bounded pagination for list endpoints and retry with backoff for retryable failures.

#### Scenario: Paginated list retrieval
- **WHEN** the user requests a list endpoint that spans multiple pages
- **THEN** the skill iterates pages within configured bounds and returns aggregated results

#### Scenario: Rate limit or transient server error
- **WHEN** GitLab responds with HTTP 429 or 5xx
- **THEN** the skill retries with backoff and returns a normalized error if retries are exhausted

### Requirement: Skill MUST produce structured JSON output
The skill SHALL return successful responses and failures as machine-parseable JSON for consistent agent consumption.

#### Scenario: Successful request output
- **WHEN** a GitLab API request succeeds
- **THEN** the thin client returns structured JSON response data

#### Scenario: Failed request output
- **WHEN** a GitLab API request fails
- **THEN** the thin client returns the normalized error envelope as JSON

### Requirement: Workflow documentation SHALL be the primary execution guide
The skill SHALL define supported workflows in references/docs with endpoint mapping, required parameters, and request/response examples so the agent can compose calls with minimal scripting.

#### Scenario: Workflow reference completeness
- **WHEN** a supported workflow is documented
- **THEN** the documentation includes endpoint path, HTTP method, required inputs, optional inputs, and expected output shape

#### Scenario: Agent workflow composition
- **WHEN** the agent needs to execute a supported workflow
- **THEN** the agent uses documentation guidance with the thin shared client rather than requiring a dedicated helper script

### Requirement: Skill SHALL support core GitLab read workflows
The skill SHALL support read operations for projects, merge requests, issues, pipelines, and repository tree/file content through direct GitLab API calls.

#### Scenario: Read project-scoped merge requests
- **WHEN** the user asks to list or retrieve merge requests for a project
- **THEN** the skill returns structured merge request data from GitLab API

#### Scenario: Read project file content
- **WHEN** the user provides a project, file path, and ref for file retrieval
- **THEN** the skill returns file content metadata or a structured not-found error

#### Scenario: Read pipeline status
- **WHEN** the user requests pipeline status for a project
- **THEN** the skill returns pipeline data in structured JSON

### Requirement: Skill SHALL support issue creation workflow
The skill SHALL create GitLab issues when provided required project context and issue title, with optional description and metadata fields.

#### Scenario: Create issue with required inputs
- **WHEN** the user provides project identifier and issue title
- **THEN** the skill creates the issue and returns issue IID and web URL

#### Scenario: Reject invalid issue create request
- **WHEN** required fields for issue creation are missing
- **THEN** the skill returns a structured validation error

### Requirement: Skill SHALL support merge request creation workflow
The skill SHALL create GitLab merge requests when provided required source branch, target branch, and title.

#### Scenario: Create merge request with valid branches
- **WHEN** the user provides valid source branch, target branch, and title
- **THEN** the skill creates the merge request and returns MR IID and web URL

#### Scenario: Reject merge request with invalid branch reference
- **WHEN** source or target branch is invalid for the project
- **THEN** the skill returns a structured validation error

### Requirement: Skill SHALL support note/comment creation workflow
The skill SHALL support adding notes to merge requests and issues.

#### Scenario: Add note to merge request
- **WHEN** the user requests a comment on an existing merge request with valid permissions
- **THEN** the skill creates the note and returns note metadata

#### Scenario: Add note to issue
- **WHEN** the user requests a comment on an existing issue with valid permissions
- **THEN** the skill creates the note and returns note metadata
