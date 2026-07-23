# GitHub Starred Repository List

A reusable GitHub Action that fetches **all starred repositories** from a GitHub user and generates a customizable Markdown file.

The action automatically handles GitHub API pagination. It starts from page `1`, fetches up to `100` repositories per request, continues with `page=n`, and stops when GitHub returns an empty array.

## Features

* ⭐ Fetch all starred repositories from any GitHub user
* 📄 Generate a Markdown file automatically
* 📝 Customize the output filename
* 📁 Customize the output directory
* 📦 Automatically create missing output directories
* 🔄 Automatically handle API pagination
* 🚀 Fetch up to 100 repositories per API request
* 🛑 Stop automatically when an empty page is returned
* 🔢 Expose the total repository count as an output
* 📂 Expose the generated file path as an output
* 🔐 Support custom GitHub tokens
* ♻️ Reusable across multiple repositories and workflows
* 🟢 Built with Node.js

---

## How It Works

The action uses GitHub's REST API to retrieve starred repositories:

```text
GET /users/{username}/starred
```

Repositories are fetched using pagination with a maximum of 100 repositories per request.

```text
page=1
   │
   ├── 100 repositories
   │
page=2
   │
   ├── 100 repositories
   │
page=3
   │
   ├── 100 repositories
   │
   ▼
page=N
   │
   ├── repositories
   │
page=N+1
   │
   └── [] → STOP
```

All repositories from every page are collected and then converted into a Markdown file.

For example, if a user has 250 starred repositories:

```text
Page 1 → 100 repositories
Page 2 → 100 repositories
Page 3 → 50 repositories
Page 4 → [] → Stop
```

The final Markdown file will contain all 250 repositories.

---

# Usage

Add the action to any GitHub Actions workflow.

The simplest example is:

```yaml
name: Update Starred Repositories

on:
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate starred repository list
        uses: Deri-Kurniawan/github-starred-repository-action@v1
        with:
          username: Deri-Kurniawan
```

By default, this generates:

```text
REPOSITORY_STAR_LIST.md
```

---

# Inputs

| Input         | Required | Default                   | Description                                                 |
| ------------- | -------- | ------------------------- | ----------------------------------------------------------- |
| `username`    | Yes      | —                         | GitHub username whose starred repositories will be fetched. |
| `output-file` | No       | `REPOSITORY_STAR_LIST.md` | Path and filename of the generated Markdown file.           |
| `token`       | No       | `${{ github.token }}`     | GitHub token used to access the GitHub API.                 |

---

## `username`

The GitHub username whose starred repositories you want to retrieve.

Example:

```yaml
with:
  username: Deri-Kurniawan
```

---

## `output-file`

The path and filename of the generated Markdown file.

The default value is:

```text
REPOSITORY_STAR_LIST.md
```

You can customize both the filename and its location.

### Custom filename

```yaml
with:
  username: Deri-Kurniawan
  output-file: MY_STARRED_REPOSITORIES.md
```

Output:

```text
MY_STARRED_REPOSITORIES.md
```

### Custom directory

```yaml
with:
  username: Deri-Kurniawan
  output-file: docs/starred.md
```

Output:

```text
docs/
└── starred.md
```

### Nested directory

```yaml
with:
  username: Deri-Kurniawan
  output-file: docs/github/starred-repositories.md
```

Output:

```text
docs/
└── github/
    └── starred-repositories.md
```

The action automatically creates missing parent directories.

For example:

```yaml
output-file: data/github/stars/repositories.md
```

If the following directories do not exist:

```text
data/
github/
stars/
```

They will be created automatically.

---

## `token`

The GitHub token used to authenticate requests to the GitHub API.

The default value is:

```yaml
${{ github.token }}
```

You can use the default GitHub Actions token:

```yaml
with:
  username: Deri-Kurniawan
  token: ${{ github.token }}
```

You can also provide a custom secret:

```yaml
with:
  username: Deri-Kurniawan
  token: ${{ secrets.GH_PAT }}
```

Never hard-code tokens directly into your workflow.

---

# Outputs

The action provides two outputs.

## `count`

The total number of starred repositories fetched.

Example:

```yaml
- name: Generate starred repository list
  id: starred
  uses: Deri-Kurniawan/github-starred-repository-action@v1
  with:
    username: Deri-Kurniawan

- name: Display repository count
  run: |
    echo "Found ${{ steps.starred.outputs.count }} starred repositories"
```

Example output:

```text
Found 3000 starred repositories
```

---

## `file`

The path of the generated Markdown file.

Example:

