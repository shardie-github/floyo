/**
 * Helper to ensure .envrc exists
 */

import * as fs from 'fs';
import * as path from 'path';

export function ensureEnvrc(): void {
  const envrcPath = path.join(process.cwd(), '.envrc');
  if (!fs.existsSync(envrcPath)) {
    fs.writeFileSync(envrcPath, `# direnv configuration
dotenv_if_exists .env.local
dotenv_if_exists .env
`);
  }
}
