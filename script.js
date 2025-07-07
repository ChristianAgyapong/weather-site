const API_KEY = 'd6a504cab9bca2537932675bfcb5a611'; // Replace with your OpenWeatherMap API key

async function getWeather() {
  const city = document.getElementById("cityInput").value;
  const weatherInfo = document.getElementById("weatherInfo");

  if (!city) {
    weatherInfo.innerHTML = `<p>Please enter a city name.</p>`;
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("City not found");

    const data = await response.json();
    const { name, main, weather } = data;

    weatherInfo.innerHTML = `
      <h2>${name}</h2>
      <p>Temperature: ${main.temp}°C</p>
      <p>Condition: ${weather[0].main}</p>
      <img src="http://openweathermap.org/img/wn/${weather[0].icon}@2x.png" alt="${weather[0].description}" />
    `;
  } catch (error) {
    weatherInfo.innerHTML = `<p>${error.message}</p>`;
  }
}
