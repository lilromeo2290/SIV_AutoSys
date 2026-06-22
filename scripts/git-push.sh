#!/bin/bash
# Auto-commit and push script for SIV_AutoSys
# Usage: bash /home/z/my-project/scripts/git-push.sh "commit message"

cd /home/z/my-project

MSG="$1"
if [ -z "$MSG" ]; then
  MSG="Auto-sync $(date '+%Y-%m-%d %H:%M:%S')"
fi

git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

git commit -m "$MSG"
git push origin main 2>&1
echo "Pushed to GitHub at $(date '+%Y-%m-%d %H:%M:%S')"