#!/usr/bin/env python3
"""Builds index.html (the publishable page) from page.html + modules.json.

page.html is the template: it holds all the markup, CSS and JS and one
`__DATA__` placeholder. modules.json is the only place the real S3 module /
prof / lesson lists live, so edits to the curriculum happen there.

    python3 build.py
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent


def main() -> int:
    data = json.loads((HERE / "modules.json").read_text(encoding="utf-8"))
    tpl = (HERE / "page.html").read_text(encoding="utf-8")

    if "__DATA__" not in tpl:
        sys.exit("page.html: the __DATA__ placeholder is gone")

    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    if "</script" in blob.lower():
        sys.exit("modules.json: a value would close the <script> block")

    (HERE / "index.html").write_text(tpl.replace("__DATA__", blob), encoding="utf-8")

    lessons = sum(
        len(g["courses"]) for m in data for s in m["sections"] for g in s["groups"]
    )
    profs = {g["prof"] for m in data for s in m["sections"] for g in s["groups"]}
    print(f"index.html: {len(data)} modules, {lessons} lessons, {len(profs)} profs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
