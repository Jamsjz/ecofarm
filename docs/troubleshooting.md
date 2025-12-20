# Troubleshooting & FAQ — EcoFarm ⚠️

## Common issues

- Model fails to load or prints `Error loading model data`:
  - Ensure `backend/data/data.csv` exists and is readable by the process.
  - Verify CSV header and column types (N,P,K,temperature,humidity,ph,rainfall,label).

- `HTTP 400: Game not initialized` when calling `/tick` or `/action`:
  - Initialize game first: `POST /init` or GET `/state` to auto-init.

- CORS problems in browser:
  - Backend `main.py` enables CORS for `*`; ensure front and back ports are correct and no proxy blocks.

- Port conflicts:
  - Backend default port `8000`; frontend dev `5173` via Vite. Use `--port` flags to change.

## Debugging tips
- Use `uvicorn main:app --reload --port 8000` and `curl` or Swagger UI (`/docs`).
- Add logging statements in `tick()` to inspect per-cell state changes.

**Next steps**
- Add an automatic health-check endpoint and readiness probe for container orchestration.