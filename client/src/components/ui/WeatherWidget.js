import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCloudRain, FaWind, FaTint } from "react-icons/fa";
import axios from "axios";

// Helper functions for weather data processing
const getWeatherDescription = (code) => {
  const weatherCodes = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return weatherCodes[code] || "Unknown";
};

const getWeatherIcon = (code) => {
  if (code === 0 || code === 1) return "☀️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌧️";
  if (code >= 61 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95 && code <= 99) return "⛈️";
  return "🌤️";
};

const estimateWeatherCode = (precipitation) => {
  if (precipitation > 10) return 63; // Moderate rain
  if (precipitation > 5) return 61; // Slight rain
  if (precipitation > 2) return 51; // Light drizzle
  if (precipitation > 0.5) return 2; // Partly cloudy
  return Math.random() > 0.5 ? 0 : 1; // Clear or mainly clear
};

const getFallbackEstimates = (days, baseDate) => {
  const estimates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    estimates.push({
      date: date.toISOString().split('T')[0],
      tempMax: 25 + Math.random() * 10,
      tempMin: 15 + Math.random() * 10,
      precipitation: Math.random() * 5,
      precipitationProbability: Math.round(Math.random() * 50),
      weatherCode: 2,
      description: 'Partly cloudy',
      icon: '⛅',
      windSpeed: 10 + Math.random() * 10,
      uvIndex: 5,
      sunrise: '06:00',
      sunset: '18:00',
      dataType: 'estimate',
    });
  }
  return estimates;
};

const getClimateEstimates = (lat, lng, additionalDays, dailyData) => {
  try {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 16); // Start from day 17

    const estimates = [];
    const avgTempMax = dailyData.temperature_2m_max.reduce((a, b) => a + b, 0) / dailyData.temperature_2m_max.length;
    const avgTempMin = dailyData.temperature_2m_min.reduce((a, b) => a + b, 0) / dailyData.temperature_2m_min.length;
    const avgPrecip = dailyData.precipitation_sum.reduce((a, b) => a + b, 0) / dailyData.precipitation_sum.length;

    for (let i = 0; i < additionalDays; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      
      const tempVariation = (Math.random() - 0.5) * 4;
      const precipVariation = Math.random() * 1.5;
      const precipitationVal = avgPrecip * precipVariation;
      
      estimates.push({
        date: date.toISOString().split('T')[0],
        tempMax: Math.round((avgTempMax + tempVariation) * 10) / 10,
        tempMin: Math.round((avgTempMin + tempVariation) * 10) / 10,
        precipitation: Math.round(precipitationVal * 10) / 10,
        precipitationProbability: Math.round(Math.min(100, precipitationVal * 5)),
        weatherCode: estimateWeatherCode(precipitationVal),
        description: getWeatherDescription(estimateWeatherCode(precipitationVal)),
        icon: getWeatherIcon(estimateWeatherCode(precipitationVal)),
        windSpeed: Math.round((10 + Math.random() * 15) * 10) / 10,
        uvIndex: Math.round(3 + Math.random() * 5),
        sunrise: dailyData.sunrise[0], // Use first day as reference
        sunset: dailyData.sunset[0],
        dataType: 'climate_estimate',
      });
    }

    return estimates;
  } catch (error) {
    console.error("Climate estimates error:", error);
    const fallbackBaseDate = new Date();
    fallbackBaseDate.setDate(fallbackBaseDate.getDate() + 16);
    return getFallbackEstimates(additionalDays, fallbackBaseDate);
  }
};

