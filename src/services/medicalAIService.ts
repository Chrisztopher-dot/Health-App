import { 
  UserProfile, 
  CheckInRecord, 
  SmartAlert, 
  AppTab, 
  ActivityLogEntry, 
  ReminderItem, 
  ScannedFoodResult, 
  RecipeItem, 
  MedicationLogEntry, 
  BayAreaEvent,
  HealthMood
} from '../types/health';
import { HealthStorageService } from './healthStorage';
import { HealthAnalyticsService } from './healthAnalytics';
import { FoodScannerService } from './foodScannerService';
import { RecipeGeneratorService } from './recipeGeneratorService';

export interface MedicalAIResponse {
  answer: string;
  spokenText: string;
  category: 
    | 'blood_pressure' 
    | 'medication' 
    | 'doctor' 
    | 'alerts' 
    | 'targets' 
    | 'symptoms' 
    | 'activity' 
    | 'food' 
    | 'recipes' 
    | 'reminders' 
    | 'checkin' 
    | 'happenings' 
    | 'settings' 
    | 'general';
  isActionLogged?: boolean;
  loggedActionDescription?: string;
  suggestedAction?: {
    label: string;
    tab: AppTab;
  };
  followUpSuggestions: string[];
  taskItems?: ReminderItem[];
  foodScanResult?: ScannedFoodResult;
  recipes?: RecipeItem[];
  bpRecord?: {
    systolic: number;
    diastolic: number;
    pulse?: number;
    date: string;
    inTarget: boolean;
  };
  medicationList?: MedicationLogEntry[];
  activityLog?: ActivityLogEntry;
  checkInSummary?: {
    mood: string;
    energy: number;
    sleep: number;
    bp?: string;
    symptoms: string[];
  };
  eventList?: BayAreaEvent[];
  updatedProfile?: UserProfile;
}

export class MedicalAIService {
  /**
   * Evaluates whether a user's voice or text message is inquiring about or commanding
   * medical information handling or app AI features.
   */
  public static isMedicalQueryOrCommand(input: string): boolean {
    const q = input.toLowerCase().trim();
    if (!q) return false;

    const keywords = [
      'blood pressure', 'bp', 'systolic', 'diastolic', 'pulse', 'heart rate', 'bpm',
      'medicine', 'medication', 'meds', 'pill', 'pills', 'dose', 'dosage', 'prescription',
      'lisinopril', 'metformin', 'vitamin', 'melatonin', 'coq10',
      'doctor', 'physician', 'cardiologist', 'appointment', 'dr.', 'dr ', 'clinic',
      'alert', 'alerts', 'risk', 'warning', 'concern',
      'target', 'targets', 'normal range', 'healthy range', 'goal',
      'food', 'scanner', 'meal', 'nutrition', 'sodium', 'carbs', 'calories', 'recipe', 'diet',
      'exercise', 'walk', 'activity', 'activities', 'hike', 'stretching',
      'reminder', 'reminders', 'task', 'tasks', 'voicemail',
      'check in', 'check-in', 'mood', 'energy', 'symptom', 'symptoms',
      'events', 'happenings', 'bay area', 'weekend', 'voice', 'speaker',
      'how have i been', 'health trend', 'timeline', 'records', 'vitals'
    ];

    return keywords.some((kw) => q.includes(kw));
  }

