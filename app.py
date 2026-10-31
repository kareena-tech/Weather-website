"""
Weather Scope - Modern Weather Web Application
Developed with Python Flask, JavaScript, HTML5, CSS3, and Open-Meteo API.
Perfect for first-year engineering demonstration & viva.
"""

from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# WMO Weather Interpretation Codes mapping (Standard Meteorological codes)
WMO_CODES = {
    0: {"description": "Clear Sky", "icon": "clear", "category": "clear"},
    1: {"description": "Mainly Clear", "icon": "mainly-clear", "category": "clear"},
    2: {"description": "Partly Cloudy", "icon": "partly-cloudy", "category": "cloudy"},
    3: {"description": "Overcast", "icon": "overcast", "category": "cloudy"},
    45: {"description": "Foggy", "icon": "fog", "category": "fog"},
    48: {"description": "Depositing Rime Fog", "icon": "fog", "category": "fog"},
    51: {"description": "Light Drizzle", "icon": "drizzle", "category": "rain"},
    53: {"description": "Moderate Drizzle", "icon": "drizzle", "category": "rain"},
    55: {"description": "Dense Drizzle", "icon": "drizzle", "category": "rain"},
    56: {"description": "Light Freezing Drizzle", "icon": "freezing-rain", "category": "snow"},
    57: {"description": "Dense Freezing Drizzle", "icon": "freezing-rain", "category": "snow"},
    61: {"description": "Slight Rain", "icon": "rain-light", "category": "rain"},
    63: {"description": "Moderate Rain", "icon": "rain", "category": "rain"},
    65: {"description": "Heavy Rain", "icon": "rain-heavy", "category": "rain"},
    66: {"description": "Light Freezing Rain", "icon": "freezing-rain", "category": "snow"},
    67: {"description": "Heavy Freezing Rain", "icon": "freezing-rain", "category": "snow"},
    71: {"description": "Slight Snow Fall", "icon": "snow-light", "category": "snow"},
    73: {"description": "Moderate Snow Fall", "icon": "snow", "category": "snow"},
    75: {"description": "Heavy Snow Fall", "icon": "snow-heavy", "category": "snow"},
    77: {"description": "Snow Grains", "icon": "snow", "category": "snow"},
    80: {"description": "Slight Rain Showers", "icon": "showers", "category": "rain"},
    81: {"description": "Moderate Rain Showers", "icon": "showers", "category": "rain"},
    82: {"description": "Violent Rain Showers", "icon": "showers-heavy", "category": "rain"},
    85: {"description": "Slight Snow Showers", "icon": "snow-showers", "category": "snow"},
    86: {"description": "Heavy Snow Showers", "icon": "snow-showers", "category": "snow"},
    95: {"description": "Thunderstorm", "icon": "thunderstorm", "category": "thunder"},
    96: {"description": "Thunderstorm with Slight Hail", "icon": "thunderstorm", "category": "thunder"},
    99: {"description": "Thunderstorm with Heavy Hail", "icon": "thunderstorm", "category": "thunder"},
}

