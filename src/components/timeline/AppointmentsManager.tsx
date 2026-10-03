import React, { useState, useEffect, useMemo } from 'react';
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
  PhoneCall,
  Briefcase,
  User,
  MapPin,
  Volume2,
  CalendarCheck,
  X
} from 'lucide-react';

interface AppointmentsManagerProps {
  profile: UserProfile;
  history?: CheckInRecord[];
}

interface AppointmentPreset {
  title: string;
  type: 'health' | 'private';
  category: string;
  defaultTime: string;
  notes: string;
  providerOrPerson: string;
  location?: string;
  emoji: string;
  priority: ReminderPriority;
  bg: string;
  border: string;
  textColor: string;
}

const HEALTH_APPOINTMENT_PRESETS: AppointmentPreset[] = [
  {
    title: "Call Primary Care Doctor for Annual Wellness Check",
    type: 'health',
    category: 'Primary Care',
    defaultTime: '10:00 AM',
    notes: 'Schedule routine 6-month wellness review and blood pressure check.',
    providerOrPerson: 'Primary Care Physician',
    location: 'Family Health Clinic, Suite 200',
    emoji: '🩺',
    priority: 'urgent',
    bg: 'bg-emerald-950/30 hover:bg-emerald-950/50',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    textColor: 'text-emerald-300',
  },
  {
    title: 'Lab Blood Work & Fasting Metabolic Panel',
    type: 'health',
    category: 'Diagnostic Lab',
    defaultTime: '08:30 AM',
    notes: 'Lipid panel, HbA1c, and electrolytes. Remember 8-hour water-only fast.',
    providerOrPerson: 'Quest / Labcorp Diagnostic Center',
    location: 'Medical Arts Pavilion, 1st Floor',
    emoji: '🩸',
    priority: 'urgent',
    bg: 'bg-rose-950/30 hover:bg-rose-950/50',
    border: 'border-rose-500/30 hover:border-rose-500/60',
    textColor: 'text-rose-300',
  },
  {
    title: 'Cardiologist Blood Pressure & ECG Review',
    type: 'health',
    category: 'Cardiology',
    defaultTime: '02:00 PM',
    notes: 'Bring 30-day blood pressure log and list of current Lisinopril timing.',
    providerOrPerson: 'Dr. Vance (Cardiologist)',
    location: 'Heart & Vascular Institute',
    emoji: '🫀',
    priority: 'urgent',
    bg: 'bg-cyan-950/30 hover:bg-cyan-950/50',
    border: 'border-cyan-500/30 hover:border-cyan-500/60',
    textColor: 'text-cyan-300',
  },
  {
    title: '6-Month Dental Cleaning & Gum Exam',
    type: 'health',
    category: 'Dental',
    defaultTime: '09:30 AM',
    notes: 'Routine cleaning, tartar removal, and preventive oral health exam.',
    providerOrPerson: 'Dr. Miller Dental Practice',
    location: 'Sunset Dental Center',
    emoji: '🦷',
    priority: 'less_urgent',
    bg: 'bg-teal-950/30 hover:bg-teal-950/50',
    border: 'border-teal-500/30 hover:border-teal-500/60',
    textColor: 'text-teal-300',
  },
  {
    title: 'Annual Eye & Glaucoma Vision Exam',
    type: 'health',
    category: 'Vision & Eye',
    defaultTime: '01:30 PM',
    notes: 'Pupil dilation, glaucoma pressure check, and reading glasses update.',
    providerOrPerson: 'Bay Vision Eye Clinic',
    location: 'Optometry Plaza, Suite 4',
    emoji: '👁️',
    priority: 'less_urgent',
    bg: 'bg-indigo-950/30 hover:bg-indigo-950/50',
    border: 'border-indigo-500/30 hover:border-indigo-500/60',
    textColor: 'text-indigo-300',
  },
  {
    title: 'Prescription Refill & Pharmacist Consultation',
    type: 'health',
    category: 'Pharmacy',
    defaultTime: '11:00 AM',
    notes: 'Discuss 90-day mail-order refill and check for drug-nutrient interactions.',
    providerOrPerson: 'Community Pharmacy Lead',
    location: 'CVS / Walgreens Pharmacy Counter',
    emoji: '💊',
    priority: 'less_urgent',
    bg: 'bg-blue-950/30 hover:bg-blue-950/50',
    border: 'border-blue-500/30 hover:border-blue-500/60',
    textColor: 'text-blue-300',
  },
];

