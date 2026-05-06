# DevVault

DevVault is a local-first personal contribution engine for open-source work.

It tracks GitHub pull requests, identifies when action is needed, generates agent-ready handoff prompts, and turns merged contributions into durable assets for a resume, GitHub profile, personal website, changelog, and blog drafts.

The goal is not to build another GitHub dashboard. The goal is to make the full PR lifecycle produce reusable personal assets automatically.

## Problem

Open-source contribution work usually creates repeated manual steps:

```text
Submit PR
-> refresh GitHub manually
-> inspect CI, reviews, and maintainer comments
-> collect context for a coding agent
-> fix and push again
-> wait for merge
-> manually record the contribution
-> rewrite it for resume, website, profile, changelog, and blog drafts
```

DevVault turns that into a local workflow:

```text
Submit PR
-> devvault sync
-> devvault status
-> devvault prompt
-> PR merged
-> devvault generate
-> contribution assets are updated
```

## Product Scope

DevVault has six modules.

### 1. PR Tracker

Tracks pull requests created by the configured GitHub user.

It should classify PRs into states such as:

- `draft`
- `open`
- `waiting_for_review`
- `changes_requested`
- `ci_failed`
- `ci_passed`
- `maintainer_commented`
- `merge_conflict`
- `merged`
- `closed`

It should also expose:

- last update time
- last maintainer activity time
- whether the user needs to act
- blocked reason
- next action

### 2. PR Intelligence

Reads PR metadata and turns raw GitHub state into a practical next step.

Inputs may include:

- PR title and body
- linked issues
- review state
- review comments
- maintainer comments
- changed files
- commits
- labels
- check runs
- CI failure summaries

Expected output:

```text
Status: CI failed
Reason: TypeScript lint failed in packages/tui/streamingWatchdog.ts
Next action: inspect reconnect watchdog state reset logic and add a regression test
```

### 3. Agent Handoff

Generates high-quality prompts for coding agents.

Prompt types:

- `fix-ci`
- `address-review`
- `add-test`
- `resolve-conflict`
- `maintainer-reply`
- `resume`
- `summary`
- `blog-draft`

Example:

```bash
devvault prompt --pr openclaw/openclaw#74224 --type fix-ci
```

### 4. Contribution Ledger

Stores merged PRs as structured contribution records.

Example:

```yaml
id: openclaw-74224
project: OpenClaw
repo: openclaw/openclaw
pr: 74224
status: merged
merged_at: 2026-04-29
type: bugfix
area: TUI reliability
impact: Resynced streaming watchdog after reconnect to prevent stale streaming state.
links:
  pr: https://github.com/openclaw/openclaw/pull/74224
tags:
  - open-source
  - ai-agent
  - tui
  - reliability
resume_ready: true
homepage_ready: true
```

### 5. Personal Website Sync

Generates content that can be copied or later synced into a personal site.

Initial output is Markdown:

- `output/website/index.md`
- `output/website/projects.md`
- `output/website/contributions.md`
- `output/website/blog-drafts/*.md`

Later versions may write directly into a GitHub Pages or Astro repository.

### 6. Resume Asset Generator

Generates resume-ready bullets from merged contributions and project metadata.

Output:

- `output/resume-snippets.md`

## MVP

The first version should be a CLI only. No web UI, no Obsidian plugin, and no automatic website commits.

MVP chain:

```text
GitHub PR
-> status tracking
-> merged detection
-> contribution record
-> Markdown outputs
```

Required commands:

```bash
devvault sync
devvault status
devvault generate
devvault prompt
```

MVP completion criteria:

- `devvault sync` fetches configured GitHub PRs.
- `devvault status` groups PRs into `Needs Action`, `Waiting`, `Merged`, and `Closed`.
- `devvault generate` writes contribution, changelog, resume, and website Markdown.
- `devvault prompt --pr owner/repo#123 --type resume` generates a useful prompt or asset text for that PR.
- Local data can be regenerated without losing manually curated contribution fields.