  /**
   * Processes a query or voice command with fully synchronized linked live access
   * across all AI features: Vitals, Food Scanner, Recipes, Medications, Reminders,
   * Daily Check-In, Activities, Doctor Appointments, and Alerts.
   */
  public static processMedicalQuery(
    input: string,
    profile: UserProfile,
    currentHistory?: CheckInRecord[]
  ): MedicalAIResponse | null {
    const q = input.toLowerCase().trim();
    const history = currentHistory || HealthStorageService.getCheckIns();
    const todayStr = new Date().toISOString().split('T')[0];

    const sortedDesc = [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // =========================================================================
    // 1. DIRECT DAILY CHECK-IN VIA VOICE & TEXT ASSISTANT
    // =========================================================================
    if (
      q.includes('check in') || 
      q.includes('check-in') || 
      q.includes('log my mood') ||
      (q.includes('i feel') && (q.includes('great') || q.includes('good') || q.includes('okay') || q.includes('tired') || q.includes('sick')))
    ) {
      let detectedMood: HealthMood = 'good';
      if (q.includes('great') || q.includes('wonderful') || q.includes('very good')) detectedMood = 'very_good';
      else if (q.includes('okay') || q.includes('fine') || q.includes('so so')) detectedMood = 'okay';
      else if (q.includes('not great') || q.includes('tired') || q.includes('unwell')) detectedMood = 'not_great';
      else if (q.includes('poor') || q.includes('bad') || q.includes('sick')) detectedMood = 'poor';

      let energy = 7;
      const energyMatch = q.match(/energy\s*(?:is|level)?\s*(\d{1,2})/);
      if (energyMatch) energy = Math.min(10, Math.max(1, parseInt(energyMatch[1], 10)));
      else if (detectedMood === 'very_good') energy = 9;
      else if (detectedMood === 'not_great') energy = 5;
      else if (detectedMood === 'poor') energy = 3;

      let sleep = 7;
      const sleepMatch = q.match(/sleep\s*(?:is|quality|of)?\s*(\d{1,2})/);
      if (sleepMatch) sleep = Math.min(10, Math.max(1, parseInt(sleepMatch[1], 10)));

      const symptomsList: string[] = [];
      if (q.includes('headache')) symptomsList.push('Headache');
      if (q.includes('dizziness') || q.includes('dizzy')) symptomsList.push('Dizziness');
      if (q.includes('stiffness') || q.includes('joint')) symptomsList.push('Joint Stiffness');
      if (q.includes('fatigue') || q.includes('tired')) symptomsList.push('Fatigue');

      const existingToday = HealthStorageService.getTodayCheckIn();
      const newRecord: CheckInRecord = {
        id: existingToday?.id || `checkin-${todayStr}`,
        date: todayStr,
        timestamp: new Date().toISOString(),
        mood: detectedMood,
        energyLevel: energy,
        sleepQuality: sleep,
        painLevel: symptomsList.length > 0 ? 2 : 0,
        symptoms: symptomsList,
        medicationStatus: 'taken',
        bloodPressure: existingToday?.bloodPressure || { measured: false },
        dailyNotes: input,
        inputMode: 'conversational',
      };

      HealthStorageService.addCheckIn(newRecord);

      const moodLabel = detectedMood.replace('_', ' ');
      const spoken = `I have completed and recorded your daily check-in for today. Mood is ${moodLabel}, energy level ${energy} out of 10, and sleep quality ${sleep} out of 10. Your health diary is up to date!`;
      const written = `📝 **Daily Health Check-In Completed (${todayStr})**:\n• **Mood**: ${detectedMood.toUpperCase()} 😊\n• **Energy Level**: **${energy} / 10**\n• **Sleep Quality**: **${sleep} / 10**\n• **Reported Symptoms**: ${symptomsList.length > 0 ? symptomsList.join(', ') : 'None'}\n• **Status**: Saved securely to your Health Timeline!`;

      return {
        answer: written,
        spokenText: spoken,
        category: 'checkin',
        isActionLogged: true,
        loggedActionDescription: `Completed check-in: Mood ${moodLabel}, Energy ${energy}/10`,
        suggestedAction: { label: 'View Health Timeline', tab: 'timeline' },
        checkInSummary: {
          mood: moodLabel,
          energy,
          sleep,
          symptoms: symptomsList,
        },
        followUpSuggestions: [
          'What are my medications today?',
          'Log BP 120/80 pulse 72',
          'Listen to what is there to do'
        ],
      };
    }

    // =========================================================================
    // 2. FOOD SCANNER & DIRECT MEAL NUTRITION CALCULATION
    // =========================================================================
    if (
      q.includes('scan food') || 
      q.includes('scan meal') || 
      q.includes('analyze food') || 
      q.includes('i ate') || 
      q.includes('i had for lunch') || 
      q.includes('i had for dinner') || 
      q.includes('i had for breakfast') || 
      (q.includes('how many calories') && (q.includes('in') || q.includes('salmon') || q.includes('chicken') || q.includes('soup') || q.includes('salad'))) ||
      (q.includes('sodium in') || q.includes('carbs in'))
    ) {
      let dishName = input
        .replace(/^(analyze food|scan food|scan meal|how many calories in|how much sodium in|i ate|i had for lunch|i had for dinner|i had for breakfast|calculate nutrition for)\s+/i, '')
        .trim();

      if (!dishName) dishName = 'Grilled Salmon with Quinoa & Steamed Asparagus';

      const scanResult = FoodScannerService.searchAndAnalyzeDish(dishName, 1.0, 'home_cooked');
      FoodScannerService.saveScanToHistory(scanResult);

      const sodiumLevel = scanResult.sodiumMg;
      const heartHealthNote = sodiumLevel <= 400 
        ? 'Excellent heart-healthy choice with low sodium!' 
        : sodiumLevel <= 700 
        ? 'Moderate sodium content. Balanced by natural potassium.' 
        : 'Higher sodium item. Drink water and balance with a low-sodium dinner.';

      const spoken = `Analyzed ${scanResult.name}. It delivers ${scanResult.calories} calories, ${scanResult.sodiumMg} milligrams of sodium, and ${scanResult.carbsGrams} grams of carbohydrates. ${heartHealthNote}`;

      let written = `🥗 **Plate & Food Scanner Analysis: ${scanResult.name}**\n\n`;
      written += `• **Calories**: **${scanResult.calories} kcal** | **Health Score**: **${scanResult.healthScore}/100**\n`;
      written += `• **Sodium**: **${scanResult.sodiumMg} mg** (${scanResult.bloodPressureAssessment.ratingLabel})\n`;
      written += `• **Carbohydrates**: **${scanResult.carbsGrams}g** (${scanResult.fiberGrams}g fiber, ${scanResult.netCarbsGrams}g net carbs)\n`;
      written += `• **Protein**: **${scanResult.proteinGrams}g** | **Fat**: **${scanResult.fatGrams}g**\n`;
      written += `• **Potassium**: **${scanResult.potassiumMg} mg** (Helps lower blood pressure)\n\n`;
      written += `💡 **Senior Dietary Guidance**: ${scanResult.diningOutSmartTips[0] || 'Enjoy with extra fresh vegetables.'}`;

      return {
        answer: written,
        spokenText: spoken,
        category: 'food',
        isActionLogged: true,
        loggedActionDescription: `Scanned meal: ${scanResult.name} (${scanResult.sodiumMg}mg Na)`,
        suggestedAction: { label: 'Open Plate Scanner', tab: 'scanner' },
        foodScanResult: scanResult,
        followUpSuggestions: [
          'Show healthy low-sodium recipes',
          'What is my latest blood pressure?',
          'What medications do I have today?'
        ],
      };
    }

    // =========================================================================
    // 3. HEALTHY RECIPES & WEEKLY LOW-SODIUM MEAL PLANS
    // =========================================================================
    if (
      q.includes('recipe') || 
      q.includes('recipes') || 
      q.includes('what should i cook') || 
      q.includes('what should i eat') || 
      q.includes('low sodium meal') || 
      q.includes('dinner idea') ||
      q.includes('breakfast idea')
    ) {
      const syncResult = RecipeGeneratorService.syncWeeklyRecipes();
      const allWeekly = syncResult.recipes;

      let filteredRecipes = allWeekly;
      if (q.includes('breakfast')) {
        filteredRecipes = allWeekly.filter((r: RecipeItem) => r.mealType === 'breakfast');
      } else if (q.includes('lunch')) {
        filteredRecipes = allWeekly.filter((r: RecipeItem) => r.mealType === 'lunch');
      } else if (q.includes('dinner') || q.includes('soup') || q.includes('stew')) {
        filteredRecipes = allWeekly.filter((r: RecipeItem) => r.mealType === 'dinner');
      }

      const topThree = (filteredRecipes.length > 0 ? filteredRecipes : allWeekly).slice(0, 3);
      const first = topThree[0];

      const spoken = `Here are this week's featured heart-healthy recipes from the "${syncResult.currentTheme.title}" collection. I recommend the ${first.title}, with only ${first.sodiumMgPerServing} milligrams of sodium per serving.`;

      let written = `🍲 **Featured Heart-Healthy Recipes (${syncResult.currentTheme.bannerEmoji} ${syncResult.currentTheme.title})**:\n\n`;
      topThree.forEach((rec: RecipeItem, idx: number) => {
        written += `**${idx + 1}. ${rec.title}** (${rec.mealType.toUpperCase()})\n`;
        written += `• 🧂 Sodium: **${rec.sodiumMgPerServing} mg/serving** | 🔥 Calories: **${rec.caloriesPerServing} kcal**\n`;
        written += `• ⏱ Time: ${rec.prepTimeMinutes + rec.cookTimeMinutes} mins | 🥬 ${rec.description}\n\n`;
      });

      return {
        answer: written,
        spokenText: spoken,
        category: 'recipes',
        suggestedAction: { label: 'Open Healthy Recipes', tab: 'recipes' },
        recipes: topThree,
        followUpSuggestions: [
          `Add ${first.title.split(' ')[0]} ingredients to grocery list`,
          'Scan my meal photo',
          'What is my latest blood pressure?'
        ],
      };
    }

    // =========================================================================
    // 4. BLOOD PRESSURE & PULSE LOGGING & INQUIRIES
    // =========================================================================
    const isLogIntent = q.includes('log') || q.includes('record') || q.includes('my bp is') || q.includes('reading is') || q.includes('measured') || q.includes('register');
    const bpMatch = q.match(/(\d{2,3})\s*(?:\/|over|\s)\s*(\d{2,3})/);
    
    if (isLogIntent && bpMatch) {
      const sys = parseInt(bpMatch[1], 10);
      const dia = parseInt(bpMatch[2], 10);
      
      const pulseMatch = q.match(/(\d{2,3})\s*(?:bpm|pulse|heart rate|beats)/) || q.match(/(?:pulse|heart rate)\s*(?:is|of)?\s*(\d{2,3})/);
      const pulseVal = pulseMatch ? parseInt(pulseMatch[1], 10) : 72;

      HealthStorageService.registerBloodPressureAndPulse(todayStr, sys, dia, pulseVal, 'Logged via Voice & Text AI Assistant');

      const isSysTarget = sys >= profile.targetSystolicMin && sys <= profile.targetSystolicMax;
      const targetNote = isSysTarget
        ? `This is in your target range (${profile.targetSystolicMin}–${profile.targetSystolicMax} mmHg).`
        : `This is slightly outside your target of ${profile.targetSystolicMin}–${profile.targetSystolicMax} mmHg.`;

      const responseText = `I have logged your blood pressure reading of ${sys}/${dia} mmHg with a pulse of ${pulseVal} BPM for today. ${targetNote}`;
      const written = `🩺 **Blood Pressure & Pulse Registered**:\n• Reading: **${sys}/${dia} mmHg**\n• Pulse: **${pulseVal} BPM**\n• Target Evaluation: ${isSysTarget ? '✅ Within Target Range' : '⚠️ Outside Ideal Target'}\n• Saved to Health Timeline & Vitals!`;

      return {
        answer: written,
        spokenText: responseText,
        category: 'blood_pressure',
        isActionLogged: true,
        loggedActionDescription: `Recorded BP ${sys}/${dia} mmHg, Pulse ${pulseVal} BPM`,
        suggestedAction: { label: 'View Vitals & BP Register', tab: 'timeline' },
        bpRecord: {
          systolic: sys,
          diastolic: dia,
          pulse: pulseVal,
          date: todayStr,
          inTarget: isSysTarget,
        },
        followUpSuggestions: [
          'What are my medications today?',
          'Show blood pressure trend',
          'Listen to what is there to do'
        ],
      };
    }

    if (q.includes('blood pressure') || q.includes('bp') || q.includes('pulse') || q.includes('heart rate') || q.includes('vitals')) {
      const bpRecords = sortedDesc.filter((r) => r.bloodPressure?.measured && r.bloodPressure.systolic);
      
      if (bpRecords.length === 0) {
        const msg = `You don't have any blood pressure readings recorded yet. Your personal systolic target is ${profile.targetSystolicMin} to ${profile.targetSystolicMax} mmHg. Would you like to log your reading now?`;
        return {
          answer: msg,
          spokenText: msg,
          category: 'blood_pressure',
          suggestedAction: { label: 'Open BP & Pulse Register', tab: 'timeline' },
          followUpSuggestions: ['Log BP 120/80 pulse 72', 'What are my healthy targets?'],
        };
      }

      const latest = bpRecords[0];
      const sys = latest.bloodPressure.systolic || 120;
      const dia = latest.bloodPressure.diastolic || 80;
      const pulseVal = latest.bloodPressure.pulse || 72;
      const readingDate = latest.date;

      const avgSys = Math.round(bpRecords.reduce((sum, r) => sum + (r.bloodPressure.systolic || 0), 0) / bpRecords.length);
      const avgDia = Math.round(bpRecords.reduce((sum, r) => sum + (r.bloodPressure.diastolic || 0), 0) / bpRecords.length);

      const inTarget = sys >= profile.targetSystolicMin && sys <= profile.targetSystolicMax;
      const spoken = `Your most recent blood pressure was recorded on ${readingDate} at ${sys} over ${dia} mmHg, with a pulse of ${pulseVal} BPM. ${inTarget ? 'This reading is in your healthy target zone.' : 'Your personal target is ' + profile.targetSystolicMin + ' to ' + profile.targetSystolicMax + '.'} Your 30-day average is ${avgSys} over ${avgDia} mmHg.`;

      const written = `📊 **Latest Blood Pressure & Pulse (${readingDate})**:\n• Reading: **${sys}/${dia} mmHg** (Pulse: **${pulseVal} BPM**)\n• Target Goal: ${profile.targetSystolicMin}–${profile.targetSystolicMax} / ${profile.targetDiastolicMin}–${profile.targetDiastolicMax} mmHg\n• 30-Day Average: **${avgSys}/${avgDia} mmHg**\n• Status: ${inTarget ? '✅ Within Target Range' : '⚠️ Outside Ideal Target'}`;

      return {
        answer: written,
        spokenText: spoken,
        category: 'blood_pressure',
        suggestedAction: { label: 'Open BP & Pulse Register', tab: 'timeline' },
        bpRecord: {
          systolic: sys,
          diastolic: dia,
          pulse: pulseVal,
          date: readingDate,
          inTarget,
        },
        followUpSuggestions: [
          'What medications do I have today?',
          'Listen to what is there to do',
          'What did my doctor say?'
        ],
      };
    }

    // =========================================================================
    // 5. MEDICATION TRACKER & PRESCRIPTION DOSES
    // =========================================================================
    if (q.includes('took') || q.includes('taken') || q.includes('swallowed') || q.includes('drank my meds')) {
      const allTodayLogs = HealthStorageService.getMedicationLogsForDate(todayStr);

      if (q.includes('morning') || q.includes('all') || q.includes('breakfast')) {
        HealthStorageService.markTimeSlotStatus(todayStr, 'morning', 'taken');
        const morningCount = allTodayLogs.filter((l) => l.timeOfDay === 'morning').length;
        const msg = `Great job! I have confirmed all ${morningCount || 'your'} morning medications as taken for today.`;
        const updatedLogs = HealthStorageService.getMedicationLogsForDate(todayStr);

        return {
          answer: `💊 **Morning Medications Confirmed Taken**:\n• Status: ✅ Taken (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})\n• Great job maintaining your blood pressure adherence!`,
          spokenText: msg,
          category: 'medication',
          isActionLogged: true,
          loggedActionDescription: 'Confirmed morning medications taken',
          suggestedAction: { label: 'View Medication Schedule', tab: 'timeline' },
          medicationList: updatedLogs,
          followUpSuggestions: [
            'What medications are left today?',
            'What is my latest blood pressure?',
            'Listen to what is there to do'
          ],
        };
      }

      // Check specific drug match
      const matchingMed = allTodayLogs.find((l) => q.includes(l.medicationName.toLowerCase()));
      if (matchingMed) {
        HealthStorageService.updateMedicationLogStatus(todayStr, matchingMed.medicationId, 'taken');
        const updatedLogs = HealthStorageService.getMedicationLogsForDate(todayStr);
        const msg = `Confirmed! I marked ${matchingMed.medicationName} (${matchingMed.dosage}) as taken for today.`;
        return {
          answer: `💊 **Medication Taken**: ${matchingMed.medicationName} (${matchingMed.dosage})\n• Status: ✅ Taken for today\n• Instructions: ${matchingMed.timeOfDay.toUpperCase()}`,
          spokenText: msg,
          category: 'medication',
          isActionLogged: true,
          loggedActionDescription: `Marked ${matchingMed.medicationName} taken`,
          suggestedAction: { label: 'View Medication Schedule', tab: 'timeline' },
          medicationList: updatedLogs,
          followUpSuggestions: [
            'What other medications do I have today?',
            'What is my blood pressure?'
          ],
        };
      }
    }

    if (q.includes('medicine') || q.includes('medication') || q.includes('meds') || q.includes('pills') || q.includes('dose') || q.includes('prescription')) {
      const todayLogs = HealthStorageService.getMedicationLogsForDate(todayStr);
      const activeMeds = profile.medications.filter((m) => m.active !== false);

      const taken = todayLogs.filter((l) => l.status === 'taken');
      const pending = todayLogs.filter((l) => l.status === 'pending');

      const morningMeds = activeMeds.filter((m) => m.timeOfDay === 'morning').map((m) => `${m.name} ${m.dosage}`).join(', ');
      const spokenSummary = `You have ${activeMeds.length} active prescriptions scheduled. Today, ${taken.length} doses are confirmed taken, and ${pending.length} are pending. Morning routine includes ${morningMeds || 'none'}.`;

      let written = `💊 **Today's Medication Schedule (${todayStr})**:\n`;
      activeMeds.forEach((m) => {
        const log = todayLogs.find((l) => l.medicationId === m.id);
        const statusIcon = log?.status === 'taken' ? '✅ Taken' : log?.status === 'missed' ? '❌ Missed' : '⏳ Pending';
        written += `• **${m.name}** (${m.dosage}) — ${m.timeOfDay.toUpperCase()} [${statusIcon}]\n  _${m.instructions}_\n`;
      });

      return {
        answer: written,
        spokenText: spokenSummary,
        category: 'medication',
        suggestedAction: { label: 'Open Medication Tracker', tab: 'timeline' },
        medicationList: todayLogs,
        followUpSuggestions: [
          'I took all morning meds',
          'What is my latest blood pressure?',
          'Listen to what is there to do'
        ],
      };
    }

    // =========================================================================
    // 6. PHYSICAL ACTIVITIES & EXERCISE LOGGING
    // =========================================================================
    if ((q.includes('log') || q.includes('record') || q.includes('walked') || q.includes('exercised')) && (q.includes('walk') || q.includes('hike') || q.includes('gardening') || q.includes('stretch') || q.includes('housework') || q.includes('exercise'))) {
      const minMatch = q.match(/(\d{1,3})\s*(?:min|mins|minutes)/);
      const duration = minMatch ? parseInt(minMatch[1], 10) : 30;

      let category: ActivityLogEntry['category'] = 'walking';
      let title = 'Neighborhood Walk';
      if (q.includes('hike') || q.includes('trail')) { category = 'hiking'; title = 'Nature Trail Walk'; }
      else if (q.includes('garden')) { category = 'gardening'; title = 'Gardening'; }
      else if (q.includes('stretch') || q.includes('yoga') || q.includes('pilates')) { category = 'stretching'; title = 'Yoga, Pilates & Stretch'; }
      else if (q.includes('housework') || q.includes('clean')) { category = 'housework'; title = 'Housework Session'; }

      const newEntry: ActivityLogEntry = {
        id: `act-${Date.now()}`,
        date: todayStr,
        title,
        category,
        durationMinutes: duration,
        intensity: duration > 40 ? 'moderate' : 'gentle',
        timeOfDay: 'morning',
        timestamp: new Date().toISOString(),
      };
      HealthStorageService.addActivityLog(newEntry);

      const msg = `Wonderful! I have logged ${duration} minutes of ${title.toLowerCase()} for today. Excellent for your heart health and longevity!`;
      const written = `🏃 **Physical Activity Logged**:\n• **Activity**: ${title}\n• **Duration**: **${duration} minutes**\n• **Intensity**: ${newEntry.intensity.toUpperCase()}\n• **Status**: Added to your 30-day activity records!`;

      return {
        answer: written,
        spokenText: msg,
        category: 'activity',
        isActionLogged: true,
        loggedActionDescription: `Logged ${duration} min ${title}`,
        suggestedAction: { label: 'View Physical Activities', tab: 'activities' },
        activityLog: newEntry,
        followUpSuggestions: [
          'How much activity did I do this week?',
          'What is my latest blood pressure?',
          'Listen to what is there to do'
        ],
      };
    }

    if (q.includes('exercise') || q.includes('activity') || q.includes('activities') || q.includes('walk') || q.includes('hike') || q.includes('active') || q.includes('minutes')) {
      const allActs = HealthStorageService.getAllActivityLogs();
      const allEntries: ActivityLogEntry[] = Object.values(allActs).flat();
      const totalMinutes = allEntries.reduce((sum: number, a: ActivityLogEntry) => sum + a.durationMinutes, 0);
      const totalSessions = allEntries.length;

      const spoken = `Over the past 30 days, you logged ${totalMinutes} active minutes across ${totalSessions} sessions, averaging ${Math.round(totalMinutes / 30)} minutes per day.`;
      const written = `🏃 **Physical Activity & Vitality Summary**:\n• Total Active Minutes: **${totalMinutes} mins** (${totalSessions} sessions logged)\n• Daily Goal Target: **30 minutes/day** (${totalMinutes >= 600 ? '✅ Target Met!' : 'Keep going!'})\n• Top Activities: Neighborhood walks, trail hikes, and home mobility.`;

      return {
        answer: written,
        spokenText: spoken,
        category: 'activity',
        suggestedAction: { label: 'Open Physical Activities', tab: 'activities' },
        followUpSuggestions: [
          'Log a 30 minute walk',
          'What is my latest blood pressure?',
          'What medications do I have today?'
        ],
      };
    }

    // =========================================================================
    // 7. REMINDERS & TASKS (ADD, CROSS OFF, VOICEMAIL BRIEFING)
    // =========================================================================
    const isReminderQuery = 
      q.includes('reminder') || 
      q.includes('reminders') || 
      q.includes('task') || 
      q.includes('tasks') || 
      q.includes('to-do') || 
      q.includes('todo') ||
      q.includes('cross off') ||
      q.includes('check off') ||
      q.includes('mark done') ||
      q.includes('mark complete') ||
      q.includes('remind me') ||
      q.includes('listen') ||
      q.includes('voicemail') ||
      q.includes('what is there to do');

    if (isReminderQuery) {
      const allReminders = HealthStorageService.getAllReminders();

      // Cross-Off Command
      if (
        q.includes('cross off') || 
        q.includes('check off') || 
        q.includes('mark done') || 
        q.includes('mark complete') || 
        q.includes('completed task') ||
        q.includes('finished task')
      ) {
        const candidate = allReminders.find((r) => {
          if (r.completed) return false;
          const words = r.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
          return words.some((w) => q.includes(w));
        }) || allReminders.find((r) => !r.completed);

        if (candidate) {
          HealthStorageService.toggleReminder(candidate.id);
          const updatedList = HealthStorageService.getAllReminders();
          const targetItem = updatedList.find((r) => r.id === candidate.id) || candidate;
          
          const spoken = `I have crossed off "${candidate.title}" from your tasks and marked the box as completed.`;
          const written = `✅ **Task Crossed Off**: "${candidate.title}"\n• **Status**: [✓] Completed (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})\n• **Category**: ${candidate.priority === 'urgent' ? '🚨 Urgent / Medical' : '📋 Routine / Daily'}`;

          return {
            answer: written,
            spokenText: spoken,
            category: 'reminders',
            isActionLogged: true,
            loggedActionDescription: `Crossed off: ${candidate.title}`,
            suggestedAction: { label: 'Open Reminders & Tasks', tab: 'reminders' },
            taskItems: [targetItem],
            followUpSuggestions: [
              'Listen to what is there to do',
              'What is my latest blood pressure?',
              'What medications do I have today?'
            ],
          };
        }
      }

      // Add Reminder Command
      if (
        q.startsWith('remind me') || 
        q.startsWith('add reminder') || 
        q.startsWith('add a reminder') || 
        q.startsWith('create task') || 
        q.startsWith('add task') ||
        q.startsWith('set reminder')
      ) {
        let cleanTitle = input
          .replace(/^(remind me to|add a reminder to|add reminder to|add urgent reminder to|add task to|create task to|create a task for|set reminder for|remember to)\s+/i, '')
          .replace(/\s*(tomorrow|today|next week|at \d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi, '')
          .trim();

        if (!cleanTitle) cleanTitle = 'New task';
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

        const isUrgent = [
          'doctor', 'hospital', 'clinic', 'medication', 'refill', 'pills', 'bp',
          'blood pressure', 'prescription', 'urgent', 'asap', 'cardiologist'
        ].some((kw) => q.includes(kw));

        const timeMatch = input.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))/i);
        const dueTime = timeMatch ? timeMatch[1].toUpperCase().replace(/\./g, '') : (q.includes('morning') ? '09:00 AM' : q.includes('afternoon') ? '02:00 PM' : undefined);

        const newItem: ReminderItem = {
          id: `rem-${Date.now()}`,
          title: cleanTitle,
          priority: isUrgent ? 'urgent' : 'less_urgent',
          dueDate: todayStr,
          dueTime,
          completed: false,
          createdAt: new Date().toISOString(),
        };

        HealthStorageService.addReminder(newItem);

        const spoken = `Added ${isUrgent ? 'urgent' : 'routine'} reminder: "${cleanTitle}"${dueTime ? ' for ' + dueTime : ''}. You can view and cross it off in Reminders and Tasks.`;
        const written = `✨ **New Task Registered in Reminders & Tasks**:\n• **Title**: "${cleanTitle}"\n• **Priority Box**: ${isUrgent ? '🚨 Urgent / Medical' : '📋 Routine / Daily'}\n• **Scheduled Time**: ${dueTime || 'Anytime today'}\n• **Status**: [ ] Pending Checkbox`;

        return {
          answer: written,
          spokenText: spoken,
          category: 'reminders',
          isActionLogged: true,
          loggedActionDescription: `Added task: ${cleanTitle}`,
          suggestedAction: { label: 'Open Reminders & Tasks', tab: 'reminders' },
          taskItems: [newItem],
          followUpSuggestions: [
            `Cross off ${cleanTitle}`,
            'Listen to what is there to do',
            'What is my latest blood pressure?'
          ],
        };
      }

      // Voicemail / Audio Briefing & Listing
      const onlyUrgent = q.includes('urgent') || q.includes('critical') || q.includes('doctor') || q.includes('medical');
      const onlyRoutine = (q.includes('routine') || q.includes('chore') || q.includes('daily') || q.includes('less urgent')) && !onlyUrgent;

      const activePending = allReminders.filter((r) => !r.completed);

      let rankedTasks = [...activePending].sort((a, b) => {
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
        if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
        return 0;
      });

      if (onlyUrgent) {
        rankedTasks = rankedTasks.filter((r) => r.priority === 'urgent');
      } else if (onlyRoutine) {
        rankedTasks = rankedTasks.filter((r) => r.priority === 'less_urgent');
      }

      let voicemailSpoken = `Welcome to your task voicemail speaker. You have ${rankedTasks.length} ${onlyUrgent ? 'urgent ' : onlyRoutine ? 'routine ' : ''}tasks in your queue, ranked by urgency. `;
      rankedTasks.forEach((t, index) => {
        const num = index + 1;
        const urgencyLabel = t.priority === 'urgent' ? 'Urgent priority.' : 'Routine.';
        const duePart = t.dueTime ? ` Due at ${t.dueTime}.` : '';
        const notesPart = t.notes ? ` Notes: ${t.notes}.` : '';
        voicemailSpoken += `Message ${num}: ${urgencyLabel} ${t.title}.${duePart}${notesPart} `;
      });
      voicemailSpoken += 'End of task voicemail. You can cross off any task or tap its box.';

      let written = `📼 **Task Voicemail Speaker Briefing** (${rankedTasks.length} Ranked Items):\n\n`;
      rankedTasks.forEach((t, index) => {
        const num = index + 1;
        const badge = t.priority === 'urgent' ? '🚨 [URGENT]' : '📋 [ROUTINE]';
        written += `**Message ${num}** ${badge}: **${t.title}**\n`;
        if (t.dueTime || t.dueDate) written += `• ⏰ Schedule: ${t.dueTime || ''} ${t.dueDate ? `(${t.dueDate})` : ''}\n`;
        if (t.notes) written += `• 📝 Notes: ${t.notes}\n`;
        written += `\n`;
      });

      return {
        answer: written,
        spokenText: voicemailSpoken,
        category: 'reminders',
        suggestedAction: { label: 'Open Reminders & Tasks Studio', tab: 'reminders' },
        taskItems: rankedTasks,
        followUpSuggestions: [
          rankedTasks.length > 0 ? `Cross off ${rankedTasks[0].title.split(' ')[0]}` : 'Add a new reminder',
          onlyUrgent ? 'Play routine tasks' : 'Play most urgent tasks',
          'What is my latest blood pressure?'
        ],
      };
    }