const PRIVATE_APPOINTMENT_PRESETS: AppointmentPreset[] = [
  {
    title: 'Financial Advisor & Annual Tax Review',
    type: 'private',
    category: 'Financial & Legal',
    defaultTime: '01:00 PM',
    notes: 'Review quarterly statements, tax deduction receipts, and retirement budget.',
    providerOrPerson: 'David Miller (CPA / Financial Planner)',
    location: 'Downtown Financial Tower, Room 510',
    emoji: '💼',
    priority: 'urgent',
    bg: 'bg-amber-950/30 hover:bg-amber-950/50',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    textColor: 'text-amber-300',
  },
  {
    title: 'Family Gathering & Birthday Dinner',
    type: 'private',
    category: 'Family & Social',
    defaultTime: '05:30 PM',
    notes: 'Meet kids and grandchildren for celebratory dinner at Waterfront Grill.',
    providerOrPerson: 'Family & Relatives',
    location: 'Waterfront Restaurant & Cafe',
    emoji: '👨‍👩‍👧',
    priority: 'less_urgent',
    bg: 'bg-purple-950/30 hover:bg-purple-950/50',
    border: 'border-purple-500/30 hover:border-purple-500/60',
    textColor: 'text-purple-300',
  },
  {
    title: 'Home Contractor & Plumbing Inspection',
    type: 'private',
    category: 'Home & Maintenance',
    defaultTime: '10:30 AM',
    notes: 'Annual water heater flush and bathroom pipe safety inspection.',
    providerOrPerson: 'Bay Area Plumbing & HVAC',
    location: 'Home Residence',
    emoji: '🏡',
    priority: 'urgent',
    bg: 'bg-orange-950/30 hover:bg-orange-950/50',
    border: 'border-orange-500/30 hover:border-orange-500/60',
    textColor: 'text-orange-300',
  },
  {
    title: 'Hair Salon & Grooming Appointment',
    type: 'private',
    category: 'Personal Care',
    defaultTime: '03:00 PM',
    notes: 'Regular haircut, wash, and style appointment with Sarah.',
    providerOrPerson: 'Sarah (Main Street Salon)',
    location: 'Main Street Salon & Spa',
    emoji: '💇',
    priority: 'less_urgent',
    bg: 'bg-pink-950/30 hover:bg-pink-950/50',
    border: 'border-pink-500/30 hover:border-pink-500/60',
    textColor: 'text-pink-300',
  },
  {
    title: 'Estate Planning & Legal Document Review',
    type: 'private',
    category: 'Legal & Paperwork',
    defaultTime: '02:30 PM',
    notes: 'Update healthcare proxy, durable power of attorney, and trust documents.',
    providerOrPerson: 'Anderson Law Associates',
    location: 'Civic Center Legal Suites',
    emoji: '📜',
    priority: 'urgent',
    bg: 'bg-violet-950/30 hover:bg-violet-950/50',
    border: 'border-violet-500/30 hover:border-violet-500/60',
    textColor: 'text-violet-300',
  },
  {
    title: 'Car Routine Service & Safety Check',
    type: 'private',
    category: 'Vehicle & Transport',
    defaultTime: '09:00 AM',
    notes: 'Oil change, tire rotation, and brake safety inspection.',
    providerOrPerson: 'Toyota Service Center',
    location: 'Auto Mall Expressway',
    emoji: '🚗',
    priority: 'less_urgent',
    bg: 'bg-slate-800/60 hover:bg-slate-800/90',
    border: 'border-slate-700 hover:border-slate-500',
    textColor: 'text-slate-200',
  },
];

