# Contributing — EcoFarm 🤝

Thanks for your interest! This file explains how to set up a dev environment and contribute.

## Local setup
### Backend
- Create Python venv: `python -m venv .venv && source .venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt` or `pip install .` (use `pyproject.toml` config; use `poetry install` if you use Poetry)
- Run: `uvicorn main:app --reload --port 8000`

### Frontend
- Install: `npm install` in `frontend/`
- Dev: `npm run dev`

## Workflow
- Fork → branch → commit → PR against `main`.
- PR checklist:
  - Add/modify tests as applicable
  - Update relevant docs in `docs/`
  - Ensure linter and formatter pass (prettier, eslint, black/ruff)

## Code style
- Python: use black and ruff/flake8
- JS: use ESLint + Prettier

**Issues and feature requests**
- Label issues with `bug`, `enhancement`, `docs`.

**Maintainers**
- Add maintainers and expected response time here.

**TODOs**
- Add CONTRIBUTING.md templates (PR template, issue templates) to `.github/`.