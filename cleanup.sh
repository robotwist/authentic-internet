#!/bin/bash

# Cleanup script to remove duplicate server files from root directory
# This helps maintain a clean project structure

echo "Cleaning up duplicate server files..."

# Make backup directory just in case
mkdir -p .backup_files

# Move server-related files to backup
echo "Moving duplicate files to .backup_files"
[ -f server.mjs ] && mv server.mjs .backup_files/
[ -d config ] && mv config .backup_files/
[ -d controllers ] && mv controllers .backup_files/
[ -d middleware ] && mv middleware .backup_files/
[ -d models ] && mv models .backup_files/
[ -d routes ] && mv routes .backup_files/
[ -d seed ] && mv seed .backup_files/
[ -d services ] && mv services .backup_files/
[ -f constants.js ] && mv constants.js .backup_files/

echo "Cleanup complete! Files were moved to .backup_files directory"
echo "Once you've confirmed everything works, you can delete the .backup_files directory"
echo "To do so, run: rm -rf .backup_files"

# Add directory structure warning to README
echo -e "\n## Project Structure\n\nThis project is organized with:\n- Frontend code in the \`/client\` directory\n- Backend code in the \`/server\` directory\n\nDo not add server files to the root directory." >> README.md

echo "Added project structure notes to README.md"

# Include a note about the Procfile
echo "Important: The Procfile is set to use the server directory."
echo "  current Procfile: $(cat Procfile)"

echo "Cleanup finished successfully!" 