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

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] CI checks pass

## Related Issues

<!-- Link to related issues -->

## Additional Notes

<!-- Any additional information for reviewers -->

---

**Note:** This PR will be automatically checked for architectural integrity. Critical violations will block merge.
