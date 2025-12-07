# Contributing to Personal Health Dashboard

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## Code of Conduct

Please be respectful and constructive in all interactions. We're all here to build something useful together.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment (see README.md)
4. Create a branch for your changes

## Development Setup

### Backend (Python)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run tests
pytest tests/ -v

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend (React/TypeScript)

```bash
cd frontend
npm install

# Run tests
npm run test:run

# Type check
npx tsc --noEmit

# Run dev server
npm run dev
```

## Making Changes

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add sleep quality score calculation
fix: correct timezone handling in date parser
docs: update API endpoint documentation
test: add tests for correlation calculation
```

### Code Style

#### Python
- Follow PEP 8
- Use type hints where practical
- Keep functions focused and small
- Add docstrings for public functions

#### TypeScript/React
- Use TypeScript strictly (no `any` where avoidable)
- Prefer functional components with hooks
- Keep components small and focused
- Use meaningful variable and function names

## Testing

### Backend Tests

All new backend features should include tests:

```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Tests

All new components should include tests:

```bash
cd frontend
npm run test:run
```

## Pull Request Process

1. **Update tests** - Add tests for new functionality
2. **Update documentation** - Update README if needed
3. **Run CI locally** - Ensure tests pass before pushing
4. **Create PR** - Use a clear title and description
5. **Address feedback** - Respond to review comments

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
How was this tested?

## Checklist
- [ ] Tests pass locally
- [ ] Code follows project style
- [ ] Documentation updated (if needed)
```

## Areas for Contribution

### Good First Issues

- Improve error messages
- Add input validation
- Write additional tests
- Fix typos in documentation

### Feature Ideas

- PDF export for reports
- Period comparison (this month vs last month)
- Dark mode support
- Mobile responsive improvements
- Additional chart types
- Support for other data sources (Garmin, Fitbit exports)
- Custom metric tracking (mood, supplements, etc.)
- Data backup/restore functionality

### Backend Improvements

- API rate limiting
- Better error handling
- Query optimization
- Additional health metrics parsing

### Frontend Improvements

- Accessibility improvements
- Loading state animations
- Chart customization options
- Keyboard navigation

## Questions?

Open an issue with your question and we'll do our best to help.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
