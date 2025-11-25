#!/bin/bash
# Git History Analysis Script for Floyo
# Analyzes git history to show velocity, iteration, and learning trajectory

set -e

echo "=== Floyo Git History Analysis ==="
echo ""

# Get repository info
REPO_NAME=$(basename $(git rev-parse --show-toplevel))
echo "Repository: $REPO_NAME"
echo ""

# Total commits
TOTAL_COMMITS=$(git rev-list --count HEAD)
echo "Total Commits: $TOTAL_COMMITS"
echo ""

# Commits by author
echo "=== Commits by Author ==="
git shortlog -sn --all | head -10
echo ""

# Commits over time (last 12 months)
echo "=== Commits Over Time (Last 12 Months) ==="
git log --since="12 months ago" --pretty=format:"%ad" --date=short | sort | uniq -c | tail -12
echo ""

# Most active days
echo "=== Most Active Days ==="
git log --pretty=format:"%ad" --date=short | sort | uniq -c | sort -rn | head -10
echo ""

# Files changed over time
echo "=== Files Changed Over Time ==="
git log --since="6 months ago" --pretty=format:"%ad" --date=short --name-only | grep -E "^[0-9]{4}-[0-9]{2}-[0-9]{2}" | sort | uniq -c | tail -10
echo ""

# Most changed files
echo "=== Most Changed Files ==="
git log --since="6 months ago" --pretty=format:"" --name-only | sort | uniq -c | sort -rn | head -20
echo ""

# Feature additions (commits with "add", "feat", "feature")
echo "=== Feature Additions ==="
git log --since="6 months ago" --grep="add\|feat\|feature" --oneline | wc -l
echo "Feature commits found"
echo ""

# Refactors (commits with "refactor", "refactoring")
echo "=== Refactors ==="
git log --since="6 months ago" --grep="refactor\|refactoring" --oneline | wc -l
echo "Refactor commits found"
echo ""

# Bug fixes (commits with "fix", "bug")
echo "=== Bug Fixes ==="
git log --since="6 months ago" --grep="fix\|bug" --oneline | wc -l
echo "Bug fix commits found"
echo ""

# Pivots (commits with "pivot", "change", "update")
echo "=== Pivots/Changes ==="
git log --since="6 months ago" --grep="pivot\|change\|update" --oneline | wc -l
echo "Pivot/change commits found"
echo ""

# Velocity metrics
echo "=== Velocity Metrics ==="
COMMITS_LAST_MONTH=$(git log --since="1 month ago" --oneline | wc -l)
COMMITS_LAST_3_MONTHS=$(git log --since="3 months ago" --oneline | wc -l)
COMMITS_LAST_6_MONTHS=$(git log --since="6 months ago" --oneline | wc -l)

echo "Commits last month: $COMMITS_LAST_MONTH"
echo "Commits last 3 months: $COMMITS_LAST_3_MONTHS"
echo "Commits last 6 months: $COMMITS_LAST_6_MONTHS"
echo ""

# Branch analysis
echo "=== Branch Analysis ==="
BRANCH_COUNT=$(git branch -a | wc -l)
echo "Total branches: $BRANCH_COUNT"
echo ""

# Recent branches
echo "=== Recent Branches ==="
git for-each-ref --sort=-committerdate refs/heads/ --format='%(refname:short) - %(committerdate:short)' | head -10
echo ""

# Merge frequency
echo "=== Merge Frequency ==="
MERGE_COUNT=$(git log --since="6 months ago" --merges --oneline | wc -l)
echo "Merges last 6 months: $MERGE_COUNT"
echo ""

# Code churn (additions/deletions)
echo "=== Code Churn (Last 6 Months) ==="
git log --since="6 months ago" --shortstat --pretty=format:"" | awk '/files? changed/ {files+=$1; inserted+=$4; deleted+=$6} END {print "Files changed:", files, "\nLines added:", inserted, "\nLines deleted:", deleted}'
echo ""

# Learning indicators (commits with "learn", "learning", "insight")
echo "=== Learning Indicators ==="
LEARNING_COMMITS=$(git log --since="6 months ago" --grep="learn\|learning\|insight" --oneline | wc -l)
echo "Commits mentioning learning: $LEARNING_COMMITS"
echo ""

# Experiment indicators (commits with "experiment", "test", "try")
echo "=== Experiment Indicators ==="
EXPERIMENT_COMMITS=$(git log --since="6 months ago" --grep="experiment\|test\|try" --oneline | wc -l)
echo "Commits mentioning experiments: $EXPERIMENT_COMMITS"
echo ""

# Summary
echo "=== Summary ==="
echo "This analysis shows:"
echo "- High commit frequency indicates active development"
echo "- Feature additions show product iteration"
echo "- Refactors show code quality focus"
echo "- Learning/experiment commits show hypothesis-driven approach"
echo ""
echo "Use this data to demonstrate:"
echo "- Velocity: High commit frequency"
echo "- Iteration: Feature additions and changes"
echo "- Quality: Refactors and bug fixes"
echo "- Learning: Experiment and learning commits"
echo ""