    // =========================================================================
    // 8. DOCTOR VISITS & CLINICAL CARE INQUIRIES
    // =========================================================================
    if (q.includes('doctor') || q.includes('physician') || q.includes('appointment') || q.includes('cardiologist') || q.includes('dr.') || q.includes('dr ')) {
      const spoken = `Your last cardiology consultation with Doctor Sarah Jenkins was on September 14. Doctor Jenkins noted stable blood pressure control, adjusted Lisinopril to 10 milligrams, and recommended keeping sodium under 2000 milligrams daily. Your next checkup is scheduled in December.`;
      const written = `🩺 **Doctor & Clinical Care Summary**:\n• **Attending Cardiologist**: Dr. Sarah Jenkins, MD (UCSF Cardiology)\n• **Latest Visit**: Sept 14, 2026 — Routine Hypertension Review\n• **Clinical Notes**: Blood pressure well controlled at 124/80 mmHg. Continued Lisinopril 10mg daily with breakfast.\n• **Doctor's Guidance**: Maintain daily 20-minute walks, keep sodium below 2,000 mg/day, and monitor for any morning dizziness.\n• **Next Follow-Up**: Scheduled December 2026.`;

      return {
        answer: written,
        spokenText: spoken,
        category: 'doctor',
        suggestedAction: { label: 'View Doctor & Clinical Care', tab: 'timeline' },
        followUpSuggestions: [
          'What is my latest blood pressure?',
          'What medications do I have today?',
          'Add a doctor reminder'
        ],
      };
    }

