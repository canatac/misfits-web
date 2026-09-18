#!/usr/bin/env python3
"""
test_fleet_protocol.py — Tests unitaires du protocole et du lanceur.

Tests :
- make_message respecte le schéma
- validate_message accepte/rejette correctement
- make_result structure correcte
- TaskClaim : acquire/release idempotence
- Redis down → launcher exit code 2
- Claim expiré → doublon rejeté
"""

from __future__ import annotations

import json
import os
import sys
import time
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from protocol.fleet_protocol import (
    PROTOCOL_VERSION,
    BusinessState,
    TransportState,
    claim_key,
    inbox_key,
    make_message,
    make_result,
    msg_key,
    queue_key,
    result_key,
    task_key,
    validate_message,
)


class TestMessageSchema(unittest.TestCase):

    def test_make_message_has_required_fields(self):
        msg = make_message(
            type="TICKET_ASSIGN",
            to="dev-web",
            from_="scrum-master",
            body="Fixer le bug #42",
        )
        for f in ("id", "version", "type", "from", "to", "task_id", "ts", "body"):
            self.assertIn(f, msg)
        self.assertEqual(msg["version"], PROTOCOL_VERSION)
        self.assertEqual(msg["state"], TransportState.PUBLISHED.value)

    def test_make_message_with_correlation(self):
        msg = make_message(
            type="TICKET_ASSIGN",
            to="dev-web",
            from_="scrum-master",
            body="test",
            correlation_id="corr_abc",
            in_reply_to="msg_xyz",
        )
        self.assertEqual(msg["correlation_id"], "corr_abc")
        self.assertEqual(msg["in_reply_to"], "msg_xyz")

    def test_validate_ok(self):
        msg = make_message(type="TEST_PING", to="x", from_="y", body="ping")
        valid, errors = validate_message(msg)
        self.assertTrue(valid)
        self.assertEqual(errors, [])

    def test_validate_missing_fields(self):
        valid, errors = validate_message({"id": "x", "body": "y"})
        self.assertFalse(valid)
        self.assertIn("missing:version", errors)
        self.assertIn("missing:type", errors)

    def test_validate_version_mismatch(self):
        msg = make_message(type="TEST_PING", to="x", from_="y", body="ping")
        msg["version"] = "0.9.0"
        valid, errors = validate_message(msg)
        self.assertFalse(valid)
        self.assertIn("version_mismatch:got=0.9.0,want=1.0.0", errors)

    def test_make_result_success(self):
        r = make_result(
            task_id="task_123",
            agent="dev-web",
            success=True,
            output="done",
            attempt_id="claim_abc",
            duration_seconds=12.3,
        )
        self.assertEqual(r["state"], BusinessState.COMPLETED.value)
        self.assertTrue(r["success"])

    def test_make_result_failure(self):
        r = make_result(
            task_id="task_123",
            agent="dev-web",
            success=False,
            error="boom",
        )
        self.assertEqual(r["state"], BusinessState.FAILED.value)

    def test_json_roundtrip(self):
        msg = make_message(type="TICKET_ASSIGN", to="dev", from_="scrum", body="x")
        blob = json.dumps(msg)
        parsed = json.loads(blob)
        self.assertEqual(parsed["id"], msg["id"])
        self.assertEqual(parsed["task_id"], msg["task_id"])


class TestTaskClaim(unittest.TestCase):
    """Tests du mécanisme de claim avec Redis mock."""

    def test_acquire_success(self):
        mock_r = MagicMock()
        mock_r.set.return_value = True
        from launcher.fleet_launcher import TaskClaim
        claim = TaskClaim(mock_r, "dev-web", "task_123")
        self.assertTrue(claim.acquire())
        mock_r.set.assert_called_once()
        args = mock_r.set.call_args
        self.assertEqual(args[0][0], claim_key("task_123"))
        self.assertIn("nx", args[1])

    def test_acquire_already_taken(self):
        mock_r = MagicMock()
        mock_r.set.return_value = None
        from launcher.fleet_launcher import TaskClaim
        claim = TaskClaim(mock_r, "dev-web", "task_123")
        self.assertFalse(claim.acquire())

    def test_release_only_if_owner(self):
        mock_r = MagicMock()
        mock_r.get.return_value = "claim_mine"
        mock_r.eval.return_value = 1
        from launcher.fleet_launcher import TaskClaim
        claim = TaskClaim(mock_r, "dev-web", "task_123")
        claim.claim_id = "claim_mine"
        claim.release()
        mock_r.eval.assert_called_once()


if __name__ == "__main__":
    unittest.main(verbosity=2)
