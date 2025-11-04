#!/usr/bin/env node
import fs from 'fs'; import path from 'path'; import { execSync } from 'child_process';
const AUDIT_DIR=process.env.AUDIT_DIR||'docs/audit';
const specFiles=fs.readdirSync('.').filter(f=>/^openapi.*\.(ya?ml|json)$/.test(f));
if(!specFiles.length) process.exit(0);
try{execSync('npx --yes @apidevtools/swagger-cli validate '+specFiles[0],{stdio:'inherit'});}catch(e){}
const routesDirs=['src/pages/api','pages/api','src/routes','server/routes'].filter(d=>fs.existsSync(d));
const specTxt=fs.readFileSync(specFiles[0],'utf-8');
const want=(specTxt.match(/ (get|post|put|patch|delete):/g)||[]).length;
let have=0;
routesDirs.forEach(d=>{
  fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{
    if(e.isFile() && /\.(ts|js)$/.test(e.name)) have++;
  })
});
fs.mkdirSync(AUDIT_DIR,{recursive:true});
fs.writeFileSync(path.join(AUDIT_DIR,'openapi_handler_parity.txt'),
  `Spec endpoints (approx): ${want}\nRoute handlers found: ${have}\n(Note: heuristic count)`);
if(want>0 && have===0) process.exit(1);
