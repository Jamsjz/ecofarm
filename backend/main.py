import dataclasses
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import io
from typing import List, Optional
from pydantic import BaseModel
from chat_service import get_chat_response, analyze_disease_chat
import numpy as np
import urllib.request
import json
import openmeteo_requests
import requests_cache
import pandas as pd
from retry_requests import retry

import tensorflow as tf


from game_engine.engine import (
    CellState,
    GameState,
    BatchActionRequest,
    PlantRequest,
    RecommendRequest,
    InitRequest,
)
from game_engine.clock import Clock
from constants import GRID_WIDTH, CROPS, ACTIONS, REGIONS
from model import Model
from chat_service import get_chat_response

app = FastAPI(title="EcoFarm API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global game state
clock = Clock()
game_state: Optional[GameState] = None
model = Model()


class ChatRequest(BaseModel):
    message: Optional[str] = None
    recent_actions: List[str] = []
    game_state: Optional[dict] = None  # Frontend can send game state directly


def get_region_from_elevation(elevation: float) -> str:
    """Determine region based on elevation in meters"""
    if elevation < 300:
        return "Terai"
    elif elevation < 2000:
        return "Hilly"
    else:
        return "Himalayan"


def initialize_grid(region: str) -> List[CellState]:
    """Initialize a 4x4 grid with region-appropriate defaults"""
    region_data = REGIONS.get(region, REGIONS["Hilly"])
    grid = []
    for _ in range(16):
        cell = CellState(
            temperature=region_data["temperature"],
            humidity=region_data["humidity"],
            rainfall=region_data["rainfall"],
            moisture=region_data["moisture"],
            n=40 + np.random.randint(-10, 10),
            p=40 + np.random.randint(-10, 10),
            k=40 + np.random.randint(-10, 10),
            ph=6.5 + np.random.uniform(-0.5, 0.5),
        )
        grid.append(cell)
    return grid


# ============== METADATA ENDPOINTS ==============


@app.get("/meta")
def get_meta():
    """Get game metadata: crops, actions, and regions"""
    return {"crops": CROPS, "actions": ACTIONS, "regions": REGIONS}


@app.get("/regions")
def get_regions():
    """Get available regions with their defaults"""
    return REGIONS


@app.get("/crops")
def get_crops():
    """Get all available crops with their costs and ideal conditions"""
    return CROPS


@app.get("/actions")
def get_actions():
    """Get all available actions with costs and effects"""
    return ACTIONS


# ============== TIME ENDPOINTS ==============


@app.get("/time")
def get_time():
    """Get current game time"""
    return {"time": clock.now()}


@app.get("/tick")
def tick():
    """Advance game by one tick and return updated state"""
    global game_state
    if game_state is None:
        raise HTTPException(status_code=400, detail="Game not initialized")

    # Advance day counter based on ticks
    game_state.day += 1

    # Update each cell
    for cell in game_state.grid:
        # Natural moisture decay
        cell.moisture = max(0, cell.moisture - 2)

        # Weed growth
        cell.weed = min(100, cell.weed + 1)

        # Crop growth
        if cell.crop and cell.stage < cell.max_stage:
            growth_rate = 1
            # Bonus growth for good conditions
            if 40 <= cell.moisture <= 80:
                growth_rate += 0.5
            if cell.weed < 30:
                growth_rate += 0.3
            cell.stage = min(cell.max_stage, cell.stage + int(growth_rate))

    return {
        "grid": [cell.model_dump() for cell in game_state.grid],
        "gold": game_state.gold,
        "day": game_state.day,
        "events": [],
    }


# ============== GAME STATE ENDPOINTS ==============


@app.post("/init")
def init_game(request: InitRequest):
    """Initialize a new game with specified region"""
    global game_state

    region = request.region
    if region not in REGIONS:
        region = "Hilly"

    game_state = GameState(
        region=region, location=region, gold=1000, day=1, grid=initialize_grid(region)
    )

    return {
        "grid": [cell.model_dump() for cell in game_state.grid],
        "gold": game_state.gold,
        "day": game_state.day,
        "region": game_state.region,
        "events": [f"Farm initialized in {region} region"],
    }


class LocationInitRequest(BaseModel):
    lat: float
    lng: float

def clean_value(val):
    if isinstance(val, (int, float)):
        return float(val)
    if not isinstance(val, str):
        return 0.0
    # Remove common units
    val = val.replace('kg/ha', '').replace('%', '').replace('ppm', '').strip()
    try:
        return float(val)
    except ValueError:
        return 0.0

def initialize_grid_with_data(region: str, soil_data: dict, weather_data: dict = None) -> List[CellState]:
    region_data = REGIONS.get(region, REGIONS["Hilly"])
    grid = []
    
    # Extract and clean soil data
    n_val = clean_value(soil_data.get("total_nitrogen", 0))
    p_val = clean_value(soil_data.get("p2o5", 0))
    k_val = clean_value(soil_data.get("potassium", 0))
    ph_val = clean_value(soil_data.get("ph", 6.5))
    
    # Weather data
    temp_val = region_data["temperature"]
    print(temp_val)
    rain_val = region_data["rainfall"]
    print(rain_val)
    wind_val = 0.0
    
    if weather_data:
        temp_val = weather_data.get("temperature", temp_val)
        rain_val = weather_data.get("rain", rain_val)
        wind_val = weather_data.get("wind_speed", wind_val)

    for _ in range(16):
        cell = CellState(
            temperature=temp_val,
            humidity=region_data["humidity"],
            rainfall=rain_val,
            moisture=region_data["moisture"],
            wind_speed=wind_val,
            n=n_val,
            p=p_val,
            k=k_val,
            ph=ph_val
        )
        grid.append(cell)
    return grid

def fetch_weather_data(lat: float, lng: float):
    try:
        # Setup the Open-Meteo API client with cache and retry on error
        cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
        retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
        openmeteo = openmeteo_requests.Client(session = retry_session)

        # Make sure all required weather variables are listed here
        # The order of variables in hourly or daily is important to assign them correctly below
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lng,
            "hourly": ["temperature_2m", "rain", "wind_speed_80m", "cloud_cover"],
            "timezone": "auto",
        }
        responses = openmeteo.weather_api(url, params=params)

        # Process first location
        response = responses[0]
        elevation = response.Elevation()
        
        # Process hourly data. The order of variables needs to be the same as requested.
        hourly = response.Hourly()
        hourly_temperature_2m = hourly.Variables(0).ValuesAsNumpy()
        hourly_rain = hourly.Variables(1).ValuesAsNumpy()
        hourly_wind_speed_80m = hourly.Variables(2).ValuesAsNumpy()
        hourly_cloud_cover = hourly.Variables(3).ValuesAsNumpy()

        hourly_data = {"date": pd.date_range(
            start = pd.to_datetime(hourly.Time(), unit = "s", utc = True),
            end = pd.to_datetime(hourly.TimeEnd(), unit = "s", utc = True),
            freq = pd.Timedelta(seconds = hourly.Interval()),
            inclusive = "left"
        )}

        hourly_data["temperature_2m"] = hourly_temperature_2m
        hourly_data["rain"] = hourly_rain
        hourly_data["wind_speed_80m"] = hourly_wind_speed_80m
        hourly_data["cloud_cover"] = hourly_cloud_cover

        hourly_dataframe = pd.DataFrame(data = hourly_data)
        
        # Use the first row (current hour) as the weather data
        current = hourly_dataframe.iloc[0]
        
        return {
            "temperature": float(current["temperature_2m"]),
            "rain": float(current["rain"]),
            "wind_speed": float(current["wind_speed_80m"]),
            "cloud_cover": float(current["cloud_cover"]),
            "elevation": elevation
        }
    except Exception as e:
        print(f"Error fetching weather data: {e}")
        return None