    // =========================================================================
    // 9. SMART RISK ALERTS
    // =========================================================================
    if (q.includes('alert') || q.includes('alerts') || q.includes('risk') || q.includes('warning') || q.includes('concern')) {
      const alerts: SmartAlert[] = HealthAnalyticsService.evaluateSmartAlerts(history, profile);

      if (alerts.length === 0) {
        const msg = `You have no active health risk alerts. All your recent check-in readings, blood pressure, and medication adherence are in a stable, healthy state.`;
        return {
          answer: `🛡️ **Smart Risk Alerts Status**:\n• **Active Alerts**: 0 pending\n• **Summary**: Key health indicators (blood pressure, medication compliance, and daily energy) are in a safe and steady range.`,
          spokenText: msg,
          category: 'alerts',
          suggestedAction: { label: 'View Smart Risk Alerts', tab: 'alerts' },
          followUpSuggestions: [
            'What is my latest blood pressure?',
            'What medications do I have today?'
          ],
        };
      }

      const topAlert = alerts[0];
      const spoken = `You have ${alerts.length} active health notice: ${topAlert.title}. ${topAlert.message}`;
      const written = `⚠️ **Smart Health Risk Alerts (${alerts.length} Active)**:\n` + alerts.map((a) => `• **${a.title}** (${a.severity.toUpperCase()}): ${a.message}`).join('\n');

      return {
        answer: written,
        spokenText: spoken,
        category: 'alerts',
        suggestedAction: { label: 'View Smart Risk Alerts', tab: 'alerts' },
        followUpSuggestions: [
          'What is my latest blood pressure?',
          'What did my doctor say?'
        ],
      };
    }

