const Alexa = require('alexa-sdk');
const axios = require('axios');

let welcomeMessage = ''

const handlers = {
    'LaunchRequest': function() {
        this.emit(':ask', welcomeMessage);
    },

    'getWeather': async () => {
        const { slots } = this.event.request.intent;
        let { location, date } = slots;

        location = location || this.attributes.location;
        date = date || this.attributes.date;

        if (!location) {
            let slotToElicit = 'location';
            let speechOutput = 'Where do you want to know the weather for?';
            return this.emit(':elicitSlot', slotToElicit, speechOutput);
        }
        if (!date) {
            date = Date.now()
        }

        let isToday = moment(date).isSame(Date.now(), 'day');

        const options = {
            headers: { 'Authorization': process.env.API_KEY }
        }

        if (isToday) {
            let [error, weatherResponse] = await to(axios.get(`api.openweathermap.org/data/2.5/weather?q={$location},us`, options));
            if (error) {
                return this.emit(':tell', `We couldn't get any data for your request. Please try again or try a different request`);
            }

            let { weather, main: { temp, humidity } } = weatherResponse;
            let weatherString = formatWeatherString(weather);
            let formattedTemp = tempC(temp);
            // let formattedTemp = tempF(temp);
            let speech = `The weather in ${location} has ${weatherString} with a temperature of ${formattedTemp} and a humidity of ${humidity} percent`;
            this.emit(':tell', speech);
        } else {
            try {
                let forecastResponse = await axios.get(`api.openweathermap.org/data/2.5/forecast?q=${location},us`, options);
                let { list } = forecastResponse;
                // reduce the data we keep
                let usefulForecast = list.map(weatherPeriod => {
                    let { dt_txt, weather, main: { temp, humidity } } = weatherPeriod;
                    return { dt_txt, weather, temp, humidity }
                });
                // reduce to 9am and 6pm forecasts only
                let reducedForecast = usefulForecast.filter(weatherPeriod => {
                    let time = weatherPeriod.dt_txt.slice(-8);
                    return time === '09:00:00' || time === '18:00:00';
                });
                // reduce to the day the user asked about 
                let dayForecast = reducedForecast(forecast => {
                    return moment(Date.now()).isSame(forecast.dt_txt);
                });

                this.attributes.location = location;
                this.attributes.date = date;

                let weatherString = dayForecast.map(forecast => formatWeatherString(forecast.weather));
                let formattedTemp = dayForecast.map(forecast => tempC(forecast.temp));
                let humidity = dayForecast.map(forecast => forecast.humidity);
                let speech = ` The weather in ${location} ${date} will have ${weatherString[0]} with a temperature of ${formattedTemp[0]} and a humidity of ${humidity[0]} percent, whilst in the afternoon it will have ${weatherString[1]} with a temperature of ${formattedTemp[1]} and a humidity of ${humidity[1]} percent`;
                this.emit(':tell', speech);
            } catch (error) {
                this.emit(':tell', `We couldn't get any data for your request. Please try again or try a different request`);
            }
        }
    },

    'tellAJoke': () => {
        let randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
        this.emit(':tell', randomJoke);
    }
};

const jokes = [
    `Where do snowmen keep their money? In a snow bank.`,
    `As we waited for a bus in the frosty weather, the woman next to me mentioned that she makes a lot of mistakes when texting in the cold. I nodded knowingly. It’s the early signs of typothermia.`,
    `Don’t knock the weather. If it didn’t change once in a while, nine tenths of the people couldn’t start a conversation.`
];

const to = prom => prom.then(data => [null, data]).catch(error => [error, null]);

const tempC = temp => Math.floor(temp - 273.15) + ' degrees Celsius ';

const tempF = temp => Math.floor(9 / 5(temp - 273) + 32) + ' Fahrenheit';

const formatWeatherString = weather => {
    if (weather.length === 1) return weather[0].description;
    return weather.slice(0, -1).map(item => item.description).join(', ') + ' and ' + weather.slice(-1)[0].description;
};

exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = APP_ID
    alexa.registerHandlers(handlers);
    alexa.execute();
};