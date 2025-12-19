from typing import List
from dataclasses import dataclass
from constants import ACTIONS


@dataclass
class GameState:
    location: str
    gold: int
    grid: List["CellState"]


@dataclass
class CellState:
    n: int
    p: int
    k: int
    rainfall: float
    ph: float
    humidity: float
    temperature: float

    def take_action(self, action: str):
        action_dict = ACTIONS[action]
        for k, v in action_dict["effect"].items():
            # if key not found, add 0
            setattr(self, k, getattr(self, k, 0) + v)
        return action_dict["name"]
