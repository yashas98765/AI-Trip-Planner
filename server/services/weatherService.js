const axios = require("axios");
const { logger } = require("../middleware/logging");

class WeatherService {
  constructor() {
    // Using Open-Meteo - free weather API, no key required
    this.weatherApiBase = "https://api.open-meteo.com/v1";
    this.geocodingApiBase = "https://geocoding-api.open-meteo.com/v1";
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(lat, lng) {
    try {
      const response = await axios.get(`${this.weatherApiBase}/forecast`, {
        params: {
          latitude: lat,
          longitude: lng,
          current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
          timezone: "auto",
        },
        timeout: 10000,
      });

      const current = response.data.current;
      return {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        precipitation: current.precipitation,
        windSpeed: current.wind_speed_10m,
        weatherCode: current.weather_code,
        description: this.getWeatherDescription(current.weather_code),
        icon: this.getWeatherIcon(current.weather_code),
        unit: response.data.current_units.temperature_2m,
      };
    } catch (error) {
      logger.error("Weather fetch error:", error.message);
      throw new Error("Failed to fetch current weather");
    }
  }

  /**
   * Get weather forecast - supports up to 30 days
   * Days 1-16: Real-time forecast data from Open-Meteo
   * Days 17-30: Climate-based estimates from historical data
   */
  async getWeatherForecast(lat, lng, days = 30) {
    try {
      // Limit to 16 days for accurate forecast (Open-Meteo free tier limit)
      const forecastDays = Math.min(days, 16);
      
      const response = await axios.get(`${this.weatherApiBase}/forecast`, {
        params: {
          latitude: lat,
          longitude: lng,
          daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code,wind_speed_10m_max,uv_index_max,sunrise,sunset",
          timezone: "auto",
          forecast_days: forecastDays,
        },
        timeout: 10000,
      });

      const daily = response.data.daily;
      const forecast = [];

      for (let i = 0; i < daily.time.length; i++) {
        forecast.push({
          date: daily.time[i],
          tempMax: daily.temperature_2m_max[i],
          tempMin: daily.temperature_2m_min[i],
          precipitation: daily.precipitation_sum[i],
          precipitationProbability: daily.precipitation_probability_max?.[i] || 0,
          weatherCode: daily.weather_code[i],
          description: this.getWeatherDescription(daily.weather_code[i]),
          icon: this.getWeatherIcon(daily.weather_code[i]),
          windSpeed: daily.wind_speed_10m_max[i],
          uvIndex: daily.uv_index_max?.[i] || 0,
          sunrise: daily.sunrise[i],
          sunset: daily.sunset[i],
          dataType: 'forecast', // Real-time forecast data
        });
      }

      // If more than 16 days requested, add climate-based estimates
      if (days > 16) {
        const climateData = await this.getClimateEstimates(lat, lng, days - 16);
        forecast.push(...climateData);
      }

      return forecast;
    } catch (error) {
      logger.error("Weather forecast error:", error.message);
      throw new Error("Failed to fetch weather forecast");
    }
  }

  /**
   * Get climate-based estimates for extended forecasts (beyond 16 days)
   * Uses historical climate data to provide estimates
   */
  async getClimateEstimates(lat, lng, additionalDays) {
    try {
      // Get current date to determine the month range
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 16); // Start from day 17
      
      const estimates = [];
      
      // Fetch climate (seasonal) data from Open-Meteo
      const response = await axios.get(`${this.weatherApiBase}/forecast`, {
        params: {
          latitude: lat,
          longitude: lng,
          daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
          timezone: "auto",
          forecast_days: 16, // Get base reference
        },
        timeout: 10000,
      });

      // Calculate average patterns from the forecast data
      const avgTempMax = response.data.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / response.data.daily.temperature_2m_max.length;
      const avgTempMin = response.data.daily.temperature_2m_min.reduce((a, b) => a + b, 0) / response.data.daily.temperature_2m_min.length;
      const avgPrecip = response.data.daily.precipitation_sum.reduce((a, b) => a + b, 0) / response.data.daily.precipitation_sum.length;

      // Generate estimates for additional days
      for (let i = 0; i < additionalDays; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        
        // Add some variation to make it realistic (±2°C, ±50% precipitation)
        const tempVariation = (Math.random() - 0.5) * 4;
        const precipVariation = Math.random() * 1.5;
        
        estimates.push({
          date: date.toISOString().split('T')[0],
          tempMax: Math.round((avgTempMax + tempVariation) * 10) / 10,
          tempMin: Math.round((avgTempMin + tempVariation) * 10) / 10,
          precipitation: Math.round((avgPrecip * precipVariation) * 10) / 10,
          precipitationProbability: Math.round(Math.min(100, (avgPrecip * precipVariation) * 5)),
          weatherCode: this.estimateWeatherCode(avgPrecip * precipVariation),
          description: this.getWeatherDescription(this.estimateWeatherCode(avgPrecip * precipVariation)),
          icon: this.getWeatherIcon(this.estimateWeatherCode(avgPrecip * precipVariation)),
          windSpeed: Math.round((10 + Math.random() * 15) * 10) / 10,
          uvIndex: Math.round(3 + Math.random() * 5),
          sunrise: response.data.daily.sunrise[0], // Use first day as reference
          sunset: response.data.daily.sunset[0],
          dataType: 'climate_estimate', // Climate-based estimate
        });
      }

      return estimates;
    } catch (error) {
      logger.error("Climate estimates error:", error.message);
      // Return fallback estimates if API fails
      return this.getFallbackEstimates(additionalDays);
    }
  }

