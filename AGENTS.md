# Agent Working Guidelines

## Workflow Overview

Every piece of work follows this cycle:

```
GitHub Issue → feature branch → PR to develop → auto-merge → develop → PR to main → auto-merge
```

---

## Step-by-Step Process

### 1. Pick a task from the GitHub Project

Before starting any work, check the GitHub Project board:

```bash
gh issue list --repo velascoamo-guillermo/my-pets --state open
```

Take the highest-priority open issue. Then move it to **In Progress** on the project board:

```bash
# Get the item ID for the issue in the project
ITEM_ID=$(gh api graphql -f query="query { node(id: \"PVT_kwHOCKbbIM4BRreS\") { ... on ProjectV2 { items(first: 50) { nodes { id content { ... on Issue { number } } } } } } }" --jq ".data.node.items.nodes[] | select(.content.number == <issue-number>) | .id")

# Move to In Progress (option ID: 47fc9ee4)
gh api graphql -f query="mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: \"PVT_kwHOCKbbIM4BRreS\",
    itemId: \"$ITEM_ID\",
    fieldId: \"PVTSSF_lAHOCKbbIM4BRreSzg_b9-w\",
    value: { singleSelectOptionId: \"47fc9ee4\" }
  }) { projectV2Item { id } }
}"
```

Project field IDs (do not change these):
- Project ID: `PVT_kwHOCKbbIM4BRreS`
- Status field ID: `PVTSSF_lAHOCKbbIM4BRreSzg_b9-w`
- Status options: `f75ad846` = Todo · `47fc9ee4` = In Progress · `98236657` = Done

### 2. Create a feature branch from `develop`

Always branch off `develop`, never off `main`.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<issue-number>-<short-description>
# e.g. feature/1-pet-sharing-migration
```

Branch naming convention: `feature/<issue-number>-<kebab-case-description>`

### 3. Implement the task

- Follow the hooks-first architecture defined in `CLAUDE.md`
- Commit frequently with descriptive messages
- Each commit message should reference the issue: `feat: add pet_shares table (#1)`

### 4. Push and open a PR to `develop`

```bash
git push origin feature/<issue-number>-<short-description>

PR_URL=$(gh pr create \
  --repo velascoamo-guillermo/my-pets \
  --base develop \
  --head feature/<issue-number>-<short-description> \
  --assignee velascoamo-guillermo \
  --title "<title>" \
  --body "$(cat <<'EOF'
## Summary
- <bullet points of what was done>

## Related issue
Closes #<issue-number>

## Test plan
- [ ] TypeScript compiles without errors
- [ ] Unit tests pass
- [ ] Integration tests pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)")

echo "PR created: $PR_URL"
```

**Always use `--assignee velascoamo-guillermo` on every PR.**

After creating the PR, add it to the GitHub Project board:

```bash
PR_NUMBER=$(echo $PR_URL | grep -o '[0-9]*$')
PR_NODE=$(gh api repos/velascoamo-guillermo/my-pets/pulls/$PR_NUMBER --jq '.node_id')
gh api graphql -f query="mutation { addProjectV2ItemById(input: {projectId: \"PVT_kwHOCKbbIM4BRreS\", contentId: \"$PR_NODE\"}) { item { id } } }"
```

### 5. Auto-merge

PRs to `develop` and `main` are configured with auto-merge enabled. Once the GitHub Actions `PR Checks` workflow passes (TypeScript + tests), the PR will automatically merge and the source branch will be deleted.

Do not manually merge. Wait for CI to pass.

### 6. Move issue to Done and close it

After the PR merges, move the issue to **Done** on the project board and close it:

```bash
# Move issue to Done on the project board
ITEM_ID=$(gh api graphql -f query="query { node(id: \"PVT_kwHOCKbbIM4BRreS\") { ... on ProjectV2 { items(first: 50) { nodes { id content { ... on Issue { number } } } } } } }" --jq ".data.node.items.nodes[] | select(.content.number == <issue-number>) | .id")

gh api graphql -f query="mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: \"PVT_kwHOCKbbIM4BRreS\",
    itemId: \"$ITEM_ID\",
    fieldId: \"PVTSSF_lAHOCKbbIM4BRreSzg_b9-w\",
    value: { singleSelectOptionId: \"98236657\" }
  }) { projectV2Item { id } }
}"
```

If the PR body contains `Closes #<issue-number>`, GitHub will close the issue automatically on merge. Otherwise close it manually:

```bash
gh issue close <issue-number> --repo velascoamo-guillermo/my-pets
```

---

## Branch Strategy

| Branch | Purpose | Merges via |
|--------|---------|------------|
| `main` | Production / App Store builds | PR from `develop` (auto-merge) |
| `develop` | Integration branch | PR from feature branches (auto-merge) |
| `feature/*` | Individual tasks | PR to `develop` |

---

## CI/CD

| Trigger | What runs |
|---------|-----------|
| Push to `develop` or `main` | EAS workflow: fingerprint → build iOS → or OTA update |
| PR to `main` | GitHub Actions: TypeScript check + unit tests + integration tests |

Branch protection on `main` requires the `TypeScript & Tests` check to pass before merge.

---

## GitHub Project

Project board: https://github.com/users/velascoamo-guillermo/projects/2

All issues for planned features live here. Per-task checklist:
1. Pick next open issue → move to **In Progress** on the board
2. Create feature branch → implement → push
3. Open PR → add PR to project board
4. CI passes → auto-merge → issue auto-closed → branch deleted

---

## Commit Message Format

```
<type>: <short description> (#<issue-number>)

Types: feat | fix | chore | ci | docs | refactor | test
```

Examples:
- `feat: add pet_shares and pet_invitations tables (#1)`
- `fix: correct RLS policy for shared pet updates (#3)`
- `test: add integration tests for pet sharing sync (#3)`