def get_weather_info(code, is_day=1):
    info = WMO_CODES.get(code, {"description": "Unknown", "icon": "unknown", "category": "cloudy"})
    icon = info["icon"]
    # Adjust clear / mainly clear icon for night
    if is_day == 0 and info["category"] == "clear":
        icon = "clear-night"
    return {
        "description": info["description"],
        "icon": icon,
        "category": info["category"]
    }

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/search")
def search_city():
    """Geocoding endpoint to search for cities worldwide."""
    query = request.args.get("q", "").strip()
    if not query or len(query) < 2:
        return jsonify([])

    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {"name": query, "count": 6, "language": "en", "format": "json"}
        resp = requests.get(url, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        
        results = []
        for item in data.get("results", []):
            results.append({
                "name": item.get("name"),
                "country": item.get("country", ""),
                "admin1": item.get("admin1", ""), # state/province
                "latitude": item.get("latitude"),
                "longitude": item.get("longitude"),
                "country_code": item.get("country_code", "")
            })
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": f"Failed to search locations: {str(e)}"}), 500

@app.route("/api/weather")
def get_weather():
    """Fetches comprehensive weather data for a city or coordinates."""
    city_name = request.args.get("city", "").strip()
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    location_label = city_name

    try:
        # If city name given, resolve to coordinates first
        if not (lat and lon):
            if not city_name:
                city_name = "New Delhi" # Default starter city
            
            geo_url = "https://geocoding-api.open-meteo.com/v1/search"
            geo_resp = requests.get(geo_url, params={"name": city_name, "count": 1, "language": "en", "format": "json"}, timeout=5)
            geo_resp.raise_for_status()
            geo_data = geo_resp.json()
            
            if not geo_data.get("results"):
                return jsonify({"error": f"Could not find location '{city_name}'. Please try another city."}), 404
            
            match = geo_data["results"][0]
            lat = match["latitude"]
            lon = match["longitude"]
            parts = [match["name"]]
            if match.get("admin1"):
                parts.append(match["admin1"])
            if match.get("country"):
                parts.append(match["country"])
            location_label = ", ".join(parts)
        else:
            # Reverse-like label or coordinates label
            lat = float(lat)
            lon = float(lon)
            if not location_label:
                location_label = f"Lat: {lat:.2f}, Lon: {lon:.2f}"

        # Fetch Open-Meteo forecast
        forecast_url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "precipitation",
                "weather_code",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m"
            ],
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "weather_code",
                "precipitation_probability",
                "uv_index"
            ],
            "daily": [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "sunrise",
                "sunset",
                "uv_index_max",
                "precipitation_probability_max"
            ],
            "timezone": "auto"
        }

        resp = requests.get(forecast_url, params=params, timeout=7)
        resp.raise_for_status()
        raw = resp.json()

        current = raw.get("current", {})
        hourly = raw.get("hourly", {})
        daily = raw.get("daily", {})

        current_code = current.get("weather_code", 0)
        is_day = current.get("is_day", 1)
        weather_meta = get_weather_info(current_code, is_day)

        # Process Hourly (Next 24 hours starting from current hour)
        hourly_list = []
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        codes = hourly.get("weather_code", [])
        precips = hourly.get("precipitation_probability", [])
        uvs = hourly.get("uv_index", [])

        # Take up to next 24 data points
        for i in range(min(24, len(times))):
            h_code = codes[i] if i < len(codes) else 0
            h_meta = get_weather_info(h_code, is_day=1)
            hourly_list.append({
                "time": times[i],
                "temp": round(temps[i], 1) if i < len(temps) else None,
                "code": h_code,
                "description": h_meta["description"],
                "icon": h_meta["icon"],
                "precipitation_probability": precips[i] if i < len(precips) else 0,
                "uv_index": uvs[i] if i < len(uvs) else 0
            })

        # Process Daily (7-day forecast)
        daily_list = []
        d_times = daily.get("time", [])
        d_codes = daily.get("weather_code", [])
        max_temps = daily.get("temperature_2m_max", [])
        min_temps = daily.get("temperature_2m_min", [])
        sunrises = daily.get("sunrise", [])
        sunsets = daily.get("sunset", [])
        uv_max = daily.get("uv_index_max", [])
        precip_max = daily.get("precipitation_probability_max", [])

        for i in range(min(7, len(d_times))):
            code = d_codes[i] if i < len(d_codes) else 0
            d_meta = get_weather_info(code, is_day=1)
            daily_list.append({
                "date": d_times[i],
                "temp_max": round(max_temps[i], 1) if i < len(max_temps) else None,
                "temp_min": round(min_temps[i], 1) if i < len(min_temps) else None,
                "description": d_meta["description"],
                "icon": d_meta["icon"],
                "sunrise": sunrises[i] if i < len(sunrises) else None,
                "sunset": sunsets[i] if i < len(sunsets) else None,
                "uv_index_max": uv_max[i] if i < len(uv_max) else None,
                "precip_max": precip_max[i] if i < len(precip_max) else 0
            })

        today_sunrise = sunrises[0] if sunrises else None
        today_sunset = sunsets[0] if sunsets else None
        today_uv = uv_max[0] if uv_max else None

        result = {
            "location": location_label,
            "latitude": lat,
            "longitude": lon,
            "timezone": raw.get("timezone", "UTC"),
            "current": {
                "temperature": round(current.get("temperature_2m", 0), 1),
                "apparent_temperature": round(current.get("apparent_temperature", 0), 1),
                "humidity": current.get("relative_humidity_2m", 0),
                "wind_speed": round(current.get("wind_speed_10m", 0), 1),
                "wind_direction": current.get("wind_direction_10m", 0),
                "pressure": round(current.get("surface_pressure", 1013), 1),
                "precipitation": current.get("precipitation", 0),
                "weather_code": current_code,
                "description": weather_meta["description"],
                "icon": weather_meta["icon"],
                "category": weather_meta["category"],
                "is_day": is_day,
                "sunrise": today_sunrise,
                "sunset": today_sunset,
                "uv_index": today_uv
            },
            "hourly": hourly_list,
            "daily": daily_list
        }

        return jsonify(result)

    except requests.exceptions.RequestException as re:
        return jsonify({"error": f"Failed to connect to weather service: {str(re)}"}), 502
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == "__main__":
    print("=====================================================")
    print(" ☀️  WeatherScope Web Application is Starting...")
    print(" 📍  URL: http://127.0.0.1:5000")
    print(" 💡  Press CTRL + C to stop the server")
    print("=====================================================")
    app.run(debug=True, host="127.0.0.1", port=5000)

