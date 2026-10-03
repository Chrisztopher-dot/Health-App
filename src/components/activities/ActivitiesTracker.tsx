import React, { useState, useEffect } from 'react';
import { UserProfile, ActivityLogEntry, ActivityCategory, ActivityIntensity, TimeOfDay } from '../../types/health';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import { WeatherHealthCard } from '../common/WeatherHealthCard';
import { 
  Footprints, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles, 
  Mic, 
  MicOff, 
  Flame, 
  Trophy, 
  Smile,
  Volume2
} from 'lucide-react';

interface ActivitiesTrackerProps {
  profile: UserProfile;
}

const QUICK_PRESETS: {
  title: string;
  category: ActivityCategory;
  defaultDuration: number;
  intensity: ActivityIntensity;
  emoji: string;
  bg: string;
  border: string;
}[] = [
  {
    title: 'Hiking & Nature Trail',
    category: 'hiking',
    defaultDuration: 45,
    intensity: 'moderate',
    emoji: '🥾',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    border: 'border-emerald-300',
  },
  {
    title: 'Working on the House (Chores / DIY)',
    category: 'housework',
    defaultDuration: 40,
    intensity: 'moderate',
    emoji: '🏡',
    bg: 'bg-amber-50 hover:bg-amber-100',
    border: 'border-amber-300',
  },
  {
    title: 'Outdoor / Neighborhood Walk',
    category: 'walking',
    defaultDuration: 30,
    intensity: 'gentle',
    emoji: '🚶',
    bg: 'bg-teal-50 hover:bg-teal-100',
    border: 'border-teal-300',
  },
  {
    title: 'Gentle Stretching & Yoga',
    category: 'stretching',
    defaultDuration: 15,
    intensity: 'gentle',
    emoji: '🧘',
    bg: 'bg-indigo-50 hover:bg-indigo-100',
    border: 'border-indigo-300',
  },
  {
    title: 'Swimming & Water Fitness',
    category: 'swimming',
    defaultDuration: 30,
    intensity: 'moderate',
    emoji: '🏊',
    bg: 'bg-cyan-50 hover:bg-cyan-100',
    border: 'border-cyan-300',
  },
  {
    title: 'Gardening & Yard Activity',
    category: 'gardening',
    defaultDuration: 30,
    intensity: 'gentle',
    emoji: '🌿',
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-300',
  },
];

