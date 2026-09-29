#!/bin/bash
# Serve the dev UI locally — no extension reload needed
# Usage: ./dev/serve.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=3457

echo "productivity_shield dev server → http://localhost:$PORT/dev/"
python3 -m http.server $PORT --directory "$ROOT"
