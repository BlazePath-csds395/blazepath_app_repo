from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
import os
import time
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ENV variables you must set in Railway
JSONBIN_BIN_ID = os.environ.get("JSONBIN_BIN_ID")
JSONBIN_API_KEY = os.environ.get("JSONBIN_API_KEY")
JSONBIN_URL = f"https://api.jsonbin.io/v3/b/{JSONBIN_BIN_ID}"
JSONBIN_HEADERS = {
    "X-Master-Key": JSONBIN_API_KEY,
    "Content-Type": "application/json"
}

def load_geojson():
    try:
        res = requests.get(JSONBIN_URL, headers=JSONBIN_HEADERS)
        res.raise_for_status()
        return res.json()["record"]
    except Exception as e:
        print("Failed to load from jsonbin.io:", e)
        return {"type": "FeatureCollection", "features": []}

def save_geojson(data):
    try:
        res = requests.put(JSONBIN_URL, headers=JSONBIN_HEADERS, json=data)
        res.raise_for_status()
    except Exception as e:
        print("Failed to save to jsonbin.io:", e)

@app.route('/api/fires', methods=['GET'])
def get_fires():
    geojson_data = load_geojson()
    return jsonify(geojson_data)

@app.route('/api/fires', methods=['POST'])
def add_fire():
    feature = request.json

    if 'id' not in feature:
        feature['id'] = f"fire-{int(time.time())}-{hash(str(feature))}"

    if 'properties' not in feature:
        feature['properties'] = {}

    feature['properties']['reportedBy'] = feature['properties'].get('reportedBy', 'user')
    feature['properties']['timestamp'] = feature['properties'].get('timestamp', datetime.now().isoformat())
    feature['properties']['endorsements'] = feature['properties'].get('endorsements', 0)
    feature['properties']['rejections'] = feature['properties'].get('rejections', 0)

    geojson_data = load_geojson()
    geojson_data['features'].append(feature)
    save_geojson(geojson_data)

    return jsonify({"success": True, "id": feature['id']})

@app.route('/api/fires/<fire_id>', methods=['PUT'])
def update_fire(fire_id):
    updates = request.json
    geojson_data = load_geojson()

    for feature in geojson_data['features']:
        if feature.get('id') == fire_id:
            if 'properties' in updates:
                feature['properties'].update(updates['properties'])
            save_geojson(geojson_data)
            return jsonify({"success": True})

    return jsonify({"success": False, "error": "Fire report not found"}), 404

@app.route('/api/fires/download', methods=['GET'])
def download_fires():
    geojson_data = load_geojson()
    return jsonify(geojson_data)  # Optionally format as attachment with Flask send_file alternative

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Flask on 0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)