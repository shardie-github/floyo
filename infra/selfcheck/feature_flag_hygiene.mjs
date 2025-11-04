#!/usr/bin/env node
import fs from 'fs'; import path from 'path';
const AUDIT=process.env.AUDIT_DIR||'docs/audit'; fs.mkdirSync(AUDIT,{recursive:true});
const flagFiles=['backend/feature_flags.py','config/flags.ts','config/flags.js','flags.json','config/featureFlags.json'].filter(fs.existsSync);
if(!flagFiles.length) process.exit(0);

let foundKillSwitch = false;
let details = [];

for(const file of flagFiles){
  const text=fs.readFileSync(file,'utf-8');
  // Check for kill_switch field in model/class definition
  const hasKillField = /kill_switch\s*[=:]/i.test(text) || /killSwitch\s*[=:]/i.test(text);
  // Check for kill-switch related methods or comments
  const hasKillMethod = /kill.*switch|killSwitch|emergency.*disable/i.test(text);
  // Check database schema/migration for kill_switch column
  const hasKillColumn = /kill_switch.*column|killSwitch.*column/i.test(text);
  
  if(hasKillField || hasKillMethod || hasKillColumn){
    foundKillSwitch = true;
    details.push(`${file}: kill-switch support detected`);
  }
}

const report = foundKillSwitch 
  ? `OK: kill-switch patterns found\n${details.join('\n')}`
  : `WARN: no kill-switch semantics detected in ${flagFiles.join(', ')}`;

fs.writeFileSync(path.join(AUDIT,'feature_flag_hygiene.txt'), report);
if(!foundKillSwitch) process.exit(1);