## Recommended Stack

- TypeScript
- Node.js
- GitHub GraphQL API
- Markdown output
- JSON local storage for MVP
- YAML config
- Vitest for tests
- tsup or tsx for CLI development

## Initial Directory Structure

```text
devvault/
  config.yaml
  data/
    prs.json
    contributions.json
  output/
    contributions.md
    changelog.md
    resume-snippets.md
    website/
      index.md
      projects.md
      contributions.md
      blog-drafts/
  src/
    cli/
      index.ts
      commands/
        sync.ts
        status.ts
        generate.ts
        prompt.ts
    config/
      loadConfig.ts
      schema.ts
    github/
      client.ts
      fetchPullRequests.ts
      fetchReviewComments.ts
      fetchCheckRuns.ts
    core/
      classifyPrStatus.ts
      buildNextAction.ts
      buildContributionRecord.ts
      mergeContributionRecord.ts
    generators/
      contributionMarkdown.ts
      changelog.ts
      resumeBullet.ts
      websiteContent.ts
      agentPrompt.ts
    storage/
      paths.ts
      readJson.ts
      writeJson.ts
      store.ts
    types/
      contribution.ts
      github.ts
      pr.ts
  tests/
    core/
    generators/
    storage/
  templates/
    contribution.md.hbs
    resume-bullet.md.hbs
    blog-draft.md.hbs
    agent-prompt.md.hbs
```

## Configuration

Example `config.yaml`:

```yaml
github:
  username: rogerdigital
  token_env: GITHUB_TOKEN

repos:
  - openclaw/openclaw
  - openai/codex

output:
  directory: output

site:
  owner_name: Roger Deng
  tagline: iOS Engineer | AI-native Builder | Open-source Contributor
```

Rules:

- Tokens must come from environment variables.
- Tokens must never be written to logs, data files, generated Markdown, commits, or PR descriptions.
- Local generated output should be deterministic where possible.

## Setup and Usage

### Install dependencies

```bash
pnpm install
```

### Configure GitHub access

Create a GitHub token and expose it through the environment variable named by `github.token_env`.

For public repositories, the token should be able to read public repository metadata through the GitHub GraphQL API. For private repositories, grant the equivalent private repository read access.

Example:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Do not commit `config.yaml` if it contains private repo names you do not want public. Never write token values into config files.

### Create config

Create `config.yaml` in the project root:

```yaml
github:
  username: rogerdigital
  token_env: GITHUB_TOKEN

repos:
  - openclaw/openclaw

output:
  directory: output

site:
  owner_name: Roger Deng
  tagline: iOS Engineer | AI-native Builder | Open-source Contributor
```

### Run the workflow

Fetch PR snapshots:

```bash
pnpm dev -- sync
```

Inspect current state:

```bash
pnpm dev -- status
```

Generate contribution assets:

```bash
pnpm dev -- generate
```

Generate an agent handoff prompt:

```bash
pnpm dev -- prompt --pr openclaw/openclaw#74224 --type fix-ci
```

Supported prompt types:

- `fix-ci`
- `address-review`
- `add-test`
- `maintainer-reply`
- `resume`
- `summary`

### Verify locally

```bash
pnpm test
pnpm build
pnpm lint
```

### Current limitations

- `sync` calls GitHub live and requires network access.
- Generated contribution impact text starts from PR metadata and is designed to be manually curated in `data/contributions.json`.
- Personal website sync is Markdown output only. It does not modify an external website repository yet.

## Data Model

### Pull Request Snapshot

```ts
type PullRequestSnapshot = {
  id: string;
  repo: string;
  number: number;
  title: string;
  url: string;
  author: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  mergeable?: "MERGEABLE" | "CONFLICTING" | "UNKNOWN";
  labels: string[];
  reviewDecision?: "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED";
  checkConclusion?: "SUCCESS" | "FAILURE" | "PENDING" | "UNKNOWN";
  lastMaintainerActivityAt?: string;
  changedFiles: string[];
};
```

