import os
import google.generativeai as genai
from dotenv import load_dotenv
from game_engine.engine import GameState
import numpy as np

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

# Use a fallback if the specific model isn't available, but try to respect user wish or standard
MODEL_NAME = "gemini-2.5-flash"  # Switched to 1.5 Flash for better speed/stability


def get_chat_response(
    message: str, game_state: GameState, recent_actions: list, predictions: dict
) -> str:
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
            summary.append(
                f"Cell {i}: {cell.crop} (Stage {cell.stage}/{cell.max_stage}, Health {cell.health}%, Moisture={cell.moisture:.1f}%, Weeds={cell.weed:.1f}%)"
            )
        else:
            summary.append(
                f"Cell {i}: Empty (N={cell.n:.1f}, P={cell.p:.1f}, K={cell.k:.1f}, pH={cell.ph:.1f}, Moisture={cell.moisture:.1f}%)"
            )
    return "\n".join(summary)


import tensorflow as tf
import numpy as np
from io import BytesIO

m = tf.keras.models.load_model("trained_model.h5")
class_name = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]


def predict_disease(file: BytesIO):
    image = tf.keras.utils.load_img(
        file, target_size=(128, 128)
    )  # or tf.keras.preprocessing.image.load_img
    input_arr = tf.keras.utils.img_to_array(image)
    input_arr = np.expand_dims(input_arr, axis=0)  # (1, 128, 128, 3)
    prediction = m.predict(input_arr)
    result_index = int(np.argmax(prediction))

    return class_name[result_index]


def summarize_disease(ctx, message: str, disease: str):
    if not API_KEY:
        print("Error: GEMINI_API_KEY not found.")
        return "Error: GEMINI_API_KEY not found in environment variables."

    try:
        print(f"Generating response with model: {MODEL_NAME}...")
        model = genai.GenerativeModel(MODEL_NAME)

        # Construct the prompt
        prompt = f"""
        You are an expert agricultural pathologist that explains about a disease in a farming simulation game called EcoFarm.
        
        Previous Conversation:
        {ctx}
        
        User Message: "{message if message else 'No message provided just explain about the disease'}"
        Disease predicted from leaf: {disease}
        
        Task:
        1. Give Introduction, Causes, Effects and Preventive measures for the disease in a simple manner.
        """

        print("Sending prompt to Gemini...")
        response = model.generate_content(prompt)
        print("Received response from Gemini.")
        return response.text
    except Exception as e:
        print(f"Error in get_chat_response: {e}")
        return f"Error generating response: {str(e)}"
