# Tests & QA — EcoFarm ✅

## Existing
- Minimal `backend/test.py` contains a small Clock instantiation only.

## Recommended tests
- Unit tests (pytest)
  - `game_engine/engine.py`: test `take_action`, cell growth, harvest logic.
  - `model.py`: test `get_recommendations` with deterministic inputs (use a fixture CSV or subset).
  - API tests: use `httpx` or `requests` to test `init`, `plant`, `action`, `tick`, `recommend` flows.

## Running the backend for tests
- Start the server in background: `uvicorn main:app --reload --port 8000`
- Run API tests with pytest (create `tests/` folder): `pytest -q`

## CI suggestions
- Add GitHub Actions workflow:
  - Steps: checkout → setup Python 3.11 → install deps → run `pytest` → run a linter (`ruff`/`flake8`) → build frontend or run `npm ci` check.

**TODOs**
- Add `tests/` folder with unit tests and API tests.
- Add test data fixtures for model predictions.