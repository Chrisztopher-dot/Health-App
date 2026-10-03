import React, { useState, useEffect, useRef } from 'react';
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
  Volume2,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  X
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
  badgeColor: string;
  description: string;
}[] = [
  {
    title: 'Outdoor Walk',
    category: 'walking',
    defaultDuration: 30,
    intensity: 'gentle',
    emoji: '🚶',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    description: 'Brisk neighborhood walk for cardiovascular stamina',
  },
  {
    title: 'Nature Trail Hike',
    category: 'hiking',
    defaultDuration: 45,
    intensity: 'moderate',
    emoji: '🥾',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Scenic outdoor hike on park trails and paths',
  },
  {
    title: 'Working on the House',
    category: 'housework',
    defaultDuration: 40,
    intensity: 'moderate',
    emoji: '🏡',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Active chores, DIY home improvement & repairs',
  },
  {
    title: 'Yoga, Pilates & Stretch',
    category: 'stretching',
    defaultDuration: 20,
    intensity: 'gentle',
    emoji: '🧘',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description: 'Core strength, joint flexibility & mindful posture',
  },
  {
    title: 'Swimming / Water Aerobics',
    category: 'swimming',
    defaultDuration: 30,
    intensity: 'moderate',
    emoji: '🏊',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description: 'Low-impact full body resistance in the pool',
  },
  {
    title: 'Gardening & Yard Care',
    category: 'gardening',
    defaultDuration: 35,
    intensity: 'gentle',
    emoji: '🌿',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
    description: 'Planting, bending & light yard vitality',
  },
];

const SENIOR_EXERCISE_GUIDELINES = [
  {
    title: 'Daily Walking Routine',
    category: 'Cardiovascular',
    duration: '20–30 mins/day',
    bpImpact: 'Reduces systolic BP by 4–9 mmHg',
    description: 'Consistent walking enhances heart efficiency, improves circulation in leg arteries, and naturally stabilizes resting blood pressure.',
    tips: 'Wear cushioned supportive shoes, walk at a conversational pace, and stay hydrated.',
    emoji: '🚶‍♂️',
  },
  {
    title: 'Gentle Chair & Floor Stretching',
    category: 'Flexibility & Balance',
    duration: '10–15 mins/day',
    bpImpact: 'Reduces arterial stiffness & eases muscle tension',
    description: 'Stretching large muscle groups (calves, hamstrings, shoulders) prevents stiffness, improves balance, and reduces fall risk.',
    tips: 'Breathe smoothly throughout each stretch. Never bounce or force a stretch past comfort.',
    emoji: '🧘‍♀️',
  },
  {
    title: 'Water Aerobics & Swimming',
    category: 'Low-Impact Resistance',
    duration: '25–40 mins (2–3x/week)',
    bpImpact: 'Zero joint strain, full aerobic conditioning',
    description: 'Water buoyancy relieves pressure on hips and knees while providing natural soothing resistance for heart and muscles.',
    tips: 'Warm water pools are best for arthritis and joint comfort.',
    emoji: '🏊‍♂️',
  },
  {
    title: 'Active Housework & Gardening',
    category: 'Functional Movement',
    duration: '30–45 mins/day',
    bpImpact: 'Burns 120–180 kcal & promotes continuous mobility',
    description: 'Everyday functional tasks like sweeping, dusting, organizing, and gardening maintain coordination and everyday vitality.',
    tips: 'Take a 2-minute seated pause every 20 minutes to check your posture and sip water.',
    emoji: '🏡',
  },
];

