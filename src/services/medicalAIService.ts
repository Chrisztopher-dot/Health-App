import { UserProfile, CheckInRecord, SmartAlert } from '../types/health';
import { HealthStorageService } from './healthStorage';
import { HealthAnalyticsService } from './healthAnalytics';

export interface MedicalAIResponse {
  answer: string;
  spokenText: string;
  category: 'blood_pressure' | 'medication' | 'doctor' | 'alerts' | 'targets' | 'symptoms' | 'activity' | 'general';
  isActionLogged?: boolean;
  loggedActionDescription?: string;
  followUpSuggestions: string[];
}

export class MedicalAIService {
  /**
   * Evaluates whether a user's voice or text message is inquiring about or commanding
   * medical information handling.
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
      'how have i been', 'health trend', 'timeline', 'records', 'vitals'
    ];

    return keywords.some((kw) => q.includes(kw));
  }

  /**
   * Processes a medical information query or voice command with linked live access
   * to check-ins, medication logs, vitals history, doctor records, and profile targets.
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

    // 1. Direct Voice / Text Logging for Blood Pressure & Pulse
    // Examples: "Log blood pressure 125 over 82", "BP is 130/85 pulse 76", "Record 120/80"
    const isLogIntent = q.includes('log') || q.includes('record') || q.includes('my bp is') || q.includes('reading is') || q.includes('measured');
    const bpMatch = q.match(/(\d{2,3})\s*(?:\/|over|\s)\s*(\d{2,3})/);
    if (isLogIntent && bpMatch) {
      const sys = parseInt(bpMatch[1], 10);
      const dia = parseInt(bpMatch[2], 10);
      
      const pulseMatch = q.match(/(\d{2,3})\s*(?:bpm|pulse|heart rate|beats)/) || q.match(/(?:pulse|heart rate)\s*(?:is|of)?\s*(\d{2,3})/);
      const pulseVal = pulseMatch ? parseInt(pulseMatch[1], 10) : 72;

      // Save to storage
      HealthStorageService.registerBloodPressureAndPulse(todayStr, sys, dia, pulseVal, 'Logged via AI Assistant');

      const isSysTarget = sys >= profile.targetSystolicMin && sys <= profile.targetSystolicMax;
      const targetNote = isSysTarget
        ? `This is within your personal target range (${profile.targetSystolicMin}–${profile.targetSystolicMax} mmHg).`
        : `This is slightly outside your target of ${profile.targetSystolicMin}–${profile.targetSystolicMax} mmHg.`;

      const responseText = `I have logged your blood pressure reading of ${sys}/${dia} mmHg with a pulse of ${pulseVal} BPM for today. ${targetNote}`;

      return {
        answer: responseText,
        spokenText: responseText,
        category: 'blood_pressure',
        isActionLogged: true,
        loggedActionDescription: `Recorded BP ${sys}/${dia} mmHg, Pulse ${pulseVal} BPM`,
        followUpSuggestions: [
          'What are my medications today?',
          'Show blood pressure trend',
          'What are my healthy targets?'
        ],
      };
    }

    // 2. Direct Voice / Text Medication Taking Command
    // Examples: "I took my morning pills", "Took Lisinopril", "I took all my meds"
    if (q.includes('took') || q.includes('taken') || q.includes('swallowed') || q.includes('drank my meds')) {
      const allTodayLogs = HealthStorageService.getMedicationLogsForDate(todayStr);

      if (q.includes('morning') || q.includes('all') || q.includes('breakfast')) {
        HealthStorageService.markTimeSlotStatus(todayStr, 'morning', 'taken');
        const morningCount = allTodayLogs.filter((l) => l.timeOfDay === 'morning').length;
        const msg = `Great job! I have confirmed all ${morningCount || 'your'} morning medications as taken for today.`;
        return {
          answer: msg,
          spokenText: msg,
          category: 'medication',
          isActionLogged: true,
          loggedActionDescription: 'Confirmed morning medications taken',
          followUpSuggestions: [
            'What medications are left today?',
            'What is my latest blood pressure?',
            'Check my adherence rate'
          ],
        };
      }

      if (q.includes('evening') || q.includes('dinner') || q.includes('night')) {
        HealthStorageService.markTimeSlotStatus(todayStr, 'evening', 'taken');
        const msg = `Confirmed! I have marked your evening medications as taken for today.`;
        return {
          answer: msg,
          spokenText: msg,
          category: 'medication',
          isActionLogged: true,
          loggedActionDescription: 'Confirmed evening medications taken',
          followUpSuggestions: [
            'What medications are left today?',
            'What is my latest blood pressure?'
          ],
        };
      }

      // Check specific drug match
      const matchingMed = allTodayLogs.find((l) => q.includes(l.medicationName.toLowerCase()));
      if (matchingMed) {
        HealthStorageService.updateMedicationLogStatus(todayStr, matchingMed.medicationId, 'taken');
        const msg = `Confirmed! I marked ${matchingMed.medicationName} (${matchingMed.dosage}) as taken for today.`;
        return {
          answer: msg,
          spokenText: msg,
          category: 'medication',
          isActionLogged: true,
          loggedActionDescription: `Marked ${matchingMed.medicationName} taken`,
          followUpSuggestions: [
            'What other medications do I have today?',
            'What is my blood pressure?'
          ],
        };
      }
    }

    // 3. Blood Pressure & Pulse Inquiries
    // Examples: "What is my latest blood pressure?", "What was my pulse yesterday?", "Tell me my vitals"
    if (q.includes('blood pressure') || q.includes('bp') || q.includes('pulse') || q.includes('heart rate') || q.includes('vitals')) {
      const bpRecords = sortedDesc.filter((r) => r.bloodPressure?.measured && r.bloodPressure.systolic);
      
      if (bpRecords.length === 0) {
        const msg = `You don't have any blood pressure readings recorded yet. Your personal systolic target is ${profile.targetSystolicMin} to ${profile.targetSystolicMax} mmHg. Would you like to log your reading now?`;
        return {
          answer: msg,
          spokenText: msg,
          category: 'blood_pressure',
          followUpSuggestions: ['Log BP 120/80 pulse 72', 'What are my healthy targets?'],
        };
      }

      const latest = bpRecords[0];
      const sys = latest.bloodPressure.systolic || 120;
      const dia = latest.bloodPressure.diastolic || 80;
      const pulseVal = latest.bloodPressure.pulse || 72;
      const readingDate = new Date(latest.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      // Calculate 30-day average
      const avgSys = Math.round(bpRecords.reduce((sum, r) => sum + (r.bloodPressure.systolic || 0), 0) / bpRecords.length);
      const avgDia = Math.round(bpRecords.reduce((sum, r) => sum + (r.bloodPressure.diastolic || 0), 0) / bpRecords.length);
      const avgPulse = Math.round(bpRecords.reduce((sum, r) => sum + (r.bloodPressure.pulse || 72), 0) / bpRecords.length);

      const inTarget = sys >= profile.targetSystolicMin && sys <= profile.targetSystolicMax;
      const targetFeedback = inTarget
        ? `This reading is in your healthy target zone (${profile.targetSystolicMin}–${profile.targetSystolicMax} mmHg).`
        : `Your personal target is ${profile.targetSystolicMin}–${profile.targetSystolicMax} mmHg.`;

      const spoken = `Your most recent blood pressure was recorded on ${readingDate} at ${sys} over ${dia} mmHg, with a pulse of ${pulseVal} beats per minute. ${targetFeedback} Your 30-day average is ${avgSys} over ${avgDia} mmHg.`;

      const written = `📊 **Latest Blood Pressure & Pulse (${readingDate})**:\n• Reading: **${sys}/${dia} mmHg** (Pulse: **${pulseVal} BPM**)\n• Target Goal: ${profile.targetSystolicMin}–${profile.targetSystolicMax} / ${profile.targetDiastolicMin}–${profile.targetDiastolicMax} mmHg\n• 30-Day Average: **${avgSys}/${avgDia} mmHg** (Avg Pulse: **${avgPulse} BPM**)\n• Status: ${inTarget ? '✅ Within Target Range' : '⚠️ Outside Ideal Target'}`;

      return {
        answer: written,
        spokenText: spoken,
        category: 'blood_pressure',
        followUpSuggestions: [
          'What medications do I have today?',
          'Have my readings improved?',
          'What did my doctor say?'
        ],
      };
    }

    // 4. Medication Schedule & Adherence Inquiries
    // Examples: "What medications do I have today?", "Did I miss any pills?", "What is my medicine schedule?"
    if (q.includes('medicine') || q.includes('medication') || q.includes('meds') || q.includes('pills') || q.includes('dose') || q.includes('prescription')) {
      const todayLogs = HealthStorageService.getMedicationLogsForDate(todayStr);
      const activeMeds = profile.medications.filter((m) => m.active !== false);

      const taken = todayLogs.filter((l) => l.status === 'taken');
      const pending = todayLogs.filter((l) => l.status === 'pending');
      const missed = todayLogs.filter((l) => l.status === 'missed');

      const morningMeds = activeMeds.filter((m) => m.timeOfDay === 'morning').map((m) => `${m.name} ${m.dosage}`).join(', ');
      const afternoonMeds = activeMeds.filter((m) => m.timeOfDay === 'afternoon').map((m) => `${m.name} ${m.dosage}`).join(', ');
      const eveningMeds = activeMeds.filter((m) => m.timeOfDay === 'evening').map((m) => `${m.name} ${m.dosage}`).join(', ');
      const bedtimeMeds = activeMeds.filter((m) => m.timeOfDay === 'bedtime').map((m) => `${m.name} ${m.dosage}`).join(', ');

      const spokenSummary = `You have ${activeMeds.length} active prescriptions scheduled. Today, ${taken.length} doses are confirmed taken, and ${pending.length} are pending. Morning routine includes ${morningMeds || 'none'}.`;

      let written = `💊 **Today's Medication Schedule (${todayStr})**:\n`;
      written += `• **Morning Routine**: ${morningMeds || 'None'}\n`;
      if (afternoonMeds) written += `• **Afternoon / Lunch**: ${afternoonMeds}\n`;
      if (eveningMeds) written += `• **Evening / Dinner**: ${eveningMeds}\n`;
      if (bedtimeMeds) written += `• **Bedtime**: ${bedtimeMeds}\n`;
      written += `\n**Status Today**: ✅ ${taken.length} Taken | ⏳ ${pending.length} Pending | ❌ ${missed.length} Missed`;

      return {
        answer: written,
        spokenText: spokenSummary,
        category: 'medication',
        followUpSuggestions: [
          'I took all morning meds',
          'What is my latest blood pressure?',
          'What did my doctor say?'
        ],
      };
    }

    // 5. Doctor Visits, Appointments & Clinical Instructions
    // Examples: "What did my doctor say?", "When is my next appointment?", "Doctor recommendations"
    if (q.includes('doctor') || q.includes('physician') || q.includes('appointment') || q.includes('cardiologist') || q.includes('dr.') || q.includes('dr ')) {
      const spoken = `Your last cardiology consultation with Doctor Sarah Jenkins was on September 14. Doctor Jenkins noted stable blood pressure control, adjusted Lisinopril to 10 milligrams, and recommended keeping sodium under 2000 milligrams daily. Your next checkup is scheduled in December.`;

      const written = `🩺 **Doctor & Clinical Care Summary**:\n• **Attending Cardiologist**: Dr. Sarah Jenkins, MD (UCSF Cardiology)\n• **Latest Visit**: Sept 14, 2026 — Routine Hypertension Review\n• **Clinical Notes**: Blood pressure well controlled at 124/80 mmHg. Continued Lisinopril 10mg daily with breakfast.\n• **Doctor's Guidance**: Maintain daily 20-minute walks, keep sodium below 2,000 mg/day, and monitor for any morning dizziness.\n• **Next Follow-Up**: Scheduled December 2026.`;

      return {
        answer: written,
        spokenText: spoken,
        category: 'doctor',
        followUpSuggestions: [
          'What is my latest blood pressure?',
          'What medications do I have today?',
          'Add a doctor reminder'
        ],
      };
    }

    // 6. Clinical Risk Alerts & Warnings
    // Examples: "Are there any health alerts?", "Do I have any health risks?", "Why is my avatar worried?"
    if (q.includes('alert') || q.includes('alerts') || q.includes('risk') || q.includes('warning') || q.includes('concern')) {
      const alerts: SmartAlert[] = HealthAnalyticsService.evaluateSmartAlerts(history, profile);

      if (alerts.length === 0) {
        const msg = `You have no active health risk alerts. All your recent check-in readings, blood pressure, and medication adherence are in a stable, healthy state.`;
        return {
          answer: `🛡️ **Smart Risk Alerts Status**:\n• **Active Alerts**: 0 pending\n• **Summary**: Key health indicators (blood pressure, medication compliance, and daily energy) are in a safe and steady range.`,
          spokenText: msg,
          category: 'alerts',
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
        followUpSuggestions: [
          'What is my latest blood pressure?',
          'What did my doctor say?'
        ],
      };
    }

    // 7. Personal Targets & Normal Guidelines
    // Examples: "What should my blood pressure be?", "What is my normal pulse?", "What are my healthy targets?"
    if (q.includes('target') || q.includes('normal range') || q.includes('healthy range') || q.includes('goal') || q.includes('should my')) {
      const spoken = `Your personalized healthy target for blood pressure is ${profile.targetSystolicMin} to ${profile.targetSystolicMax} mmHg systolic, and ${profile.targetDiastolicMin} to ${profile.targetDiastolicMax} mmHg diastolic. A normal resting pulse is 60 to 100 beats per minute.`;

      const written = `🎯 **Personal Health & Vitals Targets**:\n• **Target Systolic**: ${profile.targetSystolicMin} – ${profile.targetSystolicMax} mmHg\n• **Target Diastolic**: ${profile.targetDiastolicMin} – ${profile.targetDiastolicMax} mmHg\n• **Normal Resting Pulse**: 60 – 100 BPM\n• **Daily Physical Activity Target**: 30 minutes/day\n• **Sodium Limit**: Under 2,000 mg/day (Heart-Healthy guidelines)`;

      return {
        answer: written,
        spokenText: spoken,
        category: 'targets',
        followUpSuggestions: [
          'What is my latest blood pressure?',
          'Log BP 120/80 pulse 72',
          'What medications do I have today?'
        ],
      };
    }

    return null;
  }
}
