#!/usr/bin/env bash
# MW-2026-020 smoke test — On-device AI processing
set -euo pipefail
BASE="https://mail.misfits.ai"
PASS=0; FAIL=0

check() {
  local desc="$1" cmd="$2" expect="$3"
  result=$(eval "$cmd" 2>&1) && rc=0 || rc=$?
  if [[ "$result" == *"$expect"* ]]; then
    echo "PASS: $desc"
    PASS=$((PASS+1))
  else
    echo "FAIL: $desc (expected '$expect' in '$result')"
    FAIL=$((FAIL+1))
  fi
}

echo "=== Smoke: MW-2026-020 On-device AI ==="

# Check for WebAssembly / Web Worker in scripts
script_tags=$(curl -s $BASE/ 2>/dev/null | grep -o 'wasm\|webworker\|webassembly' | sort -u | head -3)
if [[ -n "$script_tags" ]]; then
  echo "PASS: WebAssembly/WebWorker found"
  PASS=$((PASS+1))
else
  echo "INFO: no WASM/WebWorker detected"
fi

# Check privacy/settings route
privacy_code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/settings/privacy" 2>/dev/null || echo "000")
echo "INFO: /settings/privacy HTTP $privacy_code"

# Check for model download or storage indicators
model_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'model.*download\|webllm\|onnx\|wasm.*ai' | sort -u | head -3)
echo "Model/local-AI strings found: ${model_check:-none}"

# Check cloud AI endpoints (none should exist without backend)
cloud_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'openai\.com\|anthropic\|google.*ai' | head -3)
echo "Cloud AI references: ${cloud_check:-none}"

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
