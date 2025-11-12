> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Floyo Project Structure

## Overview

This document describes the professional, well-organized structure of the Floyo codebase.

---

## 📁 Directory Structure

```
floyo/
├── backend/                 # FastAPI backend application
│   ├── ml/                  # Machine learning models and services
│   ├── guardian/            # Privacy monitoring system
│   ├── notifications/       # Notification services
│   ├── api_v1.py           # API v1 routes
│   ├── main.py             # FastAPI application entry point
│   ├── database.py         # Database connection and session management
│   ├── config.py           # Configuration management
│   ├── requirements.txt    # Python dependencies
│   └── ...
│
├── frontend/                # Next.js frontend application
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and API clients
│   ├── public/             # Static assets
│   ├── package.json        # Node.js dependencies
│   └── ...
│
├── database/                # Database models and schemas
│   ├── models.py           # SQLAlchemy models
│   └── schema.sql          # Database schema
│
├── migrations/              # Database migrations (Alembic)
│   └── ...
│
├── floyo/                   # Core Python package (CLI)
│   ├── tracker.py          # Usage tracking
│   ├── suggester.py        # Integration suggestions
│   └── cli.py              # Command-line interface
│
├── docs/                    # Documentation
│   ├── USER_GUIDE.md
│   ├── DEVELOPER_GUIDE.md
│   └── ...
│
├── ops/                     # Operations and automation
│   ├── automation-blueprints/
│   ├── dashboards/
│   └── ...
│
├── scripts/                 # Utility scripts
│   ├── lint-all.sh         # Linting script
│   └── ...
│
├── tests/                   # Test suites
│   ├── test_*.py           # Backend tests
│   └── ...
│
├── infra/                   # Infrastructure as code
│   └── ...
│
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile.backend       # Backend Docker image
├── Dockerfile.frontend      # Frontend Docker image
├── README.md                # Main readme
├── INTRODUCTION.md         # Product introduction
├── VALUE_PROPOSITION.md    # Value proposition document
├── CODE_QUALITY.md         # Code quality standards
└── ...
```

---

## 🔧 Backend Structure (`/backend`)

### Core Application
- **`main.py`** - FastAPI application, routes, middleware
- **`api_v1.py`** - Versioned API routes
- **`database.py`** - Database connection, session management
- **`config.py`** - Configuration and environment variables

### Feature Modules
- **`ml/`** - Machine learning models and services
  - `pattern_classifier.py` - Pattern classification model
  - `suggestion_scorer.py` - Confidence scoring
  - `sequence_predictor.py` - LSTM sequence prediction
  - `workflow_trigger_predictor.py` - Optimal timing prediction
  - `workflow_recommender.py` - Collaborative filtering
  - `anomaly_detector.py` - Anomaly detection
  - `model_manager.py` - Model lifecycle management
  - `training_pipeline.py` - Training orchestration
  - `evaluator.py` - Model evaluation
  - `monitoring.py` - Performance monitoring
  - `optimizer.py` - Performance optimization
  - `api.py` - ML API endpoints

- **`guardian/`** - Privacy monitoring system
  - `service.py` - Core privacy service
  - `trust_fabric.py` - Adaptive learning
  - `api.py` - Privacy API endpoints

- **`notifications/`** - Notification system
  - `service.py` - Core notification service
  - `email.py` - Email notifications
  - `websocket.py` - WebSocket notifications

### Supporting Services
- **`workflow_scheduler.py`** - Workflow execution engine
- **`analytics.py`** - Analytics endpoints
- **`monitoring.py`** - System monitoring
- **`security.py`** - Security utilities
- **`audit.py`** - Audit logging
- **`cache.py`** - Caching layer (Redis)
- **`rate_limit.py`** - Rate limiting
- **`email_service.py`** - Email service
- **`growth.py`** - Growth engine (retention, referrals)
- **`monetization.py`** - Billing and subscriptions

---

## 🎨 Frontend Structure (`/frontend`)

### Next.js App Router (`/app`)
- **`page.tsx`** - Home page
- **`dashboard/`** - Dashboard pages
- **`settings/`** - User settings
- **`trust/`** - Privacy dashboard
- **`admin/`** - Admin pages
- **`api/`** - API route handlers

### Components (`/components`)
- **`Dashboard.tsx`** - Main dashboard
- **`SuggestionsList.tsx`** - ML-enhanced suggestions
- **`WorkflowBuilder.tsx`** - Visual workflow builder
- **`NotificationCenter.tsx`** - Notification UI
- **`PatternChart.tsx`** - Pattern visualization
- **`ui/`** - Reusable UI components

### Hooks (`/hooks`)
- **`useAuth.ts`** - Authentication
- **`useAnalytics.ts`** - Analytics tracking
- **`useDarkMode.ts`** - Dark mode
- **`useKeyboardShortcuts.ts`** - Keyboard navigation

### Utilities (`/lib`)
- **`api.ts`** - API client
- **`analytics.ts`** - Analytics utilities
- **`utils.ts`** - General utilities