### Contribution Record

```ts
type ContributionRecord = {
  id: string;
  project: string;
  repo: string;
  pr: number;
  status: "merged";
  mergedAt: string;
  type: "bugfix" | "feature" | "test" | "docs" | "refactor" | "infra";
  area: string;
  impact: string;
  links: {
    pr: string;
    releaseNote?: string;
  };
  tags: string[];
  resumeReady: boolean;
  homepageReady: boolean;
  manualNotes?: string;
};
```

## Implementation Plan

The project should be implemented in small, reviewable commits. Each step should leave the repo in a working state.

### Phase 0: Project Baseline

Goal: create a maintainable TypeScript CLI foundation.

Commits:

1. `chore: initialize TypeScript CLI project`
   - add `package.json`
   - add TypeScript config
   - add lint/test/build scripts
   - add CLI entrypoint

2. `chore: add project structure and shared types`
   - add `src/types`
   - add empty module directories
   - add basic test setup

Verification:

```bash
pnpm test
pnpm build
```

### Phase 1: Config and Local Storage

Goal: read config and persist local state safely.

Commits:

1. `feat: load DevVault configuration`
   - parse `config.yaml`
   - validate required fields
   - resolve token environment variable name without reading or printing the token

2. `feat: add JSON store`
   - add read/write helpers
   - create `data/` on demand
   - preserve unknown contribution fields where possible

3. `test: cover config and storage behavior`
   - config validation tests
   - missing file tests
   - deterministic write tests

Verification:

```bash
pnpm test
pnpm build
```

### Phase 2: GitHub Sync

Goal: fetch PR snapshots for configured repos.

Commits:

1. `feat: add GitHub GraphQL client`
   - read token from configured env var
   - handle pagination
   - normalize GraphQL errors

2. `feat: fetch pull requests for configured repos`
   - filter by configured username
   - store normalized snapshots in `data/prs.json`
   - include labels, review decision, mergeability, and timestamps

3. `feat: add sync command`
   - implement `devvault sync`
   - print a concise sync summary

4. `test: cover GitHub PR normalization`
   - use fixture responses
   - cover open, draft, merged, closed, and review states

Verification:

```bash
pnpm test
pnpm build
GITHUB_TOKEN=... pnpm dev -- sync
```

### Phase 3: PR Status Classification

Goal: turn raw PR snapshots into actionable status groups.

Commits:

1. `feat: classify PR lifecycle status`
   - implement `classifyPrStatus`
   - detect merged, closed, draft, CI failed, changes requested, merge conflict, waiting

2. `feat: build next actions for PRs`
   - implement `buildNextAction`
   - include reason and recommended next step

3. `feat: add status command`
   - implement `devvault status`
   - group by `Needs Action`, `Waiting`, `Merged`, and `Closed`

4. `test: cover PR status decisions`
   - table-driven tests for classification
   - snapshot tests for CLI formatting if useful

Verification:

```bash
pnpm test
pnpm build
pnpm dev -- status
```

### Phase 4: Contribution Ledger

Goal: create durable contribution records from merged PRs.

Commits:

1. `feat: build contribution records from merged PRs`
   - derive stable IDs
   - infer project name from repo
   - infer default type, area, tags, and impact placeholders

2. `feat: merge generated records with manual contribution edits`
   - preserve `manualNotes`
   - preserve curated `impact`, `area`, `tags`, and readiness flags
   - avoid duplicate records

3. `test: cover contribution record merging`
   - generated-only records
   - manually edited records
   - updated PR metadata

Verification:

```bash
pnpm test
pnpm build
```

### Phase 5: Markdown Generators

Goal: generate useful local assets from contribution records.

Commits:

1. `feat: generate contribution markdown`
   - write `output/contributions.md`
   - group by project

2. `feat: generate changelog markdown`
   - write `output/changelog.md`
   - group by merge date

