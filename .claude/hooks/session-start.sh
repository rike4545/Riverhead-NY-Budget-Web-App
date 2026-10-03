#!/bin/bash
# Installs this repo's dependencies when a Claude Code on the web session
# starts, so the ETL tests, the type check and the site build run at once.
set -euo pipefail

# Only on the web; a local checkout manages its own environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# ETL: the dependencies pyproject.toml lists, installed directly so no build
# files land in the checkout. --user puts newer versions ahead of the image's
# Debian-packaged ones (cryptography 41), which pip cannot uninstall. The
# "transcribe" extra (faster-whisper) is left out: it is large and only the
# transcription workflow uses it.
python3 - <<'PY' | xargs python3 -m pip install --user --quiet --disable-pip-version-check --root-user-action=ignore
import tomllib
print("\n".join(tomllib.load(open("pyproject.toml", "rb"))["project"]["dependencies"]))
PY

# Web app. npm install rather than npm ci, so a cached container's
# node_modules is reused.
cd web
npm install --no-audit --no-fund --loglevel=error
