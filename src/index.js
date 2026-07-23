import * as core from "@actions/core";
import fs from "node:fs/promises";
import path from "node:path";

const PER_PAGE = 100;

const VALID_SORT_BY = [
    "name",
    "stars",
    "updated",
];

const VALID_SORT_ORDER = [
    "asc",
    "desc",
];

async function fetchAuthenticatedUser(token) {
    const response = await fetch(
        "https://api.github.com/user",
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
            [
                "Failed to fetch authenticated GitHub user.",
                `Status: ${response.status} ${response.statusText}`,
                errorBody,
            ].join("\n"),
        );
    }

    return response.json();
}

async function fetchStarredRepositories(token) {
    const repositories = [];
    let page = 1;

    while (true) {
        core.info(
            `Fetching starred repositories - page ${page}...`,
        );

        const response = await fetch(
            `https://api.github.com/user/starred?per_page=${PER_PAGE}&page=${page}`,
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
                [
                    "GitHub API request failed.",
                    `Status: ${response.status} ${response.statusText}`,
                    errorBody,
                ].join("\n"),
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "Unexpected response from GitHub API.",
            );
        }

        if (data.length === 0) {
            core.info(
                `No more repositories found. Finished at page ${page}.`,
            );

            break;
        }

        repositories.push(...data);

        core.info(
            `Page ${page}: fetched ${data.length} repositories. Total: ${repositories.length}.`,
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
        sortOrder === "asc"
            ? 1
            : -1;

    return [...repositories].sort(
        (a, b) => {
            let result = 0;

            switch (sortBy) {
                case "name":
                    result =
                        a.full_name.localeCompare(
                            b.full_name,
                            undefined,
                            {
                                sensitivity: "base",
                            },
                        );
                    break;

                case "stars":
                    result =
                        (a.stargazers_count ?? 0) -
                        (b.stargazers_count ?? 0);
                    break;

                case "updated":
                    result =
                        new Date(
                            a.updated_at,
                        ).getTime() -
                        new Date(
                            b.updated_at,
                        ).getTime();
                    break;

                default:
                    result = 0;
            }

            return result * multiplier;
        },
    );
}

function escapeMarkdown(value) {
    return String(value ?? "")
        .replace(/\|/g, "\\|")
        .replace(/\r?\n|\r/g, " ")
        .trim();
}

function formatNumber(value) {
    return Number(
        value ?? 0,
    ).toLocaleString("en-US");
}

function formatBoolean(value) {
    return value ? "Yes" : "No";
}

function formatTopics(topics) {
    if (
        !Array.isArray(topics) ||
        topics.length === 0
    ) {
        return "None";
    }

    return topics
        .map(
            (topic) =>
                `\`${escapeMarkdown(topic)}\``,
        )
        .join(", ");
}

function generateRepositoryTable(
    repositories,
) {
    const rows = repositories.map(
        (repository) => {
            const description =
                escapeMarkdown(
                    repository.description,
                ) ||
                "No description provided.";

            const language =
                escapeMarkdown(
                    repository.language,
                ) || "N/A";

            return [
                `| [**${escapeMarkdown(repository.full_name)}**](${repository.html_url})`,
                `| ${formatNumber(repository.stargazers_count)}`,
                `| ${formatNumber(repository.forks_count)}`,
                `| ${language}`,
                `| ${description} |`,
            ].join(" ");
        },
    );

    return [
        "| Repository | Stars | Forks | Language | Description |",
        "|---|---:|---:|---|---|",
        ...rows,
    ].join("\n");
}

function generateStarListMarkdown({
    username,
    repositories,
    sortBy,
    sortOrder,
}) {
    const generatedAt =
        new Date().toISOString();

    return [
        "# Starred Repositories",
        "",
        `- **User:** [${username}](https://github.com/${username})`,
        `- **Total:** ${formatNumber(repositories.length)}`,
        `- **Sorted by:** ${sortBy} (${sortOrder})`,
        `- **Generated at:** ${generatedAt}`,
        "",
        "---",
        "",
        generateRepositoryTable(
            repositories,
        ),
        "",
    ].join("\n");
}

function generateRepositoryDigest(
    repository,
) {
    const owner =
        repository.owner?.login ||
        "Unknown";

    const topics =
        Array.isArray(repository.topics)
            ? repository.topics
            : [];

    return [
        `## Repository: ${repository.full_name}`,
        "",
        "### Identity",
        "",
        `- **Name:** ${repository.name}`,
        `- **Owner:** ${owner}`,
        `- **URL:** ${repository.html_url}`,
        `- **Clone URL:** ${repository.clone_url}`,
        "",
        "### Description",
        "",
        repository.description ||
        "No description provided.",
        "",
        "### Technology",
        "",
        `- **Primary Language:** ${repository.language || "N/A"
        }`,
        `- **Topics:** ${formatTopics(topics)}`,
        "",
        "### Popularity",
        "",
        `- **Stars:** ${formatNumber(repository.stargazers_count)}`,
        `- **Forks:** ${formatNumber(repository.forks_count)}`,
        `- **Watchers:** ${formatNumber(repository.watchers_count)}`,
        "",
        "### Repository Status",
        "",
        `- **Archived:** ${formatBoolean(repository.archived)}`,
        `- **Fork:** ${formatBoolean(repository.fork)}`,
        `- **Open Issues:** ${formatNumber(repository.open_issues_count)}`,
        `- **Default Branch:** ${repository.default_branch || "N/A"
        }`,
        "",
        "### License",
        "",
        repository.license?.name ||
        "No license information.",
        "",
        "### Dates",
        "",
        `- **Created:** ${repository.created_at || "N/A"}`,
        `- **Updated:** ${repository.updated_at || "N/A"}`,
        `- **Pushed:** ${repository.pushed_at || "N/A"}`,
        "",
        "---",
        "",
    ].join("\n");
}

function generateDigestMarkdown({
    username,
    repositories,
    sortBy,
    sortOrder,
}) {
    const generatedAt =
        new Date().toISOString();

    const repositorySections =
        repositories
            .map(generateRepositoryDigest)
            .join("\n");

    return [
        "# GitHub Starred Repository Knowledge Base",
        "",
        "This document is an AI-friendly knowledge base generated from a user's GitHub starred repositories.",
        "",
        "It contains repository metadata, descriptions, topics, technology information, popularity metrics, repository status, and dates.",
        "",
        "## Collection Overview",
        "",
        `- **GitHub User:** ${username}`,
        `- **Total Repositories:** ${formatNumber(repositories.length)}`,
        `- **Sorted by:** ${sortBy} (${sortOrder})`,
        `- **Generated at:** ${generatedAt}`,
        "",
        "---",
        "",
        repositorySections,
    ].join("\n");
}

async function writeFile(
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

    core.info(
        `Generated file: ${outputFile}`,
    );
}

function validateInput(
    name,
    value,
    validValues,
) {
    if (!validValues.includes(value)) {
        throw new Error(
            [
                `Invalid "${name}" value: "${value}".`,
                `Expected one of: ${validValues.join(", ")}`,
            ].join(" "),
        );
    }
}

async function run() {
    try {
        const username =
            core.getInput("username");

        const outputFile =
            core.getInput("output-file") ||
            "REPOSITORY_STAR_LIST.md";

        const digestFile =
            core.getInput("digest-file") ||
            "REPOSITORY_STAR_DIGEST.md";

        const sortBy =
            core.getInput("sort-by") ||
            "name";

        const sortOrder =
            core.getInput("sort-order") ||
            "asc";

        const token =
            core.getInput("token") ||
            process.env.GITHUB_TOKEN;

        if (!token) {
            throw new Error(
                "GitHub token is required.",
            );
        }

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

        const authenticatedUser =
            await fetchAuthenticatedUser(
                token,
            );

        const resolvedUsername =
            username ||
            authenticatedUser.login;

        core.info(
            `Authenticated GitHub user: ${authenticatedUser.login}`,
        );

        core.info(
            `Generating starred repository data for: ${resolvedUsername}`,
        );

        const repositories =
            await fetchStarredRepositories(
                token,
            );

        const sortedRepositories =
            sortRepositories(
                repositories,
                sortBy,
                sortOrder,
            );

        const starList =
            generateStarListMarkdown({
                username: resolvedUsername,
                repositories:
                    sortedRepositories,
                sortBy,
                sortOrder,
            });

        const digest =
            generateDigestMarkdown({
                username: resolvedUsername,
                repositories:
                    sortedRepositories,
                sortBy,
                sortOrder,
            });

        await writeFile(
            outputFile,
            starList,
        );

        await writeFile(
            digestFile,
            digest,
        );

        core.setOutput(
            "count",
            repositories.length,
        );

        core.setOutput(
            "file",
            outputFile,
        );

        core.setOutput(
            "digest-file",
            digestFile,
        );

        core.info(
            `Successfully processed ${repositories.length} starred repositories.`,
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