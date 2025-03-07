import joblib
import numpy as np

# Load models and scaler
svm_model = joblib.load("models/svm_model.pkl")  # Replace with actual path
xgb_model = joblib.load("models/xgb_model.pkl")
scaler = joblib.load("models/scaler.pkl")

def predict_fire_risk(features):
    """Predict fire risk using trained models"""
    features = np.array(features).reshape(1, -1)
    scaled_features = scaler.transform(features)

    svm_pred = svm_model.predict_proba(scaled_features)[:, 1]  # Probability of fire
    xgb_pred = xgb_model.predict_proba(scaled_features)[:, 1]

    # Weighted average of models
    final_pred = (0.6 * xgb_pred + 0.4 * svm_pred)[0]  # Adjust weights if needed
    return round(final_pred, 2)