@app.get("/weather")
def get_weather_data(lat: float, lng: float):
    """Get weather data and region for a location"""
    data = fetch_weather_data(lat, lng)
    if not data:
        raise HTTPException(status_code=500, detail="Failed to fetch weather data")
    
    # Determine region
    region = get_region_from_elevation(data["elevation"])
    
    return {
        "weather": data,
        "region": region
    }

@app.post("/init_by_location")
def init_by_location(request: LocationInitRequest):
    """Initialize game based on geographic coordinates using external API"""
    global game_state
    
    lat = request.lat
    lng = request.lng
    
    # Fetch soil data
    url = f"https://soil.narc.gov.np/soil/api/?lat={lat}&lon={lng}"
    data = {}
    try:
        with urllib.request.urlopen(url) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching soil data: {e}")
    
    # Fetch weather data
    weather_data = fetch_weather_data(lat, lng)

    # Determine region from API elevation if available, else fallback
    elevation = 1000 # Default
    if "coord" in data and "elevation" in data["coord"]:
        elevation = data["coord"]["elevation"]
    elif lat < 27.5:
        elevation = 150
    elif lat < 28.5:
        elevation = 1200
    else:
        elevation = 3500
        
    region = get_region_from_elevation(elevation)
    
    # Initialize grid
    if data:
        grid = initialize_grid_with_data(region, data, weather_data)
        events = [f"Farm started at elevation {elevation}m ({region}) with soil data from NARC"]
    else:
        grid = initialize_grid(region) # Fallback to default if no soil data
        events = [f"Farm started at elevation {elevation}m ({region}) (Soil data unavailable)"]
    
    if weather_data:
        events.append(f"Weather: {weather_data['temperature']:.1f}°C, Rain: {weather_data['rain']:.1f}mm, Wind: {weather_data['wind_speed']:.1f}km/h")

    game_state = GameState(
        region=region,
        location=f"Lat: {lat:.2f}, Lng: {lng:.2f}",
        gold=1000,
        day=1,
        grid=grid
    )

    return {
        "grid": [cell.model_dump() for cell in game_state.grid],
        "gold": game_state.gold,
        "day": game_state.day,
        "region": region,
        "elevation": elevation,
        "events": events
    }


