# GitHub Starred Knowledge Base

> Turn your GitHub starred repositories into a human-readable Markdown list and a compact, AI-ready knowledge base.

A reusable GitHub Action that fetches all starred repositories from a GitHub user and generates two useful outputs:

* `STARRED_REPOSITORIES.md` — optimized for humans
* `STARRED_REPOSITORIES.txt` — optimized for AI and LLM context

The generated files can be used as a personal repository knowledge base for browsing, searching, RAG pipelines, and AI-assisted exploration.

## Features

* ⭐ Fetches all starred repositories with automatic pagination.
* 📋 Generates a human-readable Markdown repository table.
* 🤖 Generates a compact AI-ready knowledge base.
* 🔤 Sorts repositories by name ascending by default.
* 🔀 Supports sorting by name, stars, or last update.
* 📁 Supports custom output filenames and paths.
* 🔑 GitHub token is optional.
* 📦 Handles large starred repository collections.
* 🔗 Generated results include a link to this Action's source repository.

## Generated Files

### `STARRED_REPOSITORIES.md`

A human-readable list of starred repositories containing:

* Repository name
* Repository URL
* Stars
* Forks
* Primary language
* Description
* Generation metadata

Example:

| Repository                                                  |   Stars |  Forks | Language   | Description                                    |
| ----------------------------------------------------------- | ------: | -----: | ---------- | ---------------------------------------------- |
| [**facebook/react**](https://github.com/facebook/react)     | 240,000 | 50,000 | JavaScript | The library for web and native user interfaces |
| [**microsoft/vscode**](https://github.com/microsoft/vscode) | 180,000 | 30,000 | TypeScript | Visual Studio Code                             |

The file is designed to be pleasant to read and browse directly on GitHub.

### `STARRED_REPOSITORIES.txt`

A compact, structured knowledge base designed for AI and LLM consumption.

Example:

```text
# GitHub Starred Knowledge Base
# Source: https://github.com/Deri-Kurniawan/github-starred-knowledge-base-action
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

The format is intentionally compact to reduce unnecessary tokens while retaining useful repository metadata.

This makes the file useful as context for questions such as:

> Which repositories in my stars are related to authentication?

> Find repositories related to PostgreSQL.

> Which repositories should I study for building a real-time application?

> What technologies am I most interested in based on my starred repositories?

> Which starred repositories are useful for learning distributed systems?

The Action does not clone or analyze repository source code. It only builds a structured knowledge base from GitHub repository metadata.

## Usage

Create a workflow in your repository:

`.github/workflows/update-starred-repositories.yml`

```yaml
name: Update Starred Knowledge Base

on:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  generate:
    name: Generate Starred Knowledge Base
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate starred knowledge base
        id: starred
        uses: Deri-Kurniawan/github-starred-knowledge-base-action@v1
        with:
          username: Deri-Kurniawan

      - name: Commit generated files
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

          git add \
            STARRED_REPOSITORIES.md \
            STARRED_REPOSITORIES.txt

          if git diff --cached --quiet; then
            echo "No changes detected."
            exit 0
          fi

          git commit -m "chore: update starred knowledge base"
          git push
```

Run the workflow manually from:

**GitHub → Actions → Update Starred Knowledge Base → Run workflow**

The Action will generate:

```text
STARRED_REPOSITORIES.md
STARRED_REPOSITORIES.txt
```

## Inputs

| Input                 | Required | Default                    | Description                                            |
| --------------------- | -------- | -------------------------- | ------------------------------------------------------ |
| `username`            | Yes      | —                          | GitHub username whose starred repositories are fetched |
| `markdown-file`       | No       | `STARRED_REPOSITORIES.md`  | Path of the human-readable Markdown output             |
| `knowledge-base-file` | No       | `STARRED_REPOSITORIES.txt` | Path of the AI-ready knowledge base                    |
| `sort-by`             | No       | `name`                     | Sort by `name`, `stars`, or `updated`                  |
| `sort-order`          | No       | `asc`                      | Sort using `asc` or `desc`                             |
| `token`               | No       | —                          | Optional GitHub token for authenticated API requests   |

## Custom Output Files

You can customize the generated file paths:

```yaml
- name: Generate starred knowledge base
  uses: Deri-Kurniawan/github-starred-knowledge-base-action@v1
  with:
    username: Deri-Kurniawan
    markdown-file: docs/STARRED_REPOSITORIES.md
    knowledge-base-file: docs/STARRED_REPOSITORIES.txt
```

The Action automatically creates missing directories.

## Sorting

### Repository name — ascending

This is the default:

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

## Authentication

The `token` input is optional.

Without a token, the Action performs unauthenticated GitHub API requests.

```yaml
with:
  username: Deri-Kurniawan
```

You can also provide a GitHub token:

```yaml
with:
  username: Deri-Kurniawan
  token: ${{ secrets.GITHUB_TOKEN }}
```

Authenticated requests can provide a higher API rate limit and access to repositories available to the authenticated request.

The Action only processes repository information returned by the GitHub API.

## Pagination

The Action automatically fetches all available pages.

For example:

```text
Page 1 → 100 repositories
Page 2 → 100 repositories
Page 3 → 100 repositories
...
Page N → remaining repositories
Page N+1 → empty response → stop
```

No manual page configuration is required.

## Outputs

| Output                | Description                          |
| --------------------- | ------------------------------------ |
| `count`               | Total number of repositories fetched |
| `markdown-file`       | Generated Markdown file path         |
| `knowledge-base-file` | Generated AI knowledge base path     |

Example:

```yaml
- name: Generate starred knowledge base
  id: starred
  uses: Deri-Kurniawan/github-starred-knowledge-base-action@v1
  with:
    username: Deri-Kurniawan

- name: Show outputs
  run: |
    echo "Repositories: ${{ steps.starred.outputs.count }}"
    echo "Markdown: ${{ steps.starred.outputs.markdown-file }}"
    echo "Knowledge Base: ${{ steps.starred.outputs.knowledge-base-file }}"
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

## Testing

The repository includes a workflow at:

```text
.github/workflows/test.yml
```

The test workflow runs the local Action using:

```yaml
uses: ./
```

It verifies that:

* The Markdown file is generated.
* The AI knowledge-base file is generated.
* Both files contain content.
* The Markdown output contains the Action source link.
* The AI knowledge base contains the expected header and source.

## Versioning

This project uses a single `v1` tag for Action consumers.

Use:

```yaml
uses: Deri-Kurniawan/github-starred-knowledge-base-action@v1
```

After updating the Action:

```bash
npm run build

git add action.yml src/index.js dist/index.js
git commit -m "feat: update action"
git push origin main

git tag -f v1
git push origin v1 --force
```

## License

[MIT License](LICENSE)
