#!/usr/bin/env python3
import os, json, re, pathlib
AUDIT=os.environ.get("AUDIT_DIR","docs/audit"); os.makedirs(AUDIT, exist_ok=True)
code_ext=('.ts','.tsx','.js','.py','.go','.rs','.java','.rb')
total=doc=0
for root,_,files in os.walk('.'):
  if root.startswith("./node_modules") or "/." in root: continue
  for f in files:
    p=os.path.join(root,f)
    if f.endswith(code_ext):
      total+=1
      with open(p,'r',errors='ignore') as fh:
        head=''.join([next(fh,'') for _ in range(15)])
      if re.search(r'@summary|Copyright|MIT|Apache|License|Description',head,re.I):
        doc+=1
ratio= (doc/total)*100 if total else 100
with open(os.path.join(AUDIT,'docs_coverage.json'),'w') as fp:
  json.dump({"total":total,"documented":doc,"coverage_pct":round(ratio,1)},fp)
if total and ratio < 40: exit(1)