    // =========================================================================
    // 10. BAY AREA HAPPENINGS & SENIOR ACTIVITIES
    // =========================================================================
    if (q.includes('event') || q.includes('events') || q.includes('happening') || q.includes('bay area') || q.includes('weekend') || q.includes('fun')) {
      const syncEvents = HealthStorageService.syncWeeklyBayAreaEvents();
      const events = syncEvents.events.slice(0, 3);

      const spoken = `Here are fun senior-friendly happenings in the Bay Area this week, including the Golden Gate Park gentle morning stroll and the farmers market!`;
      let written = `🌉 **Bay Area Fun & Senior Happenings (${syncEvents.events.length} Active Events)**:\n\n`;
      events.forEach((ev) => {
        written += `**• ${ev.title}** (${ev.category.toUpperCase()})\n  📍 ${ev.locationName} | ⏰ ${ev.dateRange || 'This Weekend'}\n  _${ev.description}_\n\n`;
      });

      return {
        answer: written,
        spokenText: spoken,
        category: 'happenings',
        suggestedAction: { label: 'Explore Bay Area Happenings', tab: 'happenings' },
        eventList: events,
        followUpSuggestions: [
          'Log a 30 minute walk',
          'Show low-sodium recipes',
          'Listen to what is there to do'
        ],
      };
    }

