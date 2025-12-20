# Backend API Reference — EcoFarm 🧭

Base: `backend/main.py` (FastAPI)

## Quick start
- Run backend: `uvicorn main:app --reload --port 8000`
- Swagger UI: `http://localhost:8000/docs`

---

## Metadata endpoints

- `GET /meta` — Returns `crops`, `actions`, `regions`.
- `GET /regions` — Regions object & defaults.
- `GET /crops` — Full `CROPS` dictionary with `cost`, `days`, `harvest_gold`, `ideal`.
- `GET /actions` — All `ACTIONS` (name, cost per region, effect, duration).

## Time & clock
- `GET /time` — Returns current game time (float from Clock.now()).
- `GET /tick` — Advance game one tick: increments day, updates cells (moisture decay, weeds, growth). Returns new `grid`, `gold`, `day`, `events`.

## Game lifecycle
- `POST /init` (body: `InitRequest`) — Initialize a new game with `region` (defaults to Hilly). Returns initial state.
- `POST /init_by_location?lat={lat}&lng={lng}` — Initialize by coordinates; returns region & estimated elevation.
- `GET /state` — Get current `GameState` (auto-init if missing).
- `POST /state` — Replace game state with provided `GameState` JSON.
- `PUT /state` — Update game state (same as POST here).

## Grid cell endpoints
- `GET /state/grid/{row}/{col}` — Returns `CellState` for that cell (0-indexed, rows/cols 0..3).
- `PUT /state/grid/{row}/{col}` — Replace cell state (body: `CellState`).

## Actions & planting
- `POST /action` (body: `BatchActionRequest`) — Apply action to list of cell indices.
  - Example body: `{ "action": "irrigate", "indices": [0,1,2] }`
  - Harvest behavior: if `action == "harvest"` collects completed crops and adds gold.
- `POST /plant` (body: `PlantRequest`) — Plant crops on indices.
  - Example body: `{ "crop": "rice", "indices": [0,1] }`

## Recommendations
- `POST /recommend` (body: `RecommendRequest`) — Provide soil params and get top-N recommendations with predicted gold values.
- `GET /recommend/cell/{row}/{col}` — Get recommendations for a specific cell's soil parameters.

---

## Models / Schemas (from `game_engine/engine.py`)
- `CellState`:
  - Fields: `n, p, k, rainfall, ph, humidity, temperature, moisture, crop, stage, max_stage, weed, health`
  - Methods: `take_action(action: str)` — applies effect from `ACTIONS`.
- `GameState`:
  - Fields: `location, region, gold, day, grid` (list of 16 `CellState`).
- `BatchActionRequest` `{ action: str, indices: List[int] }`
- `PlantRequest` `{ crop: str, indices: List[int] }`
- `RecommendRequest` parameters: `n, p, k, temperature, humidity, ph, rainfall` (defaults provided).
- `InitRequest` `{ region?: str, lat?: float, lng?: float }`

---

## Examples
- Initialize game (Python + requests):

```py
import requests
r = requests.post('http://localhost:8000/init', json={'region':'Terai'})
print(r.json())
```

- Plant and tick:

```bash
curl -X POST "http://localhost:8000/plant" -H "Content-Type: application/json" -d '{"crop":"rice","indices":[0,1]}'
curl "http://localhost:8000/tick"
```

---

## Notes & assumptions
- Backend stores `game_state` in-memory (module-level variable). Consider replacing with persistent store for multi-user support.
- No authentication is implemented currently.
- Recommendation model is deterministic and depends on `data/data.csv` being present.

**Questions / TODOs**
- Add OpenAPI examples for all endpoints (use FastAPI's response_model and example payloads).
- Add schema file or auto-generate API reference using `fastapi` + `pydantic` models if not already present.