3. `feat: generate resume snippets`
   - write `output/resume-snippets.md`
   - produce concise resume-ready bullets

4. `feat: generate website markdown`
   - write `output/website/index.md`
   - write `output/website/contributions.md`
   - create `output/website/blog-drafts/`

5. `feat: add generate command`
   - implement `devvault generate`
   - update contribution ledger before writing outputs

6. `test: cover markdown output`
   - fixture-driven generator tests
   - deterministic output ordering

Verification:

```bash
pnpm test
pnpm build
pnpm dev -- generate
```

### Phase 6: Agent Prompt Generator

Goal: generate prompts for fixing PR issues and converting PRs into assets.

Commits:

1. `feat: generate agent prompts`
   - support `fix-ci`
   - support `address-review`
   - support `add-test`
   - support `maintainer-reply`
   - support `resume`
   - support `summary`

2. `feat: add prompt command`
   - implement `devvault prompt --pr owner/repo#123 --type fix-ci`
   - load PR from local store
   - print prompt to stdout

3. `test: cover prompt generation`
   - PR lookup parsing
   - prompt types
   - missing PR errors

Verification:

```bash
pnpm test
pnpm build
pnpm dev -- prompt --pr openclaw/openclaw#74224 --type resume
```

### Phase 7: PR Intelligence Enhancements

Goal: improve next-action quality beyond basic state classification.

Commits:

1. `feat: fetch review comments`
   - store maintainer review comments
   - identify unresolved or latest actionable comments

2. `feat: fetch check runs`
   - store failed check names
   - include log URLs when available

3. `feat: improve next-action reasoning`
   - summarize failed checks
   - summarize maintainer requests
   - prioritize action reasons

4. `test: cover intelligence prioritization`
   - CI failure before waiting
   - changes requested before generic maintainer comment
   - merge conflict before review wait

Verification:

```bash
pnpm test
pnpm build
GITHUB_TOKEN=... pnpm dev -- sync
pnpm dev -- status
```

### Phase 8: Quality and Release Readiness

Goal: make the CLI reliable enough for daily use.

Commits:

1. `docs: add setup and usage guide`
   - installation
   - GitHub token scopes
   - config example
   - command examples

2. `chore: add CI`
   - test
   - build
   - lint

3. `feat: add init command`
   - generate starter `config.yaml`
   - create `data/` and `output/`

4. `chore: prepare first release`
   - package metadata
   - changelog
   - versioning

Verification:

```bash
pnpm test
pnpm build
pnpm lint
```

## Later Roadmap

### V1: Local Dashboard

Command:

```bash
devvault web
```

Purpose:

- show active PRs
- show needs-action queue
- show merged contributions
- expose generated prompts

This should reuse `src/core`, `src/github`, `src/generators`, and `src/storage`.

### V2: Personal Website Sync

Command:

```bash
devvault sync-site
```

Purpose:

- write Markdown or MDX into a configured website repo
- update profile README content
- optionally open a PR in the website repo

### V3: Obsidian Plugin

Purpose:

- show active PRs inside Obsidian
- generate prompts and snippets from notes
- sync contribution records into a vault

### V4: AI-Assisted Summaries

Purpose:

- generate higher-quality impact summaries
- draft blog posts
- rewrite resume bullets for different target roles

This should be optional. The core CLI must remain useful without an AI API.

## Engineering Rules

- Keep the CLI local-first.
- Keep tokens out of files, logs, commits, and generated content.
- Prefer deterministic output.
- Preserve manual edits in contribution records.
- Add tests for status classification, record merging, and Markdown generation.
- Keep commits small and independently reviewable.
- Do not build web UI until the CLI loop is useful.

## First Development Target

The first target is:

```bash
devvault sync
devvault status
devvault generate
devvault prompt --pr owner/repo#123 --type resume
```

The first useful output is:

```text
output/contributions.md
output/changelog.md
output/resume-snippets.md
output/website/contributions.md
```
