import { 
  CheckInRecord, 
  DailySummary, 
  SmartAlert, 
  UserProfile, 
  RetrospectiveQueryResult, 
  ActivityLogEntry,
  WellbeingAvatarState,
  WellbeingStateCategory
} from '../types/health';
import { HealthStorageService } from './healthStorage';

export class HealthAnalyticsService {
  public static readonly MEDICAL_DISCLAIMER =
    'This is not medical advice. Contact your healthcare provider if you are concerned.';

  /**
   * Computes the dynamic avatar state, smiley expression, and wellbeing awareness metrics
   * based on the user's historical check-ins and recent patterns.
   */
  public static evaluateWellbeingAvatarState(
    history: CheckInRecord[],
    profile?: UserProfile
  ): WellbeingAvatarState {
    if (!history || history.length === 0) {
      return {
        category: 'good',
        score: 80,
        label: 'Ready for Today',
        emoji: '😊',
        bgGradient: 'from-emerald-500 to-teal-500',
        ringColor: 'border-emerald-400 ring-emerald-400/40',
        statusMessage: 'Ready for your daily check-in. Have a wonderful day!',
        prolongedBelowNormal: false,
        prolongedDaysCount: 0,
        averageMood: 'good',
        averageEnergy: 7.5,
        averageSleep: 7.5,
        recommendation: 'Complete your daily AI Check-In to keep your health insights fresh.',
      };
    }

    const sortedDesc = [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Analyze recent 7 check-ins (or all available if fewer)
    const recentSample = sortedDesc.slice(0, 7);

    // 1. Mood mapping & scoring
    const moodScoreMap: Record<string, number> = {
      great: 100,
      very_good: 95,
      good: 82,
      okay: 60,
      not_great: 35,
      poor: 15,
    };

    let totalMoodScore = 0;
    let totalEnergy = 0;
    let totalSleep = 0;
    let totalPain = 0;
    let medsScore = 0;

    recentSample.forEach((rec) => {
      const mScore = moodScoreMap[rec.mood] ?? 70;
      totalMoodScore += mScore;
      totalEnergy += (rec.energyLevel || 7);
      totalSleep += (rec.sleepQuality || 7);
      totalPain += (rec.painLevel || 0);

      if (rec.medicationStatus === 'taken') {
        medsScore += 100;
      } else if (rec.medicationStatus === 'not_yet') {
        medsScore += 60;
      } else {
        medsScore += 20;
      }
    });

    const sampleCount = recentSample.length;
    const avgMoodScore = totalMoodScore / sampleCount;
    const avgEnergy = totalEnergy / sampleCount;
    const avgSleep = totalSleep / sampleCount;
    const avgPain = totalPain / sampleCount;
    const avgMedsScore = medsScore / sampleCount;

    // Convert metrics to 0-100 scale
    const energyScore = (avgEnergy / 10) * 100;
    const sleepScore = (avgSleep / 10) * 100;
    const painScore = Math.max(0, 100 - avgPain * 10);

    // Weighted Overall Wellbeing Index:
    // Mood: 30%, Energy: 25%, Sleep: 20%, Pain: 15%, Meds Adherence: 10%
    let compositeScore = Math.round(
      avgMoodScore * 0.30 +
      energyScore * 0.25 +
      sleepScore * 0.20 +
      painScore * 0.15 +
      avgMedsScore * 0.10
    );

    // Check for high BP penalty if recent blood pressure readings are available
    const recentBp = recentSample.find((r) => r.bloodPressure?.measured && r.bloodPressure.systolic);
    if (recentBp && profile && recentBp.bloodPressure.systolic) {
      if (recentBp.bloodPressure.systolic > (profile.targetSystolicMax + 15)) {
        compositeScore = Math.max(10, compositeScore - 8);
      }
    }

    // 2. Check for prolonged below-normal streak
    let belowNormalStreak = 0;
    for (const r of sortedDesc) {
      const isBelow =
        r.mood === 'poor' ||
        r.mood === 'not_great' ||
        (r.energyLevel && r.energyLevel <= 4) ||
        (r.painLevel && r.painLevel >= 6);
      if (isBelow) {
        belowNormalStreak++;
      } else {
        break;
      }
    }

    const prolongedBelowNormal = belowNormalStreak >= 3;

    // Map most common mood string
    const latestMood = sortedDesc[0]?.mood || 'good';

    // 3. Determine category, emoji expression, gradients, and gentle awareness advice
    let category: WellbeingStateCategory;
    let emoji: string;
    let label: string;
    let bgGradient: string;
    let ringColor: string;
    let statusMessage: string;
    let recommendation: string;

    if (prolongedBelowNormal || compositeScore < 38) {
      category = 'needs_attention';
      emoji = '🥺';
      label = 'Rest & Care Recommended';
      bgGradient = 'from-amber-600 via-rose-500 to-rose-600';
      ringColor = 'border-rose-400 ring-rose-400/60';
      statusMessage = `Wellbeing lower than baseline for ${belowNormalStreak || 3} days • Rest advised`;
      recommendation = 'Rest comfortably, drink plenty of fluids, and consider letting a family member or your doctor know how you are feeling.';
    } else if (compositeScore >= 82) {
      category = 'thriving';
      emoji = '😄';
      label = 'Optimal Vitality & Wellbeing';
      bgGradient = 'from-emerald-500 to-teal-400';
      ringColor = 'border-emerald-400 ring-emerald-400/40';
      statusMessage = `High vitality • Restful sleep (${avgSleep.toFixed(1)}h) • Vitals optimal`;
      recommendation = 'Fantastic job staying active and consistent with your health routine!';
    } else if (compositeScore >= 68) {
      category = 'good';
      emoji = '😊';
      label = 'Vitals & Energy in Healthy Balance';
      bgGradient = 'from-teal-500 to-cyan-500';
      ringColor = 'border-cyan-400 ring-cyan-400/40';
      statusMessage = `Vitals balanced • Sleep ${avgSleep.toFixed(1)}h • Energy ${avgEnergy.toFixed(1)}/10`;
      recommendation = 'Keep enjoying light daily walks and staying well-hydrated today.';
    } else if (compositeScore >= 50) {
      category = 'okay';
      emoji = '🙂';
      label = 'Stable Baseline Wellbeing';
      bgGradient = 'from-sky-500 to-indigo-500';
      ringColor = 'border-sky-400 ring-sky-400/40';
      statusMessage = `Stable vitals • Normal daily energy (${avgEnergy.toFixed(1)}/10)`;
      recommendation = 'Take brief stretching breaks and relax with some warm herbal tea.';
    } else {
      category = 'below_normal';
      emoji = '🙁';
      label = 'Low Energy • Gentle Rest Advised';
      bgGradient = 'from-amber-500 to-orange-500';
      ringColor = 'border-amber-400 ring-amber-400/40';
      statusMessage = `Energy lower than usual (${avgEnergy.toFixed(1)}/10) • Prioritize rest`;
      recommendation = 'Prioritize gentle rest, reduce physically taxing chores, and take care.';
    }

    return {
      category,
      score: compositeScore,
      label,
      emoji,
      bgGradient,
      ringColor,
      statusMessage,
      prolongedBelowNormal,
      prolongedDaysCount: belowNormalStreak,
      averageMood: latestMood,
      averageEnergy: parseFloat(avgEnergy.toFixed(1)),
      averageSleep: parseFloat(avgSleep.toFixed(1)),
      recommendation,
    };
  }

  private static MOTIVATION_LIST: string[] = [
    'Drink a tall glass of fresh water to keep your body hydrated.',
    'Take a pleasant 10-minute walk outside or around your home.',
    'Stretch gently for five minutes to keep your joints limber and comfortable.',
    'Give a close friend or family member a warm phone call today.',
    'Sit comfortably outdoors and enjoy the fresh air and sunshine.',
    'Practice 5 slow, deep breaths to bring calm and relaxation to your day.',
    'Enjoy a healthy, colorful piece of fruit or warm cup of herbal tea.',
  ];

  public static getRandomMotivation(): string {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    return this.MOTIVATION_LIST[dayOfYear % this.MOTIVATION_LIST.length];
  }

  /**
   * Generates a friendly, human, encouraging daily summary after check-in
   */
  public static generateDailySummary(
    record: CheckInRecord,
    _history: CheckInRecord[],
    profile: UserProfile
  ): DailySummary {
    const insights: string[] = [];

    // 1. Blood Pressure evaluation
    if (record.bloodPressure.measured && record.bloodPressure.systolic && record.bloodPressure.diastolic) {
      const sys = record.bloodPressure.systolic;
      const dia = record.bloodPressure.diastolic;

      if (sys <= profile.targetSystolicMax && dia <= profile.targetDiastolicMax) {
        insights.push(`Your blood pressure (${sys}/${dia} mmHg) is within your healthy target range.`);
      } else if (sys > profile.targetSystolicMax + 15 || dia > profile.targetDiastolicMax + 10) {
        insights.push(`Your blood pressure reading (${sys}/${dia} mmHg) is higher than your typical target.`);
      } else {
        insights.push(`Your blood pressure was recorded at ${sys}/${dia} mmHg with a pulse of ${record.bloodPressure.pulse || 72} bpm.`);
      }
    } else {
      insights.push('Blood pressure was not recorded today (optional).');
    }

    // 2. Wellbeing & Symptoms
    const symptomCount = record.symptoms.length;
    if (symptomCount === 0) {
      if (record.mood === 'very_good' || record.mood === 'good') {
        insights.push('You reported feeling well with great energy and no bothersome symptoms.');
      } else {
        insights.push('You noted feeling quiet or subdued today, with no major physical symptoms reported.');
      }
    } else {
      const symptomListStr = record.symptoms.join(', ').toLowerCase();
      insights.push(`You noted experiencing ${symptomListStr}. Be gentle with yourself and rest if needed.`);
    }

    // 3. Sleep & Energy
    if (record.sleepQuality >= 8) {
      insights.push(`Wonderful sleep recorded last night (${record.sleepQuality}/10), helping boost your vitality.`);
    } else if (record.sleepQuality <= 4) {
      insights.push(`Sleep was on the lighter side last night (${record.sleepQuality}/10). A brief afternoon rest may help.`);
    }

    // 4. Medication Check
    if (record.medicationStatus === 'taken') {
      insights.push('You have confirmed taking your scheduled morning medications.');
    } else if (record.medicationStatus === 'not_yet') {
      insights.push('Friendly reminder: Remember to take your morning medications with your meal.');
    } else {
      insights.push('You reported missing your morning medications. Please check your schedule or call your caregiver if unsure.');
    }

    const motivation = this.getRandomMotivation();

    return {
      headline: "Today's check-in has been completed.",
      insights,
      motivation,
      disclaimer: this.MEDICAL_DISCLAIMER,
    };
  }

  /**
   * Risk-based intelligent alert engine
   */
  public static evaluateSmartAlerts(
    history: CheckInRecord[],
    profile: UserProfile
  ): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const today = new Date();
    const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sorted.length === 0) return alerts;

