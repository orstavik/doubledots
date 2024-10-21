#!/bin/bash

current_branch=$(git branch --show-current)

# Fetch tags from the remote
git fetch --tags

# Generate candidate tags based on the current date
tags=(
  "$current_branch$(date -u +'%y')"
  "$current_branch$(date -u +'%y.%m')"
  "$current_branch$(date -u +'%y.%m.%d')"
  "$current_branch$(date -u +'%y.%m.%d.%H')"
  "$current_branch$(date -u +'%y.%m.%d.%H.%M')"
  "$current_branch$(date -u +'%y.%m.%d.%H.%M%S')"
)

# Iterate through candidate tags and choose the first available one
for tag in "${tags[@]}"; do
  if ! git tag -l | grep -q "^$tag$"; then
    new_tag=$tag
    echo "New Tag: $new_tag"
    break
  fi
done

if [ -z "$new_tag" ]; then
  exit 1 "cannot make new release tag"
fi
# Create the new tag
output_files=$(find . -maxdepth 1 -type f -name "*.js" -o -name "*.js.map")
echo "Committing changes: "
echo $output_files
git tag "$new_tag"
git add $output_files
git commit -am "Release $new_tag"
git push && git push origin "$new_tag"