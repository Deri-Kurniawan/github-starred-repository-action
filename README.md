# GitHub Starred Repository Knowledge Base

> A reusable GitHub Action that turns GitHub starred repositories into a Markdown table and an AI-ready knowledge base.

## Features

* ⭐ Fetches all starred repositories with automatic pagination.
* 📋 Generates a searchable Markdown repository table.
* 🤖 Generates an AI-friendly repository digest.
* 🔤 Sorts by repository name ascending by default.
* 🔀 Supports sorting by `name`, `stars`, or `updated`.
* 📁 Supports custom output filenames and paths.
* 🔑 Token is optional.
* 📦 Works with large starred repository collections.

## Generated Files

By default:

```text
REPOSITORY_STAR_LIST.md
REPOSITORY_STAR_DIGEST.md
```

### `REPOSITORY_STAR_LIST.md`

A simple table for browsing starred repositories:

| Repository       | Stars | Forks | Language   | Description                                    |
| ---------------- | ----: | ----: | ---------- | ---------------------------------------------- |
| facebook/react   |  240k |   50k | JavaScript | The library for web and native user interfaces |
| microsoft/vscode |  180k |   30k | TypeScript | Visual Studio Code                             |

### `REPOSITORY_STAR_DIGEST.md`

An AI-ready knowledge base containing repository metadata:

* Description
* Language
* Topics
* Stars and forks
* License
* Repository status
* Dates

You can provide the digest to an AI assistant and ask:

> Which repositories in my stars are related to authentication?

> Which repositories should I study for building a real-time application?

> What technologies am I most interested in?

> Find repositories related to PostgreSQL.

The Action does not clone or analyze repository source code.

## Usage

### Without a Token

A token is optional. Without one, the Action makes unauthenticated API requests and processes the repositories GitHub makes publicly accessible.

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

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

          git add \
            REPOSITORY_STAR_LIST.md \
            REPOSITORY_STAR_DIGEST.md

          if git diff --cached --quiet; then
            echo "No changes detected."
            exit 0
          fi

          git commit -m "chore: update starred repositories"
          git push
```

### With a Token

Provide a GitHub token when authenticated API requests are desired:

```yaml
with:
  username: Deri-Kurniawan
  token: ${{ secrets.STARRED_REPOSITORIES_TOKEN }}
```

The Action only processes repositories returned by GitHub. It does not expose or print repository data that the API does not make available to the request.

## Inputs

| Input         | Required | Default                     | Description                             |
| ------------- | -------- | --------------------------- | --------------------------------------- |
| `username`    | Yes      | —                           | GitHub username whose stars are fetched |
| `output-file` | No       | `REPOSITORY_STAR_LIST.md`   | Markdown table output                   |
| `digest-file` | No       | `REPOSITORY_STAR_DIGEST.md` | AI digest output                        |
| `sort-by`     | No       | `name`                      | `name`, `stars`, or `updated`           |
| `sort-order`  | No       | `asc`                       | `asc` or `desc`                         |
| `token`       | No       | —                           | Optional GitHub authentication token    |

## Custom Output

```yaml
with:
  username: Deri-Kurniawan
  output-file: docs/stars.md
  digest-file: docs/star-digest.md
```

## Sorting

Default:

```yaml
sort-by: name
sort-order: asc
```

Other examples:

```yaml
# Most starred first
sort-by: stars
sort-order: desc
```

```yaml
# Recently updated first
sort-by: updated
sort-order: desc
```

## Pagination

The Action automatically fetches every page until GitHub returns an empty response:

```text
Page 1 → 100 repositories
Page 2 → 100 repositories
Page 3 → 100 repositories
...
Page N → remaining repositories
Page N+1 → empty → stop
```

## Development

```bash
npm install
npm run build
```

The build generates:

```text
dist/index.js
```

The `dist` directory must be committed because GitHub Actions executes the compiled Action directly.

## License

MIT
