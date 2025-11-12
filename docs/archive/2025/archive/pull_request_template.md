> Archived on 2025-11-12. Superseded by: (see docs/final index)

> Archived on 2025-11-12. Superseded by: (see docs/final index)

## Description

<!-- Provide a brief description of the changes -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement
- [ ] Security fix

## Architecture Council Review

<!-- For architectural changes, answer the following questions -->

### Architectural Impact

- [ ] This PR changes core architecture (database schema, API contracts, module dependencies)
- [ ] This PR introduces new dependencies or removes existing ones
- [ ] This PR changes configuration or environment requirements
- [ ] This PR modifies critical paths or failure modes

### Architectural Justification

<!-- If you checked any boxes above, explain why this change is necessary and how it aligns with system architecture -->

**Rationale:**

**Alternatives Considered:**

**Impact on System Intelligence Map:**
<!-- List any modules, business goals, or resilience dependencies that are affected -->

**Guardrail Implications:**
<!-- Do any guardrails need to be updated? Reference infra/selfcheck/guardrails.yaml -->

### Self-Check Status

- [ ] I've run `python infra/selfcheck/validate_guardrails.py` locally
- [ ] No new guardrail violations introduced
- [ ] System intelligence map updated (if applicable)
- [ ] Living architecture guide updated (if applicable)

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] Self-reflection tests pass (`npm test -- self_reflection`)

## SLO Impact Assessment

- [ ] **TTFB Impact:** Estimated change to Time to First Byte (target: ≤200ms)
- [ ] **API P95 Impact:** Estimated change to API P95 latency (target: ≤400ms)
- [ ] **LCP Impact:** Estimated change to Largest Contentful Paint (target: ≤2.5s)
- [ ] **Uptime Impact:** Risk to uptime SLO (target: ≥99.9%)
- [ ] Performance tested locally
- [ ] Metrics baseline captured

## Risk Assessment

- [ ] **Rollback Plan:** Steps to rollback if issues occur
- [ ] **Data Risk:** Potential for data loss or corruption
- [ ] **Security Risk:** Security implications reviewed
- [ ] **Dependency Risk:** New dependencies assessed
- [ ] **Breaking Changes:** Breaking changes documented

## Rollback Procedure

**If this PR causes issues, rollback by:**
1. [ ] Revert commit: `git revert <commit-hash>`
2. [ ] Or restore from snapshot: `ops restore <snapshot>`
3. [ ] Verify rollback: `ops doctor`
4. [ ] Check metrics: `/admin/metrics`

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] CI checks pass
- [ ] SLO impact assessed (see above)
- [ ] Rollback plan documented (see above)

## Related Issues

<!-- Link to related issues -->

## Additional Notes

<!-- Any additional information for reviewers -->

---

**Note:** This PR will be automatically checked for architectural integrity. Critical violations will block merge.
