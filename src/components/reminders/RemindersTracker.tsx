import React, { useState, useEffect } from 'react';
import { UserProfile, ReminderItem, ReminderPriority } from '../../types/health';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Sparkles, 
  Mic, 
  MicOff, 
  Calendar, 
  Clock, 
  Volume2, 
  Filter,
  Check,
  ClipboardList
} from 'lucide-react';

interface RemindersTrackerProps {
  profile: UserProfile;
}

const QUICK_PRESETS: {
  title: string;
  priority: ReminderPriority;
  dueTime?: string;
  notes?: string;
  emoji: string;
}[] = [
  {
    title: 'Housework (Chores / Tidy Up)',
    priority: 'less_urgent',
    dueTime: 'Afternoon',
    notes: 'Home cleaning, laundry, organizing, or light maintenance.',
    emoji: '🏡',
  },
  {
    title: 'Pick up Fresh Groceries & Fruit',
    priority: 'less_urgent',
    dueTime: '11:00 AM',
    notes: 'Bananas, oatmeal, berries, greens, and healthy pantry items.',
    emoji: '🛒',
  },
  {
    title: 'Call Family & Loved Ones',
    priority: 'less_urgent',
    dueTime: '04:00 PM',
    notes: 'Catch up on weekend plans and family news.',
    emoji: '📞',
  },
  {
    title: 'Water the Houseplants & Garden',
    priority: 'less_urgent',
    dueTime: 'Morning',
    notes: 'Give extra water to outdoor potted plants and garden beds.',
    emoji: '🌿',
  },
  {
    title: 'Evening Neighborhood Walk in Fresh Air',
    priority: 'less_urgent',
    dueTime: '05:30 PM',
    notes: 'Enjoy 20-30 minutes of gentle fresh air stroll.',
    emoji: '🚶',
  },
  {
    title: 'Morning Gentle Stretch & Mobility',
    priority: 'less_urgent',
    dueTime: '08:00 AM',
    notes: 'Light shoulder rolls, back stretch, and ankle rotations.',
    emoji: '🧘',
  },
  {
    title: 'Daily Hydration Goal Check',
    priority: 'less_urgent',
    dueTime: '02:00 PM',
    notes: 'Keep a full water pitcher nearby and enjoy herbal tea.',
    emoji: '💧',
  },
];

