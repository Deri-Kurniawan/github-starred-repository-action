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

const ACTION_URL =
    "https://github.com/Deri-Kurniawan/github-starred-repository-action";

function createHeaders(token) {
    const headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

async function fetchStarredRepositories(
    username,
    token,
) {
    const repositories = [];
    let page = 1;

    while (true) {
        core.info(
            `Fetching starred repositories for "${username}" - page ${page}...`,
        );

        const url =
            `https://api.github.com/users/${encodeURIComponent(username)}/starred` +
            `?per_page=${PER_PAGE}&page=${page}`;

        const response = await fetch(url, {
            headers: createHeaders(token),
        });

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
    authenticated,
}) {
    const generatedAt =
        new Date().toISOString();

    const accessMode =
        authenticated
            ? "Authenticated"
            : "Public";

    return [
        "# Starred Repositories",
        "",
        `> Generated by [GitHub Starred Repository Knowledge Base](${ACTION_URL})`,
        "",
        `- **User:** [${username}](https://github.com/${username})`,
        `- **Total:** ${formatNumber(repositories.length)}`,
        `- **Access:** ${accessMode}`,
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

function formatDigestValue(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "N/A";
    }

    return String(value)
        .replace(/\r?\n|\r/g, " ")
        .trim();
}

function formatTopicsForDigest(
    topics,
) {
    if (
        !Array.isArray(topics) ||
        topics.length === 0
    ) {
        return "";
    }

    return topics.join(",");
}

function generateRepositoryDigest(
    repository,
) {
    const topics =
        formatTopicsForDigest(
            repository.topics,
        );

    const lines = [
        `REPO ${repository.full_name}`,
        `url=${formatDigestValue(repository.html_url)}`,
        `description=${formatDigestValue(repository.description)}`,
        `language=${formatDigestValue(repository.language)}`,
    ];

    if (topics) {
        lines.push(`topics=${topics}`);
    }

    lines.push(
        `stars=${repository.stargazers_count ?? 0}`,
        `forks=${repository.forks_count ?? 0}`,
        `watchers=${repository.watchers_count ?? 0}`,
        `license=${formatDigestValue(repository.license?.spdx_id || repository.license?.name)}`,
        `archived=${Boolean(repository.archived)}`,
        `fork=${Boolean(repository.fork)}`,
        `open_issues=${repository.open_issues_count ?? 0}`,
        `default_branch=${formatDigestValue(repository.default_branch)}`,
        `created=${formatDigestValue(repository.created_at)}`,
        `updated=${formatDigestValue(repository.updated_at)}`,
        `pushed=${formatDigestValue(repository.pushed_at)}`,
        "",
    );

    return lines.join("\n");
}

function generateDigestTxt({
    username,
    repositories,
    sortBy,
    sortOrder,
    authenticated,
}) {
    const accessMode =
        authenticated
            ? "authenticated"
            : "public";

    return [
        "# GitHub Starred Repository Knowledge Base",
        `# Source: ${ACTION_URL}`,
        `# User: ${username}`,
        `# Total: ${repositories.length}`,
        `# Access: ${accessMode}`,
        `# Sort: ${sortBy} ${sortOrder}`,
        "",
        ...repositories.map(
            generateRepositoryDigest,
        ),
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
            `Invalid "${name}" value "${value}". Expected: ${validValues.join(", ")}`,
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

        const digestFile =
            core.getInput("digest-file") ||
            "REPOSITORY_STAR_DIGEST.txt";

        const sortBy =
            core.getInput("sort-by") ||
            "name";

        const sortOrder =
            core.getInput("sort-order") ||
            "asc";

        const token =
            core.getInput("token") ||
            undefined;

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

        const authenticated =
            Boolean(token);

        core.info(
            `Access mode: ${authenticated
                ? "authenticated"
                : "public"
            }`,
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

        const starList =
            generateStarListMarkdown({
                username,
                repositories:
                    sortedRepositories,
                sortBy,
                sortOrder,
                authenticated,
            });

        const digest =
            generateDigestTxt({
                username,
                repositories:
                    sortedRepositories,
                sortBy,
                sortOrder,
                authenticated,
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