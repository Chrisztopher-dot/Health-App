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

const CACHE_KEY = 'senior_weather_advisory_cache';

export class WeatherHealthService {
  public static async getAdvisory(
    lat: number = 37.7749,
    lon: number = -122.4194,
    city: string = 'San Francisco Bay Area'
  ): Promise<SeniorWeatherAdvisory> {
    try {
      const res = await fetch(`/api/weather-advisory?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`);
      if (!res.ok) {
        throw new Error(`Weather API returned ${res.status}`);
      }
      const data: SeniorWeatherAdvisory = await res.json();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('Could not fetch real-time weather from backend, using cached or fallback advisory:', err);
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore parsing error
        }
      }
      return this.getLocalFallbackAdvisory(city);
    }
  }

  public static getLocalFallbackAdvisory(city: string = 'San Francisco Bay Area'): SeniorWeatherAdvisory {
    return {
      location: { city, latitude: 37.7749, longitude: -122.4194 },
      current: {
        tempFahrenheit: 68,
        tempCelsius: 20,
        weatherCode: 1,
        weatherCondition: 'Mild & Sunny',
        weatherEmoji: '🌤️',
        humidity: 56,
        uvIndex: 4,
        windMph: 8,
      },
      airQuality: {
        usAqi: 34,
        pm25: 8,
        category: 'good',
        label: 'Good Air Quality (AQI 34)',
        color: '#10b981',
      },
      seniorAdvisories: [
        {
          category: 'optimal',
          title: 'Ideal Outdoor Walking Climate',
          advice: 'The temperature (68°F) and air quality are great for joint movement and cardiovascular health.',
          level: 'info',
          emoji: '🌿',
        },
        {
          category: 'hydration',
          title: 'Daily Hydration Goal',
          advice: 'Keep a water glass handy. Drinking 6–8 glasses daily helps kidney filtration and prevents dizziness.',
          level: 'info',
          emoji: '💧',
        },
      ],
      bestActivityWindow: {
        timeRange: '09:00 AM – 11:30 AM',
        recommendation: 'Morning sunlight provides gentle natural vitamin D synthesis and comfortable walking temperatures.',
      },
    };
  }
}
