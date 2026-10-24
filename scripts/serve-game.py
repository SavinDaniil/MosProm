#!/usr/bin/env python3
"""Serve the bundled game without third-party dependencies."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys
import webbrowser


def main():
    parser = argparse.ArgumentParser(description="Локальный запуск игры «Очаково»")
    parser.add_argument("--port", type=int, default=4174, help="порт сервера (по умолчанию 4174)")
    parser.add_argument("--no-browser", action="store_true", help="не открывать браузер автоматически")
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("порт должен быть от 1 до 65535")

    game_dir = Path(__file__).resolve().parent.parent / "ochakovo-game" / "dist"
    if not (game_dir / "index.html").is_file():
        print("Не найдена игра: {}".format(game_dir / "index.html"), file=sys.stderr)
        return 1

    handler = partial(SimpleHTTPRequestHandler, directory=str(game_dir))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as error:
        print("Не удалось запустить сервер: {}".format(error), file=sys.stderr)
        print("Если порт занят, запустите: ./start.sh --port 4175", file=sys.stderr)
        return 1

    url = "http://127.0.0.1:{}/".format(args.port)
    with server:
        print("Игра: {}\nДля остановки нажмите Ctrl+C.".format(url), flush=True)
        if not args.no_browser:
            try:
                webbrowser.open(url)
            except webbrowser.Error:
                print("Откройте адрес игры в браузере вручную.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nСервер остановлен.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
