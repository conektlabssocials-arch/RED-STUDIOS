#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

rm -rf dist
mkdir -p dist

cp "Landing Page.html" dist/index.html
cp -R styles scripts assets dist/

# Netlify serves index.html at / — production React (smaller, faster)
node <<'NODE'
const fs = require("fs");
const p = "dist/index.html";
let h = fs.readFileSync(p, "utf8");
h = h.replace(
  /<script src="https:\/\/unpkg\.com\/react@18\.3\.1\/umd\/react\.development\.js"[^>]*><\/script>/,
  '<script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>'
);
h = h.replace(
  /<script src="https:\/\/unpkg\.com\/react-dom@18\.3\.1\/umd\/react-dom\.development\.js"[^>]*><\/script>/,
  '<script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>'
);
fs.writeFileSync(p, h);
NODE

if [ -f "$ROOT/NETLIFY-AND-VIDEOS.txt" ]; then
  cp "$ROOT/NETLIFY-AND-VIDEOS.txt" "$ROOT/dist/DEPLOY.txt"
fi

echo "Built dist/ ($(du -sh dist | cut -f1)). Upload the *contents* of dist/ to Netlify (drag folder or zip root = index.html + assets + scripts + styles)."
