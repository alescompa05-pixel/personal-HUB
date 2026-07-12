document.addEventListener('DOMContentLoaded', () => {
    const weatherPillIcon = document.getElementById('weather-pill-icon');
    const weatherPillText = document.getElementById('weather-pill-text');
    const weatherSearchInput = document.getElementById('weather-search-input');
    const btnWeatherSearch = document.getElementById('btn-weather-search');
    const weatherSearchError = document.getElementById('weather-search-error');

    // Elementi Dettaglio Modal
    const weatherDetailIcon = document.getElementById('weather-detail-icon');
    const weatherDetailTemp = document.getElementById('weather-detail-temp');
    const weatherDetailDesc = document.getElementById('weather-detail-desc');
    const weatherDetailCity = document.getElementById('weather-detail-city');
    const weatherDetailPercepita = document.getElementById('weather-detail-percepita');
    const weatherDetailUmidita = document.getElementById('weather-detail-umidita');
    const weatherDetailVento = document.getElementById('weather-detail-vento');
    const weatherDetailUv = document.getElementById('weather-detail-uv');

    // Previsioni Orarie Modal
    const forecastElements = [
        { time: document.getElementById('forecast-time-1'), icon: document.getElementById('forecast-icon-1'), temp: document.getElementById('forecast-temp-1') },
        { time: document.getElementById('forecast-time-2'), icon: document.getElementById('forecast-icon-2'), temp: document.getElementById('forecast-temp-2') },
        { time: document.getElementById('forecast-time-3'), icon: document.getElementById('forecast-icon-3'), temp: document.getElementById('forecast-temp-3') },
        { time: document.getElementById('forecast-time-4'), icon: document.getElementById('forecast-icon-4'), temp: document.getElementById('forecast-temp-4') }
    ];

    // Mappatura WMO Weather interpretation codes (WW)
    const wmoInterpretation = {
        0: { desc: 'Sereno', emoji: '☀️' },
        1: { desc: 'Preval. Sereno', emoji: '🌤️' },
        2: { desc: 'Parzialm. Nuvoloso', emoji: '⛅' },
        3: { desc: 'Coperto', emoji: '☁️' },
        45: { desc: 'Nebbia', emoji: '🌫️' },
        48: { desc: 'Nebbia Brinata', emoji: '🌫️' },
        51: { desc: 'Pioggerella Leggera', emoji: '🌦️' },
        53: { desc: 'Pioggerella Moderata', emoji: '🌦️' },
        55: { desc: 'Pioggerella Densa', emoji: '🌦️' },
        56: { desc: 'Pioggerella Gelata', emoji: '❄️🌦️' },
        57: { desc: 'Pioggerella Gelata Densa', emoji: '❄️🌦️' },
        61: { desc: 'Pioggia Leggera', emoji: '🌧️' },
        63: { desc: 'Pioggia Moderata', emoji: '🌧️' },
        65: { desc: 'Pioggia Forte', emoji: '🌧️' },
        66: { desc: 'Pioggia Gelata Leggera', emoji: '❄️🌧️' },
        67: { desc: 'Pioggia Gelata Forte', emoji: '❄️🌧️' },
        71: { desc: 'Neve Leggera', emoji: '🌨️' },
        73: { desc: 'Neve Moderata', emoji: '🌨️' },
        75: { desc: 'Neve Forte', emoji: '🌨️' },
        77: { desc: 'Granelli di Neve', emoji: '🌨️' },
        80: { desc: 'Rovesci Leggeri', emoji: '🌧️' },
        81: { desc: 'Rovesci Moderati', emoji: '🌧️' },
        82: { desc: 'Rovesci Violenti', emoji: '🌧️' },
        85: { desc: 'Rovesci di Neve Leggeri', emoji: '🌨️' },
        86: { desc: 'Rovesci di Neve Forti', emoji: '🌨️' },
        95: { desc: 'Temporale', emoji: '⛈️' },
        96: { desc: 'Temporale con Grandine', emoji: '⛈️' },
        99: { desc: 'Temporale Forte con Grandine', emoji: '⛈️' }
    };

    function getWeatherInfo(code) {
        return wmoInterpretation[code] || { desc: 'Variabile', emoji: '🌤️' };
    }

    // Carica il meteo per una località (Cerca coordinate -> Fetch meteo)
    async function loadWeatherForCity(cityName) {
        if (!cityName) return;
        
        try {
            if (weatherSearchError) weatherSearchError.style.display = 'none';
            
            // 1. Risolvi coordinate geografiche tramite Geocoding API di Open-Meteo
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=it&format=json`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                throw new Error(`Città "${cityName}" non trovata`);
            }

            const location = geoData.results[0];
            const lat = location.latitude;
            const lon = location.longitude;
            
            // Ricostruisci il nome visualizzato (Città, Regione/Stato)
            const resolvedName = [
                location.name,
                location.admin1,
                location.country
            ].filter(Boolean).join(', ');

            // 2. Richiedi dati meteo correnti e orari a Open-Meteo
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=1`;
            const weatherRes = await fetch(weatherUrl);
            const weatherData = await weatherRes.json();

            if (!weatherData.current) {
                throw new Error("Impossibile recuperare i dati meteo");
            }

            // Salva città corrente in LocalStorage
            localStorage.setItem('hub-weather-city', location.name);

            // Aggiorna l'interfaccia meteo
            updateWeatherUI(resolvedName, weatherData);

        } catch (error) {
            console.error("Errore meteo:", error.message);
            if (weatherSearchError) {
                weatherSearchError.textContent = error.message;
                weatherSearchError.style.display = 'block';
            }
        }
    }

    // Aggiorna tutti gli elementi della UI con i dati meteo caricati
    function updateWeatherUI(cityName, data) {
        const current = data.current;
        const info = getWeatherInfo(current.weather_code);
        const tempRounded = Math.round(current.temperature_2m);
        const feelsLikeRounded = Math.round(current.apparent_temperature);

        // Salva variabili globali per integrazione con settings.js
        window.currentTempC = tempRounded;
        window.currentWeatherDesc = info.desc;
        window.currentWeatherEmoji = info.emoji;

        // Leggi unità dalle preferenze
        const unit = localStorage.getItem('hub-unit') || 'C';

        let displayTemp = `${tempRounded}°C`;
        let displayFeelsLike = `${feelsLikeRounded}°C`;

        if (unit === 'F') {
            const tempF = Math.round((tempRounded * 9/5) + 32);
            const feelsF = Math.round((feelsLikeRounded * 9/5) + 32);
            displayTemp = `${tempF}°F`;
            displayFeelsLike = `${feelsF}°F`;
        }

        // 1. Dashboard Weather Pill
        if (weatherPillIcon) weatherPillIcon.textContent = info.emoji;
        if (weatherPillText) weatherPillText.textContent = `${displayTemp} ${info.desc}`;

        // 2. Weather Details Modal (Now Card)
        if (weatherDetailIcon) weatherDetailIcon.textContent = info.emoji;
        if (weatherDetailTemp) weatherDetailTemp.textContent = displayTemp;
        if (weatherDetailDesc) weatherDetailDesc.textContent = info.desc;
        if (weatherDetailCity) weatherDetailCity.textContent = cityName;

        // 3. Grid Metriche Dettagliate
        if (weatherDetailPercepita) weatherDetailPercepita.textContent = displayFeelsLike;
        if (weatherDetailUmidita) weatherDetailUmidita.textContent = `${Math.round(current.relative_humidity_2m)}%`;
        if (weatherDetailVento) weatherDetailVento.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
        
        // Calcolo indice UV fittizio basato su codice meteo (Open-Meteo richiede query extra per UV reale)
        let uvLabel = "0 (Basso)";
        if (current.weather_code === 0) uvLabel = "7 (Alto)";
        else if (current.weather_code < 3) uvLabel = "5 (Medio)";
        else if (current.weather_code < 50) uvLabel = "3 (Moderato)";
        else uvLabel = "1 (Basso)";
        if (weatherDetailUv) weatherDetailUv.textContent = uvLabel;

        // 4. Previsioni Orarie (Prendiamo ore di riferimento: 09:00, 13:00, 17:00, 21:00)
        if (data.hourly && data.hourly.time) {
            const hoursToFind = [9, 13, 17, 21];
            
            hoursToFind.forEach((targetHour, index) => {
                // Trova l'indice della timeline oraria corrispondente
                const idx = data.hourly.time.findIndex(t => {
                    const dateObj = new Date(t);
                    return dateObj.getHours() === targetHour;
                });

                const el = forecastElements[index];
                if (el && idx !== -1) {
                    const tempC = Math.round(data.hourly.temperature_2m[idx]);
                    let tempFormatted = `${tempC}°C`;
                    if (unit === 'F') {
                        const tempF = Math.round((tempC * 9/5) + 32);
                        tempFormatted = `${tempF}°F`;
                    }
                    const code = data.hourly.weather_code[idx];
                    const hourInfo = getWeatherInfo(code);

                    if (el.time) el.time.textContent = `${targetHour.toString().padStart(2, '0')}:00`;
                    if (el.icon) el.icon.textContent = hourInfo.emoji;
                    if (el.temp) el.temp.textContent = tempFormatted;
                }
            });
        }
    }

    // Configura i listener di ricerca città
    if (btnWeatherSearch && weatherSearchInput) {
        btnWeatherSearch.addEventListener('click', () => {
            const city = weatherSearchInput.value.trim();
            if (city) {
                loadWeatherForCity(city);
            }
        });

        weatherSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = weatherSearchInput.value.trim();
                if (city) {
                    loadWeatherForCity(city);
                }
            }
        });
    }

    // Espone globalmente la funzione per sincronizzazione con cambio impostazioni unità
    window.loadWeatherForCity = loadWeatherForCity;

    // Avvio Iniziale: recupera l'ultima città memorizzata o usa Milano come default
    const savedCity = localStorage.getItem('hub-weather-city') || 'Milano';
    loadWeatherForCity(savedCity);
});
