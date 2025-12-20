# Game Engine — EcoFarm ⚙️

Located in `backend/game_engine`.

## Key classes

### `CellState` (pydantic `BaseModel`)
- Fields: `n, p, k, rainfall, ph, humidity, temperature, moisture, crop, stage, max_stage, weed, health`
- Method: `take_action(action: str)` — looks up `ACTIONS` from `constants.py` and applies `effect` deltas to the cell attributes.

### `GameState` (pydantic `BaseModel`)
- Fields: `location`, `region`, `gold`, `day`, `grid` (list of 16 `CellState`).
- On initialization, `grid` is populated with `CellState()` objects if empty.

### `Clock`
- `start_real`, `start_game`, `speed` (SPEED in constants). `now()` returns scaled game time.

## Lifecycle examples
- On `tick()` the server:
  - increments `day`
  - decays `moisture`
  - increments `weed`
  - advances crop `stage` depending on moisture and weed

## Extensibility notes
- To add new actions: add entries to `ACTIONS` in `constants.py` with `effect` and `cost` by region.
- To change grid size: update `GRID_WIDTH` in `constants.py` and ensure UI/grid rendering adapts.

**Tests**
- Unit tests should assert `take_action` effects, tick progression, and harvest behavior.

**TODOs**
- Add more granular event system (for delayed action durations), persistence hooks, and logging for gameplay events.