/**
 * WeatherScope - Client Application Logic
 * First Year Engineering College Project
 */

// Global State
let weatherData = null;
let currentUnit = 'C'; // 'C' or 'F'
let tempChart = null;
let searchDebounceTimer = null;

// Icon Class Mapper
const ICON_MAP = {
    "clear": "fa-sun text-yellow",
    "clear-night": "fa-moon text-indigo",
    "mainly-clear": "fa-cloud-sun text-yellow",
    "partly-cloudy": "fa-cloud-sun text-yellow",
    "overcast": "fa-cloud text-secondary",
    "fog": "fa-smog text-teal",
    "drizzle": "fa-cloud-rain text-cyan",
    "rain-light": "fa-cloud-rain text-blue",
    "rain": "fa-cloud-showers-heavy text-blue",
    "rain-heavy": "fa-cloud-showers-water text-blue",
    "freezing-rain": "fa-snowflake text-cyan",
    "snow-light": "fa-snowflake text-cyan",
    "snow": "fa-snowflake text-cyan",
    "snow-heavy": "fa-snowflake text-blue",
    "snow-showers": "fa-snowflake text-cyan",
    "showers": "fa-cloud-showers-heavy text-cyan",
    "showers-heavy": "fa-cloud-showers-heavy text-blue",
    "thunderstorm": "fa-bolt-lightning text-yellow",
    "unknown": "fa-cloud text-secondary"
};

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const suggestionsList = document.getElementById('searchSuggestions');
const locationBtn = document.getElementById('locationBtn');
const unitCelsius = document.getElementById('unitCelsius');
const unitFahrenheit = document.getElementById('unitFahrenheit');
const errorBanner = document.getElementById('errorBanner');
const errorMessage = document.getElementById('errorMessage');
const closeErrorBtn = document.getElementById('closeErrorBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const dashboardGrid = document.getElementById('weatherDashboard');

// Unit Conversion Helpers
function toDisplayTemp(celsius) {
    if (celsius === null || celsius === undefined) return '--';
    if (currentUnit === 'F') {
        return Math.round((celsius * 9 / 5) + 32);
    }
    return Math.round(celsius);
}

function toDisplaySpeed(kmh) {
    if (kmh === null || kmh === undefined) return '--';
    if (currentUnit === 'F') {
        // mph
        return (kmh * 0.621371).toFixed(1);
    }
    return kmh.toFixed(1);
}

function formatTimeOnly(isoString) {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateDisplay(isoString) {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

function getDayLabel(isoString, index) {
    if (index === 0) return 'Today';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// Fetch Weather from Backend API
async function fetchWeather(city = null, lat = null, lon = null) {
    showLoading(true);
    hideError();

    let url = '/api/weather?';
    if (lat !== null && lon !== null) {
        url += `lat=${lat}&lon=${lon}`;
        if (city) url += `&city=${encodeURIComponent(city)}`;
    } else {
        url += `city=${encodeURIComponent(city || 'New Delhi')}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch weather data.');
        }

        weatherData = data;
        renderWeather();
    } catch (err) {
        showError(err.message || 'Unable to connect to the weather service.');
    } finally {
        showLoading(false);
    }
}

// Render the Entire UI with Current Weather Data
function renderWeather() {
    if (!weatherData) return;

    const current = weatherData.current;

    // 1. Update Theme Ambiance
    updateTheme(current.category, current.is_day);

    // 2. Location & Date/Time
    document.getElementById('locationName').textContent = weatherData.location || 'Unknown Location';
    const now = new Date();
    document.getElementById('localDateTime').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) + ' | ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Category Badge
    const badge = document.getElementById('weatherCategoryBadge');
    badge.textContent = current.category.toUpperCase();

    // 3. Hero Temperature & Details
    document.getElementById('currentTemp').textContent = toDisplayTemp(current.temperature);
    document.getElementById('apparentTemp').textContent = toDisplayTemp(current.apparent_temperature);
    document.getElementById('weatherCondition').textContent = current.description;

    // Main Large Icon
    const mainIconElem = document.getElementById('mainWeatherIcon');
    const iconClass = ICON_MAP[current.icon] || 'fa-cloud';
    mainIconElem.className = `fa-solid ${iconClass} weather-icon-large`;

    // Today's High & Low
    const todayDaily = weatherData.daily && weatherData.daily[0];
    if (todayDaily) {
        document.getElementById('tempMaxToday').textContent = toDisplayTemp(todayDaily.temp_max);
        document.getElementById('tempMinToday').textContent = toDisplayTemp(todayDaily.temp_min);
    }

    // 4. Metrics Grid
    // Humidity
    const humidity = current.humidity;
    document.getElementById('humidityVal').textContent = humidity;
    document.getElementById('humidityProgress').style.width = `${Math.min(100, Math.max(0, humidity))}%`;
    const humStatus = document.getElementById('humidityStatus');
    if (humidity < 30) {
        humStatus.textContent = 'Dry';
    } else if (humidity <= 60) {
        humStatus.textContent = 'Comfortable';
    } else {
        humStatus.textContent = 'Humid';
    }

    // Wind Speed & Direction
    document.getElementById('windSpeedVal').textContent = toDisplaySpeed(current.wind_speed);
    document.getElementById('windSpeedUnit').textContent = currentUnit === 'F' ? 'mph' : 'km/h';
    document.getElementById('windDirectionText').textContent = `Direction: ${current.wind_direction}°`;
    const compass = document.getElementById('windDirectionIcon');
    if (compass) {
        // Wind direction rotates arrow (pointing toward the wind travel direction)
        compass.style.transform = `rotate(${current.wind_direction}deg)`;
    }

    // UV Index
    const uvVal = current.uv_index !== null && current.uv_index !== undefined ? current.uv_index : 0;
    document.getElementById('uvIndexVal').textContent = uvVal.toFixed(1);
    const uvBadge = document.getElementById('uvRiskBadge');
    const uvAdvice = document.getElementById('uvAdviceText');
    if (uvVal <= 2) {
        uvBadge.textContent = 'Low';
        uvBadge.style.color = 'var(--accent-green)';
        uvAdvice.textContent = 'No protection required';
    } else if (uvVal <= 5) {
        uvBadge.textContent = 'Moderate';
        uvBadge.style.color = 'var(--accent-yellow)';
        uvAdvice.textContent = 'Wear sunglasses on bright days';
    } else if (uvVal <= 7) {
        uvBadge.textContent = 'High';
        uvBadge.style.color = 'var(--accent-amber)';
        uvAdvice.textContent = 'Protection required: hat & sunscreen';
    } else if (uvVal <= 10) {
        uvBadge.textContent = 'Very High';
        uvBadge.style.color = 'var(--accent-red)';
        uvAdvice.textContent = 'Extra precautions: seek shade';
    } else {
        uvBadge.textContent = 'Extreme';
        uvBadge.style.color = '#ef4444';
        uvAdvice.textContent = 'Avoid sun during midday hours';
    }

    // Pressure
    document.getElementById('pressureVal').textContent = current.pressure;

    // Sun Schedule
    if (current.sunrise) {
        document.getElementById('sunriseTime').textContent = formatTimeOnly(current.sunrise);
    }
    if (current.sunset) {
        document.getElementById('sunsetTime').textContent = formatTimeOnly(current.sunset);
    }

    // Precipitation
    document.getElementById('precipVal').textContent = current.precipitation;
    const precipChance = todayDaily ? todayDaily.precip_max : 0;
    document.getElementById('precipProbability').textContent = `Chance: ${precipChance}%`;

    // 5. Render Hourly Timeline & Chart
    renderHourlyTimeline();
    renderHourlyChart();

    // 6. Render 7-Day Extended Forecast
    renderDailyForecast();
}

// Update Dynamic Theme on Body
function updateTheme(category, isDay) {
    document.body.className = '';
    if (isDay === 0) {
        document.body.classList.add('theme-clear-night');
        return;
    }

    switch (category) {
        case 'clear':
            document.body.classList.add('theme-clear-day');
            break;
        case 'cloudy':
        case 'fog':
            document.body.classList.add('theme-cloudy');
            break;
        case 'rain':
            document.body.classList.add('theme-rain');
            break;
        case 'snow':
            document.body.classList.add('theme-snow');
            break;
        case 'thunder':
            document.body.classList.add('theme-thunder');
            break;
        default:
            document.body.classList.add('theme-clear-day');
    }
}

// Render 24-Hour Horizontal Cards
function renderHourlyTimeline() {
    const track = document.getElementById('hourlyTrack');
    track.innerHTML = '';

    if (!weatherData.hourly || weatherData.hourly.length === 0) {
        track.innerHTML = '<p class="text-secondary">No hourly data available.</p>';
        return;
    }

    weatherData.hourly.forEach((hour, idx) => {
        const item = document.createElement('div');
        item.className = 'hourly-item';

        const timeLabel = idx === 0 ? 'Now' : formatTimeOnly(hour.time);
        const iconCls = ICON_MAP[hour.icon] || 'fa-cloud';

        item.innerHTML = `
            <span class="hourly-time">${timeLabel}</span>
            <i class="fa-solid ${iconCls} hourly-icon"></i>
            <span class="hourly-temp">${toDisplayTemp(hour.temp)}°</span>
            <span class="hourly-precip">
                <i class="fa-solid fa-droplet"></i> ${hour.precipitation_probability}%
            </span>
        `;
        track.appendChild(item);
    });
}

// Render Interactive 24-Hour Temperature Curve with Chart.js
function renderHourlyChart() {
    const canvas = document.getElementById('tempChart');
    if (!canvas || !weatherData.hourly) return;

    const ctx = canvas.getContext('2d');
    const labels = weatherData.hourly.map((h, idx) => idx === 0 ? 'Now' : formatTimeOnly(h.time));
    const temps = weatherData.hourly.map(h => toDisplayTemp(h.temp));

    if (tempChart) {
        tempChart.destroy();
    }

    // Chart.js gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temperature (°${currentUnit})`,
                data: temps,
                borderColor: '#38bdf8',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#38bdf8',
                pointHoverRadius: 6,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#38bdf8',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (context) => `Temp: ${context.parsed.y}°${currentUnit}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        callback: (value) => `${value}°`
                    }
                }
            }
        }
    });
}