---

## 🗄️ Database Structure (`/database`)

### Models (`models.py`)
- **User Management:** User, UserSession, UserConfig
- **Pattern Tracking:** Event, Pattern, TemporalPattern, FileRelationship
- **Workflows:** Workflow, WorkflowVersion, WorkflowExecution
- **Suggestions:** Suggestion
- **Organizations:** Organization, OrganizationMember
- **ML Models:** MLModel, Prediction
- **Notifications:** Notification
- **Enterprise:** SSOProvider, ComplianceReport, EnterpriseSettings
- **Privacy:** GuardianEvent, TrustFabricModel, GuardianSettings

### Schema (`schema.sql`)
- SQL schema definitions
- Indexes and constraints
- Migration scripts

---

## 🔬 ML Models Structure (`/backend/ml`)

### Base Classes
- **`base.py`** - BaseMLModel, FloyoDataProcessor

### Model Implementations
- **Pattern Classification** - RandomForestClassifier
- **Suggestion Scoring** - GradientBoostingRegressor
- **Sequence Prediction** - LSTM (TensorFlow)
- **Workflow Trigger** - GradientBoostingRegressor
- **Recommendations** - NMF (Collaborative Filtering)
- **Anomaly Detection** - IsolationForest

### Infrastructure
- **Model Manager** - Lifecycle, versioning, persistence
- **Training Pipeline** - Batch training, evaluation
- **Evaluator** - Performance metrics
- **Monitor** - Health checks, performance tracking
- **Optimizer** - Caching, batch processing

---

## 📚 Documentation Structure (`/docs`)

### User Documentation
- **USER_GUIDE.md** - End-user guide
- **WORKFLOW_BUILDER.md** - Workflow creation guide
- **API_INTEGRATION.md** - Integration guide

### Developer Documentation
- **DEVELOPER_GUIDE.md** - Contributing guide
- **ARCHITECTURE.md** - System architecture
- **API_REFERENCE.md** - API documentation

### Business Documentation
- **MARKET_FIT_ASSESSMENT.md** - Market analysis
- **COMPETITIVE_ANALYSIS.md** - Competitive landscape
- **ROADMAP.md** - Development roadmap

---

## 🧪 Testing Structure (`/tests`)

### Backend Tests
- **`test_*.py`** - Unit and integration tests
- **`test_api.py`** - API endpoint tests
- **`test_ml.py`** - ML model tests

### Frontend Tests
- **`components/`** - Component tests
- **`e2e/`** - End-to-end tests (Playwright)

---

## 🔧 Configuration Files

### Root Level
- **`.prettierrc.json`** - Prettier configuration
- **`.eslintrc.json`** - ESLint configuration
- **`ruff.toml`** - Python linting (Ruff)
- **`.editorconfig`** - Editor configuration
- **`docker-compose.yml`** - Docker Compose
- **`pyproject.toml`** - Python project configuration

### Backend
- **`requirements.txt`** - Python dependencies
- **`.pylintrc`** - Pylint configuration

### Frontend
- **`package.json`** - Node.js dependencies
- **`next.config.js`** - Next.js configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`tsconfig.json`** - TypeScript configuration

---

## 📋 Code Organization Principles

### 1. **Separation of Concerns**
- Business logic separated from API routes
- Data models separated from business logic
- ML models isolated in `/ml` directory

### 2. **Modularity**
- Each feature in its own module
- Clear interfaces between modules
- Minimal coupling between components

### 3. **Consistency**
- Consistent naming conventions
- Standardized error handling
- Uniform logging approach

### 4. **Documentation**
- Docstrings for all public functions
- Type hints for all functions
- README files in major directories

### 5. **Testability**
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical flows

---

## 🚀 Getting Started

### For Developers
1. Review [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)
2. Explore [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
3. Check [CODE_QUALITY.md](CODE_QUALITY.md) for standards

### For Contributors
1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Set up development environment
3. Run linting: `npm run lint:all`
4. Run tests: `pytest && npm test`

---

## 📊 Quality Metrics

### Code Quality
- **Linting:** Passes ruff (Python) and ESLint (TypeScript)
- **Formatting:** Black (Python) and Prettier (TypeScript)
- **Type Checking:** mypy (Python) and TypeScript compiler
- **Test Coverage:** >80% (target)

### Documentation
- **API Docs:** OpenAPI/Swagger at `/docs`
- **Code Docs:** Docstrings for all public functions
- **User Docs:** Complete user guides
- **Architecture Docs:** System diagrams and explanations

---

## 🔄 Maintenance

### Regular Tasks
- **Weekly:** Code reviews, dependency updates
- **Monthly:** Architecture review, refactoring
- **Quarterly:** Security audit, performance optimization

### Continuous Improvement
- Monitor code quality metrics
- Track technical debt
- Refactor based on feedback
- Update documentation

---

**Professional, well-organized, and ready for production.**
