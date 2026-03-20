set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/bump-version.sh <version>"
    exit 1
fi

VERSION="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."

cd "$ROOT_DIR"
npm pkg set version="$VERSION"

sed -i '' "s/^version = \".*\"/version = \"$VERSION\"/" src-tauri/Cargo.toml

TMP=$(mktemp)
node -e "
const fs = require('fs');
const conf = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
conf.version = '$VERSION';
fs.writeFileSync('$TMP', JSON.stringify(conf, null, 2) + '\n');
"
mv "$TMP" src-tauri/tauri.conf.json

cargo generate-lockfile --manifest-path src-tauri/Cargo.toml 2>/dev/null || true

echo "Updated to v$VERSION:"
echo "  - package.json"
echo "  - src-tauri/Cargo.toml"
echo "  - src-tauri/tauri.conf.json"