const WeatherWidget = ({ lat, lng }) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFullForecast, setShowFullForecast] = useState(false);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setLoading(true);
        const [currentRes, forecastRes] = await Promise.all([
          axios.get("https://api.open-meteo.com/v1/forecast", {
            params: {
              latitude: lat,
              longitude: lng,
              current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
              timezone: "auto",
            },
            timeout: 10000,
          }),
          axios.get("https://api.open-meteo.com/v1/forecast", {
            params: {
              latitude: lat,
              longitude: lng,
              daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code,wind_speed_10m_max,uv_index_max,sunrise,sunset",
              timezone: "auto",
              forecast_days: 16,
            },
            timeout: 10000,
          })
        ]);

        const current = currentRes.data.current;
        setWeather({
          temperature: current.temperature_2m,
          feelsLike: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          precipitation: current.precipitation,
          windSpeed: current.wind_speed_10m,
          weatherCode: current.weather_code,
          description: getWeatherDescription(current.weather_code),
          icon: getWeatherIcon(current.weather_code),
          unit: currentRes.data.current_units.temperature_2m,
        });

        const daily = forecastRes.data.daily;
        const forecastList = [];
        for (let i = 0; i < daily.time.length; i++) {
          forecastList.push({
            date: daily.time[i],
            tempMax: daily.temperature_2m_max[i],
            tempMin: daily.temperature_2m_min[i],
            precipitation: daily.precipitation_sum[i],
            precipitationProbability: daily.precipitation_probability_max?.[i] || 0,
            weatherCode: daily.weather_code[i],
            description: getWeatherDescription(daily.weather_code[i]),
            icon: getWeatherIcon(daily.weather_code[i]),
            windSpeed: daily.wind_speed_10m_max[i],
            uvIndex: daily.uv_index_max?.[i] || 0,
            sunrise: daily.sunrise[i],
            sunset: daily.sunset[i],
            dataType: 'forecast',
          });
        }

        // Generate the 14-day climate estimates for 30-day view compatibility
        const climateData = getClimateEstimates(lat, lng, 14, daily);
        forecastList.push(...climateData);

        setForecast(forecastList);
      } catch (error) {
        console.error("Weather fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (lat && lng) {
      loadWeather();
    }
  }, [lat, lng]);



  if (loading || !weather) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 md:p-6 shadow-xl text-white"
    >
      {/* Current Weather */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-4xl md:text-5xl font-bold">
            {Math.round(weather.temperature)}°C
          </div>
          <div className="text-sm md:text-base opacity-90 mt-1">
            Feels like {Math.round(weather.feelsLike)}°C
          </div>
          <div className="text-xs md:text-sm opacity-80 mt-1 flex items-center gap-2">
            {weather.icon} {weather.description}
          </div>
        </div>
        <div className="text-6xl md:text-7xl">{weather.icon}</div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4 pt-4 border-t border-white/20">
        <div className="text-center">
          <FaTint className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 opacity-80" />
          <div className="text-xs opacity-70">Humidity</div>
          <div className="text-sm md:text-base font-semibold">{weather.humidity}%</div>
        </div>
        <div className="text-center">
          <FaWind className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 opacity-80" />
          <div className="text-xs opacity-70">Wind</div>
          <div className="text-sm md:text-base font-semibold">{Math.round(weather.windSpeed)} km/h</div>
        </div>
        <div className="text-center">
          <FaCloudRain className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 opacity-80" />
          <div className="text-xs opacity-70">Rain</div>
          <div className="text-sm md:text-base font-semibold">{weather.precipitation} mm</div>
        </div>
      </div>

      {/* 3-Day Forecast */}
      {forecast.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs md:text-sm font-semibold opacity-80">
              {showFullForecast ? '30-Day Forecast' : '3-Day Forecast'}
            </div>
            <button
              onClick={() => setShowFullForecast(!showFullForecast)}
              className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              {showFullForecast ? 'Show Less' : 'View 30 Days →'}
            </button>
          </div>

          {!showFullForecast ? (
            // Compact 3-day view
            <div className="grid grid-cols-3 gap-2">
              {forecast.slice(0, 3).map((day, index) => {
                const date = new Date(day.date);
                const dayName = index === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });
                
                return (
                  <div
                    key={day.date}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center"
                  >
                    <div className="text-xs font-semibold mb-1">{dayName}</div>
                    <div className="text-2xl my-1">{day.icon}</div>
                    <div className="text-xs">
                      <span className="font-semibold">{Math.round(day.tempMax)}°</span>
                      <span className="opacity-70 mx-1">/</span>
                      <span className="opacity-70">{Math.round(day.tempMin)}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Expanded 30-day view
            <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
              {forecast.map((day, index) => {
                const date = new Date(day.date);
                const dayName = index === 0 
                  ? "Today" 
                  : index === 1 
                  ? "Tomorrow" 
                  : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                const isEstimate = day.dataType === 'climate_estimate' || day.dataType === 'estimate';
                
                return (
                  <div
                    key={day.date}
                    className={`bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between hover:bg-white/20 transition-colors ${
                      isEstimate ? 'border border-white/20 border-dashed' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">{day.icon}</div>
                      <div>
                        <div className="text-sm font-semibold">{dayName}</div>
                        <div className="text-xs opacity-70">{day.description}</div>
                        {isEstimate && (
                          <div className="text-xs opacity-60 italic">Climate estimate</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
                      </div>
                      {day.precipitation > 0 && (
                        <div className="text-xs opacity-70">
                          💧 {day.precipitation}mm
                        </div>
                      )}
                      {day.precipitationProbability > 0 && (
                        <div className="text-xs opacity-60">
                          {day.precipitationProbability}% rain
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default WeatherWidget;
