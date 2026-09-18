#!/bin/bash
# fleet_monitor.sh — Commandes de vérification rapide pour conductor-ops
# Usage: fleet_monitor.sh [--agent <name>] [--watch]

REDIS_HOST="${REDIS_HOST:-172.16.12.2}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASS="${REDIS_PASS:-OTn1WGEUUNsLJDQ3xfokPcxVe75YgtbMdvoPKLzW}"

show_agent() {
    local agent="$1"
    echo "=== $agent ==="
    
    # Queue
    local qlen=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" LLEN "queue:${agent}" 2>/dev/null || echo "?")
    echo "  Queue: ${qlen} messages"
    
    # Processing
    local plen=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" LLEN "processing:${agent}" 2>/dev/null || echo "?")
    echo "  Processing: ${plen} messages"
    
    # Inbox
    local ilen=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" LLEN "inbox:${agent}" 2>/dev/null || echo "?")
    echo "  Inbox: ${ilen} messages"
    
    # Claim actif
    local claim=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" KEYS "claim:*" 2>/dev/null | while read -r key; do
        local tid=$(echo "$key" | sed 's/claim://')
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" GET "$key" 2>/dev/null | \
            xargs -I{} echo "    task={} owner={}"
    done)
    if [ -n "$claim" ]; then
        echo "  Claims actifs:"
        echo "$claim"
    else
        echo "  Claims actifs: aucun"
    fi
    
    # Relay v4 actif
    local relay_pid=$(systemctl show --property=MainPID --value "fleet-relay@${agent}" 2>/dev/null || echo "inactive")
    if [ "$relay_pid" != "0" ] && [ "$relay_pid" != "inactive" ]; then
        echo "  Relay v4: PID=$relay_pid (actif)"
    else
        echo "  Relay v4: inactif"
    fi
}

show_all() {
    echo "=== FLEET LAUNCHER v4 MONITOR ==="
    echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "Redis: ${REDIS_HOST}:${REDIS_PORT}"
    echo ""
    
    echo "--- Services systemd fleet-relay@ ---"
    systemctl list-units --type=service --state=running --no-pager 2>/dev/null | grep fleet-relay || echo "  aucun actif"
    echo ""
    
    echo "--- Files d'attente actives ---"
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" SCAN 0 MATCH "queue:*" 2>/dev/null | tail -n +2 | while read -r key; do
        if [ -n "$key" ]; then
            local len=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" LLEN "$key" 2>/dev/null)
            local agent=$(echo "$key" | sed 's/queue://')
            echo "  ${agent}: ${len}"
        fi
    done
    echo ""
    
    echo "--- Claims actifs ---"
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" SCAN 0 MATCH "claim:*" 2>/dev/null | tail -n +2 | while read -r key; do
        if [ -n "$key" ]; then
            local tid=$(echo "$key" | sed 's/claim://')
            local owner=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" GET "$key" 2>/dev/null)
            local ttl=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" TTL "$key" 2>/dev/null)
            echo "  task=${tid} owner=${owner:-?} ttl=${ttl}s"
        fi
    done
    echo ""
    
    echo "--- Résultats récents ---"
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" SCAN 0 MATCH "result:*" COUNT 10 2>/dev/null | tail -n +2 | while read -r key; do
        if [ -n "$key" ]; then
            local val=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" GET "$key" 2>/dev/null)
            local success=$(echo "$val" | jq -r '.success // "?"' 2>/dev/null)
            local state=$(echo "$val" | jq -r '.state // "?"' 2>/dev/null)
            local agent=$(echo "$val" | jq -r '.from // "?"' 2>/dev/null)
            local task=$(echo "$key" | sed 's/result://')
            echo "  ${task}: state=${state} success=${success} agent=${agent}"
        fi
    done
}

AGENT=""
WATCH=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --agent) AGENT="$2"; shift 2 ;;
        --watch) WATCH=true; shift ;;
        *) shift ;;
    esac
done

if [ -n "$AGENT" ]; then
    if $WATCH; then
        while true; do
            clear
            show_agent "$AGENT"
            sleep 2
        done
    else
        show_agent "$AGENT"
    fi
else
    if $WATCH; then
        while true; do
            clear
            show_all
            sleep 2
        done
    else
        show_all
    fi
fi
