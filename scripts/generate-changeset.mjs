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

const res = await fetch(
  `https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/commits`,
  {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "bettertolive-changeset-generator",
    },
  },
)

if (!res.ok) {
  console.error(`Failed to fetch PR commits: ${res.status}`)
  process.exit(1)
}

const commits = await res.json()
const messages = commits.map((c) => c.commit.message)

function getBumpType(messages) {
  for (const msg of messages) {
    const firstLine = msg.split("\n")[0]
    if (firstLine.startsWith("feat!") || msg.includes("BREAKING CHANGE")) return "major"
  }
  for (const msg of messages) {
    const firstLine = msg.split("\n")[0]
    if (firstLine.startsWith("feat")) return "minor"
  }
  for (const msg of messages) {
    const firstLine = msg.split("\n")[0]
    if (firstLine.startsWith("fix")) return "patch"
  }
  return null
}

const SKIP_PREFIXES = ["chore", "docs", "test", "style", "ci", "build", "refactor"]
const entries = messages
  .filter((msg) => {
    const first = msg.split("\n")[0].toLowerCase()
    return !SKIP_PREFIXES.some((p) => first.startsWith(p))
  })
  .map((msg) => msg.split("\n")[0].trim())

const bumpType = getBumpType(messages)
if (!bumpType || entries.length === 0) {
  console.log("No changelog-worthy changes detected, skipping changeset")
  process.exit(0)
}

const id = `${bumpType}-${Date.now().toString(36)}`
const content = `---
'bettertolive': ${bumpType}
---

${entries.map((e) => `- ${e}`).join("\n")}
`

const filePath = join(root, ".changeset", `${id}.md`)
writeFileSync(filePath, content)
console.log(`Generated changeset: .changeset/${id}.md (${bumpType})`)
