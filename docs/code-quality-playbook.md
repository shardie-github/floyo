# Code Quality Playbook

This document describes our code quality tooling, processes, and policies for maintaining a clean, maintainable codebase.

## Overview

We use automated tools to detect unused code, dead files, duplicate modules, and structural drift. This playbook explains what we run, how to interpret results, and how to handle findings.

## Tools

### 1. TypeScript Compiler (`tsc`)

**Purpose:** Type checking and unused local/parameter detection

**Configuration:** 
- `noUnusedLocals: true` - Flags unused local variables
- `noUnusedParameters: true` - Flags unused function parameters

**Usage:**
```bash
npm run typecheck
```

**Output:** Type errors and unused variable warnings

---

### 2. ts-prune

**Purpose:** Finds unused exports across the codebase

**Usage:**
```bash
npm run prune:exports
```

**Output:** `reports/ts-prune.txt` - List of unused exports

**Reading the output:**
- `file.ts:42 - exportName` - Unused export
- `file.ts:42 - exportName (used in module)` - Used internally, safe to keep

**False positives:**
- Exports marked "used in module" are intentionally kept
- Dynamic imports may not be detected
- String-based references (e.g., `import(moduleName)`)

---

### 3. knip

**Purpose:** Finds unused files, dependencies, and exports

**Usage:**
```bash
npm run scan:usage
```

**Output:** `reports/knip.json` - JSON report of unused items

**Configuration:** `knip.json` defines entry points and project files

**Reading the output:**
- `files` - Unused files
- `dependencies` - Unused dependencies
- `exports` - Unused exports
- `types` - Unused types

---

### 4. depcheck

**Purpose:** Finds missing and unused dependencies

**Usage:**
```bash
npm run audit:deps
```

**Output:** `reports/depcheck.json` - JSON report

**Reading the output:**
- `dependencies` - Unused production dependencies
- `devDependencies` - Unused dev dependencies
- `missing` - Packages imported but not in package.json

---

### 5. ESLint

**Purpose:** Linting, unused imports detection, code quality rules

**Configuration:** `.eslintrc.json`

**Key Rules:**
- `unused-imports/no-unused-imports` - Removes unused imports
- `@typescript-eslint/no-unused-vars` - Flags unused variables
- `import/order` - Enforces import ordering

**Usage:**
```bash
npm run lint
npm run lint:unused  # Check for unused disable directives
```

---

## Workflow

### Daily Development

1. **Pre-commit:** ESLint auto-fixes unused imports
2. **Type checking:** `npm run typecheck` catches unused locals/parameters
3. **Linting:** `npm run lint` enforces code quality rules

### Weekly/Monthly

1. **Run hygiene checks:** `npm run hygiene`
2. **Review reports:** Check `reports/` directory
3. **Create dead code plan:** Update `reports/dead-code-plan.md`
4. **Execute removals:** Follow the plan in waves

### CI/CD

The `code-hygiene` job runs on every PR and push to main:
- Generates reports
- Uploads artifacts
- Warns about unused exports (non-blocking)

---

## Deletion Policy

### Safe to Delete

✅ **Backup files** (`.bak.*`, `.old`, `.tmp`)
- Created during migrations/refactors
- Not referenced anywhere
- Safe immediate deletion

✅ **Unused exports** (with multi-signal proof)
- Appears unused in ts-prune + knip + coverage
- Not marked "used in module"
- Verified no dynamic usage

✅ **Unused files**
- Not in entry points
- Not imported anywhere
- Zero test coverage

### Quarantine (Review Required)

⚠️ **Public API exports**
- Exported from index files
- May be used externally
- Verify before deletion

⚠️ **Unused but intentional**
- Exported for future use
- Part of public contract
- Documented as intentionally unused

⚠️ **Dynamic usage**
- Used via string references
- Runtime imports
- Plugin systems

### Never Delete

❌ **Entry points**
- `app/**/page.tsx` (Next.js routes)
- `app/**/route.ts` (API routes)
- `middleware.ts`
- `cli.ts` files

❌ **Test files**
- `*.test.ts`, `*.spec.ts`
- Even if unused, keep for future tests

❌ **Configuration files**
- `tsconfig.json`, `.eslintrc.json`
- `package.json`, `next.config.js`

---

## Quarantine Process

When uncertain about deletion:

1. **Move to archive:**
   ```bash
   mkdir -p archive/$(date +%Y%m%d)
   mv file.ts archive/$(date +%Y%m%d)/
   ```

2. **Update imports:**
   - Remove imports pointing to archived file
   - Add comment: `// Archived: YYYYMMDD - reason`

