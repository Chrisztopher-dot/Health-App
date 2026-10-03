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
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl animate-pulse flex items-center justify-between text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
          <div>
            <div className="h-4 bg-slate-750 rounded w-32 mb-2"></div>
            <div className="h-3 bg-slate-800 rounded w-48"></div>
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
    <div className={`bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl backdrop-blur-md relative overflow-hidden transition-all duration-300 text-white ${className}`}>
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-teal-400"></div>

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-2xl shadow-sm">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-white text-base md:text-lg">Weather & Air Quality Advisory</h3>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Live AI
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 font-semibold mt-0.5">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>{locationCity}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Readout button */}
          <button
            onClick={handleSpeakAdvisory}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-rose-600 text-white shadow-md animate-pulse'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
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
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-800 cursor-pointer"
            title="Refresh weather"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Weather & AQI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 shadow-inner mb-4">
        {/* Temperature */}
        <div className="flex items-center space-x-3">
          <div className="text-3xl select-none">{weatherEmoji}</div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {currentTemp}°<span className="text-sm font-medium text-slate-400">F</span>
            </div>
            <div className="text-xs font-semibold text-slate-300 truncate">
              {currentCondition}
            </div>
          </div>
        </div>

        {/* Air Quality (AQI) */}
        <div className="flex items-center space-x-2.5 border-l border-slate-800/80 pl-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-slate-950 text-sm shadow-md"
            style={{ backgroundColor: airQualityColor }}
          >
            {airQualityAqi}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Air Quality</div>
            <div
              className="text-xs font-black capitalize"
              style={{ color: airQualityColor }}
            >
              {airQualityCategory === 'good' ? 'Clean Air (Good)' : airQualityCategory}
            </div>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-center space-x-2.5 border-l border-slate-800/80 pl-3">
          <div className="p-2 bg-slate-900 border border-slate-800 text-cyan-400 rounded-xl">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Humidity</div>
            <div className="text-xs font-black text-white">{humidityVal}%</div>
          </div>
        </div>

        {/* Wind & UV */}
        <div className="flex items-center space-x-2.5 border-l border-slate-800/80 pl-3">
          <div className="p-2 bg-slate-900 border border-slate-800 text-amber-400 rounded-xl">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">UV Index</div>
            <div className="text-xs font-black text-white">{uvIndexVal} (Moderate)</div>
          </div>
        </div>
      </div>

      {/* Senior Clinical Advisories */}
      <div className="space-y-2.5">
        {seniorAdvisoriesList.map((item: any, idx: number) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl border flex items-start space-x-3 ${
              item.level === 'warning'
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                : item.level === 'caution'
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <span className="text-xl shrink-0 mt-0.5 select-none">{item.emoji || '🌿'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black flex items-center gap-1.5 text-white">
                <span>{item.title}</span>
                {item.level === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                {item.level === 'info' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed font-medium">{item.advice}</p>
            </div>
          </div>
        ))}

        {/* Recommended Walking Window */}
        <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/40 rounded-2xl flex items-start space-x-3">
          <div className="p-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Best Outdoor Walking Window:</span>
              <span className="text-indigo-300 font-extrabold">{bestTimeRange}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed font-medium">
              {bestRecommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
