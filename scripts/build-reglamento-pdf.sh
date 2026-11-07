#!/usr/bin/env bash
# Genera public/reglamento-liga.pdf desde content/reglamento/reglamento-liga.html
# con Chrome headless. Uso: ./scripts/build-reglamento-pdf.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
SRC="$ROOT/content/reglamento/reglamento-liga.html"
OUT="$ROOT/public/reglamento-liga.pdf"

if [ ! -x "$CHROME" ]; then
  echo "No se encontró Chrome en: $CHROME (definí CHROME_BIN)" >&2
  exit 1
fi

PROFILE="$(mktemp -d "${TMPDIR:-/tmp}/reglamento-chrome.XXXXXX")"
trap 'rm -rf "$PROFILE"' EXIT
"$CHROME" --user-data-dir="$PROFILE" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="$OUT" "file://$SRC"
# Chrome no dibuja imágenes en los márgenes de página: los logos de cada hoja
# se estampan después con pdf-lib.
node "$ROOT/scripts/stamp-reglamento-logos.mjs" "$OUT"
echo "PDF generado: $OUT"
