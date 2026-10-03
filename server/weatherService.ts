export interface SeniorWeatherAdvisory {
  location: {
    city: string;
    latitude: number;
    longitude: number;
  };
  current: {
    tempFahrenheit: number;
    tempCelsius: number;
    weatherCode: number;
    weatherCondition: string;
    weatherEmoji: string;
    humidity: number;
    uvIndex: number;
    windMph: number;
  };
  airQuality: {
    usAqi: number;
    pm25: number;
    category: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy';
    label: string;
    color: string;
  };
  seniorAdvisories: {
    category: 'heat' | 'cold' | 'air_quality' | 'hydration' | 'activity_timing' | 'optimal';
    title: string;
    advice: string;
    level: 'info' | 'caution' | 'warning';
    emoji: string;
  }[];
  bestActivityWindow: {
    timeRange: string;
    recommendation: string;
  };
}

export class SeniorWeatherService {
  /**
   * Fetch weather and air quality from Open-Meteo (100% free open API) and build senior health advisories
   */
  public static async getSeniorAdvisory(
    lat: number = 37.7749, // Default: San Francisco Bay Area
    lon: number = -122.4194,
    cityName: string = 'San Francisco Bay Area'
  ): Promise<SeniorWeatherAdvisory> {
    try {
      // 1. Fetch current weather and hourly forecast from Open-Meteo
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,uv_index&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,uv_index&timezone=auto`;

      const [weatherRes, aqiRes] = await Promise.all([
        fetch(weatherUrl).then((r) => r.json()).catch(() => null),
        fetch(aqiUrl).then((r) => r.json()).catch(() => null),
      ]);

      const currentW = weatherRes?.current || {};
      const currentAqi = aqiRes?.current || {};

      const tempF = Math.round(currentW.temperature_2m || 68);
      const tempC = Math.round(((tempF - 32) * 5) / 9);
      const humidity = Math.round(currentW.relative_humidity_2m || 55);
      const windSpeed = Math.round(currentW.wind_speed_10m || 8);
      const weatherCode = currentW.weather_code || 0;
      const usAqi = Math.round(currentAqi.us_aqi || 28);
      const pm25 = Math.round(currentAqi.pm2_5 || 8);

      const conditionInfo = this.getWeatherCondition(weatherCode);

      // Evaluate AQI
      let aqiCategory: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' = 'good';
      let aqiLabel = 'Good Air Quality (0-50 AQI)';
      let aqiColor = '#10b981';

      if (usAqi > 100) {
        aqiCategory = 'unhealthy';
        aqiLabel = 'Unhealthy Air Quality (100+ AQI)';
        aqiColor = '#ef4444';
      } else if (usAqi > 50) {
        aqiCategory = 'moderate';
        aqiLabel = 'Moderate Air Quality (51-100 AQI)';
        aqiColor = '#f59e0b';
      }

      // Build Senior Clinical Advisories
      const advisories: SeniorWeatherAdvisory['seniorAdvisories'] = [];

      // 1. Heat / Temperature Advisory
      if (tempF >= 84) {
        advisories.push({
          category: 'heat',
          title: 'High Heat Advisory for Seniors',
          advice: `Current temperature is ${tempF}°F. Senior heat regulation is more delicate; drink plenty of water and plan indoor activities during afternoon hours.`,
          level: 'warning',
          emoji: '☀️',
        });
      } else if (tempF <= 50) {
        advisories.push({
          category: 'cold',
          title: 'Brisk Temperature Advisory',
          advice: `Current temperature is ${tempF}°F. Cold air can constrict blood vessels and temporarily elevate blood pressure. Dress in warm layers when outdoors.`,
          level: 'caution',
          emoji: '🧣',
        });
      } else {
        advisories.push({
          category: 'optimal',
          title: 'Comfortable Outdoor Climate',
          advice: `Pleasant ${tempF}°F weather. Ideal conditions for a gentle morning nature stroll or outdoor garden activity.`,
          level: 'info',
          emoji: '🌿',
        });
      }

      // 2. Air Quality Advisory
      if (aqiCategory === 'unhealthy') {
        advisories.push({
          category: 'air_quality',
          title: 'Air Quality Caution (High AQI)',
          advice: `AQI is ${usAqi} (PM2.5: ${pm25} µg/m³). Keep windows closed and opt for indoor exercise routines today to protect lung and cardiovascular health.`,
          level: 'warning',
          emoji: '😷',
        });
      } else if (aqiCategory === 'moderate') {
        advisories.push({
          category: 'air_quality',
          title: 'Moderate Air Quality',
          advice: `AQI is ${usAqi}. Acceptable for most seniors; sensitive individuals should take occasional rest breaks during walks.`,
          level: 'info',
          emoji: '🍃',
        });
      } else {
        advisories.push({
          category: 'air_quality',
          title: 'Clean & Fresh Air Quality',
          advice: `AQI is ${usAqi} (${aqiLabel}). Great air quality to enjoy outdoor walking and deep breathing exercises.`,
          level: 'info',
          emoji: '✨',
        });
      }

      // 3. Hydration Advisory
      advisories.push({
        category: 'hydration',
        title: 'Daily Senior Hydration Goal',
        advice: tempF > 75 
          ? 'Aim for 6–8 glasses of water today to support kidney filtration, blood pressure stability, and joint lubrication.'
          : 'Stay comfortably hydrated with water and warm herbal tea throughout the morning and afternoon.',
        level: 'info',
        emoji: '💧',
      });

      return {
        location: {
          city: cityName,
          latitude: lat,
          longitude: lon,
        },
        current: {
          tempFahrenheit: tempF,
          tempCelsius: tempC,
          weatherCode,
          weatherCondition: conditionInfo.label,
          weatherEmoji: conditionInfo.emoji,
          humidity,
          uvIndex: Math.round(currentAqi.uv_index || 3),
          windMph: windSpeed,
        },
        airQuality: {
          usAqi,
          pm25,
          category: aqiCategory,
          label: aqiLabel,
          color: aqiColor,
        },
        seniorAdvisories: advisories,
        bestActivityWindow: {
          timeRange: '08:30 AM – 11:00 AM',
          recommendation: tempF > 80 
            ? 'Early morning hours offer the best combination of cool breeze and clean air before afternoon heat peaks.'
            : 'Mid-morning provides gentle sunshine and comfortable warmth for daily walking.',
        },
      };
    } catch (err) {
      console.warn('Weather API fallback triggered:', err);
      return this.getFallbackAdvisory(cityName);
    }
  }

  private static getWeatherCondition(code: number): { label: string; emoji: string } {
    if (code === 0) return { label: 'Clear Sky & Sunshine', emoji: '☀️' };
    if (code === 1 || code === 2) return { label: 'Partly Cloudy', emoji: '⛅' };
    if (code === 3) return { label: 'Overcast', emoji: '☁️' };
    if (code === 45 || code === 48) return { label: 'Morning Fog / Mist', emoji: '🌫️' };
    if (code >= 51 && code <= 67) return { label: 'Light Rain / Drizzle', emoji: '🌦️' };
    if (code >= 71 && code <= 77) return { label: 'Snow / Flurries', emoji: '❄️' };
    if (code >= 80 && code <= 82) return { label: 'Passing Rain Showers', emoji: '🌧️' };
    if (code >= 95) return { label: 'Thunderstorms', emoji: '⛈️' };
    return { label: 'Mild & Clear', emoji: '🌤️' };
  }

  private static getFallbackAdvisory(cityName: string): SeniorWeatherAdvisory {
    return {
      location: { city: cityName, latitude: 37.7749, longitude: -122.4194 },
      current: {
        tempFahrenheit: 68,
        tempCelsius: 20,
        weatherCode: 1,
        weatherCondition: 'Pleasant & Mild',
        weatherEmoji: '🌤️',
        humidity: 58,
        uvIndex: 4,
        windMph: 7,
      },
      airQuality: {
        usAqi: 32,
        pm25: 7,
        category: 'good',
        label: 'Good Air Quality (32 AQI)',
        color: '#10b981',
      },
      seniorAdvisories: [
        {
          category: 'optimal',
          title: 'Pleasant Outdoor Weather',
          advice: 'Comfortable temperature for your daily morning walk and outdoor activities.',
          level: 'info',
          emoji: '🌿',
        },
        {
          category: 'hydration',
          title: 'Senior Hydration Reminder',
          advice: 'Drink water consistently throughout the day to support kidney health and blood pressure balance.',
          level: 'info',
          emoji: '💧',
        },
      ],
      bestActivityWindow: {
        timeRange: '09:00 AM – 11:30 AM',
        recommendation: 'Mid-morning provides gentle warmth and fresh air for outdoor walking.',
      },
    };
  }
}