    // --- 1. Medication Alert: Missed >= 3 times in past 7 days ---
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7DaysRecords = sorted.filter((r) => new Date(r.date) >= sevenDaysAgo);
    const missedMedsCount = last7DaysRecords.filter((r) => r.medicationStatus === 'missed').length;

    if (missedMedsCount >= 3) {
      alerts.push({
        id: 'alert-med-missed',
        type: 'medication',
        severity: 'critical',
        title: 'Medication Adherence Alert',
        message: `You have recorded missed medications ${missedMedsCount} times over the past 7 days. Consistency is vital for your health.`,
        dateTriggered: new Date().toISOString(),
        dismissed: false,
      });
    }

    // --- 2. Blood Pressure Alert: Trending higher or high reading ---
    const bpRecords = sorted.filter((r) => r.bloodPressure.measured && r.bloodPressure.systolic);
    if (bpRecords.length >= 3) {
      const recent3 = bpRecords.slice(0, 3);
      const older = bpRecords.slice(3, 10);

      const recentAvgSys = recent3.reduce((sum, r) => sum + (r.bloodPressure.systolic || 0), 0) / recent3.length;
      
      if (older.length > 0) {
        const olderAvgSys = older.reduce((sum, r) => sum + (r.bloodPressure.systolic || 0), 0) / older.length;
        if (recentAvgSys - olderAvgSys >= 14 || recentAvgSys >= (profile.targetSystolicMax + 12)) {
          alerts.push({
            id: 'alert-bp-elevated',
            type: 'blood_pressure',
            severity: recentAvgSys >= (profile.targetSystolicMax + 20) ? 'critical' : 'warning',
            title: 'Blood Pressure Trend Alert',
            message: `Your recent systolic readings (averaging ${Math.round(recentAvgSys)} mmHg) are noticeably higher than your prior baseline (${Math.round(olderAvgSys)} mmHg).`,
            dateTriggered: new Date().toISOString(),
            dismissed: false,
          });
        }
      }
    }

