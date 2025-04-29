# BlazePath

A web application for visualizing wildfire perimeters and planning routes around them, with user-contributed fire reporting features.

## Features

- Visualize official fire perimeters
- Plan routes that avoid fire-affected areas
- Report fires observed in your area
- Endorse or reject fire reports from other users
- AQI visualization and information

## Setup

### Backend

1. Set up a virtual environment (recommended):
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the backend:
   ```
   flask run
   ```
   This will start the backend server at http://localhost:5000

### Frontend

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Run the frontend:
   ```
   npm start
   ```
   This will start the frontend development server at http://localhost:3000

3. Or use the combined script:
   ```
   npm run backend  # Start the backend
   npm start        # In another terminal, start the frontend
   ```

## User-Reported Fires Feature

The BlazePath app allows users to report fires they observe in their area. This feature helps the community stay informed about potential fire hazards that may not yet be included in official datasets.

### How to Use

1. Click the "Report Fire" button in the sidebar to enter Fire Reporting Mode
2. Use the drawing tools in the top-right corner to:
   - Place a marker at the location of a fire
   - Draw a polygon around a fire perimeter
3. Your reported fires will be visible to all users in the "User Reported Fires" layer
4. Users can endorse or reject fire reports to indicate their validity

## Data Storage

Fire reports are stored in a GeoJSON file on the backend server at `backend/data/user_reported_fires.geojson`. This allows for persistence between application restarts and sharing data between users.

## API Endpoints

- `GET /api/fires` - Get all fire reports
- `POST /api/fires` - Add a new fire report
- `PUT /api/fires/{fire_id}` - Update an existing fire report
- `GET /api/fires/download` - Download all fire reports as a GeoJSON file

# frontend

## install
use --force if necessary. 
```sh
npm install react-leaflet leaflet
npm install leaflet@latest
npm install leaflet-routing-machine
npm install @turf/turf
npm install react-leaflet-draw
npm install leaflet.heat
```

