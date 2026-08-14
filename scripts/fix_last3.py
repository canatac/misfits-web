#!/usr/bin/env python3
"""Fix last 3 CI errors directly"""
aos = "/root/misfits-web/src/components/admin/tabs/AdminOverviewSections.tsx"
c = open(aos).read()

# 1. securityIncidents.data?.alerts → securityIncidents (it's already an array)
c = c.replace(
    "!securityIncidents.data?.alerts?.length",
    "!securityIncidents.length"
)

# 2. monitoringLive events type: add event_type and to fields
c = c.replace(
    '.map((evt: { id?: string; kind?: string; ts?: string; message?: string; level?: string }) => (',
    '.map((evt: { id?: string; kind?: string; event_type?: string; ts?: string; message?: string; level?: string; to?: string }) => ('
)

open(c.count, "w").write(c) if False else open(aos, "w").write(c)
print(f"Done: {len(c.splitlines())} lines")
