#!/usr/bin/env python3
"""Opens or comments one issue per post-deploy check that failed
(paperclip-fleet#878, #879; the same file in reimagined-guide).

The issue is a critical bug for the team (paperclip-fleet#876): the type
Bug, labelled priority-P1, priority:high and post-deploy, with its
acceptance criteria. Still open from an earlier deploy: a comment instead.
The values of QA_TEST_LOGIN, QA_TEST_PASSWORD and QA_TEST_RECIPIENT are
masked in every text written.

Usage: post_deploy_report.py FAILURES.json
Environment: GITHUB_REPOSITORY, GITHUB_TOKEN, GITHUB_SHA, RUN_URL,
GITHUB_API_URL (optional). Standard library only.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

LABEL = "post-deploy"
LABELS = ["priority-P1", "priority:high", LABEL]
SECRETS = ("QA_TEST_LOGIN", "QA_TEST_PASSWORD", "QA_TEST_RECIPIENT")
DETAIL_CHARS = 600


def title_of(check: str) -> str:
    return f"Post-deploy check failed: {check}"


def masked(text: str, secrets: list[str]) -> str:
    for secret in sorted((s for s in secrets if s), key=len, reverse=True):
        text = text.replace(secret, "***")
    return text


class GitHub:
    def __init__(self, repo: str, token: str, api: str = "https://api.github.com") -> None:
        self.repo, self.token, self.api = repo, token, api.rstrip("/")

    def call(self, method: str, path: str, body: dict | None = None):
        request = urllib.request.Request(f"{self.api}/repos/{self.repo}{path}", method=method,
                                         data=None if body is None else json.dumps(body).encode(),
                                         headers={"Authorization": f"Bearer {self.token}",
                                                  "Accept": "application/vnd.github+json",
                                                  "Content-Type": "application/json",
                                                  "User-Agent": "post-deploy-smoke"})
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
        return json.loads(raw) if raw else None


def report(github: GitHub, failures: list[dict], sha: str, run_url: str, secrets: list[str]) -> list[str]:
    """What it did, one line per failure."""
    try:
        github.call("POST", "/labels", {"name": LABEL, "color": "b60205",
                                        "description": "A check after a deploy failed on production"})
    except urllib.error.HTTPError as error:
        if error.code != 422:  # 422: the label is there already.
            raise
    issues = github.call("GET", f"/issues?state=open&labels={LABEL}&per_page=100") or []
    done = []
    for failure in failures:
        check = masked(str(failure.get("check") or "unnamed"), secrets)
        detail = masked(str(failure.get("detail") or ""), secrets)[:DETAIL_CHARS]
        title = title_of(check)
        found = next((i for i in issues if i.get("title") == title and "pull_request" not in i), None)
        if found:
            github.call("POST", f"/issues/{found['number']}/comments",
                        {"body": f"Still failing after the deploy of {sha[:12]}.\n\n{detail}\n\nRun: {run_url}"})
            done.append(f"#{found['number']} commented: {check}")
            continue
        body = (f"The post-deploy check **{check}** failed on production after the deploy of {sha[:12]}.\n\n"
                f"{detail}\n\nRun: {run_url}\n\n## Acceptance criteria\n"
                f"- The post-deploy check \"{check}\" passes on production after the next deploy\n")
        issue = {"title": title, "body": body, "labels": LABELS}
        try:
            created = github.call("POST", "/issues", dict(issue, type="Bug"))
        except urllib.error.HTTPError as error:
            if error.code != 422:  # 422: no issue types on this repository.
                raise
            created = github.call("POST", "/issues", issue)
        done.append(f"#{created['number']} opened: {check}")
    return done


def main(argv: list[str]) -> int:
    with open(argv[1], encoding="utf-8") as source:
        failures = json.load(source)
    if not failures:
        return 0
    github = GitHub(os.environ["GITHUB_REPOSITORY"], os.environ["GITHUB_TOKEN"],
                    os.environ.get("GITHUB_API_URL", "https://api.github.com"))
    for line in report(github, failures, os.environ.get("GITHUB_SHA", ""), os.environ.get("RUN_URL", ""),
                       [os.environ.get(name, "") for name in SECRETS]):
        print(line)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
