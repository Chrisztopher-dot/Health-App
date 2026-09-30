import { CheckInRecord, UserProfile, MedicationItem, MedicationLogEntry, ActivityLogEntry, TimeOfDay, ReminderItem, BayAreaEvent, RecipeItem } from '../types/health';
import { CryptoService } from './cryptoService';

const STORAGE_KEYS = {
  CHECK_INS: 'health_app_checkins_v1',
  USER_PROFILE: 'health_app_profile_v1',
  MEDICATION_LOGS: 'health_app_med_logs_v1',
  ACTIVITY_LOGS: 'health_app_activities_v1',
  REMINDERS: 'health_app_reminders_v1',
  BAY_AREA_EVENTS: 'health_app_bay_area_events_v1',
  BAY_AREA_LAST_WEEK_SYNC: 'health_app_bay_area_week_sync_v1',
  RECIPES: 'health_app_recipes_v1',
};

export const DEFAULT_MEDICATIONS: MedicationItem[] = [
  {
    id: 'med-1',
    name: 'Lisinopril',
    dosage: '10 mg',
    instructions: 'Take with morning glass of water for blood pressure',
    timeOfDay: 'morning',
    active: true,
  },
  {
    id: 'med-2',
    name: 'Metformin',
    dosage: '500 mg',
    instructions: 'Take 1 tablet with breakfast for blood sugar',
    timeOfDay: 'morning',
    active: true,
  },
  {
    id: 'med-3',
    name: 'Vitamin D3',
    dosage: '1000 IU',
    instructions: 'Daily morning bone and immunity supplement',
    timeOfDay: 'morning',
    active: true,
  },
  {
    id: 'med-4',
    name: 'CoQ10 (Heart Health)',
    dosage: '100 mg',
    instructions: 'Take with lunch',
    timeOfDay: 'afternoon',
    active: true,
  },
  {
    id: 'med-5',
    name: 'Metformin',
    dosage: '500 mg',
    instructions: 'Take 1 tablet with dinner',
    timeOfDay: 'evening',
    active: true,
  },
  {
    id: 'med-6',
    name: 'Melatonin',
    dosage: '3 mg',
    instructions: 'Take 30 minutes before sleep if needed',
    timeOfDay: 'bedtime',
    active: true,
  },
];

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Eleanor Vance',
  age: 76,
  targetSystolicMin: 110,
  targetSystolicMax: 130,
  targetDiastolicMin: 70,
  targetDiastolicMax: 85,
  medications: DEFAULT_MEDICATIONS,
  highContrast: false,
  textScale: 'large',
  soundEnabled: true,
  voiceSpeed: 0.9,
};

export class HealthStorageService {
  private static cachedRecords: CheckInRecord[] | null = null;
  private static cachedProfile: UserProfile | null = null;
  private static cachedMedLogs: Record<string, MedicationLogEntry[]> | null = null;
  private static cachedActivityLogs: Record<string, ActivityLogEntry[]> | null = null;
  private static cachedReminders: ReminderItem[] | null = null;
  private static cachedEvents: BayAreaEvent[] | null = null;
  private static cachedRecipes: RecipeItem[] | null = null;

  public static getProfile(): UserProfile {
    if (this.cachedProfile) return this.cachedProfile;

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (raw) {
        if (raw.startsWith('enc:v1:')) {
          CryptoService.decrypt(raw).then((decrypted) => {
            this.cachedProfile = { ...DEFAULT_PROFILE, ...JSON.parse(decrypted) };
          });
        } else {
          const parsed = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
          this.cachedProfile = parsed;
          this.saveProfile(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load profile from storage', e);
    }
    this.cachedProfile = DEFAULT_PROFILE;
    return DEFAULT_PROFILE;
  }

  public static saveProfile(profile: UserProfile): void {
    this.cachedProfile = profile;
    const json = JSON.stringify(profile);

    CryptoService.encrypt(json).then((encrypted) => {
      try {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, encrypted);
      } catch (e) {
        console.error('Failed to save encrypted profile', e);
      }
    });
  }

  public static getCheckIns(): CheckInRecord[] {
    if (this.cachedRecords) return this.cachedRecords;

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHECK_INS);
      if (raw) {
        if (raw.startsWith('enc:v1:')) {
          CryptoService.decrypt(raw).then((decrypted) => {
            this.cachedRecords = JSON.parse(decrypted);
          });
        } else {
          this.cachedRecords = JSON.parse(raw);
          this.saveCheckIns(this.cachedRecords || []);
          return this.cachedRecords || [];
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored checkins', e);
    }

    const initialSeed = this.generateSampleHistory('balanced');
    this.cachedRecords = initialSeed;
    this.saveCheckIns(initialSeed);
    return initialSeed;
  }

  public static saveCheckIns(records: CheckInRecord[]): void {
    this.cachedRecords = records;
    const json = JSON.stringify(records);

    CryptoService.encrypt(json).then((encrypted) => {
      try {
        localStorage.setItem(STORAGE_KEYS.CHECK_INS, encrypted);
      } catch (e) {
        console.error('Failed to save encrypted checkins', e);
      }
    });
  }

  public static addCheckIn(record: CheckInRecord): void {
    const existing = this.getCheckIns();
    const filtered = existing.filter((r) => r.date !== record.date);
    filtered.unshift(record);
    this.saveCheckIns(filtered);

    // Sync medication status with daily medication logs
    if (record.medicationStatus === 'taken') {
      this.markTimeSlotStatus(record.date, 'morning', 'taken');
    } else if (record.medicationStatus === 'missed') {
      this.markTimeSlotStatus(record.date, 'morning', 'missed');
    }
  }

  public static getTodayCheckIn(): CheckInRecord | null {
    const todayStr = new Date().toISOString().split('T')[0];
    const checkIns = this.getCheckIns();
    return checkIns.find((r) => r.date === todayStr) || null;
  }

  // --- Medication Log Management ---

  public static getAllMedicationLogs(): Record<string, MedicationLogEntry[]> {
    if (this.cachedMedLogs) return this.cachedMedLogs;

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MEDICATION_LOGS);
      if (raw) {
        if (raw.startsWith('enc:v1:')) {
          CryptoService.decrypt(raw).then((decrypted) => {
            this.cachedMedLogs = JSON.parse(decrypted);
          });
        } else {
          this.cachedMedLogs = JSON.parse(raw);
          return this.cachedMedLogs || {};
        }
      }
    } catch (e) {
      console.warn('Failed to load med logs', e);
    }

