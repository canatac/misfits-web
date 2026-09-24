# Issue #694: waiting-autoresume-nudger.service crash loop

## Root Cause
- Service points to `/tmp/waiting_autoresume_nudger.py` — ephemeral, deleted by tmp cleanup
- `Restart=always` + `RestartSec=2` = infinite crash loop (~306k restarts/24h)
- Consumes CPU, pollutes systemd logs

## Fix
- Disabled the nudger service (fleetbus-autolistener already handles waiting agents)
- Service file rewritten: `ExecStart=/bin/sleep infinity`, `Restart=no`
- Symlink removed from `default.target.wants/`

## Verification
- Service no longer active
- No crash loop in journal
- fleetbus-autolistener.service continues to handle agent nudging

## Recovery
To restore nudger functionality: create a persistent script and update ExecStart path.
