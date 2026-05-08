# DevVault

DevVault is a local-first CLI for managing personal GitHub PR contribution work.

It is built for contributors who maintain multiple PRs across repositories and need one reliable place to answer:

- Which PRs need action now?
- Which PRs are waiting on CI, review, or merge?
- Which merged PRs should become portfolio, resume, changelog, or development-log material?
- What prompt should be handed to an agent for a focused follow-up task?

DevVault syncs GitHub PR snapshots into local JSON, classifies each PR, preserves a curated merged-contribution ledger, and generates reviewable Markdown assets for personal publishing workflows.

## Quick Start

Requirements:

- Node.js 20+
- pnpm
- Git
- GitHub CLI, optional but recommended for `gh auth token`

Install dependencies, build the CLI, create a starter config, check the environment, then run the main workflow:

```bash
pnpm install
pnpm build
node dist/cli/index.js init --username <github-user> --repo owner/name
node dist/cli/index.js doctor
node dist/cli/index.js run
```

For local development without rebuilding first, use:

```bash
pnpm dev -- run
```

If `config.yaml` is missing, run `devvault init --username <github-user> --repo owner/name`. Config validation errors include the next repair step where possible.

## Daily Workflow

For normal use, run one command:

```bash
devvault run
```

That command:

- syncs configured GitHub PRs
- classifies PR state and current action kind
- updates `data/prs.json` and `data/contributions.json`
- generates Markdown assets under `output/`
- syncs configured personal-site Markdown files
- optionally commits and pushes personal-site content when explicitly enabled

Useful follow-up commands:

```bash
devvault doctor
devvault status
devvault report --since 7d
devvault curate
devvault branches --repo-path ../some-repo
devvault prompt --pr owner/repo#123 --type fix-ci
```

## Local-First Model

DevVault keeps GitHub data and generated assets on disk. The local files are plain JSON and Markdown, so they can be inspected, edited where appropriate, committed, backed up, or used by other tooling.

- `sync` and `run` read from GitHub and require authentication.
- `status`, `report`, `generate`, and `prompt` can work from the local snapshot after a successful sync.
- `data/contributions.json` is the persistent contribution ledger and preserves curated/manual fields.
- `output/` files are generated artifacts and can be rebuilt from local data.
- Personal-site sync copies generated Markdown into another local repository when configured.

## Configuration

Minimal `config.yaml`:

```yaml
github:
  username: rogerdigital
  token_env: GITHUB_TOKEN

repos:
  - openclaw/openclaw

output:
  directory: output
```

GitHub authentication is resolved in this order:

1. The environment variable named by `github.token_env`.
2. `gh auth token`, when GitHub CLI is authenticated.

Project grouping is optional. Repos from `projects[].repos` are merged with top-level `repos`, and contribution records use the configured project name.

```yaml
projects:
  - name: OpenClaw
    repos:
      - openclaw/openclaw
    site_section: open-source
```

Personal site sync is opt-in:

```yaml
site:
  owner_name: Roger Deng
  tagline: iOS Engineer · AI-native Builder · Open-source Contributor
  sync_directory: ../rogerdigital.github.io
  index_path: src/content/devvault/index.md
  contributions_path: src/content/devvault/contributions.md
  devlog_path: src/content/devvault/devlog.md
  blog_drafts_directory: src/content/devvault/blog-drafts

automation:
  site:
    commit: false
    push: false
    commit_message: update DevVault contribution assets
```

`automation.site.commit` and `automation.site.push` default to disabled behavior. Enable them only when the target personal-site repo path is correct.

When `site.sync_directory` is configured, the directory must already exist. DevVault refuses to create a new personal-site directory implicitly, which helps catch mistyped paths before Markdown is written to the wrong place.

## Commands

| Command | Purpose | Reads | Writes | Network |
| --- | --- | --- | --- | --- |
| `devvault init` | Create starter config and local directories. | CLI options | `config.yaml`, `data/`, `output/` | No |
| `devvault doctor` | Check config, auth, and local paths. | `config.yaml`, environment, optional `gh` | None | No GitHub API call |
| `devvault sync` | Fetch PR snapshots from GitHub. | `config.yaml`, GitHub API | `data/prs.json` | Yes |
| `devvault status` | Show grouped PR state and next actions. | `data/prs.json` | None | No |
| `devvault generate` | Rebuild contribution and Markdown assets. | `config.yaml`, `data/prs.json`, `data/contributions.json` | `data/contributions.json`, `output/`, optional site files | No |
| `devvault run` | Sync PRs, generate assets, and sync site files. | Config, GitHub API, local data | Data, output, optional site repo | Yes |
| `devvault report --since <window>` | Summarize recent activity and current action items. | Local data | None | No |
| `devvault curate` | Interactively accept or edit contribution records. | `data/contributions.json` | `data/contributions.json` | No |
| `devvault branches` | Plan or prune local branches from synced PR data. | `data/prs.json`, target Git repo | Optional branch deletion | No |
| `devvault prompt` | Generate an agent handoff prompt for a PR. | `data/prs.json` | None | No |