// Render 7-Day Extended Forecast List
function renderDailyForecast() {
    const list = document.getElementById('dailyList');
    list.innerHTML = '';

    if (!weatherData.daily || weatherData.daily.length === 0) {
        list.innerHTML = '<p class="text-secondary">No daily forecast available.</p>';
        return;
    }

    weatherData.daily.forEach((day, idx) => {
        const row = document.createElement('div');
        row.className = 'daily-row';

        const dayName = getDayLabel(day.date, idx);
        const dateSub = formatDateDisplay(day.date);
        const iconCls = ICON_MAP[day.icon] || 'fa-cloud';

        row.innerHTML = `
            <div>
                <p class="daily-day">${dayName}</p>
                <p class="daily-date">${dateSub}</p>
            </div>
            <div class="daily-icon">
                <i class="fa-solid ${iconCls}"></i>
            </div>
            <div class="daily-desc">${day.description}</div>
            <div class="daily-temp-bar-wrap">
                <span class="daily-min">${toDisplayTemp(day.temp_min)}°</span>
                <div class="temp-bar-bg">
                    <div class="temp-bar-fill" style="width: 75%;"></div>
                </div>
                <span class="daily-max">${toDisplayTemp(day.temp_max)}°</span>
            </div>
        `;
        list.appendChild(row);
    });
}

