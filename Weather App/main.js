const API_Key = "41072b4fd285388735c295e54a1c0977";
const DAYS_OF_THE_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

let selectedCityproperty;
let selectedCityText;
//gettingcitiesusinggeolocation

const getCitiesUsingGeoLocations = async(searchText) => {
    const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${API_Key}`)
    return response.json();
}


// fetching the information from the api key
const getCurrentWeatherData = async ({ lat, lon, name: city}) => {
    const url = lat && lon ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_Key}&units=metric`:`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_Key}&units=metric`
    const response = await fetch(url)
    return response.json();
}


//fetching hourly forecast
const getHourlyForecast = async ({ name: city }) => {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_Key}&units=metric`);
    const data = await response.json();
    return data.list.map(forecast => {
        const { main: { temp, temp_max, temp_min, }, dt, dt_txt, weather: [{ description, icon }] } = forecast;
        return { temp, temp_max, temp_min, dt, dt_txt, description, icon }
    })
}

//formatting temperature
function formatTemperature(temp) {
    return `${temp?.toFixed(0)}`;
}

//url for icon
const creatUrlForIcon = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

// setting information which we are fetching from api key
const loadCurrentForecast = ({ name, main: { temp, temp_max, temp_min }, weather: [{ description }]} ) => {
    const currentForecastElement = document.querySelector("#current_forecast");
    currentForecastElement.querySelector(".city").textContent = name;
    currentForecastElement.querySelector(".temp").textContent =     `${formatTemperature(temp)}°C`;
    currentForecastElement.querySelector(".description").textContent = description;
    currentForecastElement.querySelector(".min-max-temp").textContent = `Hi: ${formatTemperature(temp_max)}°C   L: ${formatTemperature(temp_min)}°C`;

    //     <h1 class="city">City Name</h1>
    //     <p class="temp">Temp</p>
    //     <p class="description">Description</p>
    //     <p class="min-max-temp">High Low</p>
}

//setting hourly forecast
const loadHourlyForecast = ({main:{temp: tempNow}, weather: [{ icon: iconNow}]},hourlyForecast )=> {
    const timeFormatter = Intl.DateTimeFormat("en", {hour12: true, hour: "numeric"})
    const datefor12hours = hourlyForecast.slice(2, 14);
    const hourlyContainer = document.querySelector(".hourly-container");
    let innerHTMlString = `<article>
                        <h3 class="time">Now</h3>
                        <img class="hourly-icon" src= "${creatUrlForIcon(iconNow)}"/>
                        <p class="hourly-temp">${formatTemperature(tempNow)}°C</p>
                        </article>`;
    for (let { temp, dt_txt, icon } of datefor12hours) {
        innerHTMlString += `<article>
        <h3 class="time">${timeFormatter.format(new Date(dt_txt))}</h3>
        <img class="hourly-icon" src= "${creatUrlForIcon(icon)}"/>
        <p class="hourly-temp">${formatTemperature(temp)}°C</p>
        </article>`
    }
    hourlyContainer.innerHTML = innerHTMlString
}

//calculating days

const calculateDayWiseForecast = (hourlyForecast) => {
    let dayWiseForecast = new Map();
    for (let forecast of hourlyForecast) {
        const [date] = forecast.dt_txt.split(" ");
        const dayOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()];
        console.log(dayOfTheWeek);
        if (dayWiseForecast.has(dayOfTheWeek)) {
            let forecastForTheDay = dayWiseForecast.get(dayOfTheWeek);
            forecastForTheDay.push(forecast);
            dayWiseForecast.set(dayOfTheWeek, forecastForTheDay);
        }
        else {
            dayWiseForecast.set(dayOfTheWeek, [forecast]);
        }
    }
    console.log(dayWiseForecast);
    for (let [key, value] of dayWiseForecast) {
        let temp_min = Math.min(...Array.from(value, val => val.temp_min));
        let temp_max = Math.max(...Array.from(value, val => val.temp_max));

        dayWiseForecast.set(key, { temp_min, temp_max, icon: value.find(v => v.icon).icon });
    }
    return dayWiseForecast;
}
//setting five days forecast 

const loadFiveDayForecast = (hourlyForecast) => {
    const dayWiseForecast = calculateDayWiseForecast(hourlyForecast);
    const container = document.querySelector(".five-days-forecast-container");
    let daywiseInfo = "";

    Array.from(dayWiseForecast).map(([day, { temp_max, temp_min, icon }], index) => {
        if(index < 5){
            daywiseInfo += `<article class="forecast-container">
            <h3 class= "forecast-day">${index === 0 ? "Today": day}</h3>
            <img src="${creatUrlForIcon(icon)}" alt="" class="forecast-icon">
            <p class="min-temp">${formatTemperature(temp_min)}°C</p>
            <p class="max-temp">${formatTemperature(temp_max)}°C</p>
            </article>`
        }
    })
    container.innerHTML = daywiseInfo;
}
//setting feels like property 

const loadFeelLikeForecast = ({ main: { feels_like } }) => {
    const feelLikeTemp = document.querySelector(".feel_like");
    feelLikeTemp.textContent = `${formatTemperature(feels_like)}°C`;
}

//setting humidity value

const loadHumidity = ({ main: { humidity } }) => {
    const humidityValue = document.querySelector(".humidity_value");
    humidityValue.textContent = `${humidity}%`
}
// loading data using browser geolocation
const loadForecastUsingGeolocation = () =>{
    navigator.geolocation.getCurrentPosition(({coords})=>{
        const {latitude: lat, longitude: lon} = coords;
        selectedCityproperty = {lat,lon};
        loadData();
    }, error=> console.log(error))
}


//  const loadForecastUsingGeolocation = () =>{
//      navigator.geolocation.getCurrentPosition((coords)=>{
//      const {latitude: lat, longitude: lon} = coords;
//      selectedCityproperty = {lat,lon};
//      loadData();
//      }, error=> console.log(error))
//  }

//load forecast using search functionality
const loadData = async () =>{
    const currentWeather = await getCurrentWeatherData(selectedCityproperty);
    loadCurrentForecast(currentWeather);
    const hourlyForecast = await getHourlyForecast(currentWeather);
    loadHourlyForecast(currentWeather,hourlyForecast);
    loadFiveDayForecast(hourlyForecast);
    loadFeelLikeForecast(currentWeather);
    loadHumidity(currentWeather);
}

 //debounce function: waiting for compliting typing

function debounce(func){
    let timeOutId; 
     
    return (...args) => {
        clearTimeout(timeOutId); //clearing existing timeout
        //create a new time out till the user is pressing the key
        // console.log("debounced")
        timeOutId = setTimeout(() => {
            func.apply(this, args);
        }, 500)
    }
}

//getting location using city name 

const handleCitySelection = (event) => {
    selectedCityText = event.target.value;
    let options = document.querySelectorAll("#cities > option");
    console.log(options);
    if(options?.length){ 
        let selectedOption = Array.from(options).find(opt => opt.value === selectedCityText);
        selectedCityproperty = JSON.parse(selectedOption.getAttribute("data-city-details"));
        console.log(selectedCityproperty);
    }
    loadData();
}

const onSearchChange =  async (event) => {
    let { value } = event.target;
    if(!value){
        selectedCityproperty = null;
        selectedCityText = "";
    }
    if(value && selectedCityText!==value){
        const listOfCities = await getCitiesUsingGeoLocations(value);
        let options = "";
        for(let { lat, lon, name, state, country } of listOfCities){
            options += `<option data-city-details='${JSON.stringify({lat, lon, name})}' value="${name}, ${state}, ${country}"></option>`
        }
        document.querySelector("#cities").innerHTML = options;
        console.log(listOfCities);
    }   
}

//getting multiple value

const debounceSearch = debounce((event) => onSearchChange(event))
//Dom content loaded

document.addEventListener("DOMContentLoaded", async () => {
    loadForecastUsingGeolocation();
    const searchInput = document.querySelector("#search");
    searchInput.addEventListener("input", debounceSearch)
    searchInput.addEventListener("change", handleCitySelection);
 
})