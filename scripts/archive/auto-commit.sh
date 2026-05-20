#!/bin/bash

# auto-commit.sh - Script to automatically commit and push changes every 10 minutes
# Usage: ./auto-commit.sh [optional comment]

# If a comment was passed as an argument, use it
COMMENT=${1:-"Auto-commit: Regular update"}

# Function to commit and push changes
commit_and_push() {
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  echo "🕙 $TIMESTAMP - Checking for changes..."
  
  # Check if there are any changes to commit
  if git status --porcelain | grep -q .; then
    # Get list of changed files
    CHANGED_FILES=$(git status --porcelain | awk '{print $2}' | tr '\n' ' ')
    
    # Create commit message with timestamp and list of changed files
    COMMIT_MSG="$COMMENT [$TIMESTAMP]"
    COMMIT_MSG+=$'\n\nChanged files:\n'
    COMMIT_MSG+=$(git status --porcelain | awk '{print "- " $2}' | tr '\n' '\n')
    
    echo "💾 Changes detected, committing files: $CHANGED_FILES"
    
    # Add all changes
    git add .
    
    # Commit with descriptive message
    git commit -m "$COMMIT_MSG"
    
    # Push to remote repository
    echo "🚀 Pushing changes to remote repository..."
    git push
    
    echo "✅ Successfully committed and pushed changes!"
  else
    echo "ℹ️  No changes detected, nothing to commit."
  fi
}

# Initial commit when script starts
commit_and_push

# Continuously check for changes every 10 minutes
echo "🔄 Auto-commit script is running. Will check for changes every 10 minutes."
echo "   Press Ctrl+C to stop the script."

while true; do
  # Wait 10 minutes
  sleep 600
  
  # Commit and push any new changes
  commit_and_push
done 