    // Generate initial historical seed logs
    const seedLogs = this.generateSampleMedicationLogs();
    this.cachedMedLogs = seedLogs;
    this.saveAllMedicationLogs(seedLogs);
    return seedLogs;
  }

  public static saveAllMedicationLogs(logs: Record<string, MedicationLogEntry[]>): void {
    this.cachedMedLogs = logs;
    const json = JSON.stringify(logs);

    CryptoService.encrypt(json).then((encrypted) => {
      try {
        localStorage.setItem(STORAGE_KEYS.MEDICATION_LOGS, encrypted);
      } catch (e) {
        console.error('Failed to save encrypted med logs', e);
      }
    });
  }

  public static getMedicationLogsForDate(date: string): MedicationLogEntry[] {
    const all = this.getAllMedicationLogs();
    if (all[date] && all[date].length > 0) {
      return all[date];
    }

    // If no log exists yet for this date, initialize from active profile medications
    const profile = this.getProfile();
    const isPast = new Date(date) < new Date(new Date().toISOString().split('T')[0]);

    const initialForDate: MedicationLogEntry[] = profile.medications
      .filter((m) => m.active !== false)
      .map((med) => ({
        id: `log-${date}-${med.id}`,
        date,
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        timeOfDay: med.timeOfDay,
        status: isPast ? 'taken' : 'pending',
        takenTime: isPast ? (med.timeOfDay === 'morning' ? '08:15 AM' : med.timeOfDay === 'afternoon' ? '01:00 PM' : '07:30 PM') : undefined,
      }));

    all[date] = initialForDate;
    this.saveAllMedicationLogs(all);
    return initialForDate;
  }

  public static updateMedicationLogStatus(
    date: string,
    medicationId: string,
    status: 'taken' | 'missed' | 'pending'
  ): void {
    const logs = this.getMedicationLogsForDate(date);
    const updated = logs.map((log) => {
      if (log.medicationId === medicationId) {
        return {
          ...log,
          status,
          takenTime: status === 'taken' 
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : undefined,
        };
      }
      return log;
    });

    const all = this.getAllMedicationLogs();
    all[date] = updated;
    this.saveAllMedicationLogs(all);
  }

  public static markTimeSlotStatus(
    date: string,
    timeOfDay: TimeOfDay,
    status: 'taken' | 'missed'
  ): void {
    const logs = this.getMedicationLogsForDate(date);
    const updated = logs.map((log) => {
      if (log.timeOfDay === timeOfDay) {
        return {
          ...log,
          status,
          takenTime: status === 'taken' 
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : undefined,
        };
      }
      return log;
    });

    const all = this.getAllMedicationLogs();
    all[date] = updated;
    this.saveAllMedicationLogs(all);
  }

  public static addMedicationToProfile(med: MedicationItem): void {
    const profile = this.getProfile();
    const updatedMeds = [...profile.medications, med];
    this.saveProfile({ ...profile, medications: updatedMeds });

    // Also add to today's log
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = this.getMedicationLogsForDate(today);
    todayLogs.push({
      id: `log-${today}-${med.id}`,
      date: today,
      medicationId: med.id,
      medicationName: med.name,
      dosage: med.dosage,
      timeOfDay: med.timeOfDay,
      status: 'pending',
    });
    const all = this.getAllMedicationLogs();
    all[today] = todayLogs;
    this.saveAllMedicationLogs(all);
  }

  public static deleteMedicationFromProfile(medId: string): void {
    const profile = this.getProfile();
    const updatedMeds = profile.medications.filter((m) => m.id !== medId);
    this.saveProfile({ ...profile, medications: updatedMeds });
  }

  // --- Physical Activity Log Management ---

  public static getAllActivityLogs(): Record<string, ActivityLogEntry[]> {
    if (this.cachedActivityLogs) return this.cachedActivityLogs;

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      if (raw) {
        if (raw.startsWith('enc:v1:')) {
          CryptoService.decrypt(raw).then((decrypted) => {
            this.cachedActivityLogs = JSON.parse(decrypted);
          });
        } else {
          this.cachedActivityLogs = JSON.parse(raw);
          return this.cachedActivityLogs || {};
        }
      }
    } catch (e) {
      console.warn('Failed to load activity logs', e);
    }

    const seed = this.generateSampleActivityLogs();
    this.cachedActivityLogs = seed;
    this.saveAllActivityLogs(seed);
    return seed;
  }

  public static saveAllActivityLogs(logs: Record<string, ActivityLogEntry[]>): void {
    this.cachedActivityLogs = logs;
    const json = JSON.stringify(logs);

    CryptoService.encrypt(json).then((encrypted) => {
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, encrypted);
      } catch (e) {
        console.error('Failed to save encrypted activity logs', e);
      }
    });
  }

  public static getActivityLogsForDate(date: string): ActivityLogEntry[] {
    const all = this.getAllActivityLogs();
    return all[date] || [];
  }

  public static addActivityLog(activity: ActivityLogEntry): void {
    const all = this.getAllActivityLogs();
    const forDate = all[activity.date] || [];
    forDate.unshift(activity);
    all[activity.date] = forDate;
    this.saveAllActivityLogs(all);
  }

  public static deleteActivityLog(date: string, id: string): void {
    const all = this.getAllActivityLogs();
    if (all[date]) {
      all[date] = all[date].filter((a) => a.id !== id);
      this.saveAllActivityLogs(all);
    }
  }

  /**
   * Generates realistic 30-day physical activity logs (Hiking, Walking, Sports, Yoga, Gardening)
   */
  public static generateSampleActivityLogs(): Record<string, ActivityLogEntry[]> {
    const logs: Record<string, ActivityLogEntry[]> = {};
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const dayActivities: ActivityLogEntry[] = [];

      // Every 2 days: Morning walk
      if (i % 2 === 0) {
        dayActivities.push({
          id: `act-${dateStr}-walk`,
          date: dateStr,
          title: 'Neighborhood Morning Walk',
          category: 'walking',
          durationMinutes: 25 + (i % 3) * 5,
          intensity: 'gentle',
          timeOfDay: 'morning',
          notes: 'Enjoyed fresh air with neighbor and saw flowers in bloom.',
          feelingAfter: 'refreshed',
          timestamp: `${dateStr}T08:45:00.000Z`,
        });
      }

      // Weekend or weekly: Hiking / Nature trails
      if (i % 6 === 0) {
        dayActivities.push({
          id: `act-${dateStr}-hike`,
          date: dateStr,
          title: 'Forest Pine Nature Trail Hike',
          category: 'hiking',
          durationMinutes: 45,
          intensity: 'moderate',
          timeOfDay: 'morning',
          notes: 'Walked the shaded woodland trail, took 2 water breaks.',
          feelingAfter: 'energized',
          timestamp: `${dateStr}T10:00:00.000Z`,
        });
      }

      // Twice a week: Sports (Pickleball / Swimming)
      if (i % 5 === 1) {
        dayActivities.push({
          id: `act-${dateStr}-sports`,
          date: dateStr,
          title: 'Community Pickleball (Doubles)',
          category: 'sports',
          durationMinutes: 40,
          intensity: 'moderate',
          timeOfDay: 'afternoon',
          notes: 'Fun doubles games with the senior community league.',
          feelingAfter: 'energized',
          timestamp: `${dateStr}T14:30:00.000Z`,
        });
      }

      // Chair stretching / Yoga
      if (i % 3 === 1) {
        dayActivities.push({
          id: `act-${dateStr}-stretch`,
          date: dateStr,
          title: 'Gentle Joint & Spine Stretching',
          category: 'stretching',
          durationMinutes: 15,
          intensity: 'gentle',
          timeOfDay: 'morning',
          notes: 'Gentle mobility and shoulder rolls.',
          feelingAfter: 'good',
          timestamp: `${dateStr}T09:00:00.000Z`,
        });
      }

      logs[dateStr] = dayActivities;
    }

    return logs;
  }

  /**
   * Generates realistic 30-day medication logs
   */
  public static generateSampleMedicationLogs(): Record<string, MedicationLogEntry[]> {
    const logsByDate: Record<string, MedicationLogEntry[]> = {};
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = i === 0;

      logsByDate[dateStr] = DEFAULT_MEDICATIONS.map((med) => {
        let status: 'taken' | 'missed' | 'pending' = 'taken';
        let takenTime: string | undefined = '08:30 AM';

        if (isToday) {
          status = med.timeOfDay === 'morning' ? 'taken' : 'pending';
          takenTime = status === 'taken' ? '08:30 AM' : undefined;
        } else if (i === 2 && med.name === 'Lisinopril') {
          status = 'missed';
          takenTime = undefined;
        } else if (i === 5 && med.timeOfDay === 'afternoon') {
          status = 'missed';
          takenTime = undefined;
        }

        return {
          id: `log-${dateStr}-${med.id}`,
          date: dateStr,
          medicationId: med.id,
          medicationName: med.name,
          dosage: med.dosage,
          timeOfDay: med.timeOfDay,
          status,
          takenTime,
        };
      });
    }

    return logsByDate;
  }

  public static generateSampleHistory(
    scenario: 'balanced' | 'rising_bp' | 'missed_meds' | 'dizziness_fatigue'
  ): CheckInRecord[] {
    const records: CheckInRecord[] = [];
    const now = new Date();

    for (let i = 29; i >= 1; i--) {
      const dateObj = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = dateObj.toISOString().split('T')[0];

      let mood: CheckInRecord['mood'] = 'good';
      let energy = 7;
      let sleep = 7;
      let pain = 1;
      let painNotes = '';
      let systolic = 122 + Math.floor(Math.sin(i) * 4);
      let diastolic = 78 + Math.floor(Math.cos(i) * 3);
      let pulse = 70 + Math.floor(Math.random() * 6);
      let medicationStatus: CheckInRecord['medicationStatus'] = 'taken';
      let symptoms: string[] = [];
      let weight = 152.4 + (i % 3 === 0 ? 0.2 : -0.1);
      let dailyNotes = 'Woke up refreshed. Enjoyed morning tea in the garden.';

      if (scenario === 'balanced') {
        if (i % 7 === 0) {
          mood = 'very_good';
          energy = 8;
          sleep = 9;
        } else if (i === 12) {
          mood = 'okay';
          symptoms = ['Mild stiffness'];
          pain = 3;
          painNotes = 'Mild right knee stiffness after long walk';
        }
      } else if (scenario === 'rising_bp') {
        if (i <= 10) {
          systolic = 142 + Math.floor((10 - i) * 0.8) + (i % 2 === 0 ? 3 : -1);
          diastolic = 88 + Math.floor((10 - i) * 0.4);
          mood = i <= 4 ? 'not_great' : 'okay';
          symptoms = i <= 5 ? ['Headache', 'Fatigue'] : ['Fatigue'];
          energy = 5;
          sleep = 5;
        }
      } else if (scenario === 'missed_meds') {
        if (i === 2 || i === 4 || i === 6) {
          medicationStatus = 'missed';
          dailyNotes = 'Forgot to take morning pills before rushing to community club.';
        }
      } else if (scenario === 'dizziness_fatigue') {
        if (i === 2 || i === 7 || i === 14 || i === 22) {
          symptoms = ['Dizziness', 'Fatigue'];
          mood = 'not_great';
          energy = 4;
          sleep = 5;
          dailyNotes = 'Felt lightheaded when standing up from armchair.';
        } else if (i <= 14) {
          symptoms = ['Fatigue'];
          energy = 5;
        }
      }

      records.push({
        id: `seed-record-${dateStr}`,
        date: dateStr,
        timestamp: `${dateStr}T08:30:00.000Z`,
        mood,
        energyLevel: energy,
        sleepQuality: sleep,
        painLevel: pain,
        painNotes: painNotes || undefined,
        bloodPressure: {
          measured: true,
          systolic,
          diastolic,
          pulse,
        },
        medicationStatus,
        symptoms,
        weight: Math.round(weight * 10) / 10,
        dailyNotes,
        inputMode: i % 4 === 0 ? 'conversational' : 'standard',
      });
    }

    return records;
  }

  // --- Reminders & To-Do Management ---

  public static getAllReminders(): ReminderItem[] {
    if (this.cachedReminders) return this.cachedReminders;

    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
        if (raw) {
          if (raw.startsWith('enc:v1:')) {
            CryptoService.decrypt(raw).then((decrypted) => {
              this.cachedReminders = JSON.parse(decrypted);
            });
          } else {
            this.cachedReminders = JSON.parse(raw);
            return this.cachedReminders || [];
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load reminders from storage', e);
    }

    const seed = this.generateSampleReminders();
    this.cachedReminders = seed;
    this.saveAllReminders(seed);
    return seed;
  }

  public static saveAllReminders(reminders: ReminderItem[]): void {
    this.cachedReminders = reminders;
    const json = JSON.stringify(reminders);

    CryptoService.encrypt(json).then((encrypted) => {
      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.setItem(STORAGE_KEYS.REMINDERS, encrypted);
        }
      } catch (e) {
        console.error('Failed to save encrypted reminders', e);
      }
    });
  }

  public static addReminder(item: ReminderItem): void {
    const all = this.getAllReminders();
    all.unshift(item);
    this.saveAllReminders(all);
  }

  public static toggleReminder(id: string): void {
    const all = this.getAllReminders();
    const updated = all.map((r) => {
      if (r.id === id) {
        const nextCompleted = !r.completed;
        return {
          ...r,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return r;
    });
    this.saveAllReminders(updated);
  }

  public static deleteReminder(id: string): void {
    const all = this.getAllReminders();
    const updated = all.filter((r) => r.id !== id);
    this.saveAllReminders(updated);
  }

  public static updateReminder(id: string, updates: Partial<ReminderItem>): void {
    const all = this.getAllReminders();
    const updated = all.map((r) => {
      if (r.id === id) {
        return { ...r, ...updates };
      }
      return r;
    });
    this.saveAllReminders(updated);
  }

  public static generateSampleReminders(): ReminderItem[] {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return [
      {
        id: 'rem-1',
        title: 'Cardiologist Follow-up Appointment with Dr. Miller',
        priority: 'urgent',
        dueDate: tomorrow,
        dueTime: '10:30 AM',
        completed: false,
        notes: 'Bring current blood pressure log sheet and medication list.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rem-2',
        title: 'Call Pharmacy for Lisinopril & Metformin Refill',
        priority: 'urgent',
        dueDate: today,
        dueTime: '02:00 PM',
        completed: false,
        notes: 'Only 3 days of blood pressure medication left in bottle.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rem-3',
        title: 'Fasting Blood Sugar Fingerstick Test',
        priority: 'urgent',
        dueDate: today,
        dueTime: '08:00 AM',
        completed: true,
        completedAt: new Date().toISOString(),
        notes: 'Recorded 104 mg/dL before breakfast.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rem-4',
        title: 'Water the Garden Flowerbeds & Tomato Plants',
        priority: 'less_urgent',
        dueDate: today,
        dueTime: 'Morning',
        completed: false,
        notes: 'Best done before the afternoon sun gets too warm.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rem-5',
        title: 'Replace AA Batteries in Blood Pressure Monitor',
        priority: 'less_urgent',
        dueDate: in3Days,
        dueTime: 'Afternoon',
        completed: false,
        notes: 'Check low battery symbol on the upper display.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rem-6',
        title: 'Call Granddaughter Sarah for Her Birthday',
        priority: 'less_urgent',
        dueDate: in3Days,
        dueTime: '05:00 PM',
        completed: false,
        notes: 'She turns 19 on Thursday!',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // --- Bay Area Fun & Community Events Management ---

  public static getCurrentWeekInfo(currentDate: Date = new Date()): {
    weekKey: string;
    weekRangeLabel: string;
    thisSaturday: string;
    thisSunday: string;
    nextSaturday: string;
    nextSunday: string;
    weekendLabel: string;
    thisWeekFullLabel: string;
  } {
    const d = new Date(currentDate);
    const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
    
    // Calculate Monday of current week
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    const nextSat = new Date(monday);
    nextSat.setDate(monday.getDate() + 12);

    const nextSun = new Date(monday);
    nextSun.setDate(monday.getDate() + 13);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const formatMonthDay = (date: Date) => `${monthNames[date.getMonth()]} ${date.getDate()}`;
    
    const year = monday.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((monday.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    return {
      weekKey: `${year}-W${weekNum}`,
      weekRangeLabel: `${formatMonthDay(monday)} – ${formatMonthDay(sunday)}, ${year}`,
      thisSaturday: `Sat, ${formatMonthDay(saturday)}`,
      thisSunday: `Sun, ${formatMonthDay(sunday)}`,
      nextSaturday: `Sat, ${formatMonthDay(nextSat)}`,
      nextSunday: `Sun, ${formatMonthDay(nextSun)}`,
      weekendLabel: `This Weekend (${formatMonthDay(saturday)} – ${formatMonthDay(sunday)})`,
      thisWeekFullLabel: `Week of ${formatMonthDay(monday)} – ${formatMonthDay(sunday)}, ${year}`,
    };
  }

  public static syncWeeklyBayAreaEvents(): { events: BayAreaEvent[]; isNewWeek: boolean } {
    const weekInfo = this.getCurrentWeekInfo();
    const seed = this.generateSampleBayAreaEvents();
    
    let loaded: BayAreaEvent[] = [];
    let lastWeekKey = '';

    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        lastWeekKey = localStorage.getItem(STORAGE_KEYS.BAY_AREA_LAST_WEEK_SYNC) || '';
        const raw = localStorage.getItem(STORAGE_KEYS.BAY_AREA_EVENTS);
        if (raw && !raw.startsWith('enc:v1:')) {
          loaded = JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn('Weekly Bay Area sync read error', e);
    }

    const isNewWeek = lastWeekKey !== weekInfo.weekKey;

    if (isNewWeek || loaded.length === 0) {
      const bookmarkedIds = new Set((loaded.length > 0 ? loaded : this.cachedEvents || []).filter((e) => e.isBookmarked).map((e) => e.id));
      const customEvents = (loaded.length > 0 ? loaded : this.cachedEvents || []).filter((e) => e.id.startsWith('bae-custom-'));

      const updated = seed.map((ev) => ({
        ...ev,
        isBookmarked: bookmarkedIds.has(ev.id),
      }));

      const merged = [...customEvents, ...updated];
      this.cachedEvents = merged;
      this.saveAllBayAreaEvents(merged);

      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.setItem(STORAGE_KEYS.BAY_AREA_LAST_WEEK_SYNC, weekInfo.weekKey);
        }
      } catch {}

      return { events: merged, isNewWeek: true };
    }

    this.cachedEvents = loaded;
    return { events: loaded, isNewWeek: false };
  }

  public static getAllBayAreaEvents(): BayAreaEvent[] {
    if (this.cachedEvents) return this.cachedEvents;
    const syncResult = this.syncWeeklyBayAreaEvents();
    return syncResult.events;
  }

  public static saveAllBayAreaEvents(events: BayAreaEvent[]): void {
    this.cachedEvents = events;
    const json = JSON.stringify(events);

    CryptoService.encrypt(json).then((encrypted) => {
      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.setItem(STORAGE_KEYS.BAY_AREA_EVENTS, encrypted);
        }
      } catch (e) {
        console.error('Failed to save encrypted Bay Area events', e);
      }
    });
  }

  public static toggleBookmarkBayAreaEvent(id: string): void {
    const all = this.getAllBayAreaEvents();
    const updated = all.map((ev) => {
      if (ev.id === id) {
        return { ...ev, isBookmarked: !ev.isBookmarked };
      }
      return ev;
    });
    this.saveAllBayAreaEvents(updated);
  }

  public static addBayAreaEvent(event: BayAreaEvent): void {
    const all = this.getAllBayAreaEvents();
    all.unshift(event);
    this.saveAllBayAreaEvents(all);
  }

  public static deleteBayAreaEvent(id: string): void {
    const all = this.getAllBayAreaEvents();
    const updated = all.filter((ev) => ev.id !== id);
    this.saveAllBayAreaEvents(updated);
  }

  public static resetBayAreaEvents(): BayAreaEvent[] {
    const seed = this.generateSampleBayAreaEvents();
    this.cachedEvents = seed;
    this.saveAllBayAreaEvents(seed);
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        const weekInfo = this.getCurrentWeekInfo();
        localStorage.setItem(STORAGE_KEYS.BAY_AREA_LAST_WEEK_SYNC, weekInfo.weekKey);
      }
    } catch {}
    return seed;
  }

  public static generateSampleBayAreaEvents(date: Date = new Date()): BayAreaEvent[] {
    const week = this.getCurrentWeekInfo(date);
    return [
      // --- Top Bay Area Senior-Friendly Vegetarian & Low-Sodium Restaurants ---
      {
        id: 'bae-rest-1',
        title: 'Greens Restaurant: Waterfront Farm-to-Table Vegetarian',
        category: 'restaurant',
        region: 'san_francisco',
        locationName: 'Building A, Fort Mason Center (Marina Blvd & Buchanan), San Francisco',
        dateRange: 'Open Tuesday – Sunday (Lunch, Brunch & Dinner)',
        time: '11:30 AM – 2:30 PM, 5:00 PM – 9:00 PM',
        description: 'Iconic San Francisco landmark founded in 1979 serving creative, organic vegetarian dishes sourced directly from Green Gulch Farm. Spectacular panoramic views of the Golden Gate Bridge. Chefs gladly accommodate strict low-sodium and salt-free dietary requests using fragrant fresh herbs, Meyer lemon, and cold-pressed extra virgin olive oil.',
        highlights: ['100% Vegetarian / Plant-Based', 'Strict Low-Sodium & Salt-Free customized orders', 'Panoramic Golden Gate & Bay Vistas', 'Organic Green Gulch Farm vegetables', 'Heart-healthy olive oil preparations'],
        admission: 'Lunch from $18 | Senior Lunch & Prix Fixe Available',
        emoji: '🌿',
        seniorFriendlyNotes: 'Completely flat ground-level entrance at Fort Mason with paved parking right next to the building. Wide ADA aisles, tranquil acoustic atmosphere, and comfortable cushioned seating.',
        weatherTip: 'Waterfront can be breezy outside; indoor dining room is warm, sunlit, and heated with sweeping views.',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
        isBookmarked: true,
        isRecurring: true,
      },
      {
        id: 'bae-rest-2',
        title: 'Wildseed: Seasonal Whole-Food Plant-Based Dining',
        category: 'restaurant',
        region: 'san_francisco',
        locationName: '2000 Union Street (at Buchanan), Marina / Cow Hollow, San Francisco',
        dateRange: 'Open Daily (Lunch, Weekend Brunch & Dinner)',
        time: '11:30 AM – 9:00 PM',
        description: 'Vibrant 100% plant-based restaurant crafting seasonal California whole foods, warm grain bowls, wild mushroom flatbreads, and turmeric lentil dal. Known for clean, non-greasy cooking with zero artificial additives, minimal sodium, and fresh botanical herb infusions.',
        highlights: ['100% Plant-Based / Vegan', 'Low-Sodium Grain & Lentil Bowls', 'Rich in Potassium & Antioxidants', 'Fresh cold-pressed veggie juices', 'Warm botanical indoor patio'],
        admission: 'Entrees $16 – $24',
        emoji: '🥑',
        seniorFriendlyNotes: 'Step-free street entrance, spacious booth seating with back support, bright natural lighting, and attentive staff trained in senior dietary modifications.',
        weatherTip: 'Sunny Union Street microclimate; lovely shaded atrium seating available.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        isBookmarked: true,
        isRecurring: true,
      },
      {
        id: 'bae-rest-3',
        title: 'Cha-Ya: Calming Salt-Free Kombu Dashi & Vegan Japanese',
        category: 'restaurant',
        region: 'east_bay',
        locationName: '1686 Shattuck Ave, Gourmet Ghetto, Berkeley (also Mission SF)',
        dateRange: 'Open Wednesday – Monday (Lunch & Dinner)',
        time: '12:00 PM – 2:30 PM, 5:00 PM – 8:30 PM',
        description: 'Peaceful, Zen-inspired vegan Japanese eatery renowned for gentle, soothing cuisine. Uses house-brewed kombu seaweed and shiitake mushroom dashi broth without any MSG, fish sauce, or heavy salt. Specializes in steamed seasonal vegetable nabe hotpots, garden sushi rolls, soft braised organic tofu, and buckwheat soba noodles.',
        highlights: ['100% Vegan Japanese', 'Zero MSG & Low-Sodium Mushroom Dashi Broth', 'Steamed Vegetable Claypot (Nabe)', 'Soft organic braised tofu', 'Gentle on digestion & heart-friendly'],
        admission: 'Entrees $14 – $22',
        emoji: '🍱',
        seniorFriendlyNotes: 'Level entryway with smooth hardwood floors, quiet conversational noise level (no loud music), easy reach from Downtown Berkeley BART.',
        weatherTip: 'Pleasant indoor dining; hot green tea and warm broths make it great year-round.',
        imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80',
        isBookmarked: true,
        isRecurring: true,
      },
      {
        id: 'bae-rest-4',
        title: 'Millennium: Award-Winning Organic Plant-Based Fine Dining',
        category: 'restaurant',
        region: 'east_bay',
        locationName: '5912 College Ave (Rockridge District), Oakland',
        dateRange: 'Tuesday – Sunday (Dinner & Sunday Brunch)',
        time: '5:00 PM – 9:00 PM (Brunch Sun 10:30 AM – 2:00 PM)',
        description: 'Michelin Bib Gourmand awardee celebrated for internationally inspired, gourmet organic vegan cuisine. Utilizes seasonal farm produce, roasted root vegetables, house-made herb reductions, and reduced-sodium house seasonings that highlight natural vegetable sweetness rather than salt.',
        highlights: ['Michelin Bib Gourmand Plant-Based', 'Custom Low-Sodium preparations available', 'Local organic farm partners', 'Cozy outdoor covered patio', 'House-made fresh herbal sauces'],
        admission: 'Entrees $22 – $32',
        emoji: '🌱',
        seniorFriendlyNotes: 'Smooth flat sidewalk entrance off College Ave, comfortable heated garden courtyard, close to Rockridge BART with easy street parking.',
        weatherTip: 'Covered outdoor patio features radiant overhead heaters for cool East Bay evenings.',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        isBookmarked: false,
        isRecurring: true,
      },
      {
        id: 'bae-rest-5',
        title: 'Shangri-La: Clean Kosher Vegetarian & Low-Sodium Chinese',
        category: 'restaurant',
        region: 'san_francisco',
        locationName: '2026 Irving St (at 21st Ave), Sunset District, San Francisco',
        dateRange: 'Open Daily (Lunch & Dinner)',
        time: '11:30 AM – 3:00 PM, 4:30 PM – 8:30 PM',
        description: 'Beloved Sunset neighborhood institution famous among local seniors for ultra-clean, non-greasy kosher vegan Chinese cooking. Features steamed lotus root, bok choy with braised mushrooms, herbal longevity soups, and brown rice dishes made with no added salt, no MSG, and minimal heart-healthy oils.',
        highlights: ['100% Kosher Vegan Chinese', 'Salt-Free & Low-Oil Cooking by request', 'Herbal Longevity Soups & Steamed Greens', 'Brown rice & fresh steamed dumplings', 'Deeply trusted by senior community'],
        admission: 'Entrees $12 – $18 (Very budget friendly)',
        emoji: '🥟',
        seniorFriendlyNotes: 'Completely level ground-floor entrance, quiet family-style booths, friendly staff who specialize in senior dietary requests, right along MUNI N-Judah line.',
        weatherTip: 'Warm, cozy indoor tea room, perfect after a stroll through nearby Golden Gate Park.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        isBookmarked: true,
        isRecurring: true,
      },
      {
        id: 'bae-rest-6',
        title: 'Garden Fresh: Wholesome Vegan Stir-Frys & Steamed Tofu Bowls',
        category: 'restaurant',
        region: 'peninsula_south_bay',
        locationName: '1245 W El Camino Real, Mountain View (also Palo Alto)',
        dateRange: 'Tuesday – Sunday (Lunch & Dinner)',
        time: '11:30 AM – 2:30 PM, 5:00 PM – 8:30 PM',
        description: 'Peninsula favorite serving pure vegetarian and vegan specialties prepared with fresh daily market vegetables, light ginger and garlic infusions, and zero MSG. Offers dedicated "Healthy Heart" low-sodium steamed vegetable and tofu platters with mild ginger dipping sauce on the side.',
        highlights: ['Dedicated Low-Sodium & Steamed Menu', 'Zero MSG & Light Olive Oil cooking', 'Fresh ginger & garlic seasonings', 'Spacious booths & easy parking', 'Senior-friendly portions & takeout'],
        admission: 'Entrees $13 – $19',
        emoji: '🥗',
        seniorFriendlyNotes: 'Direct level access from dedicated plaza parking lot (no stairs), wide aisles, wheelchair accessible restrooms, and calm dining room.',
        weatherTip: 'Mild South Bay climate; climate-controlled indoor dining.',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
        isBookmarked: false,
        isRecurring: true,
      },
      {
        id: 'bae-rest-7',
        title: 'Shizen: Artistic Plant-Based Sushi & Low-Sodium Specialty Rolls',
        category: 'restaurant',
        region: 'san_francisco',
        locationName: '370 14th Street (near Valencia), Mission District, San Francisco',
        dateRange: 'Open Daily for Dinner',
        time: '4:30 PM – 9:30 PM',
        description: 'Nationally celebrated 100% vegan Japanese sushi bar combining classic shojin ryori Buddhist techniques with California produce. Enjoy rolls made with smoked tomato, torched nigiri, avocado, mountain yams, and mild shiitake ramen with low-sodium tamari soy sauce.',
        highlights: ['100% Vegan Sushi & Izakaya', 'Low-Sodium Tamari & Salt-Free Dipping', 'Shojin Ryori Buddhist culinary roots', 'Fresh mountain yam & avocado rolls', 'Peaceful Japanese wooden aesthetic'],
        admission: 'Rolls $10 – $17 | Dinner $25 – $40',
        emoji: '🍣',
        seniorFriendlyNotes: 'Ground-level entry, beautiful acoustic wood paneling that keeps ambient noise gentle, early 4:30 PM seating available for relaxing early dinners.',
        weatherTip: 'Comfortable indoor dining with soft ambient lighting.',
        imageUrl: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&auto=format&fit=crop&q=80',
        isBookmarked: false,
        isRecurring: true,
      },
      {
        id: 'bae-rest-8',
        title: 'Nourish Cafe: 100% Organic Plant-Based Grain Bowls & Smoothies',
        category: 'restaurant',
        region: 'san_francisco',
        locationName: '189 6th Ave (at California St), Inner Richmond, San Francisco',
        dateRange: 'Open Daily for Breakfast, Lunch & Early Dinner',
        time: '8:00 AM – 6:00 PM',
        description: 'Clean-eating 100% organic plant-based neighborhood cafe crafting potassium-rich superfood salads, warm quinoa bowls, salt-free housemade almond milks, sprouted toasts, and antioxidant smoothies. Food is minimally processed and naturally low in sodium.',
        highlights: ['100% Organic & Plant-Based', 'Naturally Ultra Low-Sodium', 'Rich in Potassium, Fiber & Magnesium', 'Fresh sprouted whole grains', 'Cozy neighborhood cafe'],
        admission: 'Bowls & Sandwiches $12 – $17',
        emoji: '🥣',
        seniorFriendlyNotes: 'Flat sidewalk entry in quiet Inner Richmond neighborhood, sunny window bench seating, prompt friendly counter service.',
        weatherTip: 'Sunny morning cafe; close to Clement Street and Golden Gate Park for a post-meal walk.',
        imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800&auto=format&fit=crop&q=80',
        isBookmarked: false,
        isRecurring: true,
      },
      {
        id: 'bae-rest-9',
        title: 'Amy\'s Organic Kitchen: Wholesome Vegetarian Soups & Salads',
        category: 'restaurant',
        region: 'north_bay_marin',
        locationName: '5839 Redwood Dr, Rohnert Park & 340 Ignacio Blvd, Novato / San Rafael',
        dateRange: 'Open Daily (Lunch & Dinner)',
        time: '10:30 AM – 9:00 PM',
        description: 'From the makers of Amy\'s Kitchen, this 100% vegetarian restaurant serves organic vegetable chili, split pea and lentil soups, customizable low-sodium veggie burgers, gluten-free vegan mac & cheese, and fresh garden salads with light vinaigrettes.',
        highlights: ['100% Organic & Vegetarian', 'Customizable Low-Sodium soups & bowls', 'Zero GMOs & sustainable local ingredients', 'Spacious sunny dining room with garden roof', 'Drive-thru & indoor sit-down service'],
        admission: 'Meals $9 – $16 (Great senior value)',
        emoji: '🥪',
        seniorFriendlyNotes: 'Easy parking lot, step-free access, wide automated entrance doors, comfortable booths, and large-print menu boards.',
        weatherTip: 'Warm indoor dining room with living solar roof and patio tables.',
        imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&auto=format&fit=crop&q=80',
        isBookmarked: false,
        isRecurring: true,
      },
      {
        id: 'bae-rest-10',
        title: 'Sunflower Caffe & Farm Kitchen: Garden Fresh Sonoma Dining',
        category: 'restaurant',
        region: 'napa_sonoma',
        locationName: '421 1st St W (on the Historic Plaza), Sonoma',
        dateRange: 'Open Daily for Breakfast & Lunch',
        time: '8:30 AM – 3:00 PM',
        description: 'Charming historic courtyard cafe on Sonoma Plaza dedicated to local sustainable farming. Features heirloom tomato tartines, roasted golden beet & quinoa salads, steamed organic greens, and fresh herbal teas. Kitchen happily accommodates no-salt and low-sodium senior dietary requests.',
        highlights: ['Sonoma Farm-to-Table', 'Accommodates No-Salt & Low-Sodium requests', 'Organic heirloom vegetable salads', 'Shaded historic courtyard garden', 'Fresh herbal tonics & teas'],
        admission: 'Breakfast & Lunch $14 – $22',
        emoji: '🌻',
        seniorFriendlyNotes: 'Level plaza location, peaceful shaded courtyard with fountain sounds, step-free restrooms, ideal companion to a relaxing walk in Sonoma Plaza.',
        weatherTip: 'Sunny, warm wine country afternoons with shaded courtyard umbrellas.',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
        isBookmarked: false,
        isRecurring: true,
      },
      {
        id: 'bae-rest-11',
        title: 'Golden Lotus Vegetarian: Gentle Vietnamese & Steamed Tofu',
        category: 'restaurant',
        region: 'east_bay',
        locationName: '1301 Franklin St (at 13th St), Downtown Oakland',
        dateRange: 'Open Daily (Lunch & Dinner)',
        time: '11:00 AM – 8:00 PM',
        description: 'Established 100% vegetarian Vietnamese & Asian restaurant featuring fresh rice paper salad rolls, steamed lemongrass tofu, winter melon soups, and lightly wok-tossed green beans. Kitchen prepares salt-free and low-sodium orders upon request.',
        highlights: ['100% Vegan & Vegetarian', 'Low-Sodium Lemongrass & Ginger dishes', 'Fresh Steamed Vegetable & Tofu Rolls', 'Mild herbal broths', 'Downtown Oakland location near 12th St BART'],
        admission: 'Entrees $12 – $16',
        emoji: '🥢',
        seniorFriendlyNotes: 'Flat street-level entrance, spacious round tables for family dining, calm lunchtime atmosphere.',
        weatherTip: 'Warm indoor seating; great stop when visiting East Bay cultural sights.',
        imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80',
        isBookmarked: false,
        isRecurring: true,
      },
      {
        id: 'bae-rest-12',
        title: 'Craftsman and Wolves / Nourish Marina Vegetarian Hub',
        category: 'restaurant',
        region: 'san_francisco',
        locationName: 'Chestnut & Fillmore St, Marina District, San Francisco',
        dateRange: 'Open Daily',
        time: '8:00 AM – 4:00 PM',
        description: 'Modern neighborhood cafe offering fresh cold-pressed green juices, roasted squash & grain salads, avocado sourdough toasts with lemon zest (no added salt), and chamomile herbal teas.',
        highlights: ['Plant-forward whole food menu', 'Fresh unsalted avocado & grain toasts', 'Zero-sugar & low-sodium teas', 'Sunny outdoor sidewalk seating'],
        admission: 'Items $8 – $15',
        emoji: '☕',
        seniorFriendlyNotes: 'Level sidewalks along Chestnut Street, gentle morning sun, outdoor dog-friendly benches.',
        weatherTip: 'Sunny and sheltered Marina street with mild coastal afternoon breezes.',
        imageUrl: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=800&auto=format&fit=crop&q=80',
        isBookmarked: false,
        isRecurring: true,
      },

      // --- Bay Area Fun & Weekly Events ---
      {
        id: 'bae-1',
        title: 'SF Ferry Plaza Gourmet Farmers Market & Artisan Food Fair',
        category: 'food_festival',
        region: 'san_francisco',
        locationName: 'Ferry Building Plaza (Embarcadero), San Francisco',
        dateRange: `Every Sat & Tue (This ${week.thisSaturday})`,
        time: '8:00 AM – 2:00 PM',
        description: 'World-famous waterfront market featuring over 100 regional organic farmers, fresh sourdough, local artisan cheeses, hot dim sum, and honey tastings along the scenic SF bay.',
        highlights: ['Waterfront views', 'Fresh organic fruit', 'Hot artisan pastries', 'Coffee roasters'],
        admission: 'Free Admission (Pay as you eat)',
        emoji: '🥑',
        imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Paved flat promenade, ample shaded seating benches facing the bay, wheelchair accessible, easy MUNI/BART access.',
        weatherTip: 'Morning coastal breeze with sunny afternoons. Bring a light windbreaker or sunhat.',
        isBookmarked: true,
        isRecurring: true,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
      {
        id: 'bae-2',
        title: 'Ghirardelli Chocolate & Regional Wine Tasting Celebration',
        category: 'food_festival',
        region: 'san_francisco',
        locationName: 'Ghirardelli Square (Fisherman\'s Wharf), San Francisco',
        dateRange: `${week.weekendLabel}`,
        time: '11:00 AM – 5:00 PM',
        description: 'Indulge in handcrafted artisan chocolates, chocolate fountains, ice cream sundaes, and wine pairing tastings from Napa and Sonoma vineyards with live acoustic jazz.',
        highlights: ['Chocolate demonstrations', 'Wine tastings', 'Live jazz quartet', 'Ocean views of Alcatraz'],
        admission: 'Free Entry (Tasting pass available with senior discount)',
        emoji: '🍫',
        imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Elevators available across all plaza levels, indoor & outdoor café seating, wide paved walkways.',
        weatherTip: 'Mild & pleasant, sunny with occasional bay fog roll in late afternoon.',
        isBookmarked: false,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
      {
        id: 'bae-3',
        title: 'Half Moon Bay Art & World Pumpkin Championship Fair',
        category: 'fair_festival',
        region: 'peninsula_south_bay',
        locationName: 'Main Street & Coastside Plaza, Half Moon Bay',
        dateRange: `This Weekend (${week.thisSaturday} & ${week.thisSunday})`,
        time: '9:00 AM – 5:00 PM',
        description: 'Iconic coastal festival celebrating giant 2,000-lb pumpkins, homemade pumpkin pies, artisan glassblowing, live bluegrass stages, and coastal seafood chowder.',
        highlights: ['Giant Weigh-Off winners', 'Pumpkin pancakes', 'Fine arts & crafts', '3 live music stages'],
        admission: 'Free Admission to street festival',
        emoji: '🎃',
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475b?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Main Street is closed to cars with smooth walking surface, dedicated senior rest tents and shuttle services.',
        weatherTip: 'Coastal weather can be cool in the morning. Layered clothing recommended.',
        isBookmarked: true,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
      {
        id: 'bae-4',
        title: 'Stern Grove Festival: Free Sunday Concerts in the Redwoods',
        category: 'music_concert',
        region: 'san_francisco',
        locationName: 'Sigmund Stern Grove (19th Ave & Sloat), San Francisco',
        dateRange: `Every Sunday (${week.thisSunday})`,
        time: '2:00 PM – 4:30 PM (Gates open 12:00 PM)',
        description: 'Beloved historic outdoor concert series nestled in a majestic eucalyptus and redwood outdoor amphitheater featuring symphony, jazz, and classic rock performances.',
        highlights: ['Historic redwood amphitheater', 'Picnic friendly', 'World-class orchestras & guest stars'],
        admission: 'Free (Senior advance reserve seating available)',
        emoji: '🌲',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Senior ADA shuttle runs from 19th Ave entrance directly down to the stage meadow. Designated flat paved seating area.',
        weatherTip: 'Shaded under tall trees, bring a warm sweater and picnic blanket or low chair.',
        isBookmarked: false,
        isRecurring: true,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
      {
        id: 'bae-5',
        title: 'Berkeley Gourmet Ghetto Culinary Walk & Heritage Spice Market',
        category: 'food_festival',
        region: 'east_bay',
        locationName: 'North Shattuck Cultural District, Berkeley',
        dateRange: `Every Thursday & ${week.thisSaturday}`,
        time: '10:00 AM – 3:30 PM',
        description: 'Explore the birthplace of California Farm-to-Table cuisine. Taste wood-fired sourdough pizzas, French cheeses, organic gelato, and fragrant tea tastings.',
        highlights: ['Artisan cheese counter', 'Organic tea bar', 'Locally roasted coffees', 'Culinary history tour'],
        admission: 'Free Walk & Browse (Tasting samples available)',
        emoji: '🧀',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Tree-lined sidewalks with gentle flat grade, numerous patio seating spots, close to Downtown Berkeley BART.',
        weatherTip: 'Warm and sunny East Bay climate. Very pleasant for walking.',
        isBookmarked: false,
        isRecurring: true,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
      {
        id: 'bae-6',
        title: 'Sausalito Waterfront Fine Art, Jazz & Oyster Festival',
        category: 'art_culture',
        region: 'north_bay_marin',
        locationName: 'Marinship Waterfront Park, Sausalito',
        dateRange: `${week.weekendLabel}`,
        time: '10:00 AM – 6:00 PM',
        description: 'Premier seaside art gathering showcasing over 200 acclaimed sculptors, watercolor painters, and jewelers, alongside fresh Tomales Bay oysters and local California chardonnay.',
        highlights: ['Award-winning artists', 'Fresh grilled oysters', 'Bayside jazz terrace', 'Ferry ride views'],
        admission: '$15 Senior Admission (Includes complimentary drink coupon)',
        emoji: '⛵',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Completely level grass and paved paths, direct Sausalito Ferry pier drop-off, shaded dining pavilions with tables.',
        weatherTip: 'Bright, breezy seaside air. Sunglasses and light jacket recommended.',
        isBookmarked: true,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
      {
        id: 'bae-7',
        title: 'Sonoma Historic Plaza Wine & Autumn Olive Harvest Market',
        category: 'food_festival',
        region: 'napa_sonoma',
        locationName: 'Sonoma Plaza Central Park, Downtown Sonoma',
        dateRange: `Every 1st & 3rd Saturday (This ${week.thisSaturday})`,
        time: '9:30 AM – 4:00 PM',
        description: 'Gather at the historic 8-acre park plaza for extra virgin olive oil tastings, warm fresh baguettes, Sonoma artisan goat cheese, and estate pinot noir sampling.',
        highlights: ['Olive oil pressing demo', 'Artisan sourdough & cheese', 'Historic mission tours', 'Duck pond park'],
        admission: 'Free Public Entry',
        emoji: '🍇',
        imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Gentle flat grassy lawn and wide shaded pathways, picnic benches, and accessible restrooms.',
        weatherTip: 'Warm, clear sunshine (70s°F). Great afternoon outdoor weather.',
        isBookmarked: false,
        isRecurring: true,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
      {
        id: 'bae-8',
        title: 'Filoli Historic Estate Autumn Dahlias & High Tea Garden Walk',
        category: 'nature_walk',
        region: 'peninsula_south_bay',
        locationName: 'Filoli Historic House & Gardens, Woodside',
        dateRange: `Open Daily This Week (${week.weekRangeLabel})`,
        time: '10:00 AM – 5:00 PM',
        description: 'Stroll through 16 acres of formal English renaissance gardens blooming with vibrant dahlias, historic fruit orchards, and charming afternoon tea served in the garden court.',
        highlights: ['Spectacular dahlia blooms', 'Historic 1917 Georgian country house', 'English garden tea service'],
        admission: '$20 Senior Discount Ticket',
        emoji: '🌸',
        imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Golf cart shuttles available throughout the garden, smooth wide gravel paths, benches every 50 yards.',
        weatherTip: 'Nestled against the Peninsula coastal range with mild sunny temperatures.',
        isBookmarked: false,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
      {
        id: 'bae-9',
        title: 'Downtown San Jose Jazz & Blues Sunset Sessions',
        category: 'music_concert',
        region: 'peninsula_south_bay',
        locationName: 'Plaza de Cesar Chavez Park, Downtown San Jose',
        dateRange: `Every Friday Evening (This Friday)`,
        time: '5:30 PM – 8:30 PM',
        description: 'Relax under palm trees to live Latin jazz, brass bands, and soulful blues while enjoying gourmet food truck tacos, artisan crepes, and fresh lemonade.',
        highlights: ['Live outdoor brass & jazz', 'Gourmet food truck village', 'Interactive fountain light show'],
        admission: 'Free Community Event',
        emoji: '🎷',
        imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Level paved plaza, folding lawn chairs welcome, easy Light Rail access directly at the park.',
        weatherTip: 'Warm South Bay evenings. Very pleasant for relaxing in a camp chair.',
        isBookmarked: false,
        isRecurring: true,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
      {
        id: 'bae-10',
        title: 'Japanese Tea Garden & Golden Gate Botanical Senior Morning Walk',
        category: 'nature_walk',
        region: 'san_francisco',
        locationName: 'Golden Gate Park (Music Concourse Dr), San Francisco',
        dateRange: `Every Wednesday & Friday Morning`,
        time: '9:00 AM – 11:30 AM',
        description: 'Tranquil peaceful morning stroll past traditional koi ponds, red cedar pagodas, stone lanterns, and zen rock gardens followed by warm green tea and sweet rice cakes.',
        highlights: ['Calm koi ponds & zen garden', 'Historic Drum Bridge', 'Traditional tea house snacks', 'Free admission for SF seniors'],
        admission: 'Free for SF residents/seniors ($7 regular senior admission)',
        emoji: '🍵',
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Flat paved perimeter path, handrails on main bridges, peaceful meditative atmosphere.',
        weatherTip: 'Morning dew and gentle fog giving way to midday sunshine.',
        isBookmarked: true,
        isRecurring: true,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
      {
        id: 'bae-11',
        title: 'Oakland Waterfront Jack London Square Street Eats & Craft Bazaar',
        category: 'community',
        region: 'east_bay',
        locationName: 'Jack London Square Promenade, Oakland',
        dateRange: `This Sunday (${week.thisSunday})`,
        time: '11:00 AM – 5:00 PM',
        description: 'Vibrant waterfront boardwalk market featuring over 50 local makers, handmade ceramics, vintage books, seafood chowder bread bowls, and live ukulele groups.',
        highlights: ['Bay ferry views', 'Handmade crafts', 'Live acoustic music', 'Fresh seafood stands'],
        admission: 'Free Admission',
        emoji: '🌮',
        imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Wide, completely flat boardwalk along the marina, easy ferry service from SF to Oakland terminal.',
        weatherTip: 'Sunny and warm with gentle marina breeze.',
        isBookmarked: false,
        isRecurring: true,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
      {
        id: 'bae-12',
        title: 'North Beach Italian Heritage Festival & Piazza Pizza Bake-Off',
        category: 'food_festival',
        region: 'san_francisco',
        locationName: 'Washington Square Park & Columbus Ave, San Francisco',
        dateRange: `${week.weekendLabel}`,
        time: '11:00 AM – 6:00 PM',
        description: 'Celebrate San Francisco\'s historic Little Italy with brick-oven Neapolitan pizza tastings, cannoli eating contests, accordion melodies, and Italian gelato stands.',
        highlights: ['Wood-fired pizza bake-off', 'Fresh gelato & espresso', 'Live accordion & opera songs', 'Piazza art walk'],
        admission: 'Free Street Festival',
        emoji: '🍕',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
        seniorFriendlyNotes: 'Washington Square Park has plenty of lawn and bench seating in front of Saints Peter and Paul Church.',
        weatherTip: 'Warm, protected neighborhood with sunny microclimate.',
        isBookmarked: false,
        isThisWeek: true,
        weekLabel: week.thisWeekFullLabel,
      },
    ];
  }

  // --- Healthy Recipes & Non-Salty / Vegetarian Meals Management ---

  public static getAllRecipes(): RecipeItem[] {
    if (this.cachedRecipes) return this.cachedRecipes;

    const seed = this.generateSampleRecipes();
    const photoMap = new Map(seed.map((s) => [s.id, s.imageUrl]));

    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        const raw = localStorage.getItem(STORAGE_KEYS.RECIPES);
        if (raw) {
          if (raw.startsWith('enc:v1:')) {
            CryptoService.decrypt(raw).then((decrypted) => {
              const parsed: RecipeItem[] = JSON.parse(decrypted);
              this.cachedRecipes = parsed.map((r) => ({
                ...r,
                imageUrl: r.imageUrl || photoMap.get(r.id) || 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
              }));
            });
          } else {
            const parsed: RecipeItem[] = JSON.parse(raw);
            this.cachedRecipes = parsed.map((r) => ({
              ...r,
              imageUrl: r.imageUrl || photoMap.get(r.id) || 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
            }));
            return this.cachedRecipes || [];
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load recipes from storage', e);
    }

    this.cachedRecipes = seed;
    this.saveAllRecipes(seed);
    return seed;
  }

  public static saveAllRecipes(recipes: RecipeItem[]): void {
    this.cachedRecipes = recipes;
    const json = JSON.stringify(recipes);

    CryptoService.encrypt(json).then((encrypted) => {
      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.setItem(STORAGE_KEYS.RECIPES, encrypted);
        }
      } catch (e) {
        console.error('Failed to save encrypted recipes', e);
      }
    });
  }

  public static toggleBookmarkRecipe(id: string): void {
    const all = this.getAllRecipes();
    const updated = all.map((r) => {
      if (r.id === id) {
        return { ...r, isBookmarked: !r.isBookmarked };
      }
      return r;
    });
    this.saveAllRecipes(updated);
  }

  public static addRecipe(recipe: RecipeItem): void {
    const all = this.getAllRecipes();
    all.unshift(recipe);
    this.saveAllRecipes(all);
  }

  public static deleteRecipe(id: string): void {
    const all = this.getAllRecipes();
    const updated = all.filter((r) => r.id !== id);
    this.saveAllRecipes(updated);
  }

  public static resetRecipes(): RecipeItem[] {
    const seed = this.generateSampleRecipes();
    this.cachedRecipes = seed;
    this.saveAllRecipes(seed);
    return seed;
  }

  public static generateSampleRecipes(): RecipeItem[] {
    return [
      {
        id: 'rec-1',
        title: 'Creamy Tuscan Cannellini Bean & Baby Spinach Stew',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
        sodiumMgPerServing: 75,
        caloriesPerServing: 240,
        description: 'A comforting, velvety Mediterranean stew simmered with garlic, sun-ripened tomatoes, sweet carrots, and fresh spinach without any added salt.',
        imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 cans (15 oz) no-salt-added Cannellini beans (rinsed & drained)',
          '4 cups low-sodium vegetable broth (under 140mg sodium)',
          '3 cups fresh baby spinach leaves',
          '1 can (14 oz) no-salt-added diced Italian tomatoes',
          '4 cloves garlic, minced',
          '1 medium yellow onion, diced',
          '2 carrots, sliced into coins',
          '2 tbsp extra virgin olive oil',
          '1 tbsp fresh rosemary, finely chopped',
          '1 tsp dried oregano and 1 tsp dried thyme',
          '1 tbsp freshly squeezed lemon juice (for bright finish)',
          '1/4 tsp freshly cracked black pepper',
        ],
        instructions: [
          'Heat extra virgin olive oil in a large Dutch oven over medium heat.',
          'Add diced onion and sliced carrots; sauté for 5 minutes until tender and fragrant.',
          'Add minced garlic, rosemary, oregano, and thyme. Cook for 1 minute until aromatic.',
          'Stir in the diced tomatoes, rinsed Cannellini beans, and low-sodium vegetable broth.',
          'Bring to a gentle boil, then lower heat and simmer for 12 minutes to let the herbal flavors blend.',
          'Using the back of a wooden spoon or potato masher, gently mash about 1/3 of the beans against the side of the pot to naturally thicken the stew into a creamy broth without heavy cream.',
          'Stir in fresh baby spinach and cook for 2 minutes until just wilted.',
          'Finish with fresh lemon juice and cracked black pepper. Serve warm with rustic whole grain sourdough toast.',
        ],
        saltFreeSeasoningTips: 'Fresh lemon juice, aromatic garlic, and fresh rosemary provide all the vibrant savoriness usually given by salt.',
        vegetarianSwapTip: 'Cannellini beans provide 15g of plant-based protein and 12g of dietary fiber per bowl, making it a delicious alternative to chicken noodle or sausage soup.',
        healthBenefit: 'High in natural potassium and magnesium which actively helps relax arterial walls and maintain healthy blood pressure levels.',
        emoji: '🫘',
        isBookmarked: true,
      },
      {
        id: 'rec-2',
        title: 'Roasted Butternut Squash & Honeycrisp Apple Ginger Soup',
        mealType: 'soup',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        servings: 4,
        sodiumMgPerServing: 55,
        caloriesPerServing: 180,
        description: 'Naturally sweet and warming soup bursting with beta-carotene, fresh ginger root, roasted butternut squash, and crisp California apples.',
        imageUrl: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 large butternut squash (about 3 lbs), peeled, seeded and cubed',
          '2 Honeycrisp or Gala apples, peeled, cored and chopped',
          '1 medium yellow onion, chopped',
          '1 tbsp fresh ginger root, freshly grated',
          '3 cups low-sodium vegetable broth or filtered water',
          '1/2 cup unsweetened almond milk or light coconut milk',
          '1.5 tbsp olive oil',
          '1/2 tsp ground cinnamon and 1/4 tsp ground nutmeg',
          '2 tbsp toasted unsalted pumpkin seeds (pepitas) for garnish',
        ],
        instructions: [
          'Toss cubed butternut squash, apples, and onions with olive oil, cinnamon, and nutmeg on a baking sheet.',
          'Roast in the oven at 400°F (200°C) for 25 minutes until caramelized and tender.',
          'Transfer roasted vegetables into a large soup pot; add freshly grated ginger and low-sodium broth.',
          'Simmer on medium-low for 8 minutes.',
          'Blend until silky smooth using an immersion blender or standing blender.',
          'Stir in unsweetened almond milk for creaminess.',
          'Ladle into warm bowls and top with toasted unsalted pumpkin seeds for a delicious crunch.',
        ],
        saltFreeSeasoningTips: 'The natural caramelization from roasting combined with freshly grated ginger root and a dash of nutmeg creates incredible depth without a single grain of salt.',
        vegetarianSwapTip: 'Pure plant-based and dairy-free; pumpkin seeds add healthy zinc and magnesium.',
        healthBenefit: 'Packed with Vitamin A, Vitamin C, and antioxidants that support eye health, cardiovascular vitality, and immune defense.',
        emoji: '🥣',
        isBookmarked: false,
      },
      {
        id: 'rec-3',
        title: 'Mediterranean Lemon Garlic Quinoa Bowl with Warm Chickpeas & Avocado',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'diabetic_friendly', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 15,
        servings: 2,
        sodiumMgPerServing: 85,
        caloriesPerServing: 360,
        description: 'A vibrant power bowl layered with fluffy warm quinoa, spiced chickpeas, English cucumbers, cherry tomatoes, creamy avocado, and fresh mint.',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 cup cooked warm tricolor quinoa',
          '1 can (15 oz) no-salt-added chickpeas (garbanzo beans), rinsed and drained',
          '1 ripe Haas avocado, sliced',
          '1 cup Persian or English cucumbers, diced',
          '1 cup sweet cherry tomatoes, halved',
          '2 tbsp extra virgin olive oil',
          '2 tbsp fresh lemon juice and 1/2 tsp lemon zest',
          '2 cloves garlic, grated or finely minced',
          '1/2 tsp ground cumin and 1/2 tsp smoked paprika',
          '2 tbsp fresh mint and fresh parsley, chopped',
          '1 tbsp toasted unsalted sunflower seeds',
        ],
        instructions: [
          'In a small skillet over medium heat, add 1 tbsp olive oil, cumin, smoked paprika, and chickpeas. Toast for 5 minutes until warm and fragrant.',
          'Whisk remaining olive oil, fresh lemon juice, lemon zest, minced garlic, and chopped mint in a small ramekin.',
          'Divide fluffy quinoa between two wide bowls.',
          'Arrange warm spiced chickpeas, diced cucumber, sweet cherry tomatoes, and sliced avocado in colorful sections on top.',
          'Drizzle with the zesty lemon-garlic dressing and sprinkle with sunflower seeds.',
        ],
        saltFreeSeasoningTips: 'Smoked paprika gives a gentle savory grill flavor, while lemon zest and fresh garden mint provide an exhilarating, refreshing burst.',
        vegetarianSwapTip: 'Chickpeas and quinoa together form a complete plant protein with all 9 essential amino acids, making it a satisfying vegetarian replacement for chicken salad.',
        healthBenefit: 'Monounsaturated fats from avocado and soluble fiber from chickpeas help optimize cholesterol ratios and support steady blood sugar.',
        emoji: '🥗',
        isBookmarked: true,
      },
      {
        id: 'rec-4',
        title: 'Heart-Healthy Avocado, Heirloom Tomato & Basil Toast on Sprouted Grain',
        mealType: 'breakfast',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 8,
        cookTimeMinutes: 2,
        servings: 2,
        sodiumMgPerServing: 90,
        caloriesPerServing: 220,
        description: 'Crispy toasted sprouted grain bread spread with rich mashed avocado, sweet vine tomatoes, microgreens, and a drizzle of balsamic reduction.',
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 slices low-sodium sprouted whole grain bread (e.g. Ezekiel salt-free or artisan seeded bread)',
          '1 large ripe avocado, pitted and peeled',
          '1 large ripe heirloom or vine tomato, thinly sliced',
          '1 tbsp fresh lemon juice',
          '1/4 cup fresh baby arugula or microgreens',
          '4 fresh basil leaves, torn',
          '1 tsp aged balsamic glaze (sodium-free reduction)',
          '1/4 tsp nutritional yeast or freshly ground black pepper',
          '1 tsp hemp hearts or toasted sesame seeds',
        ],
        instructions: [
          'Toast the sprouted whole grain bread until golden and crisp.',
          'In a bowl, mash the avocado with fresh lemon juice and a pinch of black pepper using a fork.',
          'Spread the creamy mashed avocado generously across the toasted bread.',
          'Layer heirloom tomato slices and fresh baby arugula on top.',
          'Garnish with torn fresh basil, hemp hearts, and a drizzle of aged balsamic glaze.',
        ],
        saltFreeSeasoningTips: 'Aged balsamic glaze and fresh torn basil give a sweet-tangy Italian flavor that makes table salt completely unnecessary.',
        vegetarianSwapTip: '100% plant-based breakfast swap for processed morning breakfast sausages or high-sodium bacon.',
        healthBenefit: 'Healthy plant sterols and potassium directly nourish the cardiovascular system and keep arteries flexible.',
        emoji: '🥑',
        isBookmarked: false,
      },
      {
        id: 'rec-5',
        title: 'Slow-Cooker French Brown Lentil & Cremini Mushroom Bourguignon',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 20,
        cookTimeMinutes: 240,
        servings: 6,
        sodiumMgPerServing: 80,
        caloriesPerServing: 270,
        description: 'Rich, savory French stew with earthy brown lentils, meaty Cremini mushrooms, pearl onions, carrots, and thyme in a rich red grape and herb reduction.',
        imageUrl: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1.5 cups French green or brown lentils, rinsed',
          '1 lb Cremini or Baby Bella mushrooms, quartered',
          '1 cup frozen pearl onions or 1 large yellow onion, chopped',
          '4 medium carrots, cut into 1-inch chunks',
          '3 stalks celery, sliced',
          '4 cloves garlic, smashed',
          '2 tbsp tomato paste (no-salt-added)',
          '4 cups low-sodium vegetable stock',
          '1/2 cup 100% Concord grape juice or dealcoholized dry red wine',
          '2 bay leaves and 4 sprigs fresh thyme',
          '2 tbsp olive oil and 1/4 tsp black pepper',
        ],
        instructions: [
          'Heat olive oil in a skillet over high heat; sear mushrooms for 4 minutes until deeply browned and savory. Transfer to slow cooker.',
          'Add rinsed lentils, carrots, celery, pearl onions, garlic, tomato paste, vegetable stock, and red grape reduction to the slow cooker.',
          'Nestle in the fresh thyme sprigs and bay leaves.',
          'Cover and cook on LOW for 6 hours (or HIGH for 3.5 hours) until lentils and vegetables are fork-tender and the gravy is rich.',
          'Discard bay leaves and thyme stems before serving.',
          'Serve over steamed brown rice or mashed cauliflower-potato mash.',
        ],
        saltFreeSeasoningTips: 'Searing the Cremini mushrooms until deep golden creates rich natural umami compounds (glutamates) that mimic the savoriness of slow-cooked meat.',
        vegetarianSwapTip: 'Hearty vegetarian alternative to traditional Beef Bourguignon; zero saturated animal fat and zero cholesterol.',
        healthBenefit: 'High dietary fiber and complex carbohydrates help stabilize insulin levels and support digestive wellness.',
        emoji: '🍄',
        isBookmarked: true,
      },
      {
        id: 'rec-6',
        title: 'Golden Turmeric Oatmeal with Fresh Blueberries, Walnuts & Cinnamon',
        mealType: 'breakfast',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'diabetic_friendly'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        servings: 2,
        sodiumMgPerServing: 15,
        caloriesPerServing: 260,
        description: 'Anti-inflammatory golden morning bowl cooked with rolled oats, ground turmeric, Ceylon cinnamon, fresh California blueberries, and crunchy walnuts.',
        imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 cup old-fashioned rolled oats (gluten-free if preferred)',
          '2 cups water or unsweetened almond milk',
          '1/2 tsp ground turmeric',
          '1/2 tsp ground Ceylon cinnamon',
          '1/4 tsp ground ginger',
          '1 cup fresh blueberries or raspberries',
          '1/4 cup raw walnut halves, gently crushed',
          '1 tbsp ground golden flaxseed',
          '1 tsp pure maple syrup or pure vanilla extract (optional)',
        ],
        instructions: [
          'Bring water or unsweetened almond milk to a gentle boil in a small saucepan.',
          'Stir in rolled oats, ground turmeric, cinnamon, and ground ginger.',
          'Reduce heat to low and simmer for 5 to 7 minutes, stirring occasionally until creamy.',
          'Stir in ground golden flaxseed and vanilla extract.',
          'Divide between two bowls and top generously with fresh blueberries and crushed walnuts.',
        ],
        saltFreeSeasoningTips: 'Ceylon cinnamon and pure vanilla provide gentle natural sweetness without adding sugar or sodium.',
        vegetarianSwapTip: 'Oats and walnuts supply omega-3 ALA fatty acids and natural plant protein.',
        healthBenefit: 'Curcumin in turmeric and anthocyanins in blueberries are powerful antioxidants that reduce joint inflammation and support brain memory.',
        emoji: '🥣',
        isBookmarked: false,
      },
      {
        id: 'rec-7',
        title: 'Sheet-Pan Rainbow Roasted Vegetables & Crispy Tofu with Balsamic Herb Glaze',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 3,
        sodiumMgPerServing: 70,
        caloriesPerServing: 310,
        description: 'Colorful tray of roasted broccoli florets, sweet bell peppers, red onion wedges, and crispy pressed organic tofu glazed with garlic-herb balsamic.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 block (14 oz) extra-firm organic tofu, pressed and cubed into 3/4-inch pieces',
          '2 cups broccoli florets',
          '1 red bell pepper and 1 yellow bell pepper, cut into 1-inch strips',
          '1 red onion, sliced into wedges',
          '1 cup zucchini or yellow squash, sliced into half-moons',
          '2 tbsp extra virgin olive oil',
          '2 tbsp aged balsamic vinegar',
          '1 tsp garlic powder and 1 tsp onion powder',
          '1 tbsp Italian herb blend (basil, oregano, rosemary, thyme)',
          '1 tbsp nutritional yeast (for savory golden crust)',
        ],
        instructions: [
          'Preheat oven to 400°F (200°C). Line a large baking sheet with parchment paper.',
          'Press tofu with a clean towel for 10 minutes to remove excess moisture; cut into cubes.',
          'In a large bowl, whisk olive oil, balsamic vinegar, garlic powder, onion powder, Italian herbs, and nutritional yeast.',
          'Add cubed tofu and all chopped vegetables to the bowl; toss gently until evenly coated.',
          'Spread out in a single layer on the prepared baking sheet.',
          'Roast for 25 minutes, tossing halfway through, until vegetables are tender with caramelized edges and tofu is golden crisp.',
        ],
        saltFreeSeasoningTips: 'Nutritional yeast and balsamic glaze form a savory, mouth-watering crust on the tofu with zero added salt.',
        vegetarianSwapTip: 'Crispy tofu delivers 16g of lean plant protein per serving, completely replacing chicken or pork sheet pan dishes.',
        healthBenefit: 'Cruciferous broccoli and colorful bell peppers supply abundant Vitamin C and sulforaphane to strengthen blood vessel integrity.',
        emoji: '🥦',
        isBookmarked: false,
      },
      {
        id: 'rec-8',
        title: 'Citrus Herb Marinated Portobello Steaks with Garlic Spinach',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'diabetic_friendly', 'high_potassium'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 12,
        servings: 2,
        sodiumMgPerServing: 65,
        caloriesPerServing: 195,
        description: 'Juicy, meaty Portobello mushroom caps marinated in orange juice, garlic, rosemary, and olive oil, pan-seared and served over a bed of warm garlic spinach.',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '4 large Portobello mushroom caps, stems removed and gently wiped clean',
          '4 cups fresh mature spinach or kale',
          '3 tbsp fresh orange juice and 1 tbsp fresh lemon juice',
          '2 tbsp extra virgin olive oil',
          '3 cloves garlic, finely minced',
          '1 tbsp fresh rosemary, minced',
          '1/2 tsp cracked black pepper',
        ],
        instructions: [
          'Whisk orange juice, lemon juice, 1.5 tbsp olive oil, 2 cloves minced garlic, rosemary, and black pepper in a shallow dish.',
          'Place Portobello caps in the marinade, turning to coat both sides. Let sit for 10 minutes.',
          'Heat a grill pan or cast-iron skillet over medium-high heat. Cook mushroom caps for 4 to 5 minutes per side until tender, juicy, and charred.',
          'In a separate small skillet, heat remaining 1/2 tbsp olive oil and 1 clove garlic; add spinach and sauté for 2 minutes until wilted.',
          'Serve the Portobello steaks hot on top of the garlic spinach.',
        ],
        saltFreeSeasoningTips: 'Fresh citrus juices (orange and lemon) act as natural flavor amplifiers that brighten the rich earthy mushroom flavors.',
        vegetarianSwapTip: 'Portobello caps have the dense texture and umami savoriness of beef steaks without cholesterol or artery-clogging saturated fats.',
        healthBenefit: 'Very low glycemic index, high in potassium and B-vitamins for cellular energy and cardiovascular health.',
        emoji: '🥩',
        isBookmarked: false,
      },
      {
        id: 'rec-9',
        title: 'Potassium-Power Green Smoothie with Banana, Spinach & Almond Butter',
        mealType: 'smoothie',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 1,
        sodiumMgPerServing: 45,
        caloriesPerServing: 250,
        description: 'A smooth, naturally sweet morning blend rich in potassium, calcium, and plant nutrients to energize your body and support healthy blood pressure.',
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 medium ripe banana (fresh or frozen)',
          '2 packed cups fresh baby spinach leaves',
          '1 cup unsweetened almond milk or oat milk',
          '1 tbsp unsalted almond butter or peanut butter',
          '1 tbsp chia seeds or ground flaxseed',
          '1/4 tsp ground cinnamon',
          '3 ice cubes',
        ],
        instructions: [
          'Place all ingredients in a high-speed blender: unsweetened almond milk, spinach, banana, almond butter, chia seeds, cinnamon, and ice.',
          'Blend on high for 45 to 60 seconds until completely creamy and vibrant green.',
          'Pour into a tall chilled glass and enjoy immediately.',
        ],
        saltFreeSeasoningTips: 'Ripe banana and fragrant cinnamon provide all the natural sweetness with zero added sugars or sodium.',
        vegetarianSwapTip: 'Almond butter and chia seeds provide clean plant protein and healthy omega-3 fatty acids.',
        healthBenefit: 'Provides over 650mg of natural dietary potassium in one glass, which works in the kidneys to flush out excess sodium from the bloodstream.',
        emoji: '🥤',
        isBookmarked: true,
      },
      {
        id: 'rec-10',
        title: 'Garden Fresh Tomato Basil & Zucchini Ribbon Pasta with Toasted Pine Nuts',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 10,
        servings: 2,
        sodiumMgPerServing: 80,
        caloriesPerServing: 320,
        description: 'Light, vibrant Italian pasta tossed with sweet cherry tomatoes, tender zucchini ribbons, fragrant fresh basil, garlic, and golden toasted pine nuts.',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '4 oz whole wheat angel hair pasta or gluten-free brown rice pasta',
          '2 medium green zucchinis, peeled into long ribbon ribbons with a vegetable peeler',
          '2 cups ripe cherry tomatoes, halved',
          '4 cloves garlic, thinly sliced',
          '1/4 cup fresh sweet basil leaves, julienned',
          '2 tbsp extra virgin olive oil',
          '2 tbsp toasted unsalted pine nuts or slivered almonds',
          '1 tbsp nutritional yeast or lemon zest for topping',
          '1/4 tsp crushed red pepper flakes (optional for gentle heat)',
        ],
        instructions: [
          'Cook whole wheat pasta in boiling water according to package directions (without adding salt to the water); drain and reserve 1/4 cup pasta water.',
          'In a large skillet, warm olive oil over medium heat. Add sliced garlic and cherry tomatoes. Sauté for 4 minutes until tomatoes burst and form a sweet sauce.',
          'Add the zucchini ribbons and cook for just 2 minutes until tender-crisp.',
          'Toss in cooked pasta, reserved pasta water, and half of the fresh basil.',
          'Divide between two shallow pasta bowls. Garnish with toasted pine nuts, remaining fresh basil, and a dusting of nutritional yeast.',
        ],
        saltFreeSeasoningTips: 'Sweet blistered cherry tomatoes create their own luscious, naturally sweet sauce when cooked in olive oil with garlic.',
        vegetarianSwapTip: 'Zucchini ribbons double the vegetable volume and fiber while reducing calorie density.',
        healthBenefit: 'Lycopene from cooked tomatoes and monounsaturated fats from olive oil work synergistically to protect cardiovascular health.',
        emoji: '🍝',
        isBookmarked: false,
      },
      {
        id: 'rec-11',
        title: 'Hearty Black Bean & Roasted Sweet Potato Chili with Cumin & Smoked Paprika',
        mealType: 'soup',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        servings: 5,
        sodiumMgPerServing: 95,
        caloriesPerServing: 280,
        description: 'A deeply satisfying, smoky chili simmered with roasted sweet potatoes, tender black beans, sweet bell peppers, and Mexican oregano.',
        imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 cans (15 oz each) no-salt-added black beans, rinsed & drained',
          '2 medium sweet potatoes, peeled and diced into 1/2-inch cubes',
          '1 can (14.5 oz) no-salt-added fire-roasted diced tomatoes',
          '1 large red bell pepper and 1 green bell pepper, chopped',
          '1 medium yellow onion, diced',
          '4 cloves garlic, minced',
          '3 cups low-sodium vegetable broth',
          '1.5 tbsp chili powder (salt-free blend)',
          '1 tbsp ground cumin and 1 tsp smoked paprika',
          '1 tsp dried oregano and 1 tbsp apple cider vinegar',
          'Fresh cilantro and diced avocado for serving',
        ],
        instructions: [
          'In a large pot, heat 1.5 tbsp olive oil over medium heat. Sauté onion, bell peppers, and diced sweet potatoes for 6 minutes.',
          'Add garlic, chili powder, cumin, smoked paprika, and oregano. Stir for 1 minute until fragrant.',
          'Pour in the fire-roasted tomatoes, rinsed black beans, and low-sodium vegetable broth.',
          'Bring to a boil, then reduce heat to low, cover, and simmer for 20 minutes until sweet potatoes are tender.',
          'Stir in apple cider vinegar for a bright, balanced finish.',
          'Serve hot in bowls topped with fresh cilantro and creamy avocado slices.',
        ],
        saltFreeSeasoningTips: 'Smoked paprika and fire-roasted tomatoes provide a deep smoky wood-fire essence that delivers immense flavor without table salt.',
        vegetarianSwapTip: 'Black beans provide 15g of protein per bowl with zero saturated animal fat and zero cholesterol compared to beef chili.',
        healthBenefit: 'Rich in dietary fiber that promotes gut health and helps reduce LDL cholesterol.',
        emoji: '🍲',
        isBookmarked: false,
      },
      {
        id: 'rec-12',
        title: 'Crispy Baked Chickpea & Roasted Red Pepper Hummus Wrap',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 0,
        servings: 2,
        sodiumMgPerServing: 90,
        caloriesPerServing: 310,
        description: 'Quick no-cook lunch wrap spread with salt-free roasted red pepper hummus, crisp shredded carrots, purple cabbage, cucumber, and baby spinach.',
        imageUrl: 'https://images.unsplash.com/photo-1628191081676-8f40d4ce6c44?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 low-sodium whole wheat or sprouted grain flatbreads/tortillas',
          '1/2 cup salt-free roasted red pepper hummus (or homemade with chickpeas, tahini, lemon & garlic)',
          '1/2 cup shredded carrots and 1/2 cup shredded purple cabbage',
          '1 Persian cucumber, thinly sliced into rounds',
          '1 cup fresh baby spinach leaves',
          '2 tbsp unsalted pumpkin seeds or sunflower seeds',
          '1 tbsp fresh lemon juice and fresh cracked black pepper',
        ],
        instructions: [
          'Lay whole wheat flatbreads flat on a clean cutting board.',
          'Spread a generous layer of salt-free hummus across the center of each wrap.',
          'Layer fresh baby spinach, sliced cucumber, shredded carrots, and purple cabbage on top.',
          'Sprinkle with toasted seeds and a squeeze of fresh lemon juice.',
          'Roll up tightly, slice in half diagonally, and enjoy with a side of fresh apple slices.',
        ],
        saltFreeSeasoningTips: 'Tahini, roasted sweet red peppers, and garlic in the hummus create rich, velvety creaminess with zero sodium.',
        vegetarianSwapTip: 'Plant-powered lunchtime alternative to high-sodium processed deli meats and cold cuts.',
        healthBenefit: 'Fresh raw vegetables provide essential polyphenols, crunchy hydration, and vascular protection.',
        emoji: '🌯',
        isBookmarked: false,
      },
    ];
  }
}

