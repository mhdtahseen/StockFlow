#!/bin/bash

# This script repairs the Supabase migration history locally
# by marking all remote-only migrations as "reverted" (so they are ignored)
# and marking current local migrations as "applied".

echo "🔍 Detecting migration discrepancies..."

# Get the list of missing versions from the dry-run output
MISSING_VERSIONS=$(npx supabase db push --dry-run 2>&1 | grep -oE '[0-9]{14}' | sort -u)

if [ -z "$MISSING_VERSIONS" ]; then
    echo "✅ No discrepancies found. Your migration history is clean!"
    exit 0
fi

echo "🛠️ Found missing versions. Repairing history..."

for version in $MISSING_VERSIONS; do
    echo "Processing $version..."
    npx supabase migration repair --status applied "$version"
done

echo "🚀 Local history repaired. You can now use 'supabase db push' normally."
