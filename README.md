# ☀️ WeatherScope - Modern Live Atmospheric Web Station

> **First Year Engineering College Project**  
> Developed using **Python (Flask), HTML5, CSS3, JavaScript (ES6+), and Open-Meteo REST API**.

---

## 📌 Project Overview
**WeatherScope** is a full-stack, responsive web application that provides real-time atmospheric measurements, 24-hour granular forecasts, and a 7-day outlook for any city across the globe or the user's current GPS location.

It uses **Open-Meteo**, a high-precision, open-source weather and geocoding API that requires **no API keys**, ensuring reliability, zero cost, and zero rate-limit hassles for academic demonstrations.

---

## 🚀 Key Features

1. **Global City Search & Autocomplete**:
   - Live debounce search querying worldwide coordinates.
   - Fast click-to-select suggestions with state/country resolution.
2. **One-Click Geolocation**:
   - Uses the browser's HTML5 `navigator.geolocation` API to instantly detect your location.
3. **Comprehensive Real-Time Meteorological Metrics**:
   - **Temperature** & **Apparent ("Feels Like") Temperature**.
   - **Humidity** level with qualitative comfort labels (Dry, Comfortable, Humid).
   - **Wind Speed & Direction** with an interactive rotating compass needle.
   - **UV Index** with safety precautions (Low to Extreme).
   - **Barometric Pressure** (in hPa).
   - **Precipitation Amount & Chance**.
   - **Sunrise & Sunset Times**.
4. **Dynamic Visual Ambiance**:
   - Automatic UI theme adaptation based on weather condition and day/night cycle (Sunny, Night, Rainy, Snowy, Stormy, Cloudy).
5. **Interactive 24-Hour Forecast**:
   - Dual view: Horizontal timeline cards and a smooth interactive temperature curve chart powered by **Chart.js**.
6. **7-Day Extended Forecast**:
   - Min/max temperature comparison bar and daily condition forecasts.
7. **Instant Unit Switcher**:
   - One-click toggle between Celsius (°C) and Fahrenheit (°F) with immediate in-browser recalculation.
8. **Glassmorphism UI**:
   - Modern, aesthetic translucent cards with subtle glow effects, responsive across desktop, tablet, and mobile screens.

---

## 🛠️ Technology Stack & Architecture

```
[ Client Browser ]
  HTML5 / CSS3 (Glassmorphism) / Vanilla JS (ES6+) / Chart.js
           │
           │  REST API Calls (fetch)
           ▼
[ Python Flask Server (app.py) ]
  Proxy controller, data normalization & WMO code mapper
           │
           │  HTTPS GET Requests
           ▼
[ Open-Meteo Meteorological Service ]
  Free Open Source Weather & Geocoding API
```

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript | User interface, DOM updates, geolocation, responsive layout |
| **Data Viz** | Chart.js | Interactive 24-hour hourly temperature trends |
| **Backend** | Python (Flask) | Serves web pages, provides `/api/weather` & `/api/search` endpoints |
| **Data Source**| Open-Meteo REST API | Open-source weather & geocoding data without API keys |

---

## ⚙️ How to Run the Project

### 1. Requirements
- Python 3.8 or newer (Installed on your system)
- Terminal / PowerShell

### 2. Install Dependencies
In the project directory, run:
```powershell
python -m pip install -r requirements.txt
```

### 3. Launch the Server
```powershell
python app.py
```

### 4. Open in Your Browser
Visit:
👉 **`http://127.0.0.1:5000`**

---

## 🎯 Viva & Presentation Highlights (For First-Year Engineering Students)

When presenting this project to professors or examiners, you can highlight these engineering concepts:

1. **Client-Server Architecture**:
   - Why use Python Flask instead of fetching directly from JavaScript?
   - *Answer*: Using a backend server acts as a secure controller/proxy. It centralizes data formatting, eliminates CORS (Cross-Origin Resource Sharing) issues, maps raw meteorological WMO codes into human-readable descriptions, and keeps client payloads lightweight.

2. **Meteorological Standards (WMO Codes)**:
   - The project implements standard **World Meteorological Organization (WMO)** weather interpretation codes (e.g., Code 0 = Clear Sky, Code 61 = Slight Rain, Code 95 = Thunderstorm).

3. **Event-Driven Asynchronous Programming**:
   - JavaScript `async/await` and Fetch API are used for non-blocking HTTP requests.
   - Search input utilizes **debouncing** (280ms) to prevent flooding the server with network requests on every keystroke.

4. **Responsive UI & CSS Grid/Flexbox**:
   - Uses mobile-first principles, dynamic CSS custom properties (`var(--...)`), and media queries to support smartphones, tablets, and wide monitors.

