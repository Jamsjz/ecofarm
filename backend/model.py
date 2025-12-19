import pandas as pd
import numpy as np
from constants import CROPS_USED, MODEL_ALPHA, MODEL_GOLDUNIT


class Model:
    """ML Model for crop recommendation based on soil parameters"""
    
    _instance = None
    _df = None
    
    def __new__(cls, *args, **kwargs):
        """Singleton pattern to avoid reloading data"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(
        self,
        alpha=MODEL_ALPHA,
        goldunit=MODEL_GOLDUNIT,
        crops_used=CROPS_USED,
    ):
        if self._initialized:
            return
            
        self.alpha = alpha
        self.goldunit = goldunit
        self.crops_used = crops_used
        
        try:
            if Model._df is None:
                Model._df = pd.read_csv("./data/data.csv")
            self.df_filtered = Model._df[Model._df["label"].isin(self.crops_used)]
            self.summary_dict = self.df_filtered.groupby("label").mean().T.to_dict()
            self.d = {k: np.array(list(v.values())) for k, v in self.summary_dict.items()}
            self._initialized = True
        except Exception as e:
            print(f"Error loading model data: {e}")
            self.d = {}
            self._initialized = True

    def predict(self, params: np.ndarray) -> dict:
        """
        Calculate distance from params to each crop's ideal conditions.
        Order of params: ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        Returns dict of {crop_name: distance}
        """
        if not self.d:
            return {}
        return {k: float(np.linalg.norm(v - params)) for k, v in self.d.items()}

    def topn(self, n: int, params: np.ndarray, predict_gold: bool = False) -> tuple:
        """
        Get top N recommended crops based on soil parameters.
        
        Args:
            n: Number of top crops to return
            params: np.array of [N, P, K, temperature, humidity, ph, rainfall]
            predict_gold: If True, convert distances to gold predictions
            
        Returns:
            tuple of (top_crop_names, prediction_dict)
        """
        predictions = self.predict(params)
        if not predictions:
            return [], {}
            
        # Sort by distance (lower is better)
        sorted_predictions = dict(sorted(predictions.items(), key=lambda item: item[1]))
        top_keys = list(sorted_predictions.keys())[:n]
        
        if predict_gold:
            # Convert distance to gold value (closer = higher gold)
            gold_predictions = {}
            for k, v in sorted_predictions.items():
                if v > 0:
                    gold_predictions[k] = round(self.alpha / v * self.goldunit, 2)
                else:
                    gold_predictions[k] = self.alpha * self.goldunit  # Perfect match
            return top_keys, gold_predictions
        
        return top_keys, sorted_predictions

    def get_recommendations(self, n: float, p: float, k: float, 
                           temperature: float, humidity: float, 
                           ph: float, rainfall: float, 
                           top_n: int = 3) -> list:
        """
        Get top N crop recommendations with predicted gold values.
        
        Returns list of dicts: [{"crop": name, "score": gold_value}, ...]
        """
        params = np.array([n, p, k, temperature, humidity, ph, rainfall])
        top_crops, gold_dict = self.topn(top_n, params, predict_gold=True)
        
        return [
            {"crop": crop.capitalize(), "score": gold_dict.get(crop, 0)}
            for crop in top_crops
        ]