    // =========================================================================
    // 11. GENERAL HEALTHY TARGETS & APP ASSISTANT
    // =========================================================================
    if (q.includes('target') || q.includes('normal range') || q.includes('healthy range') || q.includes('goal') || q.includes('should my')) {
      const spoken = `Your personalized healthy target for blood pressure is ${profile.targetSystolicMin} to ${profile.targetSystolicMax} mmHg systolic, and ${profile.targetDiastolicMin} to ${profile.targetDiastolicMax} mmHg diastolic. A normal resting pulse is 60 to 100 beats per minute.`;
      const written = `🎯 **Personal Health & Vitals Targets**:\n• **Target Systolic**: ${profile.targetSystolicMin} – ${profile.targetSystolicMax} mmHg\n• **Target Diastolic**: ${profile.targetDiastolicMin} – ${profile.targetDiastolicMax} mmHg\n• **Normal Resting Pulse**: 60 – 100 BPM\n• **Daily Physical Activity Target**: 30 minutes/day\n• **Sodium Limit**: Under 2,000 mg/day (Heart-Healthy guidelines)`;

      return {
        answer: written,
        spokenText: spoken,
        category: 'targets',
        suggestedAction: { label: 'Open BP & Pulse Register', tab: 'timeline' },
        followUpSuggestions: [
          'What is my latest blood pressure?',
          'Log BP 120/80 pulse 72',
          'What medications do I have today?'
        ],
      };
    }

