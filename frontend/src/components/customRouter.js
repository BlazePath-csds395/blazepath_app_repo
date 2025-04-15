    var L = require('leaflet');
	var corslite = require('corslite');
	var polyline = require('polyline');

	L.Routing = L.Routing || {};

	var GraphHopperv2 = L.Evented.extend({
		options: {
			serviceUrl: 'https://graphhopper.com/api/1/route',
			timeout: 30 * 1000,
			urlParameters: {}
		},

		initialize: function(apiKey, options) {
			this._apiKey = apiKey;
			L.Util.setOptions(this, options);
		},

		route: function (waypoints, callback, context, options) {
            var timedOut = false,
                wps = [],
                timer,
                wp,
                i;
        
            options = options || {};
        
            const url = `${this.options.serviceUrl}?key=${this._apiKey}`;
        
            // Timeout fallback
            timer = setTimeout(() => {
                timedOut = true;
                callback.call(context || callback, {
                    status: -1,
                    message: 'GraphHopper request timed out.'
                });
            }, this.options.timeout);
        
            // Copy waypoints
            for (i = 0; i < waypoints.length; i++) {
                wp = waypoints[i];
                wps.push({
                    latLng: wp.latLng,
                    name: wp.name,
                    options: wp.options
                });
            }
            
            // Build POST request body
            const requestBody = {
                points: [
                    [wps[0].latLng.lng, wps[0].latLng.lat],
                    [wps[1].latLng.lng, wps[1].latLng.lat],
                  ],
                profile: 'car',
                elevation: false,
                instructions: true,
                locale: 'en_US',
                points_encoded: false,
                "ch.disable": true
            };
            
            if (this.options.avoidPolygons) {
                const areas = {};
                const priority = [];
            
                for (const [areaName, polygon] of Object.entries(this.options.avoidPolygons)) {
                    areas[areaName] = {
                        type: "Feature",
                        properties: {},
                        geometry: {
                            type: "Polygon",
                            coordinates: [polygon]
                        }
                    };
            
                    // ✅ YOUR SYNTAX: "if": `in_${areaName}`
                    priority.push({
                        if: `in_${areaName}`,
                        multiply_by: 0
                    });
                }
            
                requestBody.custom_model = {
                    priority,
                    areas
                };
            }
            console.log("📝 Request Body:", JSON.stringify(requestBody, null, 2));
            // Perform POST request using fetch
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
                .then((res) => {
                    clearTimeout(timer);
                    if (!timedOut) {
                        this.fire("response", {
                            status: res.status,
                            limit: Number(res.headers.get("X-RateLimit-Limit")),
                            remaining: Number(res.headers.get("X-RateLimit-Remaining")),
                            reset: Number(res.headers.get("X-RateLimit-Reset")),
                            credits: Number(res.headers.get("X-RateLimit-Credits"))
                        });
                        return res.json();
                    }
                })
                .then((data) => {
                    if (!timedOut && data) {
                        this._routeDone(data, wps, callback, context);
                    }
                })
                .catch((err) => {
                    clearTimeout(timer);
                    callback.call(context || callback, {
                        status: -1,
                        message: 'HTTP request failed: ' + err,
                        response: err
                    });
                });
        
            return this;
        },
        

		_routeDone: function(response, inputWaypoints, callback, context) {
            var alts = [],
                mappedWaypoints,
                coordinates,
                i,
                path;
        
            context = context || callback;
            console.log(response)
            // Check for GraphHopper API error structure
            if (!response || !response.paths) {
                const errorMessage = response?.message || "Invalid response from server";
                console.error("Routing error:", response);
        
                callback.call(context, {
                    status: -1,
                    message: errorMessage,
                    response: response
                });
                return;
            }
        
            if (response.info && response.info.errors && response.info.errors.length) {
                callback.call(context, {
                    status: response.info.errors[0].details,
                    message: response.info.errors[0].message
                });
                return;
            }
        
            for (i = 0; i < response.paths.length; i++) {
                path = response.paths[i];
                coordinates = this._decodePolyline(path.points);
        
                if (path.points_order) {
                    const tempWaypoints = [];
                    for (let j = 0; j < path.points_order.length; j++) {
                        tempWaypoints.push(inputWaypoints[path.points_order[j]]);
                    }
                    inputWaypoints = tempWaypoints;
                }
        
                mappedWaypoints = this._mapWaypointIndices(inputWaypoints, path.instructions, coordinates);
        
                alts.push({
                    name: '',
                    coordinates: coordinates,
                    instructions: this._convertInstructions(path.instructions),
                    summary: {
                        totalDistance: path.distance,
                        totalTime: path.time / 1000,
                        totalAscend: path.ascend,
                    },
                    inputWaypoints: inputWaypoints,
                    actualWaypoints: mappedWaypoints.waypoints,
                    waypointIndices: mappedWaypoints.waypointIndices
                });
            }
        
            callback.call(context, null, alts);
        },
        

		_decodePolyline: function(geometry) {
            // Handle encoded polyline (string) or raw coordinates (GeoJSON)
            let coords;
          
            if (typeof geometry === "string") {
              coords = polyline.decode(geometry, 5);
            } else if (geometry && geometry.coordinates) {
              coords = geometry.coordinates.map(c => [c[1], c[0]]); // [lat, lng]
            } else {
              console.warn("Unknown geometry format in _decodePolyline", geometry);
              return [];
            }
          
            const latlngs = coords.map(c => new L.LatLng(c[0], c[1]));
            return latlngs;
          },
          

		_toWaypoints: function(inputWaypoints, vias) {
			var wps = [],
			    i;
			for (i = 0; i < vias.length; i++) {
				wps.push({
					latLng: L.latLng(vias[i]),
					name: inputWaypoints[i].name,
					options: inputWaypoints[i].options
				});
			}

			return wps;
		},

		buildRouteUrl: function(waypoints, options) {
			var computeInstructions =
				/* Instructions are always needed,
				   since we do not have waypoint indices otherwise */
				true,
				//!(options && options.geometryOnly),
				locs = [],
				i,
				baseUrl;

			for (i = 0; i < waypoints.length; i++) {
				locs.push('point=' + waypoints[i].latLng.lat + ',' + waypoints[i].latLng.lng);
			}

			baseUrl = this.options.serviceUrl + '?' +
				locs.join('&');

            console.log(baseUrl + L.Util.getParamString(L.extend({
                instructions: computeInstructions,
                type: 'json',
                key: this._apiKey
            }, this.options.urlParameters), baseUrl));

            
			return baseUrl + L.Util.getParamString(L.extend({
					instructions: computeInstructions,
					type: 'json',
					key: this._apiKey
				}, this.options.urlParameters), baseUrl);
		},

		_convertInstructions: function(instructions) {
			var signToType = {
					'-7': 'SlightLeft',
					'-3': 'SharpLeft',
					'-2': 'Left',
					'-1': 'SlightLeft',
					0: 'Straight',
					1: 'SlightRight',
					2: 'Right',
					3: 'SharpRight',
					4: 'DestinationReached',
					5: 'WaypointReached',
					6: 'Roundabout',
					7: 'SlightRight'
				},
				result = [],
				type,
				i,
				instr;

			for (i = 0; instructions && i < instructions.length; i++) {
				instr = instructions[i];
				if (i === 0) {
					type = 'Head';
				} else {
					type = signToType[instr.sign];
				}
				result.push({
					type: type,
					modifier: type,
					text: instr.text,
					distance: instr.distance,
					time: instr.time / 1000,
					index: instr.interval[0],
					exit: instr.exit_number
				});
			}

			return result;
		},

		_mapWaypointIndices: function(waypoints, instructions, coordinates) {
			var wps = [],
				wpIndices = [],
			    i,
			    idx;

			wpIndices.push(0);
			wps.push(new L.Routing.Waypoint(coordinates[0], waypoints[0].name));

			for (i = 0; instructions && i < instructions.length; i++) {
				if (instructions[i].sign === 5) { // VIA_REACHED
					idx = instructions[i].interval[0];
					wpIndices.push(idx);
					wps.push({
						latLng: coordinates[idx],
						name: waypoints[wps.length + 1].name
					});
				}
			}

			wpIndices.push(coordinates.length - 1);
			wps.push({
				latLng: coordinates[coordinates.length - 1],
				name: waypoints[waypoints.length - 1].name
			});

			return {
				waypointIndices: wpIndices,
				waypoints: wps
			};
		}
	});

	const createGraphHopper = (apiKey, options) => {
        return new GraphHopperv2(apiKey, options);
      };
export default createGraphHopper;