// Search Autocomplete
cityInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearSearchBtn.style.display = query ? 'block' : 'none';

    clearTimeout(searchDebounceTimer);
    if (query.length < 2) {
        suggestionsList.classList.add('hidden');
        suggestionsList.innerHTML = '';
        return;
    }

    searchDebounceTimer = setTimeout(async () => {
        try {
            const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!resp.ok) return;
            const results = await resp.json();

            if (results && results.length > 0) {
                suggestionsList.innerHTML = '';
                results.forEach(loc => {
                    const li = document.createElement('li');
                    const parts = [loc.name];
                    if (loc.admin1) parts.push(loc.admin1);
                    if (loc.country) parts.push(loc.country);
                    const fullText = parts.join(', ');

                    li.innerHTML = `<i class="fa-solid fa-location-dot"></i> <span>${fullText}</span>`;
                    li.addEventListener('click', () => {
                        cityInput.value = loc.name;
                        suggestionsList.classList.add('hidden');
                        fetchWeather(fullText, loc.latitude, loc.longitude);
                    });
                    suggestionsList.appendChild(li);
                });
                suggestionsList.classList.remove('hidden');
            } else {
                suggestionsList.classList.add('hidden');
            }
        } catch (err) {
            console.error('Search error:', err);
        }
    }, 280);
});

