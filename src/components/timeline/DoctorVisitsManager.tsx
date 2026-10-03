import React, { useState, useEffect } from 'react';
import { UserProfile, ReminderItem, ReminderPriority, CheckInRecord } from '../../types/health';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  PhoneCall 
} from 'lucide-react';

interface DoctorVisitsManagerProps {
  profile: UserProfile;
  history?: CheckInRecord[];
}

const DOCTOR_PRESETS: {
  title: string;
  category: 'checkup' | 'lab' | 'specialist' | 'pharmacy';
  defaultTime: string;
  notes: string;
  doctorType: string;
  emoji: string;
  priority: ReminderPriority;
  bg: string;
  border: string;
}[] = [
  {
    title: "Call Doctor's Office for Check-up",
    category: 'checkup',
    defaultTime: '10:00 AM',
    notes: 'Schedule routine 6-month wellness review and blood pressure check.',
    doctorType: 'Primary Care Physician',
    emoji: '🩺',
    priority: 'urgent',
    bg: 'bg-emerald-950/30 hover:bg-emerald-950/50',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
  },
  {
    title: 'Lab Blood Work & Fasting Panel',
    category: 'lab',
    defaultTime: '08:30 AM',
    notes: 'Lipid panel, HbA1c, and metabolic check. Remember fasting for 8 hours.',
    doctorType: 'Clinical Diagnostic Lab',
    emoji: '🩸',
    priority: 'urgent',
    bg: 'bg-rose-950/30 hover:bg-rose-950/50',
    border: 'border-rose-500/30 hover:border-rose-500/60',
  },
  {
    title: 'Cardiologist Blood Pressure Review',
    category: 'specialist',
    defaultTime: '02:00 PM',
    notes: 'Bring 30-day blood pressure chart and morning reading records.',
    doctorType: 'Cardiology Specialist',
    emoji: '🫀',
    priority: 'urgent',
    bg: 'bg-blue-950/30 hover:bg-blue-950/50',
    border: 'border-blue-500/30 hover:border-blue-500/60',
  },
  {
    title: 'Prescription & Medication Review Consultation',
    category: 'pharmacy',
    defaultTime: '11:30 AM',
    notes: 'Discuss Lisinopril timing, potassium balance, and refill schedule.',
    doctorType: 'Primary Care / Pharmacy',
    emoji: '💊',
    priority: 'less_urgent',
    bg: 'bg-amber-950/30 hover:bg-amber-950/50',
    border: 'border-amber-500/30 hover:border-amber-500/60',
  },
  {
    title: 'Annual Eye & Vision Exam',
    category: 'specialist',
    defaultTime: '01:30 PM',
    notes: 'Retina, glaucoma, and macular wellness check.',
    doctorType: 'Optometrist / Ophthalmologist',
    emoji: '👁️',
    priority: 'less_urgent',
    bg: 'bg-indigo-950/30 hover:bg-indigo-950/50',
    border: 'border-indigo-500/30 hover:border-indigo-500/60',
  },
  {
    title: 'Dental Check-up & Cleaning',
    category: 'checkup',
    defaultTime: '09:30 AM',
    notes: 'Routine 6-month dental cleaning and gum health review.',
    doctorType: 'Dentist Office',
    emoji: '🦷',
    priority: 'less_urgent',
    bg: 'bg-teal-950/30 hover:bg-teal-950/50',
    border: 'border-teal-500/30 hover:border-teal-500/60',
  },
];

