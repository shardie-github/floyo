#!/usr/bin/env node
import madge from 'madge';
import fs from 'fs'; import path from 'path';
const AUDIT_DIR=process.env.AUDIT_DIR||'docs/audit';
const roots=['src','app','packages'].filter(d=>fs.existsSync(d));
if(!roots.length){process.exit(0);}
const res=await madge(roots,{detectiveOptions:{es6:{mixedImportsAllow: true}}});
const cycles=await res.circular();
fs.mkdirSync(AUDIT_DIR,{recursive:true});
const out=path.join(AUDIT_DIR,'circular_deps.json');
fs.writeFileSync(out,JSON.stringify({cycles},null,2));
if(cycles.length){console.error('Circular deps found'); process.exit(1);}
