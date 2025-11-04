#!/usr/bin/env python3
# Score 0-100 based on presence of quickstart, env example, seed script, run script.
import os, json
AUDIT=os.environ.get("AUDIT_DIR","docs/audit"); os.makedirs(AUDIT, exist_ok=True)
score=0; notes=[]
if os.path.exists("README.md"): score+=25
if any(os.path.exists(x) for x in [".env.example","env.example"]): score+=25
if any(os.path.exists(x) for x in ["scripts/dev.sh","package.json"]): score+=25
if os.path.isdir("docs"): score+=25
with open(os.path.join(AUDIT,'onboarding_index.json'),'w') as f: json.dump({"score":score,"notes":notes},f)
exit(0 if score>=60 else 1)