// Hide suggestions on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        suggestionsList.classList.add('hidden');
    }
});

// Search on Enter key
cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        suggestionsList.classList.add('hidden');
        const q = cityInput.value.trim();
        if (q) fetchWeather(q);
    }
});

// Search button click
searchBtn.addEventListener('click', () => {
    suggestionsList.classList.add('hidden');
    const q = cityInput.value.trim();
    if (q) fetchWeather(q);
});

// Clear Search Input
clearSearchBtn.addEventListener('click', () => {
    cityInput.value = '';
    clearSearchBtn.style.display = 'none';
    suggestionsList.classList.add('hidden');
    cityInput.focus();
});

// Unit Toggles (°C / °F)
unitCelsius.addEventListener('click', () => {
    if (currentUnit === 'C') return;
    currentUnit = 'C';
    unitCelsius.classList.add('active');
    unitFahrenheit.classList.remove('active');
    renderWeather();
});

unitFahrenheit.addEventListener('click', () => {
    if (currentUnit === 'F') return;
    currentUnit = 'F';
    unitFahrenheit.classList.add('active');
    unitCelsius.classList.remove('active');
    renderWeather();
});

// Geolocation (Current Location Button)
locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
    }

    locationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating...';
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            locationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> <span class="btn-text">My Location</span>';
            fetchWeather('My Location', pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
            locationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> <span class="btn-text">My Location</span>';
            showError('Unable to retrieve your location. Please check browser permissions or search by city name.');
        },
        { timeout: 10000 }
    );
});

// Quick City Pills
document.querySelectorAll('.city-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.city-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        fetchWeather(pill.dataset.city);
    });
});

// View Toggle between Hourly Timeline and Hourly Chart
const hourlyCardsBtn = document.getElementById('hourlyCardsBtn');
const hourlyChartBtn = document.getElementById('hourlyChartBtn');
const hourlyCardsView = document.getElementById('hourlyCardsView');
const hourlyChartView = document.getElementById('hourlyChartView');

hourlyCardsBtn.addEventListener('click', () => {
    hourlyCardsBtn.classList.add('active');
    hourlyChartBtn.classList.remove('active');
    hourlyCardsView.classList.remove('hidden');
    hourlyChartView.classList.add('hidden');
});

hourlyChartBtn.addEventListener('click', () => {
    hourlyChartBtn.classList.add('active');
    hourlyCardsBtn.classList.remove('active');
    hourlyChartView.classList.remove('hidden');
    hourlyCardsView.classList.add('hidden');
    // Trigger chart redraw to calculate proper dimensions
    if (tempChart) tempChart.resize();
});

// Error handling helpers
function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
}

function hideError() {
    errorBanner.classList.add('hidden');
}

closeErrorBtn.addEventListener('click', hideError);

function showLoading(isLoading) {
    if (isLoading) {
        loadingOverlay.style.display = 'flex';
        dashboardGrid.style.opacity = '0.35';
        dashboardGrid.style.pointerEvents = 'none';
    } else {
        loadingOverlay.style.display = 'none';
        dashboardGrid.style.opacity = '1';
        dashboardGrid.style.pointerEvents = 'auto';
    }
}

// Initial Starter Weather Query (Loads on Page Start)
document.addEventListener('DOMContentLoaded', () => {
    fetchWeather('New Delhi');
});

