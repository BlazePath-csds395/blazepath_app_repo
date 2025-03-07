import os
from flask import Flask, jsonify, send_from_directory
import pandas as pd
import json

app = Flask(__name__)

# 🔥 Define file paths
frontend_path = "/Users/meghanagopu/Documents/GitHub/blazepath_app_repo/frontend/src/data"  # ✅ Target directory
csv_file = "/Users/meghanagopu/Documents/GitHub/blazepath_app_repo/backend/long_lat_merged_v21.csv"
output_file = os.path.join(frontend_path, "fire_risk.geojson")  # ✅ Save in frontend/src/data/

# ✅ Ensure the output directory exists
os.makedirs(frontend_path, exist_ok=True)

# ✅ Load wildfire dataset
df = pd.read_csv(csv_file)

# ✅ Convert DataFrame to GeoJSON format
def convert_to_geojson(df):
    features = []
    for _, row in df.iterrows():
        # Convert 'forest_fire' categorical values to numeric (0 = No fire, 1 = Fire detected)
        fire_intensity = 1 if row.get("forest_fire", "N") == "Y" else 0  

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [row["longitude"], row["latitude"]]
            },
            "properties": {
                "brightness": float(row.get("brightness", 1)),  # Ensure it's a float
                "intensity": max(float(row.get("brightness", 1)) / 100, fire_intensity),  # Ensure intensity is numeric
                "date_time": row.get("date_time", ""),
                "forest_fire": fire_intensity  # ✅ Now stored as an integer (0 or 1)
            }
        }
        features.append(feature)

    return {"type": "FeatureCollection", "features": features}

geojson_data = convert_to_geojson(df)

# ✅ Save GeoJSON file inside `frontend/src/data/`
with open(output_file, "w") as f:
    json.dump(geojson_data, f, indent=4)

print(f"🔥 GeoJSON file saved at: {output_file}")

# ✅ Serve GeoJSON file for frontend requests
@app.route('/fire_risk.geojson')
def serve_fire_risk():
    return send_from_directory(frontend_path, "fire_risk.geojson")

if __name__ == '__main__':
    app.run(debug=True, port=5000)