@app.get("/state")
def get_game_state():
    """Get current game state"""
    global game_state
    if game_state is None:
        # Auto-initialize if not initialized
        game_state = GameState(grid=initialize_grid("Hilly"))
    return game_state.model_dump()


@app.post("/state")
def set_game_state(new_state: GameState):
    """Set game state"""
    global game_state
    game_state = new_state
    return {"status": "ok"}


@app.put("/state")
def update_game_state(new_state: GameState):
    """Update game state"""
    global game_state
    game_state = new_state
    return {"status": "ok"}


# ============== GRID CELL ENDPOINTS ==============


@app.get("/state/grid/{row}/{col}")
def get_cell_state(row: int, col: int):
    """Get state of a specific grid cell"""
    global game_state
    if game_state is None:
        raise HTTPException(status_code=400, detail="Game not initialized")

    if not (0 <= row < 4 and 0 <= col < 4):
        raise HTTPException(status_code=400, detail="Invalid cell coordinates")

    index = row * GRID_WIDTH + col
    return game_state.grid[index].model_dump()


@app.put("/state/grid/{row}/{col}")
def update_cell_state(row: int, col: int, cellstate: CellState):
    """Update a specific grid cell"""
    global game_state
    if game_state is None:
        raise HTTPException(status_code=400, detail="Game not initialized")

    if not (0 <= row < 4 and 0 <= col < 4):
        raise HTTPException(status_code=400, detail="Invalid cell coordinates")

    index = row * GRID_WIDTH + col
    game_state.grid[index] = cellstate
    return game_state.grid[index].model_dump()


# ============== ACTION ENDPOINTS ==============


@app.post("/action")
def perform_action(request: BatchActionRequest):
    """Perform an action on selected cells"""
    global game_state
    if game_state is None:
        raise HTTPException(status_code=400, detail="Game not initialized")

    action = request.action
    indices = request.indices

    if action not in ACTIONS:
        raise HTTPException(status_code=404, detail=f"Action '{action}' not found")

    action_data = ACTIONS[action]
    cost_per_cell = action_data["cost"].get(
        game_state.region, action_data["cost"]["Hilly"]
    )
    total_cost = cost_per_cell * len(indices)

    # Check if harvest
    if action == "harvest":
        harvested = 0
        gold_earned = 0
        for idx in indices:
            if 0 <= idx < 16:
                cell = game_state.grid[idx]
                if cell.crop and cell.stage >= cell.max_stage:
                    crop_data = CROPS.get(cell.crop)
                    if crop_data:
                        gold_earned += crop_data.get("harvest_gold", 50)
                    harvested += 1
                    cell.crop = None
                    cell.stage = 0

        game_state.gold += gold_earned
        return {
            "msg": f"Harvested {harvested} crops! Earned {gold_earned}g",
            "gold": game_state.gold,
            "harvested": harvested,
        }

    # Check gold
    if game_state.gold < total_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough gold. Need {total_cost}g, have {game_state.gold}g",
        )

    # Apply action to cells
    affected = 0
    for idx in indices:
        if 0 <= idx < 16:
            game_state.grid[idx].take_action(action)
            affected += 1

    game_state.gold -= total_cost

    return {
        "msg": f"{action_data['name']} applied to {affected} cells (-{total_cost}g)",
        "gold": game_state.gold,
        "affected": affected,
    }