export const ActivitiesTracker: React.FC<ActivitiesTrackerProps> = ({ profile }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'tracker' | 'trends' | 'guidelines'>('tracker');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Custom Log Modal
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ActivityCategory>('walking');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [intensity, setIntensity] = useState<ActivityIntensity>('moderate');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [notes, setNotes] = useState<string>('');
  const [feelingAfter, setFeelingAfter] = useState<ActivityLogEntry['feelingAfter']>('energized');

  const stopListeningRef = useRef<(() => void) | null>(null);

  // Load activities for selected date
  const loadActivitiesForDate = (date: string) => {
    try {
      const list = HealthStorageService.getActivityLogsForDate(date);
      setActivities(Array.isArray(list) ? list : []);
    } catch {
      setActivities([]);
    }
  };

  useEffect(() => {
    loadActivitiesForDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (stopListeningRef.current) {
        stopListeningRef.current();
      }
      SpeechService.stopSpeaking();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleDateChange = (daysDelta: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + daysDelta);
    const newDateStr = current.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  // 1-Tap Quick Preset Logging
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
    loadActivitiesForDate(selectedDate);

    const feedback = `Logged ${preset.defaultDuration} mins of ${preset.title}!`;
    showToast(`✓ Logged ${preset.title} (+${preset.defaultDuration} mins)`);
    setVoiceFeedback(feedback);

    if (profile.soundEnabled) {
      SpeechService.speak(feedback, profile.voiceSpeed);
    }
  };

  // Save Modal Activity
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
    loadActivitiesForDate(selectedDate);

    // Reset form
    setTitle('');
    setNotes('');
    setIsAddModalOpen(false);

    showToast(`✓ Added ${newEntry.title} (${durationMinutes} mins)`);
    const feedback = `Successfully logged ${durationMinutes} minutes of ${newEntry.title}.`;
    setVoiceFeedback(feedback);

    if (profile.soundEnabled) {
      SpeechService.speak(feedback, profile.voiceSpeed);
    }
  };

  // Delete Activity
  const handleDeleteActivity = (id: string, actTitle: string) => {
    HealthStorageService.deleteActivityLog(selectedDate, id);
    loadActivitiesForDate(selectedDate);
    showToast(`Removed "${actTitle}"`);

    if (profile.soundEnabled) {
      SpeechService.speak(`Removed ${actTitle} from activity log.`, profile.voiceSpeed);
    }
  };

  // AI Voice parser for spoken activity logging
  const handleProcessVoiceCommand = (cmd: string) => {
    const lower = cmd.toLowerCase();
    let detectedCategory: ActivityCategory = 'walking';
    let detectedTitle = 'Daily Physical Activity';
    let detectedDuration = 30;

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
    } else if (lower.includes('stretch') || lower.includes('yoga') || lower.includes('pilates') || lower.includes('chair')) {
      detectedCategory = 'stretching';
      detectedTitle = 'Yoga, Pilates & Stretch 🧘';
    } else if (lower.includes('garden') || lower.includes('yard')) {
      detectedCategory = 'gardening';
      detectedTitle = 'Gardening & Yard Care 🌿';
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
    loadActivitiesForDate(selectedDate);

    const feedback = `Voice recorded: ${detectedDuration} mins of ${detectedTitle}.`;
    showToast(`✓ Voice Logged: ${detectedTitle} (${detectedDuration} mins)`);
    setVoiceFeedback(feedback);

    if (profile.soundEnabled) {
      SpeechService.speak(feedback, profile.voiceSpeed);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setVoiceFeedback('Listening... Say e.g. "45 min hike" or "30 min walk"');

    const stopFn = SpeechService.startListening(
      (text, isFinal) => {
        if (isFinal) {
          setIsListening(false);
          handleProcessVoiceCommand(text);
        }
      },
      (errorMsg) => {
        console.warn('Voice recognition error:', errorMsg);
        setIsListening(false);
        setVoiceFeedback('Could not hear clearly. Tap a preset or type to log.');
      },
      () => {
        setIsListening(false);
      }
    );

    stopListeningRef.current = stopFn;
  };

  // Calculations
  const activityList = Array.isArray(activities) ? activities : [];
  const totalMinutes = activityList.reduce((acc, a) => acc + (a?.durationMinutes || 0), 0);
  const targetMinutes = 30; // standard daily healthy exercise goal
  const progressPercent = Math.min(100, Math.round((totalMinutes / targetMinutes) * 100));
  const isToday = selectedDate === todayStr;

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDateTitle = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Calculate Last 7 Days Activity Data for Trends
  const allLogs = HealthStorageService.getAllActivityLogs();
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().split('T')[0];
    const dayActs = allLogs[dStr] || [];
    const mins = dayActs.reduce((sum, item) => sum + (item.durationMinutes || 0), 0);
    return {
      date: dStr,
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: mins,
      goalMet: mins >= targetMinutes,
      count: dayActs.length,
    };
  });

  const weeklyTotalMinutes = last7Days.reduce((acc, d) => acc + d.minutes, 0);
  const weeklyDaysActive = last7Days.filter((d) => d.minutes > 0).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-teal-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-xl border border-teal-400 flex items-center gap-2 animate-slideUp">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header & Daily Progress Banner */}
      <div className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-emerald-950/70 border border-teal-500/30 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Physical Health & Vitality
              </span>
              {isToday && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Today
                </span>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Footprints className="w-8 h-8 text-teal-400 flex-shrink-0" />
              <span>Physical Activities & Exercise Log</span>
            </h1>
            
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Track nature walks, stretching, swimming, and home chores. Consistent low-impact movement naturally helps optimize blood pressure and daily energy.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-teal-900/40 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Log Custom Activity</span>
            </button>

            <button
              onClick={handleToggleVoice}
              className={`p-2.5 sm:p-3 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-bold transition-all ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700'
              }`}
              title={isListening ? 'Stop Voice Input' : 'Speak your activity'}
            >
              {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-teal-400" />}
              <span>{isListening ? 'Listening...' : 'Voice Log'}</span>
            </button>
          </div>
        </div>

        {/* Date Navigator Bar */}
        <div className="mt-6 pt-5 border-t border-teal-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all active:scale-95"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-100">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span className="text-xs sm:text-sm font-black">{formattedDateTitle}</span>
            </div>

            <button
              onClick={() => handleDateChange(1)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all active:scale-95"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-2.5 py-1 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold border border-teal-500/40 transition-colors ml-1"
              >
                Today
              </button>
            )}
          </div>

          {/* Daily Progress Counter */}
          <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 px-4 py-2 rounded-2xl">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400">Daily Target: 30 mins</div>
              <div className="text-sm font-black text-teal-300">
                {totalMinutes} / {targetMinutes} mins ({progressPercent}%)
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-teal-500 flex items-center justify-center font-black text-xs text-teal-300">
              {progressPercent >= 100 ? '✓' : `${progressPercent}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Voice Assistant Feedback Banner when active */}
      {voiceFeedback && (
        <div className="p-3.5 rounded-2xl bg-teal-950/60 border border-teal-500/40 flex items-center justify-between text-teal-200 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span>{voiceFeedback}</span>
          </div>
          <button
            onClick={() => SpeechService.speak(voiceFeedback, profile.voiceSpeed)}
            className="p-1 text-teal-300 hover:text-white rounded transition-colors"
            title="Read aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Segment Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'tracker'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Footprints className="w-4 h-4" />
          <span>Daily Activity Log</span>
          {activities.length > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-white/20 text-white">
              {activities.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'trends'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>7-Day Trends & Vitality</span>
        </button>

        <button
          onClick={() => setActiveTab('guidelines')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'guidelines'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Senior Exercise & Weather Guide</span>
        </button>
      </div>

      {/* VIEW 1: Daily Activity Log & 1-Tap Presets */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          {/* Quick 1-Tap Activity Presets */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  Quick 1-Tap Activity Presets
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                Tap to instantly log for {formattedDateTitle}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {QUICK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAdd(p)}
                  className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-500/40 text-left transition-all active:scale-95 flex flex-col justify-between h-28 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl">{p.emoji}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
                      +{p.defaultDuration}m
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-100 text-xs sm:text-sm leading-tight group-hover:text-teal-300 transition-colors truncate">
                      {p.title}
                    </p>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {p.intensity} pace
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Registered Activities List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  Logged Activities for {formattedDateTitle}
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                {activities.length} Recorded
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-10 space-y-3 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                <Footprints className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm sm:text-base font-bold text-slate-300">
                  No physical activities logged for this date.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tap any preset card above or click "+ Log Custom Activity" to register walks, hikes, gardening, or housework.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/50 transition-all flex items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center font-black text-xl flex-shrink-0 shadow-md">
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
                          : act.category === 'dancing'
                          ? '💃'
                          : '🚶'}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-black text-white truncate">
                            {act.title}
                          </h4>
                          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                            {act.durationMinutes} mins
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 flex-wrap">
                          <span className="capitalize">{act.intensity} intensity</span>
                          <span>•</span>
                          <span className="capitalize">{act.timeOfDay}</span>
                          {act.feelingAfter && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                                <Smile className="w-3.5 h-3.5" /> Felt {act.feelingAfter}
                              </span>
                            </>
                          )}
                        </div>

                        {act.notes && (
                          <p className="text-xs text-slate-300 italic pt-0.5">
                            "{act.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteActivity(act.id, act.title)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors flex-shrink-0"
                      title="Remove activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: 7-Day Trends & Vitality Scorecard */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* 7-Day Visual Bar Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                  <span>7-Day Active Minutes Overview</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daily target: 30 minutes of low-impact or moderate movement
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="text-teal-300">Total: {weeklyTotalMinutes} mins</span>
                <span className="text-emerald-300">Active Days: {weeklyDaysActive} / 7</span>
              </div>
            </div>

            {/* Bar Chart Visualizer */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end pt-4 pb-2 min-h-[180px]">
              {last7Days.map((day, idx) => {
                const heightPercent = Math.min(100, Math.max(12, Math.round((day.minutes / 60) * 100)));
                const isGoalMet = day.minutes >= targetMinutes;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-black text-slate-300">
                      {day.minutes > 0 ? `${day.minutes}m` : '-'}
                    </span>

                    <div className="w-full bg-slate-950 rounded-2xl h-36 flex items-end p-1 border border-slate-800">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-xl transition-all duration-500 ${
                          isGoalMet
                            ? 'bg-gradient-to-t from-teal-600 to-emerald-400 shadow-md shadow-teal-900/40'
                            : day.minutes > 0
                            ? 'bg-gradient-to-t from-teal-800 to-teal-600'
                            : 'bg-slate-800/40'
                        }`}
                      />
                    </div>

                    <span className="text-[11px] font-bold text-slate-400">
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 Health Impact Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-center space-y-1">
              <span className="text-xs font-bold text-teal-400 block">Weekly Active Time</span>
              <span className="text-2xl sm:text-3xl font-black text-white block">
                {weeklyTotalMinutes} <span className="text-xs text-teal-300">mins</span>
              </span>
              <span className="text-[11px] text-teal-200/80">
                {weeklyTotalMinutes >= 150 ? '🏆 150m AHA Goal Met!' : `${Math.max(0, 150 - weeklyTotalMinutes)}m to weekly goal`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-1">
              <span className="text-xs font-bold text-emerald-400 block">Active Consistency</span>
              <span className="text-2xl sm:text-3xl font-black text-white block">
                {weeklyDaysActive} / 7
              </span>
              <span className="text-[11px] text-emerald-200/80">Active routine days</span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-1">
              <span className="text-xs font-bold text-indigo-400 block">Blood Pressure Impact</span>
              <span className="text-2xl sm:text-3xl font-black text-white block">
                -5 mmHg
              </span>
              <span className="text-[11px] text-indigo-200/80">Estimated arterial benefit</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center space-y-1">
              <span className="text-xs font-bold text-amber-400 block">Vitality & Mood</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 block flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5 text-amber-400" />
                Active
              </span>
              <span className="text-[11px] text-amber-200/80">Optimal daily stamina</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Senior Exercise & Outdoor Weather Guide */}
      {activeTab === 'guidelines' && (
        <div className="space-y-6">
          {/* Senior Weather Card Component */}
          <WeatherHealthCard />

          {/* Exercise Guidelines Cards */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                <span>Senior-Friendly Movement & Blood Pressure Guidelines</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evidence-based low-impact exercises recommended for healthy longevity and cardiovascular health.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SENIOR_EXERCISE_GUIDELINES.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/30 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.emoji}</span>
                      <div>
                        <h4 className="text-sm font-black text-white">{item.title}</h4>
                        <span className="text-[10px] text-teal-400 font-bold">{item.category}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {item.duration}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-teal-950/50 border border-teal-500/20 text-[11px] text-teal-200">
                    <strong>Cardio Benefit:</strong> {item.bpImpact}
                  </div>

                  <div className="text-[11px] text-slate-400 pt-0.5">
                    💡 <em>Tip: {item.tips}</em>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Log Custom Activity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-7 space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Footprints className="w-5 h-5 text-teal-400" />
                <span>Log Physical Activity</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Activity Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Activity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning Trail Hike, Pickleball Doubles, House Chores"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm p-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 font-semibold focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Category & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                    className="w-full text-sm p-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:border-teal-500 cursor-pointer"
                  >
                    <option value="walking">Walking 🚶</option>
                    <option value="hiking">Hiking & Nature Trail 🥾</option>
                    <option value="housework">Working on the House 🏡</option>
                    <option value="stretching">Yoga, Pilates & Stretch 🧘</option>
                    <option value="swimming">Swimming & Pool 🏊</option>
                    <option value="gardening">Gardening & Yard 🌿</option>
                    <option value="sports">Sports & Pickleball 🎾</option>
                    <option value="cycling">Cycling 🚴</option>
                    <option value="dancing">Dancing 💃</option>
                    <option value="strength">Strength & Balance 🏋️</option>
                    <option value="other">Other Activity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Duration (Minutes)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
                      className="w-full text-sm p-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:border-teal-500"
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(15)}
                        className="px-2 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                      >
                        15m
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(30)}
                        className="px-2 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                      >
                        30m
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(45)}
                        className="px-2 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                      >
                        45m
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intensity & Feeling */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Intensity
                  </label>
                  <select
                    value={intensity}
                    onChange={(e) => setIntensity(e.target.value as ActivityIntensity)}
                    className="w-full text-sm p-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:border-teal-500 cursor-pointer"
                  >
                    <option value="gentle">Gentle / Relaxed</option>
                    <option value="moderate">Moderate (Standard)</option>
                    <option value="vigorous">Vigorous (Active)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Feeling After
                  </label>
                  <select
                    value={feelingAfter}
                    onChange={(e) => setFeelingAfter(e.target.value as any)}
                    className="w-full text-sm p-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:border-teal-500 cursor-pointer"
                  >
                    <option value="energized">Energized ⚡</option>
                    <option value="refreshed">Refreshed 🌸</option>
                    <option value="good">Good 😊</option>
                    <option value="tired">Tired 😴</option>
                  </select>
                </div>
              </div>

              {/* Time of Day */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Time of Day
                </label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
                  className="w-full text-sm p-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:border-teal-500 cursor-pointer"
                >
                  <option value="morning">Morning 🌅</option>
                  <option value="afternoon">Afternoon ☀️</option>
                  <option value="evening">Evening 🌆</option>
                  <option value="bedtime">Bedtime / Night 🌙</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Personal Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sunny morning, walked with neighbor, heart rate steady"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm p-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 font-semibold focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 font-bold text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModalActivity}
                disabled={!title.trim()}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Save Activity</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
