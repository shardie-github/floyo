# Decision Log — Architecture Decision Records (ADR-lite)

**Format:** ADR-lite (lightweight Architecture Decision Records)

## Template

```markdown
### [YYYY-MM-DD] Decision Title

**Status:** Proposed | Accepted | Rejected | Superseded  
**Context:** Why this decision is needed  
**Decision:** What we decided  
**Consequences:** Positive and negative impacts  
**Alternatives Considered:** Other options evaluated  
**Related:** Links to related decisions
```

---

## Decisions

### [2024-01-15] Introduce Value Stream Map and Systems Thinking

**Status:** Accepted  
**Context:** Need to understand system bottlenecks and optimize delivery pipeline  
**Decision:** Create value stream map, dependency graphs, causal loop diagrams, and leverage points analysis  
**Consequences:**
- ✅ Positive: Better visibility into system constraints
- ✅ Positive: Data-driven optimization decisions
- ✅ Positive: Aligned team on improvement priorities
- ⚠️ Negative: Initial time investment in analysis
**Alternatives Considered:**
- Continue without systematic analysis (rejected - lacks visibility)
- Hire external consultant (rejected - high cost, can do internally)
**Related:** systems/vsm.md, reports/leverage-points.md

---

### [2024-01-15] Add Error Taxonomy and Guards

**Status:** Accepted  
**Context:** Need consistent error handling and better error forecasting  
**Decision:** Create centralized error taxonomy (`src/lib/errors.ts`) with categories, severity levels, and context tracking  
**Consequences:**
- ✅ Positive: Consistent error handling
- ✅ Positive: Better error diagnosis
- ✅ Positive: Improved error reporting
- ⚠️ Negative: Migration effort for existing error handling
**Alternatives Considered:**
- Keep current error handling (rejected - inconsistent)
- Use external error library (rejected - want control)
**Related:** reports/error-forecast.md, src/lib/errors.ts

---

### [2024-01-15] Implement Pre-merge Validation Checks

**Status:** Proposed  
**Context:** High CI rework rate (10%) indicates defects entering CI pipeline  
**Decision:** Add pre-commit/pre-merge hooks for type checking, test coverage, UX copy linting, and bundle size checks  
**Consequences:**
- ✅ Positive: Catch defects earlier
- ✅ Positive: Reduce CI rework
- ✅ Positive: Faster feedback loop
- ⚠️ Negative: Slower local development (mitigated by fast checks)
- ⚠️ Negative: Developer friction (mitigated by gradual rollout)
**Alternatives Considered:**
- Rely on CI only (rejected - too late in pipeline)
- Manual checks (rejected - not scalable)
**Related:** reports/leverage-points.md

---

### [2024-01-15] Parallelize PR Reviews

**Status:** Proposed  
**Context:** PR review queue is longest bottleneck (2 PRs waiting, 1h avg wait)  
**Decision:** Add CODEOWNERS file for auto-assignment and enable parallel reviews  
**Consequences:**
- ✅ Positive: Faster PR reviews
- ✅ Positive: Reduced lead time
- ✅ Positive: Better reviewer distribution
- ⚠️ Negative: Need to maintain CODEOWNERS file
- ⚠️ Negative: Potential quality concerns (mitigated by maintaining review standards)
**Alternatives Considered:**
- Keep sequential reviews (rejected - too slow)
- Reduce review requirements (rejected - quality risk)
**Related:** reports/leverage-points.md

---

### [2024-01-15] Add Microbenchmark Harness

**Status:** Accepted  
**Context:** Need to track performance trends and catch regressions early  
**Decision:** Create benchmark harness (`bench/runner.ts`) with weekly CI runs and trend analysis  
**Consequences:**
- ✅ Positive: Performance regression detection
- ✅ Positive: Performance trend visibility
- ✅ Positive: Data-driven performance decisions
- ⚠️ Negative: CI time overhead (mitigated by weekly runs)
- ⚠️ Negative: Maintenance of benchmark suites
**Alternatives Considered:**
- Manual performance testing (rejected - not scalable)
- External performance monitoring only (rejected - want code-level insights)
**Related:** bench/runner.ts, .github/workflows/benchmarks.yml

---

### [2024-01-15] Consolidate Design Tokens

**Status:** Accepted  
**Context:** Design tokens scattered across CSS and Tailwind config  
**Decision:** Create canonical token file (`design/tokens.json`) with semantic aliases  
**Consequences:**
- ✅ Positive: Single source of truth
- ✅ Positive: Easier theme updates
- ✅ Positive: Better tooling support
- ⚠️ Negative: Migration effort (minimal - additive only)
**Alternatives Considered:**
- Keep current structure (rejected - lacks centralization)
- Use external design system (rejected - want control)
**Related:** design/tokens.json, reports/design-token-audit.md

---

### [2024-01-15] Exclude Deno Edge Functions from TypeScript Check

**Status:** Accepted  
**Context:** Supabase edge functions use Deno syntax incompatible with Node.js TypeScript  
**Decision:** Exclude `supabase/functions/**/*.ts` from main tsconfig.json  
**Consequences:**
- ✅ Positive: TypeScript checks pass
- ✅ Positive: No false errors
- ⚠️ Negative: No type checking for edge functions (acceptable - Deno handles this)
**Alternatives Considered:**
- Fix Deno syntax (rejected - incompatible)
- Separate tsconfig for Deno (considered - unnecessary complexity)
**Related:** tsconfig.json

---

## Decision Process

1. **Propose:** Document decision in this log
2. **Review:** Discuss with team
3. **Decide:** Accept, reject, or defer
4. **Implement:** Execute decision
5. **Review:** Evaluate consequences after implementation

## Guidelines

- Keep decisions concise but complete
- Update status as decisions progress
- Link related decisions
- Review quarterly for relevance

---

**Status:** ✅ Decision log established  
**Next:** Use for future architectural decisions
