# plot_twist — agent notes

## Git workflow (for agents)

Never commit directly to main/master unless the user explicitly says to.
Before the first file edit, create a branch named claude/<short-task-slug>
from the default branch — or, if this working tree might be shared with
another active session or has unrelated uncommitted changes, use a sibling
worktree instead: git worktree add ../<repo>--<slug> -b claude/<slug>.

Push the branch right after the first meaningful commit
(git push -u origin <branch>) so the work is backed up off this machine —
an unpushed branch is an unfinished step. Prefer a WIP: commit on the branch
over git stash when pausing. Stage files deliberately (no blind git add -A);
stop and ask before committing any file over 50 MB.

At the end of the session: commit, push, and leave the branch for the user
to merge or PR. Merge into main only when the user asks, using
git merge --no-ff, and delete the branch (local + remote) after it merges.
