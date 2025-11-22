# Contributing to Floyo

First off, thank you for considering contributing to Floyo! 🎉

Whether you're fixing a bug, adding a feature, improving documentation, or just asking questions, your contributions make Floyo better for everyone.

---

## How Can I Contribute?

### 🐛 Report Bugs

Found something that's not working? Let us know!

1. **Check existing issues** - Someone might have already reported it
2. **Create a new issue** - Use the bug report template
3. **Include details:**
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
   - Your environment (OS, browser, etc.)

### 💡 Suggest Features

Have an idea that would make Floyo better? We'd love to hear it!

1. **Check existing feature requests** - See if it's already been suggested
2. **Open a discussion** - Start a GitHub Discussion to get feedback
3. **Create an issue** - Use the feature request template if you're ready to propose it

### 📝 Improve Documentation

Good documentation helps everyone. You can help by:

- Fixing typos or unclear explanations
- Adding examples or use cases
- Translating docs to other languages
- Improving code comments

### 💻 Write Code

Ready to dive into the code? Awesome! Here's how to get started.

---

## Your First 10 Minutes

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/your-username/floyo-monorepo.git
cd floyo-monorepo
```

### 2. Set Up Your Environment

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
cd frontend && npm install && cd ..

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Run the Tests

```bash
# Python tests
pytest tests/unit/ -v

# TypeScript tests
cd frontend && npm test

# Make sure everything passes!
```

### 4. Pick an Issue

- Look for issues labeled `good first issue`
- Comment on the issue to let others know you're working on it
- Ask questions if anything is unclear

---

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update tests if needed
- Update documentation if you're changing behavior

### 3. Test Your Changes

```bash
# Run all tests
npm run test
pytest tests/unit/ -v

# Run linters
npm run lint
cd backend && ruff check . && black --check .

# Fix any issues before committing
```

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/) to keep our git history clean:

```bash
# Format: <type>(<scope>): <description>

# Examples:
git commit -m "feat(api): add user authentication endpoint"
git commit -m "fix(backend): resolve database connection timeout"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(tracker): add tests for pattern detection"
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 5. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then:
1. Go to GitHub and create a Pull Request
2. Fill out the PR template
3. Link to any related issues
4. Request review from maintainers

---

## Code Style Guidelines

### Python

- Follow [PEP 8](https://pep8.org/)
- Use type hints where helpful
- Keep functions focused and small
- Add docstrings for public functions/classes

```python
def process_file(file_path: str) -> dict:
    """Process a file and return metadata.
    
    Args:
        file_path: Path to the file to process
        
    Returns:
        Dictionary with file metadata
    """
    # Your code here
```

**Before committing:**
```bash
cd backend
ruff check .
black .
```

### TypeScript/JavaScript

- Follow the ESLint configuration
- Use TypeScript for new code
- Prefer functional programming patterns
- Keep components small and focused

```typescript
interface FileMetadata {
  path: string;
  size: number;
}

function processFile(file: FileMetadata): Promise<void> {
  // Your code here
}
```

**Before committing:**
```bash
cd frontend
npm run lint
npm run format
```

---

## Testing Guidelines

### Write Tests

- **New features** should include tests
- **Bug fixes** should include a test that reproduces the bug
- Aim for good coverage, but don't obsess over 100%

### Test Structure

```python
# tests/test_feature.py
def test_feature_happy_path():
    """Test the happy path."""
    # Arrange
    input_data = {...}
    
    # Act
    result = process(input_data)
    
    # Assert
    assert result.success is True

def test_feature_edge_case():
    """Test edge case handling."""
    # Test error conditions, empty inputs, etc.
```

### Running Tests

```bash
# Run all tests
pytest tests/unit/ -v

# Run specific test file
pytest tests/test_tracker.py -v

# Run with coverage
pytest tests/unit/ --cov=backend --cov-report=html
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)
- [ ] No console.logs or debug code left behind
- [ ] Commit messages follow conventional commits

### PR Checklist

- [ ] Clear description of changes
- [ ] Link to related issues
- [ ] Screenshots (for UI changes)
- [ ] Tests added/updated
- [ ] Documentation updated

### Review Process

1. **Automated checks** - CI runs tests and linters
2. **Code review** - At least one maintainer will review
3. **Feedback** - We'll provide constructive feedback
4. **Approval** - Once approved, we'll merge!

**Don't worry** - It's normal for PRs to go through a few iterations. We're all here to learn and improve together.

---

## Code Review Guidelines

### For Reviewers

- Be respectful and constructive
- Explain *why* you're suggesting changes
- Ask questions if something is unclear
- Focus on the code, not the person
- Appreciate the effort - contributing is awesome!

### For Contributors

- Don't take feedback personally - it's about the code
- Ask questions if feedback is unclear
- Be open to suggestions
- Remember: we're all on the same team

---

## Project Structure

```
floyo-monorepo/
├── frontend/          # Next.js frontend
│   ├── app/          # App router pages
│   ├── components/   # React components
│   └── lib/          # Utilities
├── backend/helpers
│
├── backend/          # Python FastAPI backend
│   ├── api/          # API route handlers
│   ├── services/     # Business logic
│   └── models/      # Database models
│
├── floyo/            # Core tracking library
│   ├── tracker.py    # Usage pattern tracking
│   └── suggester.py  # Integration suggestions
│
├── tests/            # Test suite
└── docs/             # Documentation
```

**Not sure where to put something?** Ask in an issue or discussion!

---

## Getting Help

### Questions?

- **GitHub Discussions** - For general questions and ideas
- **GitHub Issues** - For bugs and feature requests
- **Discord** - For real-time chat (coming soon!)

### Stuck?

- Check existing documentation
- Search closed issues for similar problems
- Ask in a GitHub Discussion
- Open an issue with the `question` label

**Remember:** There are no stupid questions. We're all here to help!

---

## Recognition

Contributors are recognized in:
- Our README.md
- Release notes
- (Coming soon) A contributors page on the website

Thank you for making Floyo better! 🙏

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Celebrate diversity

### Enforcement

We're committed to maintaining a welcoming community. Unacceptable behavior will be addressed appropriately.

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

**Ready to contribute?** Pick an issue, create a branch, and let's build something awesome together! 🚀

**Questions?** Open a GitHub Discussion or issue - we're here to help!
