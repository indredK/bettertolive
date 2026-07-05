import { writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const PR_NUMBER = process.argv[2]

if (!PR_NUMBER || !GITHUB_REPOSITORY || !GITHUB_TOKEN) {
  console.error(
    "Usage: GITHUB_REPOSITORY=owner/repo GITHUB_TOKEN=xxx node generate-changeset.mjs <pr-number>",
  )
  process.exit(1)
}

const commitsRes = await fetch(
  `https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/commits`,
  {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "bettertolive-changeset-generator",
    },
  },
)

if (!commitsRes.ok) {
  console.error(`Failed to fetch PR commits: ${commitsRes.status}`)
  process.exit(1)
}

const commits = await commitsRes.json()

const CONVENTIONAL_TYPES = [
  "feat",
  "fix",
  "perf",
  "refactor",
  "revert",
  "docs",
  "style",
  "chore",
  "test",
  "ci",
  "build",
]

const CHANGELOG_TYPES = ["feat", "fix", "perf", "refactor", "revert"]
const BUMP_BY_TYPE = {
  feat: "minor",
  fix: "patch",
  perf: "patch",
  refactor: "patch",
  revert: "patch",
}

function parseConventionalCommit(message) {
  const firstLine = message.split("\n")[0].trim()
  const match = firstLine.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/)
  if (!match) return null

  const [, type, scope, bang, description] = match
  if (!CONVENTIONAL_TYPES.includes(type)) return null

  const isBreaking =
    !!bang ||
    message
      .split("\n")
      .some((line) => line.startsWith("BREAKING CHANGE:") || line.startsWith("BREAKING-CHANGE:"))

  return { type, scope, isBreaking, description, firstLine }
}

function getBumpType(parsedCommits) {
  if (parsedCommits.some((c) => c.isBreaking)) return "major"
  if (parsedCommits.some((c) => c.type === "feat")) return "minor"
  for (const c of parsedCommits) {
    if (BUMP_BY_TYPE[c.type]) return BUMP_BY_TYPE[c.type]
  }
  return null
}

function formatEntry(c) {
  const scope = c.scope ? `**${c.scope}:** ` : ""
  const breaking = c.isBreaking ? "💥 " : ""
  return `${breaking}${scope}${c.description}`
}

const parsedCommits = commits.map((c) => parseConventionalCommit(c.commit.message)).filter(Boolean)

const changelogCommits = parsedCommits.filter((c) => CHANGELOG_TYPES.includes(c.type))

const bumpType = getBumpType(parsedCommits)

if (!bumpType || changelogCommits.length === 0) {
  console.log("No changelog-worthy changes detected, skipping changeset")
  process.exit(0)
}

const prRef = `#${PR_NUMBER}`
const entries = changelogCommits.map((c) => formatEntry(c))

const id = `${bumpType}-${Date.now().toString(36)}`
const content = `---
'bettertolive': ${bumpType}
---

${entries.map((e) => `- ${e}`).join("\n")}

PR: ${prRef}
`

const filePath = join(root, ".changeset", `${id}.md`)
writeFileSync(filePath, content)
console.log(`Generated changeset: .changeset/${id}.md (${bumpType})`)
