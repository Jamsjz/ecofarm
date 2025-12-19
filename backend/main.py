from fastapi import FastAPI
from game_engine.engine import CellState, GameState
from game_engine.clock import Clock
from constants import GRID_WIDTH
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

global clock
clock = Clock()


@app.get("/time")
def home():
    return {"time": clock.now()}


@app.post("/state")
def get_game_state(gamestate: GameState):
    global state
    state = gamestate


@app.put("/state")
def update_game_state(gamestate: GameState):
    global state
    print(state.location)
    state = gamestate
    print(state.location)


@app.get("/state")
def get_game_state():
    global state
    return state


@app.get("/state/grid/{row}/{col}")
def get_grid_state(row: int, col: int):
    global state
    index = row * GRID_WIDTH + col
    return state.grid[index]


@app.put("/state/grid/{row}/{col}")
def update_grid_state(row: int, col: int, cellstate: CellState):
    global state
    index = row * GRID_WIDTH + col
    state.grid[index] = cellstate
    return state.grid[index]
