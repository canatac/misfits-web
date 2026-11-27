#!/usr/bin/env python3
"""The checks of the interface that failed, from the JSON report of
Playwright, for post_deploy_report.py (paperclip-fleet#878).

Usage: post_deploy_failures.py REPORT.json FAILURES.json
FAILURES.json: {"failures": one per test failed after its retries,
{"check": its title, "detail": the first line of its last error},
"passed": the titles of the tests passed, whose issue is closed
(paperclip-fleet#882); a test skipped is neither}. Standard library only.
"""

from __future__ import annotations

import json
import re
import sys

ANSI = re.compile(r"\x1b\[[0-9;]*m")
DETAIL_CHARS = 400


def specs(suite: dict):
    yield from suite.get("specs") or []
    for child in suite.get("suites") or []:
        yield from specs(child)


def failures(report: dict) -> list[dict]:
    found = []
    for suite in report.get("suites") or []:
        for spec in specs(suite):
            if spec.get("ok", True):
                continue
            message = ""
            for case in spec.get("tests") or []:
                for result in case.get("results") or []:
                    error = result.get("error") or {}
                    message = error.get("message") or message
            first = ANSI.sub("", message).strip().splitlines()[:1]
            found.append({"check": spec.get("title") or "unnamed",
                          "detail": (first[0] if first else "failed")[:DETAIL_CHARS]})
    # A crash before any test (the config, the browser): one failure.
    if not found and report.get("errors"):
        message = ANSI.sub("", (report["errors"][0] or {}).get("message") or "").strip().splitlines()[:1]
        found.append({"check": "run", "detail": (message[0] if message else "failed")[:DETAIL_CHARS]})
    return found


def passed(report: dict) -> list[str]:
    """The titles of the tests whose last result passed (after a retry too)."""
    found = []
    for suite in report.get("suites") or []:
        for spec in specs(suite):
            results = [result for case in spec.get("tests") or [] for result in case.get("results") or []]
            if spec.get("ok", True) and results and results[-1].get("status") == "passed":
                found.append(spec.get("title") or "unnamed")
    return found


def main(argv: list[str]) -> int:
    try:
        with open(argv[1], encoding="utf-8") as source:
            report = json.load(source)
    except (OSError, ValueError):
        report = {"errors": [{"message": "no report of Playwright"}]}
    with open(argv[2], "w", encoding="utf-8") as out:
        json.dump({"failures": failures(report), "passed": passed(report)}, out)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
