#!/usr/bin/env node
import { CLIEngine } from '@axe-core/cli';
import fs from 'fs'; const AUDIT=process.env.AUDIT_DIR||'docs/audit';
const target = fs.existsSync('out') ? 'out' : (fs.existsSync('dist') ? 'dist' : null);
if(!target) process.exit(0);
const cli = new CLIEngine();
const result = await cli.run(['--dir', target, '--timeout', '120000']);
fs.mkdirSync(AUDIT,{recursive:true});
fs.writeFileSync(`${AUDIT}/a11y_report.json`, JSON.stringify(result,null,2));
if (result.violations && result.violations.length) process.exit(1);
