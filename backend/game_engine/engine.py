from typing import List, Optional
from pydantic import BaseModel
from constants import ACTIONS


class CellState(BaseModel):
    """Represents soil and crop state of a single grid cell"""
    n: float = 0
    p: float = 0
    k: float = 0
    rainfall: float = 0
    ph: float = 6.5
    humidity: float = 60
    temperature: float = 25
    moisture: float = 50
    wind_speed: float = 0
    # Crop state
    crop: Optional[str] = None
    stage: int = 0
    max_stage: int = 100
    weed: float = 0
    health: float = 100

    def take_action(self, action: str) -> str:
        """Apply an action's effects to this cell"""
        action_dict = ACTIONS.get(action)
        if not action_dict:
            return f"Unknown action: {action}"
        for k, v in action_dict.get("effect", {}).items():
            current = getattr(self, k, 0)
            setattr(self, k, current + v)
        return action_dict["name"]


class GameState(BaseModel):
    """Represents the entire game state"""
    location: str = "Kathmandu"
    region: str = "Hilly"
    gold: int = 1000
    day: int = 1
    grid: List[CellState] = []

    def __init__(self, **data):
        super().__init__(**data)
        if not self.grid:
            self.grid = [CellState() for _ in range(16)]


class BatchActionRequest(BaseModel):
    """Request model for batch actions on multiple cells"""
    action: str
    indices: List[int]


class PlantRequest(BaseModel):
    """Request model for planting crops"""
    crop: str
    indices: List[int]


class RecommendRequest(BaseModel):
    """Request model for crop recommendations based on soil parameters"""
    n: float = 40
    p: float = 40
    k: float = 40
    temperature: float = 25
    humidity: float = 65
    ph: float = 6.5
    rainfall: float = 100


class InitRequest(BaseModel):
    """Request model for game initialization"""
    region: str = "Hilly"
    lat: Optional[float] = None
    lng: Optional[float] = None