export const ActivitiesTracker: React.FC<ActivitiesTrackerProps> = ({ profile }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  // Modal Form State
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ActivityCategory>('walking');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [intensity, setIntensity] = useState<ActivityIntensity>('moderate');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [notes, setNotes] = useState<string>('');
  const [feelingAfter, setFeelingAfter] = useState<ActivityLogEntry['feelingAfter']>('energized');

  // Load activities for selected date
  useEffect(() => {
    try {
      const list = HealthStorageService.getActivityLogsForDate(selectedDate);
      setActivities(Array.isArray(list) ? list : []);
    } catch {
      setActivities([]);
    }
  }, [selectedDate]);

  const handleDateChange = (daysDelta: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + daysDelta);
    const newDateStr = current.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  const handleQuickAdd = (preset: typeof QUICK_PRESETS[0]) => {
    const newEntry: ActivityLogEntry = {
      id: `act-${Date.now()}`,
      date: selectedDate,
      title: preset.title,
      category: preset.category,
      durationMinutes: preset.defaultDuration,
      intensity: preset.intensity,
      timeOfDay: 'morning',
      feelingAfter: 'energized',
      timestamp: new Date().toISOString(),
    };

    HealthStorageService.addActivityLog(newEntry);
    const updated = HealthStorageService.getActivityLogsForDate(selectedDate);
    setActivities(updated);

    const feedback = `Logged ${preset.defaultDuration} minutes of ${preset.title}. Great job staying active!`;
    setVoiceFeedback(feedback);
    if (profile.soundEnabled) {
      SpeechService.speak(feedback, profile.voiceSpeed);
    }
  };

  const handleSaveModalActivity = () => {
    if (!title.trim()) return;

    const newEntry: ActivityLogEntry = {
      id: `act-${Date.now()}`,
      date: selectedDate,
      title: title.trim(),
      category,
      durationMinutes,
      intensity,
      timeOfDay,
      notes: notes.trim() || undefined,
      feelingAfter,
      timestamp: new Date().toISOString(),
    };

    HealthStorageService.addActivityLog(newEntry);
    const updated = HealthStorageService.getActivityLogsForDate(selectedDate);
    setActivities(updated);

    // Reset
    setTitle('');
    setNotes('');
    setIsAddModalOpen(false);

    const feedback = `Successfully logged ${durationMinutes} minutes of ${newEntry.title}.`;
    setVoiceFeedback(feedback);
    if (profile.soundEnabled) {
      SpeechService.speak(feedback, profile.voiceSpeed);
    }
  };

  const handleDeleteActivity = (id: string, actTitle: string) => {
    HealthStorageService.deleteActivityLog(selectedDate, id);
    const updated = HealthStorageService.getActivityLogsForDate(selectedDate);
    setActivities(updated);

    if (profile.soundEnabled) {
      SpeechService.speak(`Removed ${actTitle} from activity log.`, profile.voiceSpeed);
    }
  };

  // AI Voice parser for activities
  const handleProcessVoiceCommand = (cmd: string) => {
    const lower = cmd.toLowerCase();
    let detectedCategory: ActivityCategory = 'walking';
    let detectedTitle = 'Physical Activity';
    let detectedDuration = 30;

    // Check duration numbers
    const matchMins = lower.match(/(\d+)\s*(?:min|minute|minutes)/);
    if (matchMins) {
      detectedDuration = parseInt(matchMins[1], 10);
    }

    if (lower.includes('hike') || lower.includes('hiking') || lower.includes('trail')) {
      detectedCategory = 'hiking';
      detectedTitle = 'Nature Trail Hike 🥾';
    } else if (lower.includes('house') || lower.includes('cleaning') || lower.includes('chore') || lower.includes('repair') || lower.includes('garage') || lower.includes('diy') || lower.includes('home')) {
      detectedCategory = 'housework';
      detectedTitle = 'Working on the House 🏡';
    } else if (lower.includes('pickleball') || lower.includes('tennis') || lower.includes('sport')) {
      detectedCategory = 'sports';
      detectedTitle = 'Sports & Games 🎾';
    } else if (lower.includes('swim') || lower.includes('water')) {
      detectedCategory = 'swimming';
      detectedTitle = 'Swimming & Pool Aerobics 🏊';
    } else if (lower.includes('stretch') || lower.includes('yoga') || lower.includes('chair')) {
      detectedCategory = 'stretching';
      detectedTitle = 'Gentle Stretching 🧘';
    } else if (lower.includes('garden') || lower.includes('yard')) {
      detectedCategory = 'gardening';
      detectedTitle = 'Gardening 🌿';
    } else if (lower.includes('bike') || lower.includes('cycling')) {
      detectedCategory = 'cycling';
      detectedTitle = 'Cycling 🚴';
    } else if (lower.includes('dance') || lower.includes('dancing')) {
      detectedCategory = 'dancing';
      detectedTitle = 'Dancing 💃';
    } else {
      detectedCategory = 'walking';
      detectedTitle = 'Daily Walk 🚶';
    }

    const newAct: ActivityLogEntry = {
      id: `act-${Date.now()}`,
      date: selectedDate,
      title: detectedTitle,
      category: detectedCategory,
      durationMinutes: detectedDuration,
      intensity: 'moderate',
      timeOfDay: 'morning',
      feelingAfter: 'energized',
      timestamp: new Date().toISOString(),
    };

    HealthStorageService.addActivityLog(newAct);
    const updated = HealthStorageService.getActivityLogsForDate(selectedDate);
    setActivities(updated);

    const feedback = `Logged ${detectedDuration} minutes of ${detectedTitle}.`;
    setVoiceFeedback(feedback);
    if (profile.soundEnabled) {
      SpeechService.speak(feedback, profile.voiceSpeed);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setVoiceFeedback('Listening to your activity...');

    SpeechService.startListening(
      (text, isFinal) => {
        if (isFinal) {
          setIsListening(false);
          handleProcessVoiceCommand(text);
        }
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const activityList = Array.isArray(activities) ? activities : [];
  const totalMinutes = activityList.reduce((acc, a) => acc + (a?.durationMinutes || 0), 0);
  const targetMinutes = 30; // standard daily senior exercise goal
  const progressPercent = Math.min(100, Math.round((totalMinutes / targetMinutes) * 100));

  const isToday = selectedDate === todayStr;
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDateTitle = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto my-3 sm:my-6 space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Senior Weather & Air Quality Health Advisory */}
      <WeatherHealthCard />

      {/* Top Banner & Date Navigator */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-teal-800 bg-teal-100 px-3 py-1 rounded-full">
                Physical Activities Tracker
              </span>
              {isToday && (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  Today
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2 sm:gap-3">
              <Footprints className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 flex-shrink-0" />
              <span>Physical Activities & Exercise Log</span>
            </h2>
          </div>

          {/* Log Custom Activity Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-teal-200 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Log Custom Activity
          </button>
        </div>

        {/* Date Navigator Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 sm:pt-6">
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2 sm:p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 font-bold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
              title="Go back to previous day"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline text-xs sm:text-sm font-bold">Previous</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 rounded-2xl border-2 border-slate-200 flex-1 sm:flex-initial justify-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 flex-shrink-0" />
              <span className="text-xs sm:text-base font-extrabold text-slate-900 text-center truncate">
                {formattedDateTitle}
              </span>
            </div>

            <button
              onClick={() => handleDateChange(1)}
              className="p-2 sm:p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 font-bold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
              title="Go to next day"
            >
              <span className="hidden sm:inline text-xs sm:text-sm font-bold">Next</span>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="w-full sm:w-auto px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs sm:text-sm rounded-xl border border-teal-300 transition-colors text-center"
            >
              Jump to Today
            </button>
          )}
        </div>
      </div>

      {/* AI Voice Assistant Quick Action Bar */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={handleToggleVoice}
            className={`p-2 sm:p-2.5 rounded-xl transition-all flex-shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-300'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title="Speak your activity"
          >
            {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
              <button
                onClick={() => SpeechService.speak(voiceFeedback || 'Say e.g. "45 min walk" or "30 min pickleball"', profile.voiceSpeed)}
                className="p-1 rounded-lg hover:bg-white/20 text-teal-200 hover:text-white transition-colors"
                title="Listen"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">Say it in AI</h4>
            </div>
            <p className="text-[11px] sm:text-xs text-teal-100 font-medium truncate">
              {voiceFeedback || 'Say e.g. "45 min walk" or "30 min pickleball"'}
            </p>
          </div>
        </div>

        {/* Quick Voice Chips */}
        <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleProcessVoiceCommand('I went for a 45 minute nature hike')}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] sm:text-xs font-bold transition-all"
          >
            "45 min Hike 🥾"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('I spent 40 minutes working on the house')}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] sm:text-xs font-bold transition-all"
          >
            "Housework 🏡"
          </button>
        </div>
      </div>

      {/* Daily Activity Scorecard */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200 text-center">
          <span className="text-xs font-extrabold text-teal-800 uppercase tracking-wider block">
            Total Active Time
          </span>
          <span className="text-3xl font-black text-teal-800 mt-1 block">
            {totalMinutes} <span className="text-sm font-bold">mins</span>
          </span>
          <span className="text-xs font-semibold text-teal-700">
            {totalMinutes >= targetMinutes ? '🎯 Goal Met!' : `${targetMinutes - totalMinutes} mins to 30m goal`}
          </span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
          <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">
            Sessions Logged
          </span>
          <span className="text-3xl font-black text-emerald-800 mt-1 block">
            {activities.length}
          </span>
          <span className="text-xs font-semibold text-emerald-700">Activities Completed</span>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
          <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider block">
            Daily Goal
          </span>
          <span className="text-3xl font-black text-amber-800 mt-1 block">
            {progressPercent}%
          </span>
          <span className="text-xs font-semibold text-amber-700">30 Min Daily Target</span>
        </div>

        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 text-center">
          <span className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider block">
            Energy Impact
          </span>
          <span className="text-3xl font-black text-indigo-800 mt-1 block flex items-center justify-center gap-1">
            <Trophy className="w-6 h-6 text-amber-500" />
            Active
          </span>
          <span className="text-xs font-semibold text-indigo-700">Health & Vitality</span>
        </div>
      </div>

      {/* Quick 1-Tap Log Cards */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            Quick 1-Tap Activity Presets
          </h3>
          <span className="text-xs font-semibold text-slate-500">Tap to instantly register for this date</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickAdd(p)}
              className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 flex flex-col justify-between h-28 ${p.bg} ${p.border}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{p.emoji}</span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white/80 text-slate-700 border">
                  +{p.defaultDuration} min
                </span>
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-sm leading-tight">{p.title}</p>
                <span className="text-[11px] font-semibold text-slate-500 capitalize">{p.intensity} pace</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Activities Logged on Selected Date */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-600" />
            Registered Activities for {formattedDateTitle}
          </h3>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {activities.length} Recorded
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-10 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <Footprints className="w-12 h-12 text-slate-400 mx-auto" />
            <p className="text-lg font-extrabold text-slate-700">No physical activities recorded for this day.</p>
            <p className="text-sm font-medium text-slate-500">
              Tap any quick preset above or click "Log Custom Activity" to register a hike, sport, or walk.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-teal-200 flex-shrink-0">
                    {act.category === 'hiking'
                      ? '🥾'
                      : act.category === 'housework'
                      ? '🏡'
                      : act.category === 'sports'
                      ? '🎾'
                      : act.category === 'swimming'
                      ? '🏊'
                      : act.category === 'stretching'
                      ? '🧘'
                      : act.category === 'gardening'
                      ? '🌿'
                      : act.category === 'cycling'
                      ? '🚴'
                      : '🚶'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-extrabold text-slate-900">{act.title}</h4>
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                        {act.durationMinutes} mins
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                      <span className="capitalize">Intensity: {act.intensity}</span>
                      <span>•</span>
                      <span className="capitalize">Time: {act.timeOfDay}</span>
                      {act.feelingAfter && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 flex items-center gap-1">
                            <Smile className="w-3.5 h-3.5" />
                            Felt {act.feelingAfter}
                          </span>
                        </>
                      )}
                    </div>

                    {act.notes && (
                      <p className="text-xs text-slate-600 mt-1 font-medium bg-white p-2 rounded-xl border border-slate-200">
                        "{act.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteActivity(act.id, act.title)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-white transition-colors self-end sm:self-center"
                  title="Remove activity entry"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Custom Activity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Footprints className="w-6 h-6 text-teal-600" />
                Log Physical Activity
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1">
                  Activity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hiking at Pine Trail, Pickleball Doubles, Swimming"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                    className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-teal-600 cursor-pointer"
                  >
                    <option value="hiking">Hiking 🥾</option>
                    <option value="housework">Working on the House 🏡</option>
                    <option value="sports">Sports 🎾</option>
                    <option value="walking">Walking 🚶</option>
                    <option value="stretching">Stretching / Yoga 🧘</option>
                    <option value="swimming">Swimming 🏊</option>
                    <option value="gardening">Gardening 🌿</option>
                    <option value="cycling">Cycling 🚴</option>
                    <option value="dancing">Dancing 💃</option>
                    <option value="strength">Strength / Balance 🏋️</option>
                    <option value="other">Other Activity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
                    className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1">
                    Intensity
                  </label>
                  <select
                    value={intensity}
                    onChange={(e) => setIntensity(e.target.value as ActivityIntensity)}
                    className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-teal-600 cursor-pointer"
                  >
                    <option value="gentle">Gentle / Relaxed</option>
                    <option value="moderate">Moderate</option>
                    <option value="vigorous">Vigorous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1">
                    Feeling After
                  </label>
                  <select
                    value={feelingAfter}
                    onChange={(e) => setFeelingAfter(e.target.value as any)}
                    className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-teal-600 cursor-pointer"
                  >
                    <option value="energized">Energized ⚡</option>
                    <option value="refreshed">Refreshed 🌸</option>
                    <option value="good">Good 😊</option>
                    <option value="tired">Tired 😴</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1">
                  Time of Day
                </label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
                  className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-teal-600 cursor-pointer"
                >
                  <option value="morning">Morning 🌅</option>
                  <option value="afternoon">Afternoon ☀️</option>
                  <option value="evening">Evening 🌆</option>
                  <option value="bedtime">Bedtime / Night 🌙</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Beautiful sunny morning, felt light on my feet"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-3 rounded-xl border-2 border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModalActivity}
                disabled={!title.trim()}
                className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold shadow-md flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Save Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
