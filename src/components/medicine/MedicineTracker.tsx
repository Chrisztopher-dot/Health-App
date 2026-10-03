import React, { useState, useEffect } from 'react';
import { UserProfile, MedicationItem, MedicationLogEntry, TimeOfDay } from '../../types/health';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import { 
  Pill, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles, 
  Mic, 
  MicOff, 
  Sun, 
  Sunset, 
  Moon, 
  Sunrise,
  Check,
  Volume2,
  CalendarDays
} from 'lucide-react';

interface MedicineTrackerProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

const TIME_SLOT_CONFIG: {
  key: TimeOfDay;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  border: string;
  badge: string;
}[] = [
  {
    key: 'morning',
    label: 'Morning Routine',
    icon: Sunrise,
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    key: 'afternoon',
    label: 'Afternoon / Lunch',
    icon: Sun,
    bg: 'bg-yellow-50/70',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  },
  {
    key: 'evening',
    label: 'Evening / Dinner',
    icon: Sunset,
    bg: 'bg-orange-50/70',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    key: 'bedtime',
    label: 'Bedtime',
    icon: Moon,
    bg: 'bg-indigo-50/70',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
];

export const MedicineTracker: React.FC<MedicineTrackerProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [logs, setLogs] = useState<MedicationLogEntry[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [aiVoiceFeedback, setAiVoiceFeedback] = useState<string | null>(null);

  // New medication form state
  const [newMedName, setNewMedName] = useState<string>('');
  const [newMedDosage, setNewMedDosage] = useState<string>('');
  const [newMedInstructions, setNewMedInstructions] = useState<string>('');
  const [newMedTimeOfDay, setNewMedTimeOfDay] = useState<TimeOfDay>('morning');

  // Load logs whenever selectedDate changes
  useEffect(() => {
    const dateLogs = HealthStorageService.getMedicationLogsForDate(selectedDate);
    setLogs(dateLogs);
  }, [selectedDate]);

  // Compute 7 days of the week for the selected date
  const weekDays = React.useMemo(() => {
    const cur = new Date(selectedDate + 'T00:00:00');
    const day = cur.getDay();
    const diffToMonday = cur.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(cur);
    monday.setDate(diffToMonday);

    const days: { dateStr: string; dayName: string; dayNumber: number; isSelected: boolean; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = d.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isSelected: str === selectedDate,
        isToday: str === todayStr,
      });
    }
    return days;
  }, [selectedDate, todayStr]);

  // Load all logs for the week
  const weeklyLogs = React.useMemo(() => {
    const res: Record<string, MedicationLogEntry[]> = {};
    weekDays.forEach((wd) => {
      res[wd.dateStr] = HealthStorageService.getMedicationLogsForDate(wd.dateStr);
    });
    return res;
  }, [weekDays, logs]);

  const handleDateChange = (daysDelta: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + daysDelta);
    const newDateStr = current.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  const handleToggleStatus = (medicationId: string, currentStatus: MedicationLogEntry['status'], targetDate = selectedDate) => {
    const nextStatus: MedicationLogEntry['status'] =
      currentStatus === 'taken' ? 'missed' : currentStatus === 'missed' ? 'pending' : 'taken';

    HealthStorageService.updateMedicationLogStatus(targetDate, medicationId, nextStatus);
    const updatedLogs = HealthStorageService.getMedicationLogsForDate(selectedDate);
    setLogs(updatedLogs);

    if (profile.soundEnabled) {
      const med = logs.find((l) => l.medicationId === medicationId);
      const statusText = nextStatus === 'taken' ? 'marked as taken' : nextStatus === 'missed' ? 'marked as missed' : 'set to pending';
      SpeechService.speak(`${med?.medicationName || 'Medicine'} ${statusText}`, profile.voiceSpeed);
    }
  };

  const handleMarkSlotAllTaken = (slot: TimeOfDay) => {
    HealthStorageService.markTimeSlotStatus(selectedDate, slot, 'taken');
    const updated = HealthStorageService.getMedicationLogsForDate(selectedDate);
    setLogs(updated);

    const slotLabel = TIME_SLOT_CONFIG.find((s) => s.key === slot)?.label || slot;
    const msg = `All ${slotLabel} medications have been marked as taken.`;
    setAiVoiceFeedback(msg);

    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  const handleAddNewMedication = () => {
    if (!newMedName.trim()) return;

    const newMed: MedicationItem = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || 'As directed',
      instructions: newMedInstructions.trim() || 'Take with water',
      timeOfDay: newMedTimeOfDay,
      active: true,
    };

    HealthStorageService.addMedicationToProfile(newMed);
    const updatedProfile = HealthStorageService.getProfile();
    onUpdateProfile(updatedProfile);

    // Refresh logs for current view
    const refreshed = HealthStorageService.getMedicationLogsForDate(selectedDate);
    setLogs(refreshed);

    // Reset form
    setNewMedName('');
    setNewMedDosage('');
    setNewMedInstructions('');
    setIsAddModalOpen(false);

    const msg = `Added ${newMed.name} to your ${newMedTimeOfDay} schedule.`;
    setAiVoiceFeedback(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  const handleDeleteMedication = (id: string, name: string) => {
    HealthStorageService.deleteMedicationFromProfile(id);
    const updatedProfile = HealthStorageService.getProfile();
    onUpdateProfile(updatedProfile);

    const refreshed = HealthStorageService.getMedicationLogsForDate(selectedDate);
    setLogs(refreshed);

    if (profile.soundEnabled) {
      SpeechService.speak(`Removed ${name} from schedule.`, profile.voiceSpeed);
    }
  };

  // AI Voice Medication Assistant Parser
  const handleProcessVoiceCommand = (command: string) => {
    const lower = command.toLowerCase();
    let feedback = '';

    // Check for "mark morning taken"
    if (lower.includes('morning') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('morning');
      return;
    }
    // Check for "mark afternoon taken"
    if (lower.includes('afternoon') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('afternoon');
      return;
    }
    // Check for "mark evening taken"
    if (lower.includes('evening') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('evening');
      return;
    }
    // Check for "mark bedtime taken"
    if (lower.includes('bedtime') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('bedtime');
      return;
    }

    // Match specific medicine by name
    const matchingMed = logs.find((l) => lower.includes(l.medicationName.toLowerCase()));
    if (matchingMed) {
      if (lower.includes('miss') || lower.includes('forgot') || lower.includes("didn't")) {
        HealthStorageService.updateMedicationLogStatus(selectedDate, matchingMed.medicationId, 'missed');
        feedback = `Marked ${matchingMed.medicationName} as missed for today.`;
      } else {
        HealthStorageService.updateMedicationLogStatus(selectedDate, matchingMed.medicationId, 'taken');
        feedback = `Marked ${matchingMed.medicationName} as taken for today.`;
      }
      const updated = HealthStorageService.getMedicationLogsForDate(selectedDate);
      setLogs(updated);
    } else if (lower.includes('what') || lower.includes('list') || lower.includes('schedule')) {
      const pendingCount = logs.filter((l) => l.status === 'pending').length;
      feedback = `You have ${logs.length} scheduled medications today. ${pendingCount} are still pending.`;
    } else {
      // Default: mark all morning medications taken
      handleMarkSlotAllTaken('morning');
      return;
    }

    setAiVoiceFeedback(feedback);
    if (profile.soundEnabled && feedback) {
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
    setAiVoiceFeedback('Listening to your medicine update...');

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

  // Calculations for adherence scorecard
  const totalCount = logs.length;
  const takenCount = logs.filter((l) => l.status === 'taken').length;
  const missedCount = logs.filter((l) => l.status === 'missed').length;
  const pendingCount = logs.filter((l) => l.status === 'pending').length;
  const adherencePercent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

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
      {/* Top Banner & Date Navigator */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                Daily Medicine Tracker
              </span>
              {isToday && (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  Today
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2 sm:gap-3">
              <Pill className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
              <span>Medication Schedule & History</span>
            </h2>
          </div>

          {/* Add Medicine Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add New Medicine
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
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
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

          {/* View Mode Toggle: Daily Routine vs 7-Day Schedule Matrix */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  viewMode === 'daily'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Daily Routine</span>
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  viewMode === 'weekly'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>7-Day Schedule Matrix</span>
              </button>
            </div>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 transition-colors text-center"
              >
                Today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Voice Assistant Quick Action Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={handleToggleVoice}
            className={`p-2 sm:p-2.5 rounded-xl transition-all flex-shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-300'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title="Speak medication update"
          >
            {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
              <button
                onClick={() => SpeechService.speak(aiVoiceFeedback || 'Say e.g. "Took morning meds" or "Took Lisinopril"', profile.voiceSpeed)}
                className="p-1 rounded-lg hover:bg-white/20 text-emerald-200 hover:text-white transition-colors"
                title="Listen"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">Say it in AI</h4>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-100 font-medium truncate">
              {aiVoiceFeedback || 'Say e.g. "Took morning meds" or "Took Lisinopril"'}
            </p>
          </div>
        </div>

        {/* Quick voice chips */}
        <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleProcessVoiceCommand('I took all my morning medications')}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] sm:text-xs font-bold transition-all"
          >
            "Took morning meds"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('I took all my evening medications')}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] sm:text-xs font-bold transition-all"
          >
            "Took evening meds"
          </button>
        </div>
      </div>

      {/* 7-DAY WEEKLY SCHEDULE MATRIX VIEW */}
      {viewMode === 'weekly' && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-emerald-600" />
                <span>7-Day Medication Schedule & Adherence Matrix</span>
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">
                Overview of all scheduled doses across the week. Click any status circle to toggle confirmation.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-100 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-3 min-w-[200px]">Medicine & Routine</th>
                  {weekDays.map((wd) => (
                    <th 
                      key={wd.dateStr} 
                      className={`py-3 px-2 text-center min-w-[70px] ${
                        wd.isSelected ? 'bg-emerald-50 rounded-t-xl text-emerald-900 font-black' : ''
                      }`}
                    >
                      <div className="text-[11px] text-slate-400">{wd.dayName}</div>
                      <div className={`text-base font-black ${wd.isToday ? 'text-emerald-700 underline' : 'text-slate-800'}`}>
                        {wd.dayNumber}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profile.medications.filter((m) => m.active !== false).map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {med.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {med.dosage}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium capitalize mt-0.5 flex items-center gap-1.5">
                        <span className="font-bold text-emerald-700">{med.timeOfDay}</span>
                        <span>•</span>
                        <span className="truncate max-w-[180px]">{med.instructions}</span>
                      </div>
                    </td>

                    {weekDays.map((wd) => {
                      const dayLogs = weeklyLogs[wd.dateStr] || [];
                      const medLog = dayLogs.find((l) => l.medicationId === med.id);
                      const status = medLog?.status || 'pending';

                      return (
                        <td 
                          key={wd.dateStr} 
                          className={`py-3 px-2 text-center align-middle ${
                            wd.isSelected ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleToggleStatus(med.id, status, wd.dateStr)}
                            className={`w-9 h-9 mx-auto rounded-xl border-2 flex items-center justify-center font-black text-sm transition-all active:scale-90 shadow-xs ${
                              status === 'taken'
                                ? 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-200'
                                : status === 'missed'
                                ? 'bg-rose-500 border-rose-600 text-white shadow-rose-200'
                                : 'bg-slate-50 border-slate-300 text-slate-400 hover:bg-slate-100'
                            }`}
                            title={`${med.name} on ${wd.dateStr}: ${status.toUpperCase()} (Click to toggle)`}
                          >
                            {status === 'taken' ? '✓' : status === 'missed' ? '✕' : '•'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DAILY ROUTINE VIEW */}
      {viewMode === 'daily' && (
        <>
          {/* Daily Adherence Scorecard */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                Adherence Rate
              </span>
              <span className="text-3xl font-black text-emerald-700 mt-1 block">
                {adherencePercent}%
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {takenCount} of {totalCount} Taken
              </span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">
                Taken ✅
              </span>
              <span className="text-3xl font-black text-emerald-700 mt-1 block">
                {takenCount}
              </span>
              <span className="text-xs font-semibold text-emerald-800">Confirmed Doses</span>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-center">
              <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider block">
                Missed ❌
              </span>
              <span className="text-3xl font-black text-rose-700 mt-1 block">
                {missedCount}
              </span>
              <span className="text-xs font-semibold text-rose-800">Missed Doses</span>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
              <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider block">
                Pending ⏳
              </span>
              <span className="text-3xl font-black text-amber-700 mt-1 block">
                {pendingCount}
              </span>
              <span className="text-xs font-semibold text-amber-800">Remaining Today</span>
            </div>
          </div>

      {/* Time Slots Checklist */}
      <div className="space-y-6">
        {TIME_SLOT_CONFIG.map((slot) => {
          const slotLogs = logs.filter((l) => l.timeOfDay === slot.key);
          if (slotLogs.length === 0) return null;

          const SlotIcon = slot.icon;
          const allSlotTaken = slotLogs.length > 0 && slotLogs.every((l) => l.status === 'taken');

          return (
            <div
              key={slot.key}
              className={`rounded-3xl border-2 p-6 sm:p-8 space-y-4 shadow-sm ${slot.bg} ${slot.border}`}
            >
              {/* Slot Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-800">
                    <SlotIcon className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                        {slot.label}
                      </h3>
                      {allSlotTaken && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          All Taken ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-600">
                      {slotLogs.length} prescribed {slotLogs.length === 1 ? 'medicine' : 'medicines'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkSlotAllTaken(slot.key)}
                    className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-sm rounded-xl border-2 border-emerald-300 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Mark All {slot.key.charAt(0).toUpperCase() + slot.key.slice(1)} Taken
                  </button>
                </div>
              </div>

              {/* Medication Cards List */}
              <div className="grid grid-cols-1 gap-3">
                {slotLogs.map((log) => {
                  const isTaken = log.status === 'taken';
                  const isMissed = log.status === 'missed';

                  return (
                    <div
                      key={log.id}
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isTaken
                          ? 'bg-emerald-50/90 border-emerald-400 shadow-sm'
                          : isMissed
                          ? 'bg-rose-50/90 border-rose-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Checkbox Button */}
                        <button
                          onClick={() => handleToggleStatus(log.medicationId, log.status)}
                          className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-extrabold text-xl transition-all active:scale-90 flex-shrink-0 ${
                            isTaken
                              ? 'bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-200'
                              : isMissed
                              ? 'bg-rose-600 border-rose-700 text-white'
                              : 'bg-white hover:bg-slate-100 border-slate-400 text-slate-400'
                          }`}
                          title="Click to toggle Taken / Missed / Pending"
                        >
                          {isTaken ? '✓' : isMissed ? '✕' : ''}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-extrabold text-slate-900">
                              {log.medicationName}
                            </span>
                            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {log.dosage}
                            </span>
                          </div>

                          <p className="text-sm font-medium text-slate-600 mt-0.5">
                            {profile.medications.find((m) => m.id === log.medicationId)?.instructions || 'Take as directed'}
                          </p>

                          {log.takenTime && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mt-1">
                              <Clock className="w-3.5 h-3.5" />
                              Recorded at {log.takenTime}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badges & Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleToggleStatus(log.medicationId, log.status)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border uppercase tracking-wider transition-all ${
                            isTaken
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : isMissed
                              ? 'bg-rose-600 text-white border-rose-700'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {isTaken ? '✅ Taken' : isMissed ? '❌ Missed' : '⏳ Pending'}
                        </button>

                        <button
                          onClick={() => handleDeleteMedication(log.medicationId, log.medicationName)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors"
                          title="Delete from schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* Add New Medication Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Pill className="w-6 h-6 text-emerald-600" />
                Add New Medication
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
                  Medicine Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amlodipine, Aspirin, Atorvastatin"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 mg, 1 tablet"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1">
                    Time of Day
                  </label>
                  <select
                    value={newMedTimeOfDay}
                    onChange={(e) => setNewMedTimeOfDay(e.target.value as TimeOfDay)}
                    className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    <option value="morning">Morning 🌅</option>
                    <option value="afternoon">Afternoon ☀️</option>
                    <option value="evening">Evening 🌆</option>
                    <option value="bedtime">Bedtime 🌙</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1">
                  Instructions / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take with breakfast glass of water"
                  value={newMedInstructions}
                  onChange={(e) => setNewMedInstructions(e.target.value)}
                  className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600 focus:outline-none"
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
                onClick={handleAddNewMedication}
                disabled={!newMedName.trim()}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold shadow-md flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add to Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