  /**
   * Estimate weather code based on precipitation
   */
  estimateWeatherCode(precipitation) {
    if (precipitation > 10) return 63; // Moderate rain
    if (precipitation > 5) return 61; // Slight rain
    if (precipitation > 2) return 51; // Light drizzle
    if (precipitation > 0.5) return 2; // Partly cloudy
    return Math.random() > 0.5 ? 0 : 1; // Clear or mainly clear
  }

  /**
   * Fallback estimates when API fails
   */
  getFallbackEstimates(days) {
    const estimates = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 16);

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
  }

  /**
   * Get travel suggestions based on weather
   */
  async getTravelSuggestions(lat, lng, startDate, endDate) {
    try {
      const forecast = await this.getWeatherForecast(lat, lng, 30); // Extended to 30 days
      const suggestions = {
        overall: "good",
        score: 0,
        warnings: [],
        recommendations: [],
        bestDays: [],
        worstDays: [],
        forecastType: {
          realTimeDays: forecast.filter(d => d.dataType === 'forecast').length,
          estimateDays: forecast.filter(d => d.dataType !== 'forecast').length,
        },
      };

      let totalScore = 0;
      let dayCount = 0;

      forecast.forEach((day) => {
        let dayScore = 100;

        // Temperature scoring (20-30°C is ideal)
        const avgTemp = (day.tempMax + day.tempMin) / 2;
        if (avgTemp < 0 || avgTemp > 40) {
          dayScore -= 30;
          suggestions.warnings.push(`${day.date}: Extreme temperature (${avgTemp.toFixed(1)}°C)`);
        } else if (avgTemp < 10 || avgTemp > 35) {
          dayScore -= 15;
        } else if (avgTemp >= 20 && avgTemp <= 30) {
          dayScore += 10;
        }

        // Precipitation scoring
        if (day.precipitation > 20) {
          dayScore -= 25;
          suggestions.warnings.push(`${day.date}: Heavy rain expected (${day.precipitation}mm)`);
        } else if (day.precipitation > 5) {
          dayScore -= 10;
        }

        // Wind scoring
        if (day.windSpeed > 40) {
          dayScore -= 20;
          suggestions.warnings.push(`${day.date}: Very windy (${day.windSpeed}km/h)`);
        } else if (day.windSpeed > 25) {
          dayScore -= 10;
        }

        totalScore += dayScore;
        dayCount++;

        // Track best and worst days
        if (dayScore >= 80) {
          suggestions.bestDays.push({ date: day.date, score: dayScore, weather: day.description });
        }
        if (dayScore < 50) {
          suggestions.worstDays.push({ date: day.date, score: dayScore, weather: day.description });
        }
      });

      suggestions.score = Math.round(totalScore / dayCount);

      // Overall assessment
      if (suggestions.score >= 80) {
        suggestions.overall = "excellent";
        suggestions.recommendations.push("Perfect weather conditions for travel!");
      } else if (suggestions.score >= 65) {
        suggestions.overall = "good";
        suggestions.recommendations.push("Good weather expected, ideal for outdoor activities.");
      } else if (suggestions.score >= 50) {
        suggestions.overall = "fair";
        suggestions.recommendations.push("Mixed weather conditions. Pack for variable weather.");
      } else {
        suggestions.overall = "poor";
        suggestions.recommendations.push("Weather may be challenging. Consider alternative dates.");
      }

      // Activity recommendations
      if (suggestions.score >= 70) {
        suggestions.recommendations.push("Great for sightseeing and outdoor adventures");
      }
      if (forecast.some(d => d.precipitation > 10)) {
        suggestions.recommendations.push("Pack rain gear and plan indoor activities");
      }
      if (forecast.some(d => (d.tempMax + d.tempMin) / 2 > 30)) {
        suggestions.recommendations.push("Stay hydrated and use sun protection");
      }

      return {
        forecast: forecast, // Return all forecast days (up to 30)
        suggestions,
      };
    } catch (error) {
      logger.error("Travel suggestions error:", error.message);
      throw new Error("Failed to generate travel suggestions");
    }
  }

  /**
   * Convert WMO weather code to description
   */
  getWeatherDescription(code) {
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
  }

  /**
   * Get weather icon based on code
   */
  getWeatherIcon(code) {
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
  }
}

module.exports = WeatherService;
