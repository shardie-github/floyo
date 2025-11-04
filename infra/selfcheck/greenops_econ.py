#!/usr/bin/env python3
import os, json, time
AUDIT=os.environ.get("AUDIT_DIR","docs/audit"); os.makedirs(AUDIT, exist_ok=True)
# Heuristic: estimate cost/energy proxies from CI runtime and dependency sizes
start=float(os.environ.get("GITHUB_RUN_STARTED_AT", "0") or 0)
now=time.time()
runtime_min = round((now - start)/60, 2) if start else None
report={"runtime_minutes": runtime_min, "notes":"Heuristic GreenOps estimate. Calibrate with provider data."}
with open(os.path.join(AUDIT,'greenops_report.json'),'w') as f: json.dump(report,f)
