# GitHub Starred Repository Knowledge Base

> A reusable GitHub Action that turns GitHub starred repositories into a searchable Markdown table and a compact AI-ready knowledge base.

## Features

* ⭐ Fetches all starred repositories with automatic pagination.
* 📋 Generates a searchable Markdown repository table.
* 🤖 Generates a compact, AI-optimized text knowledge base.
* 🔤 Sorts by repository name ascending by default.
* 🔀 Supports sorting by `name`, `stars`, or `updated`.
* 📁 Supports custom output filenames and paths.
* 🔑 GitHub token is optional.
* 📦 Works with large starred repository collections.

## Generated Files

By default, the Action generates:

```text
REPOSITORY_STAR_LIST.md
REPOSITORY_STAR_DIGEST.txt
```

### `REPOSITORY_STAR_LIST.md`

A human-readable table containing:

* Repository
* Stars
* Forks
* Language
* Description

The generated file also includes a link to this Action's source repository.

### `REPOSITORY_STAR_DIGEST.txt`

A compact, structured knowledge base optimized for AI and LLM consumption.

Example:

```text
# GitHub Starred Repository Knowledge Base
# Source: https://github.com/Deri-Kurniawan/github-starred-repository-action
# User: Deri-Kurniawan
# Total: 2
# Access: public
# Sort: name asc

REPO facebook/react
url=https://github.com/facebook/react
description=The library for web and native user interfaces.
language=JavaScript
topics=react,javascript,frontend,ui
stars=240000
forks=50000
watchers=50000
license=MIT
archived=false
fork=false
open_issues=500
default_branch=main
created=2013-05-24T16:15:54Z
updated=2026-07-23T10:00:00Z
pushed=2026-07-23T09:30:00Z
```

The format minimizes unnecessary tokens while preserving useful repository metadata, making it suitable for:

* AI assistants
* LLM context
* RAG pipelines
* Personal knowledge bases
* Repository discovery
* Semantic search

For example, you can provide the digest to an AI and ask:

> Which repositories in my stars are related to authentication?

> Which repositories should I study for building a real-time application?

> What technologies am I most interested in?

> Find repositories related to PostgreSQL.

> Which starred repositories are useful for learning distributed systems?

The Action does not clone or analyze repository source code.

## Usage

### Basic Usage

A GitHub token is optional.

```yaml
name: Update Starred Repositories

on:
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Generate starred repositories
        uses: Deri-Kurniawan/github-starred-repository-action@v1
        with:
          username: Deri-Kurniawan
```

This generates:

```text
REPOSITORY_STAR_LIST.md
REPOSITORY_STAR_DIGEST.txt
```

### Automatically Commit Changes

```yaml
name: Update Starred Repositories

on:
  workflow_dispatch:

  schedule:
    - cron: "0 */6 * * *"

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Generate starred repositories
        uses: Deri-Kurniawan/github-starred-repository-action@v1
        with:
          username: Deri-Kurniawan

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

          git add \
            REPOSITORY_STAR_LIST.md \
            REPOSITORY_STAR_DIGEST.txt

          if git diff --cached --quiet; then
            echo "No changes detected."
            exit 0
          fi

          git commit -m "chore: update starred repositories"
          git push
```

## Authentication

The `token` input is optional.

Without a token, the Action makes unauthenticated GitHub API requests and processes repositories returned as publicly accessible by GitHub.

With a token:

```yaml
with:
  username: Deri-Kurniawan
  token: ${{ secrets.STARRED_REPOSITORIES_TOKEN }}
```

the Action uses authenticated API requests.

The Action only processes repository data returned by GitHub. It does not intentionally expose or print repository data that is unavailable to the API request.

## Inputs

| Input         | Required | Default                      | Description                                            |
| ------------- | -------- | ---------------------------- | ------------------------------------------------------ |
| `username`    | Yes      | —                            | GitHub username whose starred repositories are fetched |
| `output-file` | No       | `REPOSITORY_STAR_LIST.md`    | Markdown table output path                             |
| `digest-file` | No       | `REPOSITORY_STAR_DIGEST.txt` | AI-ready text digest output path                       |
| `sort-by`     | No       | `name`                       | Sort by `name`, `stars`, or `updated`                  |
| `sort-order`  | No       | `asc`                        | Sort order: `asc` or `desc`                            |
| `token`       | No       | —                            | Optional GitHub authentication token                   |

## Custom Output Files

```yaml
with:
  username: Deri-Kurniawan
  output-file: docs/github-stars.md
  digest-file: docs/github-stars.txt
```

The Action automatically creates missing directories.

## Sorting

### Name ascending — default

```yaml
with:
  sort-by: name
  sort-order: asc
```

### Most starred first

```yaml
with:
  sort-by: stars
  sort-order: desc
```

### Recently updated first

```yaml
with:
  sort-by: updated
  sort-order: desc
```

## Pagination

The Action automatically fetches all available pages until GitHub returns an empty response.

```text
Page 1 → 100 repositories
Page 2 → 100 repositories
Page 3 → 100 repositories
...
Page N → remaining repositories
Page N+1 → empty → stop
```

No manual page configuration is required.

## Outputs

| Output        | Description                          |
| ------------- | ------------------------------------ |
| `count`       | Total number of repositories fetched |
| `file`        | Generated Markdown table path        |
| `digest-file` | Generated AI digest path             |

Example:

```yaml
- name: Generate starred repositories
  id: stars
  uses: Deri-Kurniawan/github-starred-repository-action@v1
  with:
    username: Deri-Kurniawan

- name: Show result
  run: |
    echo "Repositories: ${{ steps.stars.outputs.count }}"
    echo "List: ${{ steps.stars.outputs.file }}"
    echo "Digest: ${{ steps.stars.outputs.digest-file }}"
```

## Development

Install dependencies:

```bash
npm install
```

Build the Action:

```bash
npm run build
```

This generates:

```text
dist/index.js
```

The `dist` directory must be committed because GitHub Actions executes the compiled Action directly.

## License

MIT
