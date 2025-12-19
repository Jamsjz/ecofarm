import pandas as pd
import numpy as np
from constants import CROPS_USED, MODEL_ALPHA, MODEL_GOLDUNIT
import numpy as np
from numpy import array
import pandas as pd


class Model:
    def __init__(
        self,
        alpha=MODEL_ALPHA,
        goldunit=MODEL_GOLDUNIT,
        crops_used=CROPS_USED,
    ):
        self._df = pd.read_csv("./data/data.csv")
        self.alpha = alpha
        self.goldunit = goldunit
        self.crops_used = crops_used
        self.df_filtered = self._df[self._df["label"].isin(self.crops_used)]
        self.summary_dict = self.df_filtered.groupby("label").mean().T.to_dict()
        self.d = {k: np.array(list(v.values())) for k, v in self.summary_dict.items()}

    def report(self):
        """Prints the report on the model vs dataset."""
        from sklearn.metrics import classification_report

        test = {
            k: array(list(v.values()))
            for k, v in self.df_filtered.drop("label", axis=1).T.to_dict().items()
        }
        predictions = array([Model.topn(v, 1)[0][0] for v in test.values()])
        actual = array(self.df_filtered.label)
        print(classification_report(actual, predictions))

    def predict(self, params: np.ndarray):
        """
        Order of params: ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        """
        return {k: np.linalg.norm(v - params) for k, v in self.d.items()}

    def topn(self, n: int, params, predict_gold=False):
        "Returns top_keys, sorted_prediction_dict"
        if not predict_gold:
            sorted_prediction_dict = dict(
                sorted(Model.predict(params).items(), key=lambda item: item[1])
            )
            return list(sorted_prediction_dict.keys())[:n], sorted_prediction_dict

        top_keys, prediction_dict = Model.topn(params, 3)
        for k, v in prediction_dict.items():
            prediction_dict[k] = self.alpha / v * self.goldunit
        return top_keys, prediction_dict
