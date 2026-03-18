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
gh issue list --repo velascoamo-guillermo/my-pets --state open --assignee velascoamo-guillermo
```

Take the highest-priority open issue. Move it to "In Progress" by assigning yourself if not already assigned.

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

gh pr create \
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
)"
```

**Always use `--assignee velascoamo-guillermo` on every PR.**

The PR is automatically linked to the issue via `Closes #<issue-number>` in the body — GitHub shows it under "Development" in the issue. Do NOT add PRs to the project board as separate items.

### 5. Auto-merge

PRs to `develop` and `main` are configured with auto-merge enabled. Once the GitHub Actions `PR Checks` workflow passes (TypeScript + tests), the PR will automatically merge and the source branch will be deleted.

Do not manually merge. Wait for CI to pass.

### 6. Close the issue

After the PR merges, close the corresponding GitHub issue:

```bash
gh issue close <issue-number> --repo velascoamo-guillermo/my-pets --comment "Implemented in PR #<pr-number>"
```

If the PR body contains `Closes #<issue-number>`, GitHub will close the issue automatically on merge.

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

All issues for planned features live here. When starting a task:
1. Check the board for the next open issue
2. Start implementation on a feature branch
3. PR → develop → auto-merge closes the issue

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
