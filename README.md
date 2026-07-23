# GitHub Starred Repository Knowledge Base

> A reusable GitHub Action that turns your GitHub starred repositories into a Markdown table and an AI-ready knowledge base.

## ✨ Features

* ⭐ Fetches **all starred repositories** with automatic pagination.
* 📋 Generates a searchable Markdown repository table.
* 🤖 Generates an AI-friendly repository digest.
* 🔤 Sorts by repository name ascending by default.
* 🔀 Supports sorting by `name`, `stars`, or `updated`.
* 📁 Supports custom output filenames and paths.
* 📦 Works with large starred repository collections.

## 📄 Generated Files

By default:

`REPOSITORY_STAR_LIST.md`

`REPOSITORY_STAR_DIGEST.md`

### `REPOSITORY_STAR_LIST.md`

A simple table for browsing your starred repositories:

| Repository       | Stars | Forks | Language   | Description                                    |
| ---------------- | ----: | ----: | ---------- | ---------------------------------------------- |
| facebook/react   |  240k |   50k | JavaScript | The library for web and native user interfaces |
| microsoft/vscode |  180k |   30k | TypeScript | Visual Studio Code                             |

### `REPOSITORY_STAR_DIGEST.md`

An AI-ready knowledge base containing repository metadata such as:

* Description
* Language
* Topics
* Stars and forks
* License
* Repository status
* Dates

You can provide this file to an AI assistant and ask:

> Which repositories in my stars are related to authentication?

> Which repositories should I study for building a real-time application?

> What technologies am I most interested in?

> Find repositories related to PostgreSQL.

The Action does not clone or analyze repository source code.

## 🚀 Usage

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
          token: ${{ secrets.STARRED_REPOSITORIES_TOKEN }}

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

Create a repository secret named:

`STARRED_REPOSITORIES_TOKEN`

## ⚙️ Inputs

| Input         | Required | Default                     | Description                           |
| ------------- | -------- | --------------------------- | ------------------------------------- |
| `username`    | No       | Authenticated user          | Username displayed in generated files |
| `output-file` | No       | `REPOSITORY_STAR_LIST.md`   | Markdown table output                 |
| `digest-file` | No       | `REPOSITORY_STAR_DIGEST.md` | AI digest output                      |
| `sort-by`     | No       | `name`                      | `name`, `stars`, or `updated`         |
| `sort-order`  | No       | `asc`                       | `asc` or `desc`                       |
| `token`       | Yes      | —                           | GitHub authentication token           |

### Custom filenames

```yaml
with:
  output-file: docs/stars.md
  digest-file: docs/star-digest.md
```

### Custom sorting

```yaml
with:
  sort-by: stars
  sort-order: desc
```

## 🔄 Pagination

The Action automatically fetches all pages until GitHub returns an empty page:

Page 1 → 100 repositories
Page 2 → 100 repositories
Page 3 → 100 repositories
...
Page N → remaining repositories
Page N+1 → empty → stop

## 🛠️ Development

```bash
npm install
npm run build
```

The build generates:

`dist/index.js`

The `dist` directory must be committed because GitHub Actions executes the compiled Action directly.

## 📜 License

MIT
