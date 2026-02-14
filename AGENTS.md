# Repository Guidelines

## Project Structure & Module Organization
This repository is organized around OpenSpec artifacts and Codex skills.

- `.codex/skills/<skill-name>/SKILL.md`: Skill definitions and usage instructions.
- `openspec/config.yaml`: OpenSpec project configuration.
- `openspec/changes/<change-name>/`: Active change artifacts (for example `proposal.md`, `design.md`, `specs/...`, `tasks.md`).
- `openspec/specs/`: Main/spec baseline capability specs.
- `openspec/changes/archive/`: Archived completed changes.

Use kebab-case for change and capability names (for example `add-direct-gitlab-api-skill`).

## Build, Test, and Development Commands
There is no compile/build pipeline in this repo. Primary workflow commands are OpenSpec and Git:

- `openspec list --json`: List active changes.
- `openspec status --change "<name>"`: Show artifact progress for a change.
- `openspec instructions <artifact> --change "<name>" --json`: Get artifact template/guidance.
- `git status --short`: Check local changes quickly.

Run commands from the repository root.

## Coding Style & Naming Conventions
- Keep Markdown concise, actionable, and requirement-focused.
- Use clear section headings and consistent bullet formatting.
- In specs, use normative language: `SHALL`/`MUST`.
- Requirement format:
  - `### Requirement: <name>`
  - `#### Scenario: <name>` with `WHEN`/`THEN`
- Prefer ASCII text unless a file already requires Unicode.

## Testing Guidelines
Validation is specification-driven:

- Ensure each requirement has at least one scenario.
- Verify change completeness with `openspec status --change "<name>"`.
- For spec updates, confirm capability names in `proposal.md` match folders under `specs/`.
- Before committing, review diff scope with `git diff --stat`.

## Commit & Pull Request Guidelines
- Use Conventional Commits (for example `feat(openspec): add tasks for direct gitlab api skill`).
- Commit after every major step (proposal, design, specs, tasks, implementation).
- Keep commits focused; avoid bundling unrelated edits.
- PRs should include:
  - Purpose and scope summary
  - Linked change path (for example `openspec/changes/<name>/`)
  - Validation evidence (`openspec status` output or equivalent)
  - Risks or follow-up items

## Security & Configuration Tips
- Never commit tokens or secrets.
- Use environment variables for credentials (for example `GITLAB_TOKEN`).
- Keep examples and docs free of real host credentials or internal sensitive data.
