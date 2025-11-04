#!/usr/bin/env node
import fs from 'fs'; import path from 'path';
const AUDIT=process.env.AUDIT_DIR||'docs/audit'; fs.mkdirSync(AUDIT,{recursive:true});
const flagFiles=['config/flags.ts','config/flags.js','flags.json','config/featureFlags.json'].filter(fs.existsSync);
if(!flagFiles.length) process.exit(0);
const text=fs.readFileSync(flagFiles[0],'utf-8');
const hasKill = /kill|sunset|deprecate/i.test(text);
fs.writeFileSync(path.join(AUDIT,'feature_flag_hygiene.txt'), hasKill?'OK: kill-switch patterns found':'WARN: no kill-switch semantics detected');
if(!hasKill) process.exit(1)
