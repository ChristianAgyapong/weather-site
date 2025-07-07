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
};

elements.searchBtn.addEventListener("click", () => getWeatherByCity(elements.cityInput.value.trim()));
elements.cityInput.addEventListener("keypress", e => { if (e.key === "Enter") getWeatherByCity(elements.cityInput.value.trim()); });
elements.locateBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => showError("Location access denied.")
    );
  } else {
    showError("Geolocation not supported.");
  }
});

function getWeatherByCity(city) {
  if (!city) return showError("Please enter a city name.");
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
  fetchWeather(url);
}

function getWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  fetchWeather(url);
}

async function fetchWeather(url) {
  elements.error.textContent = "";
  elements.weatherCard.classList.add("hidden");
  elements.loader.classList.remove("hidden");

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const { name, main: { temp, feels_like, humidity }, weather, wind, sys: { sunrise, sunset}, timezone } = data;

    elements.cityName.textContent = name;
    elements.temp.textContent = temp;
    elements.feels_like.textContent = feels_like;
    elements.humidity.textContent = humidity;
    elements.wind.textContent = (wind.speed * 3.6).toFixed(1);
    elements.weatherIcon.src = `http://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
    elements.description.textContent = weather[0].main;
    elements.sunrise.textContent = formatTime(sunrise, timezone);
    elements.sunset.textContent = formatTime(sunset, timezone);

    elements.weatherCard.classList.remove("hidden");
  } catch (err) {
    showError(err.message);
  } finally {
    elements.loader.classList.add("hidden");
  }
}

function showError(msg) {
  elements.error.textContent = msg;
  elements.loader.classList.add("hidden");
}

function formatTime(timestamp, tzOffset = 0) {
  const dt = new Date((timestamp + tzOffset) * 1000);
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