export const RemindersTracker: React.FC<RemindersTrackerProps> = ({ profile }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'urgent' | 'less_urgent'>('all');
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  
  // Fast Inline Add Bar State
  const [fastTitle, setFastTitle] = useState<string>('');
  const [fastPriority, setFastPriority] = useState<ReminderPriority>('urgent');

  // Detailed Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalPriority, setModalPriority] = useState<ReminderPriority>('urgent');
  const [modalDueDate, setModalDueDate] = useState<string>(todayStr);
  const [modalDueTime, setModalDueTime] = useState<string>('');
  const [modalNotes, setModalNotes] = useState<string>('');

  // Voice AI State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = () => {
    const list = HealthStorageService.getAllReminders();
    setReminders([...list]);
  };

  const handleToggleReminder = (id: string, reminderTitle: string, currentCompleted: boolean) => {
    HealthStorageService.toggleReminder(id);
    loadReminders();

    const action = !currentCompleted ? 'Completed' : 'Marked as not completed';
    if (profile.soundEnabled) {
      SpeechService.speak(`${action}: ${reminderTitle}`, profile.voiceSpeed);
    }
  };

  const handleDeleteReminder = (id: string, reminderTitle: string) => {
    HealthStorageService.deleteReminder(id);
    loadReminders();

    if (profile.soundEnabled) {
      SpeechService.speak(`Removed ${reminderTitle} from reminders.`, profile.voiceSpeed);
    }
  };

  const handleFastAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fastTitle.trim()) return;

    const newItem: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: fastTitle.trim(),
      priority: fastPriority,
      dueDate: todayStr,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newItem);
    loadReminders();
    setFastTitle('');

    const feedback = `Added ${fastPriority === 'urgent' ? 'urgent' : 'less urgent'} reminder: ${newItem.title}`;
    setVoiceFeedback(feedback);
    if (profile.soundEnabled) {
      SpeechService.speak(feedback, profile.voiceSpeed);
    }
  };

  const handleSaveModal = () => {
    if (!modalTitle.trim()) return;

    const newItem: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: modalTitle.trim(),
      priority: modalPriority,
      dueDate: modalDueDate || todayStr,
      dueTime: modalDueTime.trim() || undefined,
      notes: modalNotes.trim() || undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newItem);
    loadReminders();

    // Reset Modal
    setModalTitle('');
    setModalNotes('');
    setModalDueTime('');
    setIsModalOpen(false);

    const feedback = `Added ${modalPriority === 'urgent' ? 'urgent' : 'less urgent'} reminder: ${newItem.title}`;
    setVoiceFeedback(feedback);
    if (profile.soundEnabled) {
      SpeechService.speak(feedback, profile.voiceSpeed);
    }
  };

  const handleQuickAddPreset = (preset: typeof QUICK_PRESETS[0]) => {
    const newItem: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: preset.title,
      priority: preset.priority,
      dueDate: todayStr,
      dueTime: preset.dueTime,
      notes: preset.notes,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newItem);
    loadReminders();

    const feedback = `Added reminder: ${preset.title} (${preset.priority === 'urgent' ? 'Urgent' : 'Less Urgent'})`;
    setVoiceFeedback(feedback);
    if (profile.soundEnabled) {
      SpeechService.speak(feedback, profile.voiceSpeed);
    }
  };

  // AI Voice parser for reminders
  const handleProcessVoiceCommand = (cmd: string) => {
    const lower = cmd.toLowerCase();

    // Check if user is marking something as done
    if (lower.startsWith('mark ') || lower.startsWith('done ') || lower.startsWith('complete ')) {
      const match = reminders.find((r) => !r.completed && lower.includes(r.title.toLowerCase().substring(0, 10)));
      if (match) {
        handleToggleReminder(match.id, match.title, false);
        setVoiceFeedback(`Marked "${match.title}" as completed.`);
        return;
      }
    }

    // Determine priority
    let detectedPriority: ReminderPriority = 'less_urgent';
    const isUrgentKeywords = [
      'urgent', 'doctor', 'physician', 'hospital', 'appointment', 'emergency',
      'prescription', 'refill', 'medication', 'pills', 'medicine', 'blood pressure',
      'critical', 'important', 'test', 'dentist', 'clinic', 'asap'
    ];

    if (isUrgentKeywords.some((kw) => lower.includes(kw))) {
      detectedPriority = 'urgent';
    }

    // Clean title
    let cleanTitle = cmd
      .replace(/^(remind me to|add a reminder to|add reminder to|add urgent reminder to|add less urgent reminder to|don't let me forget to|please remind me to|set reminder for|remember to)\s+/i, '')
      .replace(/\s*\((urgent|less urgent)\)$/i, '')
      .trim();

    if (!cleanTitle) {
      cleanTitle = 'Important reminder';
    }

    // Capitalize first letter
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    const newItem: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: cleanTitle,
      priority: detectedPriority,
      dueDate: todayStr,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newItem);
    loadReminders();

    const feedback = `Added ${detectedPriority === 'urgent' ? 'urgent' : 'less urgent'} reminder: "${cleanTitle}".`;
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
    setVoiceFeedback('Listening to your reminder...');

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

  const urgentList = reminders.filter((r) => r.priority === 'urgent');
  const lessUrgentList = reminders.filter((r) => r.priority === 'less_urgent');

  const activeUrgentCount = urgentList.filter((r) => !r.completed).length;
  const activeLessUrgentCount = lessUrgentList.filter((r) => !r.completed).length;
  const completedCount = reminders.filter((r) => r.completed).length;

  const filteredUrgent = urgentList.filter((r) => showCompleted || !r.completed);
  const filteredLessUrgent = lessUrgentList.filter((r) => showCompleted || !r.completed);

  return (
    <div className="max-w-5xl mx-auto my-3 sm:my-6 space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full">
                To-Do & Memory List
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {reminders.length} Total Items
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2 sm:gap-3">
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 flex-shrink-0" />
              <span>Reminders</span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Keep track of important things to not forget, organized into <strong className="text-rose-700">Urgent</strong> and <strong className="text-indigo-700">Less Urgent</strong> categories.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Detailed Reminder
          </button>
        </div>

        {/* Quick Add Inline Bar */}
        <form onSubmit={handleFastAdd} className="pt-4 sm:pt-6">
          <label className="block text-xs sm:text-sm font-extrabold text-slate-700 mb-2">
            Quick Add Something Not to Forget:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex items-center rounded-2xl border-2 border-slate-300 bg-slate-50 p-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setFastPriority('urgent')}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                  fastPriority === 'urgent'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>🚨 Urgent</span>
              </button>
              <button
                type="button"
                onClick={() => setFastPriority('less_urgent')}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                  fastPriority === 'less_urgent'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>📝 Less Urgent</span>
              </button>
            </div>

            <input
              type="text"
              value={fastTitle}
              onChange={(e) => setFastTitle(e.target.value)}
              placeholder="e.g. Call pharmacy for prescription, Water tomatoes..."
              className="flex-1 text-sm sm:text-lg p-3 sm:p-3.5 rounded-2xl border-2 border-slate-300 focus:border-indigo-600 focus:outline-none font-semibold bg-slate-50"
            />

            <button
              type="submit"
              disabled={!fastTitle.trim()}
              className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>

      {/* AI Voice Assistant Quick Action Bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-3 sm:p-3.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={handleToggleVoice}
            className={`p-2 sm:p-2.5 rounded-xl transition-all flex-shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-300'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title="Speak your reminder"
          >
            {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
              <button
                onClick={() => SpeechService.speak(voiceFeedback || 'Say e.g. "Call doctor tomorrow" or "Water plants"', profile.voiceSpeed)}
                className="p-1 rounded-lg hover:bg-white/20 text-indigo-200 hover:text-white transition-colors"
                title="Listen"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">Say it in AI</h4>
            </div>
            <p className="text-[11px] sm:text-xs text-indigo-100 font-medium truncate">
              {voiceFeedback || 'Say e.g. "Call doctor tomorrow" or "Water plants"'}
            </p>
          </div>
        </div>

        {/* Quick Voice Chips */}
        <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleProcessVoiceCommand('Add urgent reminder to call Dr. Miller for test results')}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] sm:text-xs font-bold transition-all"
          >
            "🚨 Call Doctor"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('Add less urgent reminder to buy fresh fruit and vitamins')}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] sm:text-xs font-bold transition-all"
          >
            "📝 Buy Groceries"
          </button>
        </div>
      </div>

      {/* Reminders Scorecard Overview */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-center">
          <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider block">
            🚨 Urgent Tasks
          </span>
          <span className="text-3xl font-black text-rose-800 mt-1 block">
            {activeUrgentCount}
          </span>
          <span className="text-xs font-semibold text-rose-700">Need Attention</span>
        </div>

        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 text-center">
          <span className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider block">
            📝 Less Urgent
          </span>
          <span className="text-3xl font-black text-indigo-800 mt-1 block">
            {activeLessUrgentCount}
          </span>
          <span className="text-xs font-semibold text-indigo-700">Routine & Chores</span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
          <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">
            ✅ Completed
          </span>
          <span className="text-3xl font-black text-emerald-800 mt-1 block">
            {completedCount}
          </span>
          <span className="text-xs font-semibold text-emerald-700">Done & Checked</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center flex flex-col justify-center">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
            Display Options
          </span>
          <label className="flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            Show Completed
          </label>
        </div>
      </div>

      {/* Quick 1-Tap Preset Cards */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Quick 1-Tap Common Reminders
          </h3>
          <span className="text-xs font-semibold text-slate-500">Tap to add directly to your list</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUICK_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickAddPreset(p)}
              className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 flex flex-col justify-between h-28 ${
                p.priority === 'urgent'
                  ? 'bg-rose-50/70 hover:bg-rose-100/80 border-rose-200'
                  : 'bg-indigo-50/70 hover:bg-indigo-100/80 border-indigo-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{p.emoji}</span>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  p.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {p.priority === 'urgent' ? '🚨 Urgent' : '📝 Less Urgent'}
                </span>
              </div>
              <p className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight line-clamp-2">
                {p.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 ${
            activeCategoryFilter === 'all'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>All ({reminders.length})</span>
        </button>

        <button
          onClick={() => setActiveCategoryFilter('urgent')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 ${
            activeCategoryFilter === 'urgent'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white text-rose-800 border-2 border-rose-200 hover:bg-rose-50'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>🚨 Urgent ({activeUrgentCount})</span>
        </button>

        <button
          onClick={() => setActiveCategoryFilter('less_urgent')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 ${
            activeCategoryFilter === 'less_urgent'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-indigo-800 border-2 border-indigo-200 hover:bg-indigo-50'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>📝 Less Urgent ({activeLessUrgentCount})</span>
        </button>
      </div>

      {/* SECTION 1: URGENT CATEGORY */}
      {(activeCategoryFilter === 'all' || activeCategoryFilter === 'urgent') && (
        <div className="bg-white rounded-3xl border-2 border-rose-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-rose-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-rose-950">
                  🚨 Urgent Reminders & Appointments
                </h3>
                <p className="text-xs font-semibold text-rose-800/80">
                  Doctor visits, prescription refills, and critical tasks
                </p>
              </div>
            </div>

            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
              {urgentList.filter((r) => !r.completed).length} Pending
            </span>
          </div>

          {filteredUrgent.length === 0 ? (
            <div className="text-center py-8 bg-rose-50/40 rounded-2xl border border-dashed border-rose-200 space-y-2">
              <Check className="w-10 h-10 text-rose-400 mx-auto" />
              <p className="text-base font-extrabold text-rose-900">No pending urgent reminders!</p>
              <p className="text-xs text-rose-700">You are all caught up on critical health and medical tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUrgent.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    item.completed
                      ? 'bg-slate-50/80 border-slate-200 opacity-60'
                      : 'bg-rose-50/40 border-rose-200 hover:border-rose-400 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() => handleToggleReminder(item.id, item.title, item.completed)}
                      className={`p-1.5 rounded-xl border-2 transition-all mt-0.5 flex-shrink-0 ${
                        item.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-rose-300 text-rose-400 hover:border-rose-600 hover:text-rose-600'
                      }`}
                      title={item.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-lg sm:text-xl font-extrabold text-slate-900 ${
                          item.completed ? 'line-through text-slate-500' : ''
                        }`}>
                          {item.title}
                        </h4>
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          🚨 Urgent
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                        {item.dueDate && (
                          <span className="flex items-center gap-1 text-rose-800">
                            <Calendar className="w-3.5 h-3.5" />
                            {item.dueDate === todayStr ? 'Today' : item.dueDate}
                          </span>
                        )}
                        {item.dueTime && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {item.dueTime}
                            </span>
                          </>
                        )}
                        {item.completedAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700">
                              Completed {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-700 mt-2 font-medium bg-white p-2.5 rounded-xl border border-rose-100">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => SpeechService.speak(item.title, profile.voiceSpeed)}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-white transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleDeleteReminder(item.id, item.title)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-white transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: LESS URGENT CATEGORY */}
      {(activeCategoryFilter === 'all' || activeCategoryFilter === 'less_urgent') && (
        <div className="bg-white rounded-3xl border-2 border-indigo-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-indigo-950">
                  📝 Less Urgent Reminders & Routine Tasks
                </h3>
                <p className="text-xs font-semibold text-indigo-800/80">
                  Household chores, watering plants, grocery lists, and family calls
                </p>
              </div>
            </div>

            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
              {lessUrgentList.filter((r) => !r.completed).length} Pending
            </span>
          </div>

          {filteredLessUrgent.length === 0 ? (
            <div className="text-center py-8 bg-indigo-50/40 rounded-2xl border border-dashed border-indigo-200 space-y-2">
              <Check className="w-10 h-10 text-indigo-400 mx-auto" />
              <p className="text-base font-extrabold text-indigo-900">No pending routine reminders!</p>
              <p className="text-xs text-indigo-700">Add things to do or water plants using the quick add bar above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLessUrgent.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    item.completed
                      ? 'bg-slate-50/80 border-slate-200 opacity-60'
                      : 'bg-indigo-50/30 border-indigo-200 hover:border-indigo-400 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() => handleToggleReminder(item.id, item.title, item.completed)}
                      className={`p-1.5 rounded-xl border-2 transition-all mt-0.5 flex-shrink-0 ${
                        item.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-indigo-300 text-indigo-400 hover:border-indigo-600 hover:text-indigo-600'
                      }`}
                      title={item.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-lg sm:text-xl font-extrabold text-slate-900 ${
                          item.completed ? 'line-through text-slate-500' : ''
                        }`}>
                          {item.title}
                        </h4>
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                          📝 Less Urgent
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                        {item.dueDate && (
                          <span className="flex items-center gap-1 text-indigo-800">
                            <Calendar className="w-3.5 h-3.5" />
                            {item.dueDate === todayStr ? 'Today' : item.dueDate}
                          </span>
                        )}
                        {item.dueTime && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {item.dueTime}
                            </span>
                          </>
                        )}
                        {item.completedAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700">
                              Completed {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-700 mt-2 font-medium bg-white p-2.5 rounded-xl border border-indigo-100">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => SpeechService.speak(item.title, profile.voiceSpeed)}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-white transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleDeleteReminder(item.id, item.title)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-white transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Custom Detailed Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-indigo-600" />
                Add Detailed Reminder
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1">
                  What would you like not to forget?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule cardiologist appointment with Dr. Miller"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1">
                  Category & Priority
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalPriority('urgent')}
                    className={`p-3.5 rounded-2xl font-extrabold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                      modalPriority === 'urgent'
                        ? 'bg-rose-50 border-rose-600 text-rose-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    🚨 Urgent
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalPriority('less_urgent')}
                    className={`p-3.5 rounded-2xl font-extrabold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                      modalPriority === 'less_urgent'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <ClipboardList className="w-5 h-5 text-indigo-600" />
                    📝 Less Urgent
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={modalDueDate}
                    onChange={(e) => setModalDueDate(e.target.value)}
                    className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1">
                    Time / Window (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 AM or Morning"
                    value={modalDueTime}
                    onChange={(e) => setModalDueTime(e.target.value)}
                    className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bring health insurance card and latest blood pressure reading log."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-indigo-600 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-3 rounded-xl border-2 border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModal}
                disabled={!modalTitle.trim()}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold shadow-md flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
