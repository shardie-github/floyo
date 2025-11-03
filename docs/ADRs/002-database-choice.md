# ADR 002: Database Choice

## Status

Accepted

## Context

We need a database for storing:
- User accounts and authentication data
- Event tracking data (high write volume)
- Pattern analysis results
- Integration suggestions

## Decision

We chose **PostgreSQL** as the primary database with **SQLAlchemy ORM**.

## Rationale

### PostgreSQL Advantages

1. **ACID Compliance**: Critical for user data integrity
2. **JSON Support**: JSONB for flexible event details
3. **Full-text Search**: Built-in search capabilities
4. **Reliability**: Proven production track record
5. **Advanced Features**: Arrays, JSON, full-text search, extensions
6. **Performance**: Excellent for complex queries

### Alternatives Considered

**SQLite**
- Pros: Simple, no server needed, good for development
- Cons: Not suitable for production, concurrency limitations

**MongoDB**
- Pros: Flexible schema, good for event data
- Cons: No ACID guarantees, harder to query relations, less mature tooling

**MySQL**
- Pros: Widely used, good performance
- Cons: Inferior JSON support, weaker constraints

### SQLAlchemy

- Mature ORM with excellent PostgreSQL support
- Type-safe queries with type hints
- Alembic for migrations
- Works well with FastAPI dependency injection

## Consequences

- Positive:
  - Strong data integrity
  - Flexible schema for event data
  - Production-ready
  - Good performance

- Negative:
  - Requires database server setup
  - More complex than SQLite for development
  - Need to manage migrations

## Implementation Notes

- Use PostgreSQL 15+ for latest features
- Use JSONB for event details and config
- Use Alembic for schema migrations
- Consider read replicas for scaling (future)