export const DoctorVisitsManager: React.FC<DoctorVisitsManagerProps> = ({
  profile,
  history = [],
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [allReminders, setAllReminders] = useState<ReminderItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form state
  const [visitTitle, setVisitTitle] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>(todayStr);
  const [visitTime, setVisitTime] = useState<string>('10:00 AM');
  const [priority, setPriority] = useState<ReminderPriority>('urgent');
  const [questionsToAsk, setQuestionsToAsk] = useState<string>('');

  const loadReminders = () => {
    const list = HealthStorageService.getAllReminders();
    setAllReminders(list);
  };

  useEffect(() => {
    loadReminders();
  }, []);

  // Filter items that are clinical / doctor related
  const isDoctorRelated = (title: string, notes?: string) => {
    const text = `${title} ${notes || ''}`.toLowerCase();
    return (
      text.includes('doctor') ||
      text.includes('dr.') ||
      text.includes('dr ') ||
      text.includes('clinic') ||
      text.includes('check-up') ||
      text.includes('checkup') ||
      text.includes('cardiolog') ||
      text.includes('lab') ||
      text.includes('blood work') ||
      text.includes('fasting') ||
      text.includes('hospital') ||
      text.includes('prescription refill') ||
      text.includes('appointment') ||
      text.includes('exam') ||
      text.includes('dental') ||
      text.includes('vision') ||
      text.includes('ophthalmolog') ||
      text.includes('optometr')
    );
  };

  const doctorItems = allReminders.filter((r) => isDoctorRelated(r.title, r.notes));
  const upcomingDoctorItems = doctorItems.filter((r) => !r.completed);
  const completedDoctorItems = doctorItems.filter((r) => r.completed);

  // Quick 1-tap add
  const handleQuickAdd = (preset: typeof DOCTOR_PRESETS[0]) => {
    const newItem: ReminderItem = {
      id: `rem-doc-${Date.now()}`,
      title: preset.title,
      priority: preset.priority,
      dueDate: todayStr,
      dueTime: preset.defaultTime,
      completed: false,
      notes: `${preset.notes} (Doctor: ${preset.doctorType})`,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newItem);
    loadReminders();

    if (profile.soundEnabled) {
      SpeechService.speak(`Added ${preset.title} to your clinical appointments.`, profile.voiceSpeed);
    }
  };

  const handleSaveModal = () => {
    if (!visitTitle.trim()) return;

    const fullNotes = [
      doctorName.trim() ? `Doctor / Clinic: ${doctorName.trim()}` : '',
      questionsToAsk.trim() ? `Questions to ask: ${questionsToAsk.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' • ');

    const newItem: ReminderItem = {
      id: `rem-doc-${Date.now()}`,
      title: visitTitle.trim(),
      priority,
      dueDate: visitDate,
      dueTime: visitTime,
      completed: false,
      notes: fullNotes || undefined,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newItem);
    loadReminders();

    // Reset
    setVisitTitle('');
    setDoctorName('');
    setQuestionsToAsk('');
    setIsAddModalOpen(false);

    if (profile.soundEnabled) {
      SpeechService.speak(`Scheduled ${newItem.title} for ${visitDate}.`, profile.voiceSpeed);
    }
  };

  const handleToggleCompleted = (id: string, currentStatus: boolean, title: string) => {
    HealthStorageService.toggleReminder(id);
    loadReminders();

    if (!currentStatus && profile.soundEnabled) {
      SpeechService.speak(`Marked ${title} as completed.`, profile.voiceSpeed);
    }
  };

  const handleDelete = (id: string) => {
    HealthStorageService.deleteReminder(id);
    loadReminders();
  };

  // Compute clinical insights to prompt doctor discussion
  const highBpCount = history.filter(
    (h) => h.bloodPressure.measured && (h.bloodPressure.systolic || 0) >= 135
  ).length;

  return (
    <div className="space-y-6 animate-fadeIn text-white">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-widest">
                Clinical Care & Doctor Visits
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {upcomingDoctorItems.length} Scheduled
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
              <span>Doctor Check-Ups & Clinical Appointments</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl font-medium">
              Manage doctor visits, fasting lab tests, specialist consults, and notes to discuss with your physician.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-950/50 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Schedule Doctor Visit</span>
          </button>
        </div>
      </div>

      {/* AI Doctor Visit Preparation Tip Card */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-blue-950/30 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md flex-shrink-0 mt-0.5">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h3 className="font-black text-white text-base sm:text-lg">
              Doctor Consultation Prep & Questions
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium leading-relaxed">
              {highBpCount > 2
                ? `You logged ${highBpCount} readings above 135 mmHg systolic in your history. Remind your doctor to review your morning Lisinopril dosage.`
                : `Your 30-day vitals are steady. Share your adherence logs with your doctor at your next wellness check.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
          <span className="text-xs font-black text-indigo-300 bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-400/30 shadow-sm">
            📋 Bring 30-day chart
          </span>
        </div>
      </div>

      {/* 1-Tap Quick Doctor & Lab Action Presets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-blue-400" />
              <span>Quick 1-Tap Doctor & Clinical Presets</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Tap any item to instantly add a reminder to your schedule
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DOCTOR_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickAdd(preset)}
              className={`p-4 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between gap-3 ${preset.bg} ${preset.border} shadow-sm backdrop-blur-sm`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl flex-shrink-0">{preset.emoji}</span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm leading-tight">
                      {preset.title}
                    </h4>
                    <span className="text-[11px] font-bold text-blue-400">
                      {preset.doctorType}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-medium line-clamp-2">
                {preset.notes}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-bold text-slate-400">
                <span>🕒 {preset.defaultTime}</span>
                <span className="text-blue-400 font-extrabold hover:text-blue-300">
                  + Add to Schedule
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled & Upcoming Doctor Appointments */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>Scheduled Doctor & Clinical Appointments</span>
          </h3>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
            {upcomingDoctorItems.length} Active
          </span>
        </div>

        {upcomingDoctorItems.length === 0 ? (
          <div className="text-center py-10 space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <Stethoscope className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-lg font-extrabold text-slate-300">No upcoming doctor appointments scheduled.</p>
            <p className="text-sm font-medium text-slate-400 max-w-md mx-auto">
              Tap "Call Doctor's Office for Check-up" above or click "Schedule Doctor Visit" to set a date with your clinic.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingDoctorItems.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl border border-blue-500/30 bg-blue-950/20 hover:bg-blue-950/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => handleToggleCompleted(item.id, item.completed, item.title)}
                    className="p-2 rounded-xl bg-slate-800 border border-blue-500/40 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5 shadow-sm"
                    title="Mark appointment completed"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base sm:text-lg font-extrabold text-white">
                        {item.title}
                      </h4>
                      {item.priority === 'urgent' && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                          Important
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-1 flex-wrap">
                      {item.dueDate && (
                        <span className="flex items-center gap-1 text-blue-300 font-extrabold bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 rounded-md">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.dueDate}
                        </span>
                      )}
                      {item.dueTime && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {item.dueTime}
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-300 mt-2 font-medium bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                        📝 {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleCompleted(item.id, item.completed, item.title)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95"
                  >
                    Mark Attended ✓
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                    title="Remove appointment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Past Doctor Visits */}
        {completedDoctorItems.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
              Completed & Past Check-Ups ({completedDoctorItems.length})
            </h4>
            <div className="space-y-2 opacity-75">
              {completedDoctorItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="font-bold text-slate-400 line-through truncate max-w-[280px]">
                      {item.title}
                    </span>
                    {item.dueDate && (
                      <span className="text-slate-500">({item.dueDate})</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Custom Doctor Visit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-fadeIn text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-blue-400" />
                <span>Schedule Doctor Check-Up</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white font-extrabold text-xl p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-1">
                  Appointment Title / Reason *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call Doctor's Office for Blood Pressure Check-up"
                  value={visitTitle}
                  onChange={(e) => setVisitTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 font-semibold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-1">
                  Doctor / Clinic Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sarah Jenkins (Cardiology Clinic)"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 font-semibold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 font-semibold text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-1">
                  Questions to Ask Doctor / Clinical Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Discuss recent morning dizziness and review Lisinopril dosage..."
                  value={questionsToAsk}
                  onChange={(e) => setQuestionsToAsk(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 font-semibold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                    priority === 'urgent'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🔴 Important Priority
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('less_urgent')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                    priority === 'less_urgent'
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🔵 Standard Priority
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 font-bold text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={!visitTitle.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md"
              >
                Save Doctor Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
