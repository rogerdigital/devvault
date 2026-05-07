# DevVault

DevVault is a local-first personal contribution engine for GitHub PR work.

It tracks PR lifecycle state, tells you what needs action, generates handoff prompts, records merged contributions, and writes reusable Markdown assets for a personal website, resume snippets, changelog, and development log.

## Daily Workflow

For normal use, run one command:

```bash
devvault run
```

That command:

- syncs configured GitHub PRs
- classifies PR state and current action kind
- updates `data/contributions.json`
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

## Setup

Install dependencies and build:

```bash
pnpm install
pnpm build
```

Create a starter config:

```bash
node dist/cli/index.js init --username your-github-username --repo owner/repo
```

For local development, use:

```bash
node dist/cli/index.js run
```

If GitHub CLI is authenticated, DevVault can read `gh auth token` automatically. You can still use an explicit environment token through `github.token_env`.

Check the environment:

```bash
node dist/cli/index.js doctor
```

## Config

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

`automation.site.commit` and `automation.site.push` default to safe disabled behavior. Enable them only when the target personal-site repo path is correct.

## Commands

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

### `devvault report --since <window>`

Summarizes recent PR activity, merged contributions, homepage-ready assets, and current needs-action PRs.

Supported windows:

- `24h`
- `7d`
- `2w`
- ISO date strings

### `devvault curate`

Reviews contribution records interactively and marks accepted or edited entries as `curated`. Curated fields are preserved when generated data refreshes.

### `devvault branches`

Uses synced PR data to suggest local branch cleanup.

```bash
devvault branches --repo-path ../openclaw
devvault branches --repo-path ../openclaw --prune
```

`--prune` deletes only branches linked to merged PRs. Unmatched branches are left for manual review.

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

## Generated Files

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

`output/devlog.md` is updated by daily sections. Re-running on the same day replaces that day's section instead of duplicating it.

## Current Architecture

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

## Verification

Run the full local verification set:

```bash
pnpm test
pnpm build
pnpm lint
```
