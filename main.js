const API_KEY = 'd6a504cab9bca2537932675bfcb5a611';

const elements = {
  cityInput: document.getElementById("cityInput"),
  searchBtn: document.getElementById("searchBtn"),
  locateBtn: document.getElementById("locateBtn"),
  weatherCard: document.getElementById("weatherCard"),
  loader: document.getElementById("loader"),
  error: document.getElementById("error"),
  cityName: document.getElementById("cityName"),
  weatherIcon: document.getElementById("weatherIcon"),
  description: document.getElementById("description"),
  temp: document.getElementById("temp"),
  feels_like: document.getElementById("feels_like"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  navbar: document.querySelector(".navbar")
};

let searchTimeout;

elements.searchBtn.addEventListener("click", () => {
  const city = elements.cityInput.value.trim();
  if (city) {
    getWeatherByCity(city);
    saveRecentSearch(city);
  }
});

elements.cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = elements.cityInput.value.trim();
    if (city) {
      getWeatherByCity(city);
      saveRecentSearch(city);
    }
  }
});

elements.cityInput.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  const value = e.target.value.trim();
  elements.error.textContent = "";
  if (value.length > 0 && !/^[a-zA-Z\s\-']+$/.test(value)) {
    elements.cityInput.style.borderColor = "rgba(255, 107, 107, 0.5)";
  } else {
    elements.cityInput.style.borderColor = "";
  }
});

elements.locateBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    elements.locateBtn.innerHTML = "⏳";
    elements.locateBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        elements.locateBtn.innerHTML = "📍";
        elements.locateBtn.disabled = false;
      },
      (error) => {
        let errorMessage = "Location access denied.";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access was denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        showError(errorMessage);
        elements.locateBtn.innerHTML = "📍";
        elements.locateBtn.disabled = false;
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  } else {
    showError("Geolocation is not supported by this browser.");
  }
});

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    elements.navbar.classList.add("scrolled");
  } else {
    elements.navbar.classList.remove("scrolled");
  }
});

async function getWeatherByCity(city) {
  if (!city) return showError("Please enter a city name.");
  if (city.length < 2) {
    return showError("City name must be at least 2 characters long.");
  }
  if (!/^[a-zA-Z\s\-']+$/.test(city)) {
    return showError("Please enter a valid city name (letters only).");
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  await fetchWeather(url);
}

async function getWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  await fetchWeather(url);
}

async function fetchWeather(url) {
  try {
    elements.error.textContent = "";
    elements.weatherCard.classList.add("hidden");
    elements.loader.classList.remove("hidden");
    elements.searchBtn.disabled = true;
    elements.locateBtn.disabled = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.main || !data.weather || !data.weather[0]) {
      throw new Error("Invalid weather data received");
    }
    displayWeather(data);
  } catch (error) {
    let errorMessage = "Unable to fetch weather data.";
    if (error.name === 'AbortError') {
      errorMessage = "Request timed out. Please try again.";
    } else if (error.message.includes('not found')) {
      errorMessage = "City not found. Please check the spelling and try again.";
    } else if (error.message.includes('network')) {
      errorMessage = "Network error. Please check your connection and try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    showError(errorMessage);
  } finally {
    elements.searchBtn.disabled = false;
    elements.locateBtn.disabled = false;
    elements.loader.classList.add("hidden");
  }
}

function displayWeather(data) {
  try {
    const {
      name,
      main: { temp, feels_like, humidity },
      weather,
      wind,
      sys: { sunrise, sunset },
      timezone
    } = data;
    elements.cityName.textContent = name;
    elements.temp.textContent = Math.round(temp);
    elements.feels_like.textContent = Math.round(feels_like);
    elements.humidity.textContent = humidity;
    elements.wind.textContent = wind?.speed ? (wind.speed * 3.6).toFixed(1) : 'N/A';
    const iconCode = weather[0]?.icon || '01d';
    elements.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    elements.weatherIcon.onerror = () => {
      elements.weatherIcon.src = `https://openweathermap.org/img/wn/01d@2x.png`;
    };
    elements.description.textContent = weather[0]?.description || 'Clear sky';
    elements.sunrise.textContent = formatTime(sunrise, timezone);
    elements.sunset.textContent = formatTime(sunset, timezone);
    elements.weatherCard.classList.remove("hidden");
    elements.cityInput.style.borderColor = "rgba(81, 207, 102, 0.5)";
    setTimeout(() => {
      elements.cityInput.style.borderColor = "";
    }, 2000);
  } catch (error) {
    showError("Error displaying weather data.");
  }
}

function showError(message) {
  elements.error.textContent = message;
  elements.weatherCard.classList.add("hidden");
  elements.loader.classList.add("hidden");
  elements.cityInput.style.borderColor = "rgba(255, 107, 107, 0.5)";
  setTimeout(() => {
    elements.cityInput.style.borderColor = "";
  }, 3000);
}

function formatTime(timestamp, timezoneOffset = 0) {
  try {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    return date.toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  } catch (error) {
    return 'N/A';
  }
}

let recentSearches = [];

function saveRecentSearch(city) {
  const cityLower = city.toLowerCase();
  recentSearches = recentSearches.filter(search => search.toLowerCase() !== cityLower);
  recentSearches.unshift(city);
  recentSearches = recentSearches.slice(0, 5);
}

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
    e.preventDefault();
    elements.locateBtn.click();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    elements.cityInput.focus();
  }
  if (e.key === 'Escape') {
    elements.cityInput.value = '';
    elements.cityInput.focus();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  elements.cityInput.focus();
  elements.searchBtn.classList.add("pulse");
  setTimeout(() => {
    elements.searchBtn.classList.remove("pulse");
  }, 3000);
});

const popularCities = [
  'London', 'New York', 'Tokyo', 'Paris', 'Sydney', 'Berlin', 'Rome', 'Barcelona',
  'Amsterdam', 'Dubai', 'Singapore', 'Hong Kong', 'Los Angeles', 'San Francisco'
];

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

window.addEventListener('online', () => {
  if (elements.error.textContent.includes('network') || elements.error.textContent.includes('connection')) {
    elements.error.textContent = '';
    showSuccess('Connection restored!');
  }
});

window.addEventListener('offline', () => {
  showError('No internet connection. Please check your network.');
});

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success-color);
    color: white;
    padding: 1rem 2rem;
    border-radius: 10px;
    z-index: 1000;
    animation: slideInRight 0.5s ease;
  `;
  document.body.appendChild(successDiv);
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}