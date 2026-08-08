import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCloudRain, FaWind, FaTint } from "react-icons/fa";
import { mapsAPI } from "../../services/api";

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
          mapsAPI.getCurrentWeather({ lat, lng }),
          mapsAPI.getWeatherForecast({ lat, lng, days: 30 }), // Changed from 3 to 30
        ]);

        if (currentRes.data.success) {
          setWeather(currentRes.data.data);
        }

        if (forecastRes.data.success) {
          // Handle new response structure
          const forecastData = forecastRes.data.data.forecast || forecastRes.data.data;
          setForecast(Array.isArray(forecastData) ? forecastData : []);
        }
      } catch (error) {
        console.error("Weather fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (lat && lng) {
      loadWeather();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
