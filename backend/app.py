from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json
import os
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
GEOJSON_FILE = os.path.join(DATA_DIR, 'user_reported_fires.json')

os.makedirs(DATA_DIR, exist_ok=True)

if not os.path.exists(GEOJSON_FILE):
    with open(GEOJSON_FILE, 'w') as f:
        json.dump({
            "type": "FeatureCollection",
            "features": []
        }, f)


def load_geojson():
    """Load GeoJSON data from file"""
    try:
        with open(GEOJSON_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            "type": "FeatureCollection",
            "features": []
        }


def save_geojson(data):
    """Save GeoJSON data to file"""
    with open(GEOJSON_FILE, 'w') as f:
        json.dump(data, f, indent=2)


@app.route('/api/fires', methods=['GET'])
def get_fires():
    """Endpoint to get all fire reports"""
    geojson_data = load_geojson()
    return jsonify(geojson_data)


@app.route('/api/fires', methods=['POST'])
def add_fire():
    """Endpoint to add a new fire report"""
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
    """Endpoint to update an existing fire report (e.g., for endorsements)"""
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
    """Endpoint to download the full GeoJSON file"""
    return send_file(GEOJSON_FILE, mimetype='application/json', as_attachment=True, 
                     download_name=f'fire_reports_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')


if __name__ == '__main__':
    app.run(debug=True, port=5000)
