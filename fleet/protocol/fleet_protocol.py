#!/usr/bin/env python3
"""
fleet_protocol.py — Schéma et constantes du protocole de messages fleet.

Version du format : 1.0.0

États transport  : PUBLISHED → CLAIMED → DELIVERED
États métier     : ACCEPTED → RUNNING → BLOCKED | COMPLETED | FAILED | CANCELLED

Aucune dépendance à tmux. Le transport est purement Redis Lists + fichiers de session.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

PROTOCOL_VERSION = "1.0.0"

# ── Transport states ──────────────────────────────────────────────────────────
class TransportState(str, Enum):
    PUBLISHED = "PUBLISHED"
    CLAIMED = "CLAIMED"
    DELIVERED = "DELIVERED"

# ── Business states ──────────────────────────────────────────────────────────
class BusinessState(str, Enum):
    ACCEPTED = "ACCEPTED"
    RUNNING = "RUNNING"
    BLOCKED = "BLOCKED"
    BLOCKED_APPROVAL = "BLOCKED_APPROVAL"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

# ── Message types ────────────────────────────────────────────────────────────
class MessageType(str, Enum):
    TICKET_ASSIGN = "TICKET_ASSIGN"
    TICKET_FIX_PR = "TICKET_FIX_PR"
    STATUS_UPDATE = "STATUS_UPDATE"
    TEST_PING = "TEST_PING"
    TEST_PONG = "TEST_PONG"
    RESULT = "RESULT"
    ERROR = "ERROR"
    HEARTBEAT = "HEARTBEAT"
    BLOCKED_APPROVAL = "BLOCKED_APPROVAL"

# ── Redis key patterns ───────────────────────────────────────────────────────
def queue_key(agent: str) -> str:
    return f"queue:{agent}"

def inbox_key(agent: str) -> str:
    return f"inbox:{agent}"

def processing_key(agent: str) -> str:
    return f"processing:{agent}"

def task_key(task_id: str) -> str:
    return f"task:{task_id}"

def msg_key(msg_id: str) -> str:
    return f"msg:{msg_id}"

def result_key(task_id: str) -> str:
    return f"result:{task_id}"

def claim_key(task_id: str) -> str:
    return f"claim:{task_id}"

def log_key(date: Optional[str] = None) -> str:
    if date is None:
        date = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"log:fleet:{date}"

# ── Message builder ──────────────────────────────────────────────────────────
def make_message(
    *,
    type: MessageType | str,
    to: str,
    from_: str,
    body: str,
    task_id: Optional[str] = None,
    correlation_id: Optional[str] = None,
    in_reply_to: Optional[str] = None,
    ttl_seconds: int = 3600,
    extra: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Construit un message conforme au protocole v1.0.0."""
    msg_id = f"msg_{uuid.uuid4().hex[:16]}"
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    msg: dict[str, Any] = {
        "id": msg_id,
        "version": PROTOCOL_VERSION,
        "type": str(type),
        "from": from_,
        "to": to,
        "task_id": task_id or f"task_{uuid.uuid4().hex[:12]}",
        "correlation_id": correlation_id or msg_id,
        "in_reply_to": in_reply_to,
        "ts": ts,
        "ttl_seconds": ttl_seconds,
        "expires_at": (
            datetime.now(timezone.utc).timestamp() + ttl_seconds
        ),
        "body": body,
        "state": TransportState.PUBLISHED.value,
    }
    if extra:
        msg.update(extra)
    return msg

def validate_message(payload: dict[str, Any]) -> tuple[bool, list[str]]:
    """Valide qu'un payload respecte le schéma minimal."""
    required = ["id", "version", "type", "from", "to", "task_id", "ts", "body"]
    errors = [f"missing:{k}" for k in required if k not in payload]
    if "version" in payload and payload["version"] != PROTOCOL_VERSION:
        errors.append(f"version_mismatch:got={payload['version']},want={PROTOCOL_VERSION}")
    return (len(errors) == 0, errors)

# ── Result builder ───────────────────────────────────────────────────────────
def make_result(
    *,
    task_id: str,
    agent: str,
    success: bool,
    output: str = "",
    error: str = "",
    artifacts: Optional[dict[str, Any]] = None,
    attempt_id: str = "",
    duration_seconds: float = 0.0,
) -> dict[str, Any]:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "id": f"res_{uuid.uuid4().hex[:16]}",
        "version": PROTOCOL_VERSION,
        "type": MessageType.RESULT.value,
        "task_id": task_id,
        "from": agent,
        "success": success,
        "state": BusinessState.COMPLETED.value if success else BusinessState.FAILED.value,
        "output": output,
        "error": error,
        "artifacts": artifacts or {},
        "attempt_id": attempt_id,
        "duration_seconds": duration_seconds,
        "ts": ts,
    }