3. **Document:**
   - Add to `reports/dead-code-plan.md` with status: `⚠️ quarantine`
   - Note reason for uncertainty

4. **Review after 30 days:**
   - If still unused, proceed with deletion
   - If used, restore from archive

---

## Folder Conventions

### Structure

```
src/                    # Main source (if using src/)
├── features/          # Feature modules
├── entities/          # Domain entities
├── shared/            # Shared utilities
├── lib/               # Library code
├── app/               # Next.js app directory
└── styles/            # Global styles
```

**Current structure:** We use a flat structure with domain folders:
- `frontend/app/` - Next.js app
- `frontend/components/` - React components
- `frontend/hooks/` - React hooks
- `ops/` - Operations tooling
- `scripts/` - Utility scripts

### Path Aliases

**Configuration:** `tsconfig.json`
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Usage:**
```typescript
import { Button } from '@/components/ui/button'
```

---

## Barrel Files Policy

### Do ✅

- Use barrel files (`index.ts`) for:
  - Public API exports
  - Component libraries
  - Utility modules

- Explicit exports:
  ```typescript
  export { ComponentA } from './ComponentA'
  export { ComponentB } from './ComponentB'
  ```

### Don't ❌

- Wildcard re-exports (bloats bundles):
  ```typescript
  export * from './module'  // Avoid
  ```

- Deep barrel nesting (hurts tree-shaking)

---

## Naming Conventions

### Files

- **kebab-case:** `user-profile.tsx`, `api-client.ts`
- **PascalCase:** `UserProfile.tsx` (components only)

### Components

- **PascalCase:** `Button.tsx`, `UserProfile.tsx`

### Utilities

- **camelCase:** `formatDate.ts`, `validateEmail.ts`

### Enforced via ESLint

- `import/order` - Alphabetical imports
- `@typescript-eslint/naming-convention` - Naming rules

---

## Test Placement

**Current:** Tests alongside sources (`*.test.tsx`)

**Alternative:** Centralized `tests/` directory

**Policy:** Pick one and document. Currently using co-located tests.

---

## CI Integration

### GitHub Actions

**Workflow:** `.github/workflows/code-quality.yml`

**Job:** `code-hygiene`
- Runs on PR and push to main
- Generates reports
- Uploads artifacts
- Non-blocking warnings

**Artifacts:**
- `reports/ts-prune.txt`
- `reports/knip.json`
- `reports/depcheck.json`

---

## Triage Process

### 1. Review Reports

```bash
npm run hygiene
cat reports/ts-prune.txt | head -50
```

### 2. Identify Candidates

- Multi-signal proof (ts-prune + knip + coverage)
- Not "used in module"
- Not entry points

### 3. Verify

```bash
# Search for usage
grep -r "exportName" --include="*.ts" --include="*.tsx"
```

### 4. Document

Add to `reports/dead-code-plan.md`:
- File/export
- Proof (tools)
- Action (delete/archive/inline)
- Risk level
- Status

### 5. Execute

- Wave 1: Safe deletions (backup files)
- Wave 2: Unused exports (high confidence)
- Wave 3: Missing dependencies
- Wave 4: Unused devDependencies

### 6. Verify

```bash
npm run build
npm test
npm run typecheck
```

---

## False Positives

### Common Causes

1. **Dynamic imports:**
   ```typescript
   const module = await import('./module')
   ```
   **Solution:** Add to knip ignore list

2. **String references:**
   ```typescript
   router.push('/route')
   ```
   **Solution:** Document as intentionally unused

3. **Type-only exports:**
   ```typescript
   export type { User }
   ```
   **Solution:** Use `import type` or mark as type export

4. **Plugin systems:**
   ```typescript
   registerPlugin('name', plugin)
   ```
   **Solution:** Add to entry points in knip.json

### Handling

- Add to ignore lists in tool configs
- Document in `reports/dead-code-plan.md`
- Mark as "false positive" with reason

---

## Maintenance

### Weekly

- Run `npm run hygiene`
- Review new unused exports
- Update dead-code-plan.md

### Monthly

- Execute deletion waves
- Update tool configurations
- Review and update this playbook

### Quarterly

- Review folder structure
- Consolidate duplicate code
- Update naming conventions

---

## Resources

- [ts-prune docs](https://github.com/nadeesha/ts-prune)
- [knip docs](https://knip.dev)
- [depcheck docs](https://github.com/depcheck/depcheck)
- [ESLint unused imports](https://github.com/sweepline/eslint-plugin-unused-imports)

---

## Questions?

- Check `reports/dead-code-plan.md` for current findings
- Review this playbook for policies
- Ask in team chat for ambiguous cases
