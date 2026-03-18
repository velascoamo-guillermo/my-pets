# Agent Working Guidelines

## Workflow Overview

```
GitHub Issue → feature branch → PR to main → auto-merge
```

---

## Step-by-Step Process

### 1. Pick a task from the GitHub Project

```bash
gh issue list --repo velascoamo-guillermo/my-pets --state open
```

Take the highest-priority open issue.

### 2. Create a feature branch from `main`

```bash
git checkout main
git pull origin main
git checkout -b feature/<issue-number>-<short-description>
# e.g. feature/4-services-sharing
```

Branch naming convention: `feature/<issue-number>-<kebab-case-description>`

### 3. Implement the task

- Follow the hooks-first architecture defined in `CLAUDE.md`
- Commit frequently with descriptive messages
- Each commit message should reference the issue: `feat: add pet_shares table (#1)`

### 4. Push and open a PR to `main`

```bash
git push origin feature/<issue-number>-<short-description>

gh pr create \
  --base main \
  --assignee velascoamo-guillermo \
  --title "<title>" \
  --body "$(cat <<'EOF'
## Summary
- <bullet points of what was done>

Closes #<issue-number>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Always use `--assignee velascoamo-guillermo` on every PR.**

`Closes #<issue-number>` in the body links the PR to the issue and auto-closes it on merge.

### 5. Enable auto-merge

```bash
gh pr merge <pr-number> --auto --squash
```

Once the `TypeScript & Tests` CI check passes, the PR merges automatically and the branch is deleted.

---

## Branch Strategy

| Branch      | Purpose              | Merges via                   |
| ----------- | -------------------- | ---------------------------- |
| `main`      | Production / OTA     | PR from feature (auto-merge) |
| `feature/*` | Individual tasks     | PR to `main`                 |

---

## CI/CD

| Trigger          | What runs                                                         |
| ---------------- | ----------------------------------------------------------------- |
| Push to `main`   | EAS workflow: fingerprint → build iOS → or OTA update             |
| PR to `main`     | GitHub Actions: TypeScript check + unit tests + integration tests |

Branch protection on `main` requires `TypeScript & Tests` to pass before merge.

---

## GitHub Project

Project board: https://github.com/users/velascoamo-guillermo/projects/2

Project field IDs (do not change these):

- Project ID: `PVT_kwHOCKbbIM4BRreS`
- Status field ID: `PVTSSF_lAHOCKbbIM4BRreSzg_b9-w`
- Status options: `f75ad846` = Todo · `47fc9ee4` = In Progress · `98236657` = Done

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
