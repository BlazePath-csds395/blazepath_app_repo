from flask import Flask, request, jsonify
import joblib
import numpy as np
from model import predict_fire_risk

app = Flask(__name__)

@app.route("/predictions", methods=["GET"])
def predictions():
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        temp = request.args.get('temperature_2m', type=float)
        humidity = request.args.get('relative_humidity_2m', type=float)
        wind_speed = request.args.get('wind_speed_10m', type=float)
        soil_moisture = request.args.get('soil_moisture_0_to_7cm', type=float)

        # Check if all values exist
        if None in [lat, lon, temp, humidity, wind_speed, soil_moisture]:
            return jsonify({"error": "Missing required parameters"}), 400
        
        # Predict fire risk
        risk = predict_fire_risk([temp, humidity, wind_speed, soil_moisture])

        return jsonify({"lat": lat, "lon": lon, "risk": risk})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
