import * as core from "@actions/core";
import fs from "node:fs/promises";
import path from "node:path";

const PER_PAGE = 100;

const VALID_GROUP_BY = [
    "none",
    "language",
    "owner",
];

const VALID_SORT_BY = [
    "name",
    "stars",
    "updated",
];

const VALID_SORT_ORDER = [
    "asc",
    "desc",
];

const VALID_FORMATS = [
    "list",
    "table",
];

async function fetchStarredRepositories(username, token) {
    const repositories = [];
    let page = 1;

    while (true) {
        core.info(
            `Fetching starred repositories for "${username}" - page ${page}...`,
        );

        const response = await fetch(
            `https://api.github.com/users/${encodeURIComponent(
                username,
            )}/starred?per_page=${PER_PAGE}&page=${page}`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${token}`,
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            },
        );

        if (!response.ok) {
            const errorBody = await response.text();

            throw new Error(
                `GitHub API request failed: ${response.status} ${response.statusText}\n${errorBody}`,
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "Unexpected response from GitHub API.",
            );
        }

        if (data.length === 0) {
            break;
        }

        repositories.push(...data);

        core.info(
            `Page ${page}: fetched ${data.length}. Total: ${repositories.length}`,
        );

        page++;
    }

    return repositories;
}

function sortRepositories(
    repositories,
    sortBy,
    sortOrder,
) {
    const multiplier =
        sortOrder === "asc" ? 1 : -1;

    return [...repositories].sort(
        (a, b) => {
            let result = 0;

            switch (sortBy) {
                case "name":
                    result = a.full_name.localeCompare(
                        b.full_name,
                    );
                    break;

                case "stars":
                    result =
                        (a.stargazers_count || 0) -
                        (b.stargazers_count || 0);
                    break;

                case "updated":
                    result =
                        new Date(a.updated_at).getTime() -
                        new Date(b.updated_at).getTime();
                    break;
            }

            return result * multiplier;
        },
    );
}

function getGroupName(repository, groupBy) {
    switch (groupBy) {
        case "language":
            return repository.language || "Other";

        case "owner":
            return repository.owner?.login || "Unknown";

        case "none":
        default:
            return "All Repositories";
    }
}

function groupRepositories(
    repositories,
    groupBy,
) {
    const groups = new Map();

    for (const repository of repositories) {
        const groupName = getGroupName(
            repository,
            groupBy,
        );

        if (!groups.has(groupName)) {
            groups.set(groupName, []);
        }

        groups
            .get(groupName)
            .push(repository);
    }

    return groups;
}

function escapeMarkdown(value) {
    return String(value || "")
        .replace(/\|/g, "\\|")
        .replace(/\r?\n|\r/g, " ")
        .trim();
}

function formatStars(count) {
    return `⭐ ${count.toLocaleString()}`;
}

function generateList(repositories) {
    return repositories
        .map((repository) => {
            const description =
                escapeMarkdown(
                    repository.description,
                ) ||
                "No description provided.";

            return `- [**${repository.full_name}**](${repository.html_url}) — ${description}`;
        })
        .join("\n");
}

function generateTable(repositories) {
    const rows = repositories.map(
        (repository) => {
            const description =
                escapeMarkdown(
                    repository.description,
                ) ||
                "No description provided.";

            return `| [**${repository.full_name}**](${repository.html_url}) | ${formatStars(repository.stargazers_count)} | ${description} |`;
        },
    );

    return [
        "| Repository | Stars | Description |",
        "|---|---:|---|",
        ...rows,
    ].join("\n");
}

function generateMarkdown({
    username,
    repositories,
    groupBy,
    sortBy,
    sortOrder,
    format,
}) {
    const generatedAt =
        new Date().toISOString();

    const groups =
        groupRepositories(
            repositories,
            groupBy,
        );

    const output = [
        "# Starred Repositories",
        "",
        `- **User:** [${username}](https://github.com/${username})`,
        `- **Total:** ${repositories.length}`,
        `- **Grouped by:** ${groupBy}`,
        `- **Sorted by:** ${sortBy} (${sortOrder})`,
        `- **Format:** ${format}`,
        `- **Last updated:** ${generatedAt}`,
        "",
        "---",
        "",
    ];

    for (const [
        groupName,
        groupRepositoriesList,
    ] of groups) {
        output.push(
            `## ${groupName} (${groupRepositoriesList.length})`,
            "",
        );

        if (format === "table") {
            output.push(
                generateTable(
                    groupRepositoriesList,
                ),
            );
        } else {
            output.push(
                generateList(
                    groupRepositoriesList,
                ),
            );
        }

        output.push("", "");
    }

    return output.join("\n");
}

async function writeMarkdownFile(
    outputFile,
    content,
) {
    const directory =
        path.dirname(outputFile);

    await fs.mkdir(directory, {
        recursive: true,
    });

    await fs.writeFile(
        outputFile,
        content,
        "utf8",
    );
}

function validateInput(
    name,
    value,
    validValues,
) {
    if (!validValues.includes(value)) {
        throw new Error(
            `Invalid "${name}" value "${value}". ` +
            `Expected one of: ${validValues.join(", ")}`,
        );
    }
}

async function run() {
    try {
        const username =
            core.getInput("username", {
                required: true,
            });

        const outputFile =
            core.getInput("output-file") ||
            "REPOSITORY_STAR_LIST.md";

        const groupBy =
            core.getInput("group-by") ||
            "language";

        const sortBy =
            core.getInput("sort-by") ||
            "name";

        const sortOrder =
            core.getInput("sort-order") ||
            "asc";

        const format =
            core.getInput("format") ||
            "table";

        const token =
            core.getInput("token") ||
            process.env.GITHUB_TOKEN;

        if (!token) {
            throw new Error(
                "GitHub token is required.",
            );
        }

        validateInput(
            "group-by",
            groupBy,
            VALID_GROUP_BY,
        );

        validateInput(
            "sort-by",
            sortBy,
            VALID_SORT_BY,
        );

        validateInput(
            "sort-order",
            sortOrder,
            VALID_SORT_ORDER,
        );

        validateInput(
            "format",
            format,
            VALID_FORMATS,
        );

        const repositories =
            await fetchStarredRepositories(
                username,
                token,
            );

        const sortedRepositories =
            sortRepositories(
                repositories,
                sortBy,
                sortOrder,
            );

        const markdown =
            generateMarkdown({
                username,
                repositories:
                    sortedRepositories,
                groupBy,
                sortBy,
                sortOrder,
                format,
            });

        await writeMarkdownFile(
            outputFile,
            markdown,
        );

        core.setOutput(
            "count",
            repositories.length,
        );

        core.setOutput(
            "file",
            outputFile,
        );

        core.info(
            `Successfully generated ${outputFile}`,
        );

        core.info(
            `Total repositories: ${repositories.length}`,
        );
    } catch (error) {
        core.setFailed(
            error instanceof Error
                ? error.message
                : "Unknown error",
        );
    }
}

await run();