    // General fallback linked assistant response
    const generalSpoken = `I have linked access to all your health records, food scanner, blood pressure vitals, medications, and physical activity logs. How can I assist you today?`;
    const generalWritten = `🤖 **MyHealthSafe Synchronized AI Assistant**:\nI am fully connected across your entire health suite:\n• 💓 **Blood Pressure & Vitals**: Track readings, log BP, and view trends.\n• 🍎 **Food Plate Scanner**: Analyze meal photos, sodium, carbs, and calories.\n• 🍲 **Healthy Recipes**: Explore 7-day low-sodium meal plans & add to grocery lists.\n• 💊 **Medications**: Confirm taken doses, view schedules, and check refills.\n• 📋 **Reminders & Voicemail**: Add tasks, cross off boxes [✓], and listen to audio briefings.\n• 🏃 **Activities & Walks**: Log workouts, garden sessions, and track active minutes.\n• 🩺 **Doctor Visits**: Review care notes and appointment reminders.\n\nAsk me anything by voice, type below, or take a meal picture!`;

    return {
      answer: generalWritten,
      spokenText: generalSpoken,
      category: 'general',
      followUpSuggestions: [
        'Listen to what is there to do',
        'Log BP 120/80 pulse 72',
        'Scan my meal for sodium and calories',
        'What medications do I have today?'
      ],
    };
  }
}