    // --- 3. Prolonged Below-Normal Wellbeing Alert ---
    let belowNormalStreak = 0;
    for (const r of sorted) {
      const isBelow = r.mood === 'poor' || r.mood === 'not_great' || r.energyLevel <= 4 || r.painLevel >= 6;
      if (isBelow) {
        belowNormalStreak++;
      } else {
        break;
      }
    }

    if (belowNormalStreak >= 3) {
      alerts.push({
        id: 'alert-prolonged-low-wellbeing',
        type: 'wellness',
        severity: 'warning',
        title: 'Wellbeing Notice: Below Normal Baseline',
        message: `Your energy and wellbeing ratings have been below normal for ${belowNormalStreak} consecutive check-ins. Taking extra rest, staying hydrated, or consulting your doctor is recommended.`,
        dateTriggered: new Date().toISOString(),
        dismissed: false,
      });
    } else if (sorted.length >= 5) {
      const last5 = sorted.slice(0, 5);
      const poorStreak = last5.every((r) => r.mood === 'poor' || r.mood === 'not_great');
      if (poorStreak) {
        alerts.push({
          id: 'alert-wellness-streak',
          type: 'wellness',
          severity: 'warning',
          title: 'Wellness Concern Alert',
          message: 'You have reported low wellbeing for 5 consecutive days. Sharing how you feel with your family or doctor can help.',
          dateTriggered: new Date().toISOString(),
          dismissed: false,
        });
      }
    }

