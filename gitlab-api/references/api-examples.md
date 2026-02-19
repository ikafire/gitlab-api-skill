# Direct GitLab API Examples

## Prerequisites

- `GITLAB_BASE_URL`
- `GITLAB_TOKEN`
- `PROJECT_PATH` (project path like `group/project`)
- `PROJECT_ENCODED` (URL-encoded project path)


Set encoded project path before running examples:

```bash
PROJECT_PATH="group/project"
PROJECT_ENCODED=$(python -c 'import urllib.parse,os;print(urllib.parse.quote(os.environ["PROJECT_PATH"], safe=""))')
```

## Read examples

### 1) Read project by path

```bash
node gitlab-api/scripts/run-gitlab-api.mjs \
  --method GET \
  --endpoint "/projects/${PROJECT_ENCODED}"
```

### 2) List merge requests for project

```bash
node gitlab-api/scripts/run-gitlab-api.mjs \
  --method GET \
  --endpoint "/projects/${PROJECT_ENCODED}/merge_requests?state=opened&per_page=20"
```

### 3) List issues for project

```bash
node gitlab-api/scripts/run-gitlab-api.mjs \
  --method GET \
  --endpoint "/projects/${PROJECT_ENCODED}/issues?state=opened&per_page=20"
```

### 4) List pipelines for project

```bash
node gitlab-api/scripts/run-gitlab-api.mjs \
  --method GET \
  --endpoint "/projects/${PROJECT_ENCODED}/pipelines?per_page=20"
```

### 5) Read repository tree

```bash
node gitlab-api/scripts/run-gitlab-api.mjs \
  --method GET \
  --endpoint "/projects/${PROJECT_ENCODED}/repository/tree?ref=main&per_page=20"
```

### 6) Read repository file content metadata

```bash
node gitlab-api/scripts/run-gitlab-api.mjs \
  --method GET \
  --endpoint "/projects/${PROJECT_ENCODED}/repository/files/README.md?ref=main"
```

## Write examples

### 7) Create issue

```bash
node gitlab-api/scripts/run-gitlab-api.mjs \
  --method POST \
  --endpoint "/projects/${PROJECT_ENCODED}/issues" \
  --body '{"title":"Example issue from API","description":"Created by skill example"}'
```

### 8) Add note to issue

```bash
node gitlab-api/scripts/run-gitlab-api.mjs \
  --method POST \
  --endpoint "/projects/${PROJECT_ENCODED}/issues/${ISSUE_IID}/notes" \
  --body '{"body":"Example issue note"}'
```

### 9) Create merge request

```bash
node gitlab-api/scripts/run-gitlab-api.mjs \
  --method POST \
  --endpoint "/projects/${PROJECT_ENCODED}/merge_requests" \
  --body '{"source_branch":"example-source","target_branch":"main","title":"Example MR from API"}'
```

### 10) Add note to merge request

```bash
node gitlab-api/scripts/run-gitlab-api.mjs \
  --method POST \
  --endpoint "/projects/${PROJECT_ENCODED}/merge_requests/${MR_IID}/notes" \
  --body '{"body":"Example MR note"}'
```
