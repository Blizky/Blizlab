#!/bin/zsh
cd /Users/alex/Projects/GitHub/Blizlab || exit 1
git add -A
git commit -m "update $(date '+%Y-%m-%d %H:%M:%S')" || true
git push
