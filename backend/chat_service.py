import os
import google.generativeai as genai
from dotenv import load_dotenv
from game_engine.engine import GameState

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

# Use a fallback if the specific model isn't available, but try to respect user wish or standard
MODEL_NAME = "gemini-2.5-flash"  # Switched to 1.5 Flash for better speed/stability

def get_chat_response(message: str, game_state: GameState, recent_actions: list, predictions: dict) -> str:
    if not API_KEY:
        print("Error: GEMINI_API_KEY not found.")
        return "Error: GEMINI_API_KEY not found in environment variables."

    try:
        print(f"Generating response with model: {MODEL_NAME}...")
        model = genai.GenerativeModel(MODEL_NAME)
        
        # Construct the prompt
        prompt = f"""
        You are an expert agricultural AI assistant in a farming simulation game called EcoFarm.
        
        Current Game State:
        - Location: {game_state.location} ({game_state.region})
        - Day: {game_state.day}
        - Gold: {game_state.gold}
        
        Grid Status (Summary):
        {_summarize_grid(game_state.grid)}
        
        Recent Actions Performed:
        {recent_actions}
        
        Model Predictions for Cells (Crop Suitability):
        {predictions}
        
        User Message: "{message if message else 'No specific question. Please analyze the recent actions and provide feedback.'}"
        
        Task:
        1. Analyze the current state and recent actions.
        2. Provide advice and recommendations for the next steps.
        3. Evaluate if the recent actions were good or bad for the crops/soil.
        4. Explain how these actions affect the soil parameters (N, P, K, pH, Moisture, etc.) and crop growth.
        5. Be concise but helpful.
        6. If the user message is empty, focus primarily on reacting to the 'Recent Actions Performed'.
        """
        
        print("Sending prompt to Gemini...")
        response = model.generate_content(prompt)
        print("Received response from Gemini.")
        return response.text
    except Exception as e:
        print(f"Error in get_chat_response: {e}")
        return f"Error generating response: {str(e)}"

def _summarize_grid(grid):
    summary = []
    for i, cell in enumerate(grid):
        if cell.crop:
            summary.append(f"Cell {i}: {cell.crop} (Stage {cell.stage}/{cell.max_stage}, Health {cell.health}%, Moisture={cell.moisture:.1f}%, Weeds={cell.weed:.1f}%)")
        else:
            summary.append(f"Cell {i}: Empty (N={cell.n:.1f}, P={cell.p:.1f}, K={cell.k:.1f}, pH={cell.ph:.1f}, Moisture={cell.moisture:.1f}%)")
    return "\n".join(summary)