export const AppointmentsManager: React.FC<AppointmentsManagerProps> = ({
  profile,
  history = [],
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [allReminders, setAllReminders] = useState<ReminderItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'health' | 'private'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  // Form state
  const [formType, setFormType] = useState<'health' | 'private'>('health');
  const [title, setTitle] = useState<string>('');
  const [providerOrPerson, setProviderOrPerson] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>('10:00 AM');
  const [location, setLocation] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [priority, setPriority] = useState<ReminderPriority>('urgent');
  const [notes, setNotes] = useState<string>('');

  const loadReminders = () => {
    const list = HealthStorageService.getAllReminders();
    setAllReminders(list);
  };

  useEffect(() => {
    loadReminders();
  }, []);

  // Classify reminders into health vs private
  const classifyAppointment = (item: ReminderItem): 'health' | 'private' | 'general' => {
    if (item.appointmentType) return item.appointmentType;
    const text = `${item.title} ${item.notes || ''} ${item.category || ''}`.toLowerCase();
    
    // Health keywords
    const isHealth = (
      text.includes('doctor') ||
      text.includes('dr.') ||
      text.includes('dr ') ||
      text.includes('clinic') ||
      text.includes('hospital') ||
      text.includes('checkup') ||
      text.includes('check-up') ||
      text.includes('cardiolog') ||
      text.includes('lab') ||
      text.includes('blood work') ||
      text.includes('fasting') ||
      text.includes('dental') ||
      text.includes('dentist') ||
      text.includes('vision') ||
      text.includes('optometr') ||
      text.includes('ophthalmolog') ||
      text.includes('exam') ||
      text.includes('prescription') ||
      text.includes('pharmacy') ||
      text.includes('physician') ||
      text.includes('physical therapy') ||
      text.includes('vitals')
    );

    if (isHealth) return 'health';

    // Private keywords
    const isPrivate = (
      text.includes('tax') ||
      text.includes('advisor') ||
      text.includes('cpa') ||
      text.includes('financial') ||
      text.includes('lawyer') ||
      text.includes('legal') ||
      text.includes('attorney') ||
      text.includes('dinner') ||
      text.includes('family') ||
      text.includes('birthday') ||
      text.includes('plumb') ||
      text.includes('contractor') ||
      text.includes('home') ||
      text.includes('repair') ||
      text.includes('hair') ||
      text.includes('barber') ||
      text.includes('salon') ||
      text.includes('car') ||
      text.includes('mechanic') ||
      text.includes('meeting') ||
      text.includes('bank') ||
      text.includes('social')
    );

    if (isPrivate) return 'private';
    return 'private'; // Default non-medication reminders in appointments view to private matter
  };

  // Grouped lists
  const classifiedItems = useMemo(() => {
    return allReminders.map((item) => ({
      ...item,
      computedType: classifyAppointment(item),
    }));
  }, [allReminders]);

  const healthAppointments = classifiedItems.filter((i) => i.computedType === 'health');
  const privateAppointments = classifiedItems.filter((i) => i.computedType === 'private');

  const upcomingHealth = healthAppointments.filter((i) => !i.completed);
  const upcomingPrivate = privateAppointments.filter((i) => !i.completed);
  const upcomingAll = classifiedItems.filter((i) => !i.completed);
  const completedAll = classifiedItems.filter((i) => i.completed);

  // Quick 1-tap add preset
  const handleQuickAdd = (preset: AppointmentPreset) => {
    const newItem: ReminderItem = {
      id: `apt-${preset.type}-${Date.now()}`,
      title: preset.title,
      priority: preset.priority,
      dueDate: todayStr,
      dueTime: preset.defaultTime,
      completed: false,
      appointmentType: preset.type,
      category: preset.category,
      providerOrPerson: preset.providerOrPerson,
      location: preset.location,
      notes: preset.notes,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newItem);
    loadReminders();

    if (profile.soundEnabled) {
      SpeechService.speak(
        `Added ${preset.title} to your ${preset.type === 'health' ? 'doctor' : 'private'} appointments.`,
        profile.voiceSpeed
      );
    }
  };

  // Save Modal Form
  const handleSaveModal = () => {
    if (!title.trim()) return;

    const newItem: ReminderItem = {
      id: `apt-${formType}-${Date.now()}`,
      title: title.trim(),
      priority,
      dueDate: date,
      dueTime: time,
      completed: false,
      appointmentType: formType,
      category: category.trim() || (formType === 'health' ? 'Doctor Visit' : 'Personal Matter'),
      providerOrPerson: providerOrPerson.trim() || undefined,
      location: location.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newItem);
    loadReminders();

    // Reset
    setTitle('');
    setProviderOrPerson('');
    setCategory('General');
    setLocation('');
    setPhone('');
    setNotes('');
    setIsAddModalOpen(false);

    if (profile.soundEnabled) {
      SpeechService.speak(`Scheduled ${newItem.title} for ${date}.`, profile.voiceSpeed);
    }
  };

  const handleToggleCompleted = (id: string, currentStatus: boolean, itemTitle: string) => {
    HealthStorageService.toggleReminder(id);
    loadReminders();

    if (!currentStatus && profile.soundEnabled) {
      SpeechService.speak(`Marked ${itemTitle} as completed.`, profile.voiceSpeed);
    }
  };

  const handleDelete = (id: string) => {
    HealthStorageService.deleteReminder(id);
    loadReminders();
  };

  const handleSpeakAppointment = (item: ReminderItem) => {
    const speech = `${item.title}. Scheduled for ${item.dueDate || 'today'} at ${item.dueTime || 'scheduled time'}.${
      item.providerOrPerson ? ` With ${item.providerOrPerson}.` : ''
    }${item.location ? ` Located at ${item.location}.` : ''}`;
    SpeechService.speak(speech, profile.voiceSpeed);
  };

  // Clinical Vitals Alert Count for Health Prep
  const highBpCount = history.filter(
    (h) => h.bloodPressure.measured && (h.bloodPressure.systolic || 0) >= 135
  ).length;

  // Render an individual appointment card
  const renderAppointmentCard = (item: ReminderItem & { computedType: 'health' | 'private' | 'general' }) => {
    const isHealth = item.computedType === 'health';
    const accentBorder = isHealth ? 'hover:border-emerald-500/60' : 'hover:border-amber-500/60';
    const tagBg = isHealth ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    const iconColor = isHealth ? 'text-emerald-400' : 'text-amber-400';

    return (
      <div
        key={item.id}
        className={`bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md transition-all ${accentBorder} flex flex-col justify-between gap-4 group relative overflow-hidden`}
      >
        <div className="space-y-3">
          {/* Header Row: Badges & Actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${tagBg}`}>
                {isHealth ? <Stethoscope className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                <span>{isHealth ? 'Health & Doctor' : 'Private Matter'}</span>
              </span>

              {item.category && (
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {item.category}
                </span>
              )}

              {item.priority === 'urgent' && (
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Priority
                </span>
              )}
            </div>

            {/* Top right quick icons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSpeakAppointment(item)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Read aloud"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Delete appointment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className={`text-lg sm:text-xl font-black text-white leading-snug ${item.completed ? 'line-through text-slate-400' : ''}`}>
            {item.title}
          </h3>

          {/* Meta Details: Provider, Date/Time, Location */}
          <div className="space-y-1.5 text-xs sm:text-sm text-slate-300 pt-1">
            {item.providerOrPerson && (
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <User className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
                <span>{item.providerOrPerson}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-slate-300">
              {item.dueDate && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>{item.dueDate}</span>
                </div>
              )}
              {item.dueTime && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{item.dueTime}</span>
                </div>
              )}
            </div>

            {item.location && (
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">{item.location}</span>
              </div>
            )}
          </div>

          {/* Notes / Checklist */}
          {item.notes && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 text-xs text-slate-300 leading-relaxed font-medium">
              <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Notes & Prep</span>
              {item.notes}
            </div>
          )}
        </div>

        {/* Bottom Actions: Call & Checkbox */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          {item.phone ? (
            <a
              href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Office</span>
            </a>
          ) : (
            <div />
          )}

          <button
            onClick={() => handleToggleCompleted(item.id, item.completed, item.title)}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 ${
              item.completed
                ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                : isHealth
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{item.completed ? 'Completed' : 'Mark as Done'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn text-white">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/70 border border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-widest">
                Schedule & Visits Center
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {upcomingHealth.length} Health
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {upcomingPrivate.length} Private
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <CalendarCheck className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
              <span>Appointments & Scheduled Matters</span>
            </h2>

            <p className="text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Organized listings for clinical healthcare visits (physicians, specialists, fasting lab tests, dental) and personal private matters (financial, home maintenance, family gatherings, legal).
            </p>
          </div>

          <button
            onClick={() => {
              setFormType('health');
              setIsAddModalOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-blue-950/50 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap self-start md:self-center"
          >
            <Plus className="w-5 h-5" />
            <span>Schedule New Appointment</span>
          </button>
        </div>
      </div>

      {/* AI Doctor & Consultation Briefing Card */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-blue-950/30 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md flex-shrink-0 mt-0.5">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h3 className="font-black text-white text-base sm:text-lg">
              AI Clinical Prep & Preparation Brief
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium leading-relaxed">
              {highBpCount > 2
                ? `You have ${highBpCount} blood pressure readings above 135 mmHg systolic. Remind your doctor to review your morning Lisinopril dosage at your next check-up.`
                : `Your recent vitals are steady. Remember to bring your prescription list and ask your doctor about your upcoming 6-month lab work.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
          <span className="text-xs font-black text-indigo-300 bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-400/30 shadow-sm">
            📋 Bring 30-Day Vitals Log
          </span>
        </div>
      </div>

      {/* Category Filter Pills: All vs Health vs Private */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl sm:rounded-3xl shadow-lg">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🌟 All Appointments</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950/60 font-bold">
              {upcomingAll.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('health')}
            className={`px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeFilter === 'health'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Health & Doctor Visits</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950/60 font-bold">
              {upcomingHealth.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('private')}
            className={`px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeFilter === 'private'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Private & Personal Matters</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950/60 font-bold">
              {upcomingPrivate.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
            showCompleted
              ? 'bg-slate-800 text-white border-slate-700'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          {showCompleted ? 'Hide Completed' : `Show Completed (${completedAll.length})`}
        </button>
      </div>

      {/* Main Content Area: Separate Listings or Filtered View */}
      {activeFilter === 'all' ? (
        <div className="space-y-8">
          {/* Section 1: Health & Clinical Appointments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Health & Clinical Appointments</h3>
                  <p className="text-xs text-slate-400">Doctor visits, specialists, fasting labs, dental, and eye exams</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFormType('health');
                  setIsAddModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Health</span>
              </button>
            </div>

            {upcomingHealth.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingHealth.map(renderAppointmentCard)}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
                <p className="text-base font-bold text-slate-300">No upcoming health appointments scheduled.</p>
                <p className="text-xs text-slate-500">Tap below to add a doctor check-up or fasting blood test preset.</p>
              </div>
            )}
          </div>

          {/* Section 2: Private & Personal Matters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Private & Personal Matters</h3>
                  <p className="text-xs text-slate-400">Financial advisor, family gatherings, home maintenance, salon, legal</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFormType('private');
                  setIsAddModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Private</span>
              </button>
            </div>

            {upcomingPrivate.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingPrivate.map(renderAppointmentCard)}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
                <p className="text-base font-bold text-slate-300">No upcoming private appointments scheduled.</p>
                <p className="text-xs text-slate-500">Tap below to add a financial advisor, family dinner, or home maintenance preset.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeFilter === 'health' ? (
        /* Filtered Health Only View */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                <span>Health & Doctor Appointments ({upcomingHealth.length})</span>
              </h3>
              <p className="text-xs text-slate-400">Scheduled clinical check-ups, labs, and specialists</p>
            </div>
            <button
              onClick={() => {
                setFormType('health');
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Health Visit</span>
            </button>
          </div>

          {upcomingHealth.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingHealth.map(renderAppointmentCard)}
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <div className="text-4xl">🩺</div>
              <p className="text-lg font-bold text-slate-200">No health appointments currently scheduled</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">Use the quick 1-tap health presets below to schedule an annual wellness check or cardiologist visit.</p>
            </div>
          )}
        </div>
      ) : (
        /* Filtered Private Only View */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <span>Private & Personal Matters ({upcomingPrivate.length})</span>
              </h3>
              <p className="text-xs text-slate-400">Financial, family, home maintenance, and personal care appointments</p>
            </div>
            <button
              onClick={() => {
                setFormType('private');
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Private Appointment</span>
            </button>
          </div>

          {upcomingPrivate.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingPrivate.map(renderAppointmentCard)}
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <div className="text-4xl">💼</div>
              <p className="text-lg font-bold text-slate-200">No private appointments currently scheduled</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">Use the 1-tap private presets below to quickly add family dinners, tax advisor reviews, or contractor visits.</p>
            </div>
          )}
        </div>
      )}

      {/* Completed Appointments Section (Collapsible) */}
      {showCompleted && completedAll.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Completed History ({completedAll.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
            {completedAll.map(renderAppointmentCard)}
          </div>
        </div>
      )}

      {/* Quick 1-Tap Presets Section */}
      <div className="space-y-6 pt-4">
        {/* Health Presets */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                <span>1-Tap Health & Doctor Presets</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Quickly add common clinical check-ups and laboratory tests to your calendar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {HEALTH_APPOINTMENT_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAdd(preset)}
                className={`p-4 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between gap-3 ${preset.bg} ${preset.border} group`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-2xl">{preset.emoji}</span>
                    <span className="text-[11px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                      {preset.category}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-white group-hover:text-emerald-300 transition-colors">
                    {preset.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {preset.notes}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {preset.defaultTime}
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>+ Quick Add</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Private Presets */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <span>1-Tap Private & Personal Matter Presets</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Quickly add financial, family, home maintenance, and personal care appointments
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRIVATE_APPOINTMENT_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAdd(preset)}
                className={`p-4 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between gap-3 ${preset.bg} ${preset.border} group`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-2xl">{preset.emoji}</span>
                    <span className="text-[11px] font-black uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md">
                      {preset.category}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                    {preset.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {preset.notes}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {preset.defaultTime}
                  </span>
                  <span className="text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>+ Quick Add</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Custom Appointment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto text-white">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-black text-white">Schedule Appointment</h3>
                <p className="text-xs text-slate-400">Create a clinical health visit or personal private matter</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Switcher: Health vs Private */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setFormType('health');
                  setCategory('Primary Care');
                }}
                className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  formType === 'health'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Health & Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormType('private');
                  setCategory('Financial / Family');
                }}
                className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  formType === 'private'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Private Matter</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Appointment Title / Reason *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={formType === 'health' ? 'e.g. Cardiologist Check-up' : 'e.g. Tax Advisor Meeting'}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {formType === 'health' ? 'Doctor / Provider Name' : 'Contact Person / Organization'}
                  </label>
                  <input
                    type="text"
                    value={providerOrPerson}
                    onChange={(e) => setProviderOrPerson(e.target.value)}
                    placeholder={formType === 'health' ? 'e.g. Dr. Vance' : 'e.g. David Miller (CPA)'}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Category / Specialty
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder={formType === 'health' ? 'e.g. Cardiology, Dental' : 'e.g. Financial, Home, Family'}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Location / Room / Address
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={formType === 'health' ? 'e.g. Heart Clinic, Suite 400' : 'e.g. Downtown Office / Home'}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. (415) 555-0199"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Preparation Notes & Checklist
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    formType === 'health'
                      ? 'e.g. Bring 30-day BP log, ask about dosage timing, fast for 8 hours...'
                      : 'e.g. Bring 2025 W-2 and tax documents, discuss quarterly retirement estimate...'
                  }
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Urgency / Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      priority === 'urgent'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-700'
                    }`}
                  >
                    High Priority
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('less_urgent')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      priority === 'less_urgent'
                        ? 'bg-slate-700 text-white border-slate-600 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-700'
                    }`}
                  >
                    Standard Routine
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={!title.trim()}
                className={`px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-lg transition-all active:scale-95 ${
                  formType === 'health'
                    ? 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 shadow-emerald-950/50'
                    : 'bg-amber-600 hover:bg-amber-500 disabled:opacity-40 shadow-amber-950/50'
                }`}
              >
                Save Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
