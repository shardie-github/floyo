#!/usr/bin/env node
import fs from 'fs'; import path from 'path';
const AUDIT=process.env.AUDIT_DIR||'docs/audit'; fs.mkdirSync(AUDIT,{recursive:true});
const manifest = ['analytics/manifest.json','docs/analytics_manifest.json'].find(f=>fs.existsSync(f));
if(!manifest) process.exit(0);
const allow=new Set(JSON.parse(fs.readFileSync(manifest,'utf-8')).events||[]);
const codeRoots=['src','app','packages'].filter(fs.existsSync);
const found=new Set();
const rx=/track\(['"`]([A-Za-z0-9_.:-]+)['"`]/g;
for(const root of codeRoots){
  const walk=(p)=>{for(const f of fs.readdirSync(p,{withFileTypes:true})){
    const np=path.join(p,f.name);
    if(f.isDirectory()) walk(np);
    else if(/\.(ts|tsx|js)$/.test(f.name)){
      const s=fs.readFileSync(np,'utf-8'); let m; while((m=rx.exec(s))){found.add(m[1]);}
    }}};
  walk(root);
}
const unknown=[...found].filter(e=>!allow.has(e));
fs.writeFileSync(path.join(AUDIT,'analytics_contracts.txt'), `Unknown events: ${unknown.join(', ')||'none'}`)
if(unknown.length) process.exit(1)