@app.post("/plant")
def plant_crop(request: PlantRequest):
    """Plant a crop on selected cells"""
    global game_state
    if game_state is None:
        raise HTTPException(status_code=400, detail="Game not initialized")

    crop_name = request.crop.capitalize()
    indices = request.indices

    if crop_name not in CROPS:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_name}' not found")

    crop_data = CROPS[crop_name]
    cost_per_plant = crop_data["cost"].get(
        game_state.region, crop_data["cost"]["Hilly"]
    )

    # Count plantable cells
    plantable = sum(
        1 for idx in indices if 0 <= idx < 16 and game_state.grid[idx].crop is None
    )
    total_cost = cost_per_plant * plantable

    if game_state.gold < total_cost:
        raise HTTPException(
            status_code=400, detail=f"Not enough gold. Need {total_cost}g"
        )

    planted = 0
    for idx in indices:
        if 0 <= idx < 16:
            cell = game_state.grid[idx]
            if cell.crop is None:
                cell.crop = crop_name
                cell.stage = 0
                cell.max_stage = crop_data["days"] * 10  # Growth stages
                planted += 1

    game_state.gold -= planted * cost_per_plant

    return {
        "msg": f"Planted {planted} {crop_name} (-{planted * cost_per_plant}g)",
        "gold": game_state.gold,
        "planted": planted,
    }


# ============== RECOMMENDATION ENDPOINTS ==============


@app.post("/recommend")
def get_recommendations(request: RecommendRequest):
    """Get top 3 crop recommendations based on soil parameters"""
    recommendations = model.get_recommendations(
        n=request.n,
        p=request.p,
        k=request.k,
        temperature=request.temperature,
        humidity=request.humidity,
        ph=request.ph,
        rainfall=request.rainfall,
        top_n=3,
    )
    return {"recommendations": recommendations}


@app.get("/recommend/cell/{row}/{col}")
def get_cell_recommendations(row: int, col: int):
    """Get crop recommendations for a specific cell based on its current soil state"""
    global game_state
    if game_state is None:
        raise HTTPException(status_code=400, detail="Game not initialized")

    if not (0 <= row < 4 and 0 <= col < 4):
        raise HTTPException(status_code=400, detail="Invalid cell coordinates")

    index = row * GRID_WIDTH + col
    cell = game_state.grid[index]

    recommendations = model.get_recommendations(
        n=cell.n,
        p=cell.p,
        k=cell.k,
        temperature=cell.temperature,
        humidity=cell.humidity,
        ph=cell.ph,
        rainfall=cell.rainfall,
        top_n=3,
    )
    return {"cell": index, "recommendations": recommendations}


@app.get("/recommend/average")
def get_average_recommendations():
    """Get crop recommendations based on average soil state across all cells"""
    global game_state
    if game_state is None:
        # Return default recommendations
        recommendations = model.get_recommendations(
            n=40, p=40, k=40, temperature=25, humidity=65, ph=6.5, rainfall=100, top_n=3
        )
        return {"recommendations": recommendations}

    # Calculate averages
    n_cells = len(game_state.grid)
    avg_n = sum(c.n for c in game_state.grid) / n_cells
    avg_p = sum(c.p for c in game_state.grid) / n_cells
    avg_k = sum(c.k for c in game_state.grid) / n_cells
    avg_temp = sum(c.temperature for c in game_state.grid) / n_cells
    avg_humidity = sum(c.humidity for c in game_state.grid) / n_cells
    avg_ph = sum(c.ph for c in game_state.grid) / n_cells
    avg_rainfall = sum(c.rainfall for c in game_state.grid) / n_cells

    recommendations = model.get_recommendations(
        n=avg_n,
        p=avg_p,
        k=avg_k,
        temperature=avg_temp,
        humidity=avg_humidity,
        ph=avg_ph,
        rainfall=avg_rainfall,
        top_n=3,
    )
    return {"recommendations": recommendations}


# ============== GEMINI/AI ENDPOINTS ==============