    // --- 4. Doctor Follow-Up Alert: Recurring Dizziness, Chest Discomfort, Shortness of breath ---
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30Days = sorted.filter((r) => new Date(r.date) >= thirtyDaysAgo);

    const dizzinessCount = last30Days.filter((r) =>
      r.symptoms.some((s) => s.toLowerCase().includes('dizziness'))
    ).length;

    if (dizzinessCount >= 3) {
      alerts.push({
        id: 'alert-doc-dizziness',
        type: 'doctor_followup',
        severity: 'critical',
        title: 'Doctor Follow-Up: Dizziness Pattern',
        message: `You have reported dizziness ${dizzinessCount} times in the last month. We recommend mentioning this pattern to your doctor.`,
        dateTriggered: new Date().toISOString(),
        dismissed: false,
      });
    }

    const chestDiscomfortCount = last30Days.filter((r) =>
      r.symptoms.some((s) => s.toLowerCase().includes('chest'))
    ).length;

    if (chestDiscomfortCount >= 1) {
      alerts.push({
        id: 'alert-doc-chest',
        type: 'doctor_followup',
        severity: 'critical',
        title: 'Doctor Follow-Up: Chest Discomfort',
        message: 'Chest discomfort was recently noted. Always seek immediate medical guidance for chest discomfort or tightness.',
        dateTriggered: new Date().toISOString(),
        dismissed: false,
      });
    }

