#!/usr/bin/env bash
# PostToolUse hook: after a `git checkout -b NAME` Bash call completes
# successfully, write NAME into .claude/branch-lock. This sets up the
# branch guard so subsequent commits/pushes are validated against this
# branch — preventing the silent-branch-swap mistakes that produced
# cherry-pick rescues on PRs #460, #462, and #465.
#
# Only fires on `git checkout -b NAME` (new-branch creation), not on
# regular `git checkout BRANCH`, because the latter is often used to
# move between branches the user has already chosen, and locking would
# fight that workflow. If you want to lock after a plain checkout,
# write to .claude/branch-lock manually.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PAYLOAD=$(cat)
CMD=$(echo "$PAYLOAD" | /usr/bin/python3 -c "import sys, json; print(json.load(sys.stdin).get('tool_input', {}).get('command', ''))" 2>/dev/null || true)

# Match `git checkout -b <name>` (capture the branch name)
# Branch name chars per `git check-ref-format`: alnum + . _ / -
if [[ "$CMD" =~ git[[:space:]]+checkout[[:space:]]+-b[[:space:]]+([A-Za-z0-9._/-]+) ]]; then
  BRANCH="${BASH_REMATCH[1]}"
  cd "$REPO_ROOT" || exit 0
  echo "$BRANCH" > .claude/branch-lock
  echo "🔒 branch-lock written: $BRANCH" >&2
fi

exit 0
