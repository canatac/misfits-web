"""Tests of the post-deploy checks of the interface and of their report
(paperclip-fleet#878): no network. python3 -m unittest discover -s .github/scripts"""

from __future__ import annotations

import json
import sys
import unittest
import urllib.error
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import post_deploy_failures as fail  # noqa: E402
import post_deploy_report as rep  # noqa: E402


def spec(title, ok, message=None):
    results = [{"status": "failed", "error": {"message": message}}] if message else [{"status": "passed"}]
    return {"title": title, "ok": ok, "tests": [{"results": results}]}


class Failures(unittest.TestCase):
    def test_the_tests_failed_by_their_title_and_first_line(self):
        report = {"suites": [{"title": "post-deploy.smoke.ts", "specs": [spec("login", True)], "suites": [
            {"title": "x", "specs": [
                spec("add account: provider catalogue", False,
                     "\x1b[31mError: GET /api/external-accounts/oauth2/providers\x1b[39m\n\nExpected: < 400\nReceived: 500"),
                spec("compose", True)]}]}]}
        self.assertEqual(fail.failures(report), [{"check": "add account: provider catalogue", "detail":
                                                  "Error: GET /api/external-accounts/oauth2/providers"}])

    def test_a_crash_before_the_tests_is_one_failure(self):
        self.assertEqual(fail.failures({"suites": [], "errors": [{"message": "browser closed\nmore"}]}),
                         [{"check": "run", "detail": "browser closed"}])
        self.assertEqual(fail.failures({"suites": []}), [])

    def test_no_report_is_a_failure(self):
        out = Path(__file__).parent / "_failures_test.json"
        self.addCleanup(lambda: out.unlink(missing_ok=True))
        fail.main(["x", "/nonexistent/report.json", str(out)])
        self.assertEqual(json.loads(out.read_text()), [{"check": "run", "detail": "no report of Playwright"}])


class FakeGitHub:
    def __init__(self, open_issues=(), types=True):
        self.open_issues, self.types, self.calls, self.labelled = list(open_issues), types, [], False

    def call(self, method, path, body=None):
        self.calls.append((method, path, body))
        if path == "/labels":
            if self.labelled:
                raise urllib.error.HTTPError(path, 422, "exists", {}, None)
            self.labelled = True
            return {}
        if method == "GET":
            return self.open_issues
        if path == "/issues" and "type" in body and not self.types:
            raise urllib.error.HTTPError(path, 422, "no types", {}, None)
        return {"number": 900 + len(self.calls)}


class Report(unittest.TestCase):
    FAILURE = {"check": "provider catalogue", "detail": "GET x answered 500 for qa@example.org / hunter2"}

    def test_a_new_failure_opens_a_critical_bug_without_the_secrets(self):
        github = FakeGitHub()
        done = rep.report(github, [self.FAILURE], "a" * 40, "https://run", ["qa@example.org", "hunter2", ""])
        method, path, body = github.calls[-1]
        self.assertEqual((method, path, body["type"], body["labels"]),
                         ("POST", "/issues", "Bug", ["priority-P1", "priority:high", "post-deploy"]))
        self.assertEqual(body["title"], "Post-deploy check failed: provider catalogue")
        self.assertIn("## Acceptance criteria\n- The post-deploy check \"provider catalogue\" passes", body["body"])
        self.assertIn("aaaaaaaaaaaa", body["body"])
        self.assertNotIn("hunter2", json.dumps(github.calls))
        self.assertNotIn("qa@example.org", json.dumps(github.calls))
        self.assertTrue(done[0].endswith("opened: provider catalogue"))

    def test_still_open_it_is_commented(self):
        github = FakeGitHub([{"number": 7, "title": "Post-deploy check failed: provider catalogue"},
                             {"number": 8, "title": "Post-deploy check failed: provider catalogue",
                              "pull_request": {}}])
        self.assertEqual(rep.report(github, [self.FAILURE], "b" * 40, "https://run", []),
                         ["#7 commented: provider catalogue"])
        self.assertEqual(github.calls[-1][1], "/issues/7/comments")

    def test_without_issue_types_it_opens_it_all_the_same(self):
        github = FakeGitHub(types=False)
        github.labelled = True
        rep.report(github, [self.FAILURE], "c" * 40, "", [])
        self.assertNotIn("type", github.calls[-1][2])
        self.assertEqual(github.calls[-1][2]["labels"][0], "priority-P1")


if __name__ == "__main__":
    unittest.main()
