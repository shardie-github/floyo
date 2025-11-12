> Archived on 2025-11-12. Superseded by: (see docs/final index)

# ADR 001: API Framework Selection

## Status

Accepted

## Context

We need to choose a web framework for building the Floyo API. Key requirements:
- Fast development and iteration
- Automatic API documentation
- Type safety
- Async support for file watching operations
- Easy integration with SQLAlchemy

## Decision

We chose **FastAPI** over alternatives like Flask, Django, and Starlette.

## Rationale

### FastAPI Advantages

1. **Automatic API Documentation**: Built-in OpenAPI/Swagger support
2. **Type Safety**: Pydantic models provide runtime validation and IDE support
3. **Performance**: Comparable to Node.js and Go frameworks
4. **Async Support**: Native async/await for concurrent operations
5. **Modern Python**: Uses Python 3.6+ type hints throughout
6. **Fast Development**: Less boilerplate, clear structure

### Alternatives Considered

**Flask**
- Pros: Simple, flexible, large ecosystem
- Cons: No automatic API docs, more boilerplate, no built-in type validation

**Django**
- Pros: Full-featured, excellent ORM, admin panel
- Cons: Too heavyweight for API-only, slower for simple endpoints

**Starlette**
- Pros: Fast, async-first
- Cons: Lower-level, requires more setup, less documentation

## Consequences

- Positive:
  - Developers can use Swagger UI immediately
  - Type hints improve code quality
  - Fast iteration on API endpoints
  - Great developer experience

- Negative:
  - Less mature ecosystem than Flask/Django
  - Some teams may need to learn Pydantic models
  - Fewer tutorials/resources compared to Flask

## Implementation Notes

- Use Pydantic v2 for models
- Leverage dependency injection for database sessions
- Use OpenAPI tags for endpoint organization
