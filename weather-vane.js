///////////////////////////////////////////////////////////////////////////////
// weather-vane.js ////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Criteria ///////////////////////////////////////////////////////////////////
// * Event Listeners - The weather-display is clickable; toggles F/C scale.
// * Classes - Weather class represents a single-hour weather report.
// * Timing - weatherUpdateInterval updates the given weather in intervals
//            of WEATHER_UPDATE_INTERVAL.
// * Fetch Requests - Data is fetched from weather.gov's API.
// * Local Storage - Stores a key-value recalling whether this user
//                   toggled the display to F or C in their last visit.
///////////////////////////////////////////////////////////////////////////////

const weatherDisplay = document.getElementById("weather-display");
const TACOMA_LATITUDE = 47.241389;
const TACOMA_LONGITUDE = -122.459444;
const WEATHER_UPDATE_INTERVAL = 300000;
let temperatureScaleIsFarenheit = true;
let weather;

// Weather ////////////////////////////////////////////////////////////////////
// Represents the weather conditions of a single hour, drawn from weather.gov.
class Weather {

    constructor(moment, forecastURL) {
        this.forecastURL = forecastURL;
        this.forecastDate = new Date();
        this.isDaytime = moment.isDaytime;
        this.temperature = moment.temperature;
        this.windSpeed = moment.windSpeed;
        this.weather = moment.shortForecast;
    }

    // updateWeather //////////////////////////////////////////////////////////
    // Updates this Weather's conditions, then logs a string with said updates.
    updateWeather = async () => {
        // Get updated weather using this weather's forecastURL.
        let updatedWeather = await getWeather(this.forecastURL);
        // Update Weather's values using the updated weather.
        await this.updateWeatherValues(updatedWeather);
        // Log updated Weather.
        let weatherString = this.weatherString();
        console.log(weatherString);
    }

    // updateWeatherValues ////////////////////////////////////////////////////
    // Updates this Weather's conditions.
    updateWeatherValues = async (updatedWeather) => {
        this.forecastDate = new Date();
        this.isDaytime = updatedWeather.isDaytime;
        this.temperature = updatedWeather.temperature;
        this.windSpeed = updatedWeather.windSpeed;
        this.weather = updatedWeather.weather;
    }

    // weatherString //////////////////////////////////////////////////////////
    // Returns a string representing the data of this Weather object.
    weatherString = () => {
        const string = 
        `// ${this.forecastDate} ////////////////////
        Weather: ${this.weather}
        Temperature: ${this.temperature}F
        Wind Speed: ${this.windSpeed}
        Daytime: ${this.isDaytime}`
        return string;
    }

    // getCelsius /////////////////////////////////////////////////////////////
    // Returns the celsius measurement of this Weather's temperature.
    getCelsius = () => {
        return Math.round((this.temperature - 32) * 0.55);
    }
}

// getWeatherURL //////////////////////////////////////////////////////////////
// Returns the weather.gov for the URL needed to capture the current weather in
// Tacoma.
const getWeatherURL = async () => {
    let weatherURL;
    const apiURL =
        `https://api.weather.gov/points/${TACOMA_LATITUDE},${TACOMA_LONGITUDE}`;
    await fetch(apiURL)
    .then((retrievedData) => {
        return retrievedData.json();
    })
    .then((jsonifiedData) => {
        weatherURL = jsonifiedData.properties.forecastHourly;
        return weatherURL;
    })
    .catch(() => {
        console.log("! ERROR: Failed to fetch weather.gov data. !");
    });
    return weatherURL;
}

// getWeather /////////////////////////////////////////////////////////////////
// Queries weather.gov for Tacoma's current weather, given the URL to its
// hourly forecast.
const getWeather = async (forecastURL) => {
    // let weather;
    await fetch(forecastURL)
    .then((retrievedData) => {
        return retrievedData.json();
    })
    .then((jsonifiedData) => {
        let now = jsonifiedData.properties.periods[0];
        weather = new Weather(now, forecastURL);
    })
    .catch(() => {
        console.log("! ERROR: Failed to fetch weather.gov data. !");
    })
    return weather;
}