    return alerts;
  }

  /**
   * Non-medical AI health trend insights
   */
  public static generateTrendInsights(history: CheckInRecord[]): string[] {
    if (history.length < 3) {
      return ['Keep checking in daily to unlock personalized health trends and patterns over time.'];
    }

    const insights: string[] = [];
    const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const last7 = sorted.slice(0, 7);
    const prev7 = sorted.slice(7, 14);

    // Energy analysis
    const avgEnergyLast7 = last7.reduce((acc, r) => acc + r.energyLevel, 0) / last7.length;
    if (prev7.length > 0) {
      const avgEnergyPrev7 = prev7.reduce((acc, r) => acc + r.energyLevel, 0) / prev7.length;
      if (avgEnergyLast7 < avgEnergyPrev7 - 1.5) {
        insights.push("I've noticed your energy levels have been lower during the past week compared to the week before.");
      } else if (avgEnergyLast7 > avgEnergyPrev7 + 1.5) {
        insights.push("Your reported energy levels have shown an encouraging rise over the past seven days!");
      }
    }

    // Sleep analysis
    const avgSleepLast7 = last7.reduce((acc, r) => acc + r.sleepQuality, 0) / last7.length;
    if (avgSleepLast7 < 5.5) {
      insights.push("Your sleep quality has decreased during recent days. Consider keeping a relaxing, quiet evening routine.");
    }

    // Blood pressure trend
    const bpReadings = sorted.filter((r) => r.bloodPressure.measured && r.bloodPressure.systolic);
    if (bpReadings.length >= 4) {
      const firstSys = bpReadings[bpReadings.length - 1].bloodPressure.systolic || 120;
      const recentSys = bpReadings[0].bloodPressure.systolic || 120;
      if (recentSys > firstSys + 12) {
        insights.push("There has been a gradual increase in your blood pressure readings across your recent check-ins.");
      } else if (recentSys < firstSys - 10) {
        insights.push("Your blood pressure numbers have shown a steady and positive improvement.");
      }
    }

    if (insights.length === 0) {
      insights.push('Your key health indicators (sleep, energy, and blood pressure) have remained steady and stable.');
    }

    return insights;
  }

  /**
   * Retrospective Health Q&A Assistant Engine
   */
  public static queryRetrospective(
    query: string,
    history: CheckInRecord[],
    profile: UserProfile
  ): RetrospectiveQueryResult {
    const q = query.toLowerCase();
    const sortedAsc = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sortedDesc = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 1. "When did my fatigue start?" / symptom onset
    if (q.includes('fatigue') || q.includes('tired') || q.includes('dizziness') || q.includes('headache') || q.includes('symptom')) {
      let targetSymptom = 'Fatigue';
      if (q.includes('dizziness')) targetSymptom = 'Dizziness';
      if (q.includes('headache')) targetSymptom = 'Headache';

      const symptomOccurrences = sortedAsc.filter((r) =>
        r.symptoms.some((s) => s.toLowerCase().includes(targetSymptom.toLowerCase())) ||
        (targetSymptom === 'Fatigue' && (r.energyLevel <= 4 || (r.symptomNotes && r.symptomNotes.toLowerCase().includes('tired'))))
      );

      if (symptomOccurrences.length === 0) {
        return {
          query,
          answer: `I searched all your records and did not find any recorded instances of ${targetSymptom.toLowerCase()} in your check-in history.`,
          relevantDateRange: 'All check-in history',
          bulletPoints: ['No symptom occurrences found in records', 'Energy ratings have remained in a healthy range'],
          doctorConsultSuggested: false,
        };
      }

      const firstDate = new Date(symptomOccurrences[0].date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const recentDate = new Date(symptomOccurrences[symptomOccurrences.length - 1].date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
      });

      return {
        query,
        answer: `Your ${targetSymptom.toLowerCase()} was first noted on ${firstDate}. You have recorded it ${symptomOccurrences.length} time(s), most recently on ${recentDate}.`,
        relevantDateRange: `${firstDate} – ${recentDate}`,
        bulletPoints: [
          `First recorded onset: ${firstDate}`,
          `Total days recorded with ${targetSymptom.toLowerCase()}: ${symptomOccurrences.length} day(s)`,
          symptomOccurrences.length >= 3
            ? `Because this has happened ${symptomOccurrences.length} times, discussing it with your doctor is advised.`
            : `Keep monitoring how you feel over the next few days.`,
        ],
        doctorConsultSuggested: symptomOccurrences.length >= 3,
        suggestedFollowUp: `Would you like to print or share this symptom timeline for your next doctor appointment?`,
      };
    }

    // 2. "Have my blood pressure readings improved?" / BP queries
    if (q.includes('blood pressure') || q.includes('bp') || q.includes('readings') || q.includes('systolic')) {
      const bpRecords = sortedAsc.filter((r) => r.bloodPressure.measured && r.bloodPressure.systolic);

      if (bpRecords.length < 2) {
        return {
          query,
          answer: 'You have only a few blood pressure entries recorded. Once you log 3 or more readings, I can give you a full trend comparison.',
          relevantDateRange: 'Recent entries',
          bulletPoints: ['Please continue measuring and logging your blood pressure in your daily check-in.'],
          doctorConsultSuggested: false,
        };
      }

      const midpoint = Math.floor(bpRecords.length / 2);
      const firstHalf = bpRecords.slice(0, midpoint);
      const secondHalf = bpRecords.slice(midpoint);

      const firstAvgSys = Math.round(firstHalf.reduce((sum, r) => sum + (r.bloodPressure.systolic || 0), 0) / firstHalf.length);
      const firstAvgDia = Math.round(firstHalf.reduce((sum, r) => sum + (r.bloodPressure.diastolic || 0), 0) / firstHalf.length);

      const secAvgSys = Math.round(secondHalf.reduce((sum, r) => sum + (r.bloodPressure.systolic || 0), 0) / secondHalf.length);
      const secAvgDia = Math.round(secondHalf.reduce((sum, r) => sum + (r.bloodPressure.diastolic || 0), 0) / secondHalf.length);

      const improved = secAvgSys < firstAvgSys;
      const diffSys = Math.abs(secAvgSys - firstAvgSys);

      return {
        query,
        answer: improved
          ? `Yes! Your blood pressure readings have improved. Your average systolic reading decreased from ${firstAvgSys}/${firstAvgDia} mmHg earlier in your history down to ${secAvgSys}/${secAvgDia} mmHg recently.`
          : `Your average blood pressure readings have shifted from ${firstAvgSys}/${firstAvgDia} mmHg to ${secAvgSys}/${secAvgDia} mmHg (a change of ${diffSys} mmHg).`,
        relevantDateRange: `${bpRecords[0].date} to ${bpRecords[bpRecords.length - 1].date}`,
        bulletPoints: [
          `Earlier average: ${firstAvgSys}/${firstAvgDia} mmHg`,
          `Recent average: ${secAvgSys}/${secAvgDia} mmHg`,
          `Your personalized target: below ${profile.targetSystolicMax}/${profile.targetDiastolicMax} mmHg`,
        ],
        doctorConsultSuggested: secAvgSys >= 140,
        suggestedFollowUp: 'You can view the full interactive chart on your Health tab.',
      };
    }

    // 3. "How have I been feeling during the last month?" / general month trend
    if (q.includes('month') || q.includes('feeling') || q.includes('trend') || q.includes('january') || q.includes('last 30')) {
      const recordsToAnalyze = sortedDesc.slice(0, 30);
      if (recordsToAnalyze.length === 0) {
        return {
          query,
          answer: "There are no check-ins logged yet for the requested period.",
          relevantDateRange: "Past 30 days",
          bulletPoints: [],
          doctorConsultSuggested: false,
        };
      }

      const goodDays = recordsToAnalyze.filter((r) => r.mood === 'very_good' || r.mood === 'good').length;
      const okDays = recordsToAnalyze.filter((r) => r.mood === 'okay').length;
      const poorDays = recordsToAnalyze.filter((r) => r.mood === 'not_great' || r.mood === 'poor').length;
      const avgEnergy = (recordsToAnalyze.reduce((sum, r) => sum + r.energyLevel, 0) / recordsToAnalyze.length).toFixed(1);
      const avgSleep = (recordsToAnalyze.reduce((sum, r) => sum + r.sleepQuality, 0) / recordsToAnalyze.length).toFixed(1);

      return {
        query,
        answer: `Over the past month (${recordsToAnalyze.length} logged check-ins), you had ${goodDays} good/very good days, ${okDays} okay days, and ${poorDays} days where you felt not great. Your average daily energy was ${avgEnergy}/10 and sleep quality averaged ${avgSleep}/10.`,
        relevantDateRange: `Past ${recordsToAnalyze.length} check-ins`,
        bulletPoints: [
          `😊 Good / Very Good Days: ${goodDays} of ${recordsToAnalyze.length}`,
          `⚡ Average Energy: ${avgEnergy} / 10`,
          `🌙 Average Sleep Quality: ${avgSleep} / 10`,
          `💊 Medication Compliance: ${Math.round((recordsToAnalyze.filter((r) => r.medicationStatus === 'taken').length / recordsToAnalyze.length) * 100)}%`,
        ],
        doctorConsultSuggested: poorDays >= 5,
        suggestedFollowUp: 'Would you like to see your medication adherence or sleep breakdown?',
      };
    }

    // 4. "Did I miss any medicine?" / Medication tracking inquiries
    if (q.includes('med') || q.includes('medicine') || q.includes('pill') || q.includes('lisinopril') || q.includes('metformin') || q.includes('dose')) {
      const past7 = sortedDesc.slice(0, 7);
      const missedInPast7 = past7.filter((r) => r.medicationStatus === 'missed');
      const takenInPast7 = past7.filter((r) => r.medicationStatus === 'taken');
      const rate = past7.length > 0 ? Math.round((takenInPast7.length / past7.length) * 100) : 100;

      const activeMedsList = profile.medications.map((m) => `${m.name} (${m.dosage}, ${m.timeOfDay})`).join(', ');

      return {
        query,
        answer: missedInPast7.length === 0
          ? `Great news! You have taken all your scheduled morning medications consistently over the past 7 days (100% adherence rate).`
          : `You have ${missedInPast7.length} missed medication day(s) recorded in the past week. Your 7-day adherence is ${rate}%.`,
        relevantDateRange: 'Past 7 Days & Active Schedule',
        bulletPoints: [
          `Current Prescriptions: ${activeMedsList}`,
          `7-Day Adherence: ${rate}% (${takenInPast7.length} of ${past7.length} confirmed)`,
          missedInPast7.length > 0
            ? `Missed dates: ${missedInPast7.map((r) => r.date).join(', ')}`
            : 'No missed doses recorded in the last 7 check-ins.',
        ],
        doctorConsultSuggested: missedInPast7.length >= 3,
        suggestedFollowUp: 'You can review and check off daily medicines in the "Health" tab under Medicine.',
      };
    }

    // 5. "How much exercise / physical activity did I do?" / Activity inquiries
    if (q.includes('exercise') || q.includes('activity') || q.includes('activities') || q.includes('walk') || q.includes('hike') || q.includes('sport') || q.includes('active')) {
      const allActs = HealthStorageService.getAllActivityLogs();
      const allEntries: ActivityLogEntry[] = Object.values(allActs).flat();
      const totalMinutes = allEntries.reduce((sum: number, a: ActivityLogEntry) => sum + a.durationMinutes, 0);
      const totalSessions = allEntries.length;

      const hikingCount = allEntries.filter((a: ActivityLogEntry) => a.category === 'hiking').length;
      const houseWorkCount = allEntries.filter((a: ActivityLogEntry) => a.category === 'housework' || a.category === 'sports').length;
      const walkCount = allEntries.filter((a: ActivityLogEntry) => a.category === 'walking').length;

      return {
        query,
        answer: `Over the past 30 days, you logged a total of ${totalMinutes} active minutes across ${totalSessions} sessions (${Math.round(totalMinutes / 30)} mins/day average), including ${walkCount} walks, ${hikingCount} hikes, and ${houseWorkCount} sessions working on the house.`,
        relevantDateRange: 'Past 30 Days of Activity Logs',
        bulletPoints: [
          `Total Active Time: ${totalMinutes} minutes`,
          `🥾 Hikes Logged: ${hikingCount} trail session(s)`,
          `🏡 Working on the House: ${houseWorkCount} session(s)`,
          `🚶 Daily Walks: ${walkCount} neighborhood walk(s)`,
          `Daily Goal: ${totalMinutes >= 600 ? '✅ Exceeded 30 min/day target!' : 'Keep staying active each morning.'}`,
        ],
        doctorConsultSuggested: false,
        suggestedFollowUp: 'You can view and log daily physical activities in the "Activities" tab.',
      };
    }

    // 6. "What are my reminders?" / Reminders & To-Do Queries
    if (q.includes('reminder') || q.includes('reminders') || q.includes('forget') || q.includes('to-do') || q.includes('todo') || q.includes('task') || q.includes('tasks') || q.includes('urgent')) {
      const allReminders = HealthStorageService.getAllReminders();
      const activeUrgent = allReminders.filter((r) => r.priority === 'urgent' && !r.completed);
      const activeLessUrgent = allReminders.filter((r) => r.priority === 'less_urgent' && !r.completed);

      const urgentTitles = activeUrgent.map((r) => `🚨 ${r.title}`).join('; ');
      const lessUrgentTitles = activeLessUrgent.map((r) => `📝 ${r.title}`).join('; ');

      return {
        query,
        answer: `You currently have ${activeUrgent.length} urgent reminder(s) and ${activeLessUrgent.length} less urgent task(s) on your list.`,
        relevantDateRange: 'Active Reminders List',
        bulletPoints: [
          `🚨 Urgent (${activeUrgent.length}): ${urgentTitles || 'None pending'}`,
          `📝 Less Urgent (${activeLessUrgent.length}): ${lessUrgentTitles || 'None pending'}`,
        ],
        doctorConsultSuggested: false,
        suggestedFollowUp: 'You can manage, check off, or add new items in the "Reminder" tab.',
      };
    }


    // Default fallback general summary
    return {
      query,
      answer: `Looking across your ${history.length} logged check-ins, your general mood has been predominantly ${sortedDesc[0]?.mood?.replace('_', ' ') || 'stable'} with an average energy score of ${(history.reduce((a, b) => a + b.energyLevel, 0) / (history.length || 1)).toFixed(1)}/10.`,
      relevantDateRange: 'Entire Check-In History',
      bulletPoints: [
        `Total Check-Ins: ${history.length}`,
        `Latest Check-In: ${sortedDesc[0]?.date || 'Today'}`,
        'All your readings and notes are preserved in your secure timeline.',
      ],
      doctorConsultSuggested: false,
      suggestedFollowUp: 'You can ask specific questions like "When did my fatigue start?" or "Have my BP readings improved?".',
    };
  }
}