```yaml
- name: Generate starred repository list
  id: starred
  uses: Deri-Kurniawan/github-starred-repository-action@v1
  with:
    username: Deri-Kurniawan
    output-file: docs/starred.md

- name: Display generated file
  run: |
    echo "Generated file: ${{ steps.starred.outputs.file }}"
```

Output:

```text
Generated file: docs/starred.md
```

---

# Complete Example

The following example automatically updates a Markdown file every six hours.

```yaml
name: Update Starred Repository List

on:
  workflow_dispatch:

  schedule:
    - cron: "0 */6 * * *"

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate starred repository list
        id: starred
        uses: Deri-Kurniawan/github-starred-repository-action@v1
        with:
          username: Deri-Kurniawan
          output-file: REPOSITORY_STAR_LIST.md
          token: ${{ github.token }}

      - name: Display result
        run: |
          echo "Fetched ${{ steps.starred.outputs.count }} repositories"
          echo "Generated ${{ steps.starred.outputs.file }}"

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

          git add REPOSITORY_STAR_LIST.md

          if git diff --cached --quiet; then
            echo "No changes detected."
            exit 0
          fi

          git commit -m "chore: update starred repositories"
          git push
```

---

# Custom Output File Example

You can customize the generated file location:

```yaml
name: Update Starred Repositories

on:
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Generate starred repository list
        id: starred
        uses: Deri-Kurniawan/github-starred-repository-action@v1
        with:
          username: Deri-Kurniawan
          output-file: docs/github/starred-repositories.md

      - name: Show result
        run: |
          echo "Fetched ${{ steps.starred.outputs.count }} repositories"
          echo "File: ${{ steps.starred.outputs.file }}"
```

The action will automatically create:

```text
docs/
└── github/
    └── starred-repositories.md
```

---

# Scheduled Updates

The action can be combined with GitHub Actions scheduled workflows.

Run every six hours:

```yaml
on:
  schedule:
    - cron: "0 */6 * * *"
```

Run every day at midnight UTC:

```yaml
on:
  schedule:
    - cron: "0 0 * * *"
```

Run every Monday at midnight UTC:

```yaml
on:
  schedule:
    - cron: "0 0 * * 1"
```

You can also allow manual execution:

```yaml
on:
  workflow_dispatch:

  schedule:
    - cron: "0 */6 * * *"
```

This provides both automatic synchronization and manual execution.

---

# Committing the Generated File

The action itself does **not** commit or push changes.

This is intentional.

The action only performs:

```text
Fetch repositories
        ↓
Generate Markdown
        ↓
Set outputs
```

The consuming workflow decides what to do with the generated file.

For example:

```text
Generate Markdown
        ↓
    git add
        ↓
   git commit
        ↓
    git push
```

This design makes the action more reusable.

You can use the generated file for:

* Git commits
* GitHub Actions artifacts
* Documentation
* Static websites
* Portfolio websites
* README files
* Other automation workflows
* Input for another GitHub Action

---

# Permissions

If your workflow only generates the file, you can use read-only permissions:

```yaml
permissions:
  contents: read
```

If your workflow commits and pushes the generated file:

```yaml
permissions:
  contents: write
```

Example:

```yaml
permissions:
  contents: write
```

The permission is required by the workflow that performs the `git push`, not by the generation logic itself.

---

# Using a Custom Personal Access Token

For public starred repositories, the default GitHub Actions token is generally sufficient.

If you need to use a custom token, create a repository secret.

Navigate to:

```text
Repository Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

Create:

```text
GH_PAT
```

Then:

```yaml
- name: Generate starred repository list
  uses: Deri-Kurniawan/github-starred-repository-action@v1
  with:
    username: Deri-Kurniawan
    token: ${{ secrets.GH_PAT }}
```

Never expose tokens in workflow logs or commit them to source control.

---

# Generated Markdown

The generated Markdown file contains a simple list of repositories.

Example:

```markdown
# Starred Repositories

> Automatically generated by GitHub Actions.