@app.post("/chat")
def chat_with_lab(request: ChatRequest):
    """
    Chat with the laboratory AI assistant.
    Uses Gemini to analyze game state, recent actions, and model predictions.
    """
    global game_state

    # Use frontend-provided game state if available, else use server state
    current_state = None
    if request.game_state:
        # Build GameState from frontend data
        try:
            grid_data = request.game_state.get("grid", [])
            cells = []
            for g in grid_data:
                cells.append(
                    CellState(
                        n=g.get("n", 40),
                        p=g.get("p", 40),
                        k=g.get("k", 40),
                        rainfall=g.get("rainfall", 100),
                        ph=g.get("ph", 6.5),
                        humidity=g.get("humidity", 60),
                        temperature=g.get("temperature", 25),
                        moisture=g.get("moisture", 50),
                        crop=g.get("crop"),
                        stage=int(g.get("stage", 0)),
                        max_stage=int(g.get("max_stage", 100)),
                        weed=g.get("weed", 0),
                        health=g.get("health", 100),
                    )
                )
            current_state = GameState(
                location=request.game_state.get("location", "Unknown"),
                region=request.game_state.get("region", "Hilly"),
                gold=request.game_state.get("gold", 1000),
                day=request.game_state.get("day", 1),
                grid=cells if cells else [CellState() for _ in range(16)],
            )
        except Exception as e:
            print(f"Error parsing frontend game state: {e}")
            current_state = game_state
    else:
        current_state = game_state

    if current_state is None:
        # Create a default state for chat if nothing available
        current_state = GameState(
            location="Default",
            region="Hilly",
            gold=1000,
            day=1,
            grid=[CellState() for _ in range(16)],
        )

    # Get predictions for all cells
    predictions = {}
    for i, cell in enumerate(current_state.grid):
        # params order: ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        params = np.array(
            [
                cell.n,
                cell.p,
                cell.k,
                cell.temperature,
                cell.humidity,
                cell.ph,
                cell.rainfall,
            ]
        )
        preds = model.predict(params)
        # Get top 3 suitable crops (lowest distance)
        sorted_preds = sorted(preds.items(), key=lambda x: x[1])[:3]
        predictions[f"Cell {i}"] = sorted_preds

    response = get_chat_response(
        message=request.message,
        game_state=current_state,
        recent_actions=request.recent_actions,
        predictions=predictions,
    )

    return {"response": response}


@app.post("/gemini")
def ask_gemini(context: dict):
    """Get AI advice (mock implementation)"""
    ctx = context.get("context", "")

    # Simple response based on keywords
    if "water" in ctx.lower():
        advice = "Watering is essential for crop health. Monitor soil moisture levels."
    elif "fertilizer" in ctx.lower() or "nutrient" in ctx.lower():
        advice = "Balance NPK nutrients based on your crop's needs."
    elif "harvest" in ctx.lower():
        advice = "Harvest crops when they reach full maturity for maximum yield."
    else:
        advice = "Focus on maintaining optimal soil conditions for your crops."

    return {"advice": advice}


@app.post("/summarize")
def summarize_interactions(interactions: dict):
    """Generate a summary of AI interactions (mock implementation)"""
    interaction_list = interactions.get("interactions", [])

    if not interaction_list:
        return {"summary": "No interactions to summarize."}

    summary_parts = []
    for i, item in enumerate(interaction_list, 1):
        human = item.get("human", "")
        ai = item.get("ai", "")
        summary_parts.append(f"{i}. Query: {human[:50]}... → {ai[:50]}...")

    return {"summary": "Session Summary:\n" + "\n".join(summary_parts)}


from io import BytesIO

from dataclasses import dataclass


@dataclass
class Message:
    role: str
    content: str


messages = []


@app.post("/dpredict")
async def predict_endpoint(message: str, image: UploadFile = File(...)):
    contents = await image.read()  # bytes
    
    # Check if image is valid/provided (not placeholder)
    # The frontend sends a placeholder Blob([''], type='image/png') if no image
    # calculated size of 'placeholder' might be tiny. 
    # But let's just pass contents. If it fails to open as image, the service handles it.
    
    chatres = analyze_disease_chat(messages, message, contents)
    retdict = {"chatres": chatres}
    
    # Update local history
    messages.append(Message(role="user", content=message))
    messages.append(Message(role="assistant", content=chatres))
    
    return retdict


@app.get("/pathologer")
async def get_messages():
    return {"messages": messages}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