// weatherUpdateInterval //////////////////////////////////////////////////////
// Sets the regularity with which the given Weather is updated.
const weatherUpdateInterval = () => {
    setInterval(async () => {
        console.log("Weather updating.");
        await weather.updateWeather();
        updateDisplay(weather);
    }, WEATHER_UPDATE_INTERVAL);
}

// updateDisplay //////////////////////////////////////////////////////////////
// Receives a Weather, and updates the weather-display with this Weather's
// values.
// weather-display becomes clickable, allowing F/C scale to be toggled.
const updateDisplay = async (weather) => {
    await fetchingDisplay();
    const pGreeting = document.createElement("p");
    pGreeting.innerText = `Greetings. It is...`;
    const pWeather = document.createElement("p");
    if (!temperatureScaleIsFarenheit) {
        pWeather.innerHTML = 
            `<span id="temperature">${weather.getCelsius()}&deg;C</span>
            / <span id="weather">${weather.weather}</span>`;
    } else {
        pWeather.innerHTML = 
            `<span id="temperature">${weather.temperature}&deg;F</span>
            / <span id="weather">${weather.weather}</span>`;
    }
    const pWinds = document.createElement("p");
    pWinds.innerHTML = 
        `with <span id="wind-speed">${weather.windSpeed}</span> winds`
    const pLocation = document.createElement("p");
    pLocation.innerText = `in Tacoma, WA.`
    await clearDisplay();
    weatherDisplay.appendChild(pGreeting);
    weatherDisplay.appendChild(pWeather);
    weatherDisplay.appendChild(pWinds);
    weatherDisplay.appendChild(pLocation);
    weatherDisplay.addEventListener("click", toggleTemperatureScale);
}

// clearDisplay ///////////////////////////////////////////////////////////////
// weather-display becomes unclickable and empty.
const clearDisplay = async () => {
    weatherDisplay.removeEventListener("click", toggleTemperatureScale);
    weatherDisplay.innerHTML = "";
}

// fetchingDisplay ////////////////////////////////////////////////////////////
// weather-display becomes unclickable and displays a loading message.
const fetchingDisplay = async () => {
    weatherDisplay.removeEventListener("click", toggleTemperatureScale);
    weatherDisplay.innerHTML = `<p>Fetching weather data...</p>`;
}

// toggleTemperatureScale /////////////////////////////////////////////////////
// Toggles the temperature scale used to display weather.
// Sets a local storage cookie to recall the user's preference.
const toggleTemperatureScale = () => {
    let convertedTemperature;
    let spanTemperature = document.getElementById("temperature");
    let temperature = spanTemperature.innerText.split("°")[0];
    if (temperatureScaleIsFarenheit) {
        temperatureScaleIsFarenheit = false;
        localStorage.setItem("temperatureScaleIsFarenheit", "false");
        convertedTemperature = weather.getCelsius();
        spanTemperature.innerText = `${convertedTemperature}°C`;
        console.log(`${temperature}°F ➟ ${convertedTemperature}°C`);
    } else {
        temperatureScaleIsFarenheit = true;
        localStorage.setItem("temperatureScaleIsFarenheit", "true");
        convertedTemperature = weather.temperature;
        spanTemperature.innerText = `${convertedTemperature}°F`;
        console.log(`${temperature}°C ➟ ${convertedTemperature}°F`);
    }
    console.log(`Temperature scale is farenheit: ${temperatureScaleIsFarenheit}`);
}

// displayWeather /////////////////////////////////////////////////////////////
// Fetches weather data, populates the weather-display, and initializes the
// interval between updates.
const displayWeather = async () => {
    await fetchingDisplay();
    const scale = localStorage.getItem("temperatureScaleIsFarenheit");
    const weatherURL = await getWeatherURL();
    console.log(`Retrieved weatherURL: ${weatherURL}`)
    weather = await getWeather(weatherURL);
    console.log(weather.weatherString());
    weatherUpdateInterval();
    if (scale) {
        console.log
            (`Local storage present. Temperature scale is farenheit: ${scale}`);
        if (scale == "false") {
            temperatureScaleIsFarenheit = false;
        } else {
            temperatureScaleIsFarenheit = true;
        }
    }
    updateDisplay(weather);
}

///////////////////////////////////////////////////////////////////////////////

displayWeather();