- **User:** [Deri-Kurniawan](https://github.com/Deri-Kurniawan)
- **Total:** 3
- **Last updated:** 2026-07-23T08:00:00.000Z

---

- [**facebook/react**](https://github.com/facebook/react) — The library for web and native user interfaces.
- [**vercel/next.js**](https://github.com/vercel/next.js) — The React Framework for the Web.
- [**oven-sh/bun**](https://github.com/oven-sh/bun) — Incredibly fast JavaScript runtime.
```

The output file can be directly used by GitHub, Markdown renderers, documentation platforms, or static site generators.

---

# API Pagination

The action fetches a maximum of 100 repositories per request.

The pagination logic is equivalent to:

```text
page = 1

while true:
    response = fetch(page)

    if response is empty:
        break

    repositories.push(...response)

    page++
```

The action does not require the total number of starred repositories in advance.

Example:

```text
50 starred repositories

Page 1 → 50 repositories
Page 2 → []
Stop
```

Another example:

```text
250 starred repositories

Page 1 → 100 repositories
Page 2 → 100 repositories
Page 3 → 50 repositories
Page 4 → []
Stop
```

The action therefore works with any number of starred repositories supported by the GitHub API.

---

# API Rate Limits

The action uses GitHub's REST API and is subject to GitHub API rate limits.

The action uses authenticated requests through the provided token.

For large collections, multiple API requests are required.

For example:

```text
100 repositories  → approximately 2 API requests
1,000 repositories → approximately 11 API requests
3,000 repositories → approximately 31 API requests
```

The final empty response is used to determine that pagination has finished.

---

# Local Development

Clone the repository:

```bash
git clone https://github.com/Deri-Kurniawan/github-starred-repository-action.git

cd github-starred-repository-action
```

Install dependencies:

```bash
npm install
```

Build the action:

```bash
npm run build
```

The build command creates:

```text
dist/index.js
```

The `dist` directory must be committed to the repository because GitHub Actions executes the bundled JavaScript file specified by `action.yml`.

Repository structure:

```text
github-starred-repository-action/
├── .github/
│   └── workflows/
├── src/
│   └── index.js
├── dist/
│   └── index.js
├── action.yml
├── package.json
├── package-lock.json
├── README.md
└── LICENSE
```

---

# Versioning

It is recommended to publish stable versions using Git tags.

For example:

```text
v1
v1.0.0
v1.1.0
v2
```

Users can reference the major version:

```yaml
uses: Deri-Kurniawan/github-starred-repository-action@v1
```

Or a specific version:

```yaml
uses: Deri-Kurniawan/github-starred-repository-action@v1.0.0
```

For maximum reproducibility and security, workflows can also pin the action to a specific commit SHA.

---

# Example: Multiple Users

The same action can be executed multiple times with different usernames and output files.

```yaml
jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Fetch user A stars
        uses: Deri-Kurniawan/github-starred-repository-action@v1
        with:
          username: user-a
          output-file: data/user-a-stars.md

      - name: Fetch user B stars
        uses: Deri-Kurniawan/github-starred-repository-action@v1
        with:
          username: user-b
          output-file: data/user-b-stars.md
```

Result:

```text
data/
├── user-a-stars.md
└── user-b-stars.md
```

---

# Example: Upload as an Artifact

You do not have to commit the generated file.

You can upload it as a GitHub Actions artifact:

```yaml
name: Generate Starred Repository List

on:
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Generate starred repository list
        uses: Deri-Kurniawan/github-starred-repository-action@v1
        with:
          username: Deri-Kurniawan
          output-file: REPOSITORY_STAR_LIST.md

      - name: Upload Markdown
        uses: actions/upload-artifact@v4
        with:
          name: starred-repositories
          path: REPOSITORY_STAR_LIST.md
```

---

# Limitations

Currently, the action:

* Generates Markdown output
* Uses GitHub's REST API
* Fetches repositories using pagination
* Stops when an empty API response is returned
* Supports customizable output paths and filenames
* Does not commit changes automatically
* Does not push changes automatically
* Does not customize the Markdown template
* Does not filter repositories by language
* Does not filter repositories by topics
* Does not group repositories by language

---

# Roadmap

Potential future improvements include:

* Custom Markdown templates
* Custom Markdown headers
* Custom repository item templates
* Sorting by repository name
* Sorting by star count
* Sorting by language
* Filtering by repository owner
* Filtering by programming language
* Filtering by topics
* Grouping repositories by programming language
* JSON output
* YAML output
* HTML output
* Include repository stars
* Include repository forks
* Include repository language
* Include repository topics
* Include repository license
* Include repository creation date
* Include repository last update date

---

# Contributing

Contributions, issues, and feature requests are welcome.

Before submitting a pull request:

1. Install dependencies:

```bash
npm install
```

2. Build the action:

```bash
npm run build
```

3. Verify that `dist/index.js` is updated.

4. Test the action in a GitHub Actions workflow.

5. Submit a pull request.

---

# License

Distributed under the MIT License.

See the `LICENSE` file for more information.

---

# Author

Created by [Deri Kurniawan](https://github.com/Deri-Kurniawan).

If you find this action useful, consider giving the repository a star.