### `devvault run`

The main automation command. It syncs PRs, generates assets, syncs configured site files, and prints current action items.

### `devvault status`

Shows PRs grouped as `Needs Action`, `Waiting`, `Merged`, and `Closed`.

Each row includes a lifecycle status and action kind, for example:

```text
owner/repo #123 [ci_failed/fix_ci]
owner/repo #124 [changes_requested/address_review]
owner/repo #125 [merge_conflict/resolve_conflict]
```

Rows may include a warning when GitHub returned only the first page of a large field, for example `Warning: changed files truncated`, `Warning: review comments truncated`, or `Warning: check runs truncated`. Treat those warnings as a signal to inspect the PR directly before making a final decision.

### `devvault report --since <window>`

Summarizes recent PR activity, merged contributions, homepage-ready assets, and current needs-action PRs.

Supported windows:

- `24h`
- `7d`
- `2w`
- ISO date strings

Report output uses the same truncation warnings as `devvault status`.

### `devvault curate`

Reviews contribution records interactively and marks accepted or edited entries as `curated`. Curated fields are preserved when generated data refreshes.

### `devvault branches`

Uses synced PR data to suggest local branch cleanup.

```bash
devvault branches --repo-path ../openclaw
devvault branches --repo-path ../openclaw --prune
```

`--prune` deletes only branches linked to merged PRs after the local branch patch is confirmed to be already included in the current base branch with `git cherry -v`. Fork PR branches, unmatched branches, and branches with unconfirmed local patches are left for manual review.

### `devvault prompt`

Generates agent handoff prompts.

Supported prompt types:

- `fix-ci`
- `address-review`
- `add-test`
- `resolve-conflict`
- `maintainer-reply`
- `resume`
- `summary`

Example:

```bash
devvault prompt --pr openclaw/openclaw#74224 --type summary
```

## Data and Generated Files

```text
data/
  prs.json
  contributions.json

output/
  contributions.md
  changelog.md
  resume-snippets.md
  devlog.md
  website/
    index.md
    contributions.md
    blog-drafts/
```

`data/prs.json` is the local GitHub PR snapshot cache. It is refreshed by `devvault sync` and `devvault run`.

`data/contributions.json` is the durable merged-contribution ledger. Generated fields are refreshed from merged PRs, while curated fields are preserved across regeneration.

`output/` contains generated Markdown assets. These files are meant to be reviewable outputs, not the source of truth.

`output/devlog.md` is updated by daily sections. Re-running on the same day replaces that day's section instead of duplicating it. Older undated development logs are preserved by converting the old `Generated at` timestamp into a dated section before the new daily entry is prepended.

When personal-site sync is configured, DevVault writes the generated website Markdown into the configured site repository paths. The site repository remains a publishing target, not the source of DevVault data.

## Safety and Failure Behavior

DevVault is designed to make automated local workflows recoverable:

- Personal-site commits and pushes are disabled unless `automation.site.commit` or `automation.site.push` is explicitly enabled.
- `site.sync_directory` must already exist; DevVault does not create a new personal-site root implicitly.
- Git and GitHub CLI command failures include focused context and a next repair step where possible.
- `branches --prune` requires both a linked merged PR and local patch confirmation through `git cherry -v`.
- Fork PR branches, unmatched branches, and branches with unconfirmed local patches are left for manual review.
- Large GitHub fields that are only partially fetched are surfaced through truncation warnings in status, report, and development-log output.
- Missing or invalid config errors point to the next command or config field to repair.

## Architecture

```text
src/
  cli/
    commands/
  config/
  github/
  core/
  generators/
  storage/
  types/
tests/
```

Core data flow:

```text
GitHub API
-> PR snapshots
-> PR classification and next action
-> contribution records
-> Markdown assets
-> optional personal-site sync
```

The main stages are:

- Sync: `src/github/` fetches PR metadata, review comments, check runs, and pagination warning signals through the GitHub GraphQL API.
- Classification: `src/core/` turns snapshots into lifecycle statuses and next-action kinds such as `fix_ci`, `address_review`, or `resolve_conflict`.
- Contribution ledger: merged PRs are converted into contribution records and merged with existing curated records.
- Generation: `src/generators/` writes contribution, changelog, resume, development-log, and website Markdown.
- Site sync: `generate` and `run` can copy generated website Markdown into a configured personal-site repository.
- Prompt handoff: `prompt` uses the local PR snapshot to generate focused follow-up prompts without another GitHub request.

Support modules in `src/core/` include command execution helpers for readable `git`/`gh` failures and snapshot warning formatting for truncated GitHub data.

## Development

Run the full local verification set:

```bash
pnpm test
pnpm build
pnpm lint
```

Useful development commands:

```bash
pnpm dev -- status
pnpm dev -- generate
pnpm test tests/cli/generateSmoke.test.ts
```
