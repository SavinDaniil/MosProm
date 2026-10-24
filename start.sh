#!/bin/sh
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if ! command -v python3 >/dev/null 2>&1; then
    echo 'Для запуска нужен Python 3. Установите пакет python3 через менеджер пакетов Linux.' >&2
    exit 1
fi
exec python3 "$PROJECT_DIR/scripts/serve-game.py" "$@"
