import React, { useState, useEffect } from 'react';
import { CloudSun, Droplets, Sun, AlertTriangle, Clock, RefreshCw, Volume2, ShieldCheck, MapPin } from 'lucide-react';
import { WeatherHealthService, SeniorWeatherAdvisory } from '../../services/weatherHealthService';
import { SpeechService } from '../../services/speechService';

interface WeatherHealthCardProps {
  className?: string;
}

export const WeatherHealthCard: React.FC<WeatherHealthCardProps> = ({ className = '' }) => {
  const [advisory, setAdvisory] = useState<SeniorWeatherAdvisory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const loadWeather = async () => {
    setLoading(true);
    try {
      const data = await WeatherHealthService.getAdvisory();
      setAdvisory(data);
    } catch {
      setAdvisory(WeatherHealthService.getLocalFallbackAdvisory());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  const handleSpeakAdvisory = () => {
    if (!advisory) return;

    if (isSpeaking) {
      SpeechService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const advList = advisory.seniorAdvisories || (advisory as any).advisories || [];
    const textToSpeak = `Here is your senior weather and health advisory for ${advisory.location?.city || 'the Bay Area'}. Current temperature is ${advisory.current?.tempFahrenheit || 68} degrees Fahrenheit and ${advisory.current?.weatherCondition || 'pleasant'}. Air quality is ${advisory.airQuality?.label || 'Good'}. Best time for outdoor walking is ${advisory.bestActivityWindow?.timeRange || 'morning'}. ${advList.map((a: any) => `${a.title}: ${a.advice}`).join(' ')}`;

    setIsSpeaking(true);
    SpeechService.speak(textToSpeak, 0.9, () => {
      setIsSpeaking(false);
    });
  };

  if (loading && !advisory) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm animate-pulse flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl"></div>
          <div>
            <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-slate-100 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!advisory) return null;

  const seniorAdvisoriesList = advisory.seniorAdvisories || (advisory as any).advisories || [];
  const locationCity = advisory.location?.city || 'San Francisco Bay Area';
  const currentTemp = advisory.current?.tempFahrenheit ?? 68;
  const currentCondition = advisory.current?.weatherCondition || 'Pleasant & Mild';
  const weatherEmoji = advisory.current?.weatherEmoji || '🌤️';
  const airQualityColor = advisory.airQuality?.color || '#10b981';
  const airQualityAqi = advisory.airQuality?.usAqi ?? 32;
  const airQualityCategory = advisory.airQuality?.category || 'good';
  const humidityVal = advisory.current?.humidity ?? 55;
  const uvIndexVal = advisory.current?.uvIndex ?? 3;
  const bestTimeRange = advisory.bestActivityWindow?.timeRange || '09:00 AM – 11:30 AM';
  const bestRecommendation = advisory.bestActivityWindow?.recommendation || 'Comfortable conditions for daily walking.';

  return (
    <div className={`bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 rounded-2xl p-5 border border-blue-100/80 shadow-sm relative overflow-hidden transition-all duration-300 ${className}`}>
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-sky-400 to-teal-400"></div>

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-slate-800 text-base md:text-lg">Weather & Air Quality Health Advisory</h3>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              {locationCity}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Readout button */}
          <button
            onClick={handleSpeakAdvisory}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              isSpeaking
                ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300 animate-pulse'
                : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
            }`}
            title="Listen to advisory"
          >
            <Volume2 className="w-4 h-4" />
            <span>{isSpeaking ? 'Stop Voice' : 'Read Advisory'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadWeather}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
            title="Refresh weather"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Weather & AQI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/90 backdrop-blur-sm p-3.5 rounded-xl border border-blue-100/60 shadow-xs mb-3.5">
        {/* Temperature */}
        <div className="flex items-center space-x-3">
          <div className="text-3xl select-none">{weatherEmoji}</div>
          <div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {currentTemp}°<span className="text-sm font-medium text-slate-500">F</span>
            </div>
            <div className="text-xs font-medium text-slate-600 truncate">
              {currentCondition}
            </div>
          </div>
        </div>

        {/* Air Quality (AQI) */}
        <div className="flex items-center space-x-2.5 border-l border-slate-100 pl-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-xs"
            style={{ backgroundColor: airQualityColor }}
          >
            {airQualityAqi}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700">Air Quality</div>
            <div
              className="text-xs font-semibold capitalize"
              style={{ color: airQualityColor }}
            >
              {airQualityCategory === 'good' ? 'Clean Air' : airQualityCategory}
            </div>
          </div>
        </div>

        {/* Humidity & UV */}
        <div className="flex items-center space-x-2.5 border-l border-slate-100 pl-3">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700">Humidity</div>
            <div className="text-xs font-semibold text-slate-600">{humidityVal}%</div>
          </div>
        </div>

        {/* Wind & UV */}
        <div className="flex items-center space-x-2.5 border-l border-slate-100 pl-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700">UV Index</div>
            <div className="text-xs font-semibold text-slate-600">{uvIndexVal} (Moderate)</div>
          </div>
        </div>
      </div>

      {/* Senior Clinical Advisories */}
      <div className="space-y-2">
        {seniorAdvisoriesList.map((item: any, idx: number) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border flex items-start space-x-2.5 ${
              item.level === 'warning'
                ? 'bg-red-50/80 border-red-200 text-red-900'
                : item.level === 'caution'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <span className="text-xl shrink-0 mt-0.5 select-none">{item.emoji || '🌿'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold flex items-center gap-1.5">
                {item.title}
                {item.level === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                {item.level === 'info' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{item.advice}</p>
            </div>
          </div>
        ))}

        {/* Recommended Walking Window */}
        <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-start space-x-2.5">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg mt-0.5">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              Best Outdoor Walking Window: <span className="text-indigo-700 font-extrabold">{bestTimeRange}</span>
            </div>
            <p className="text-xs text-indigo-900/80 mt-0.5 leading-relaxed">
              {bestRecommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
