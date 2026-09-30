import { HealthAnalyticsService } from '../src/services/healthAnalytics';
import { HealthStorageService, DEFAULT_PROFILE } from '../src/services/healthStorage';
import { CheckInRecord } from '../src/types/health';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ Passed: ${message}`);
  }
}

console.log('\n--- 1. Testing Daily Summary Generation ---');
const sampleRecord: CheckInRecord = {
  id: 'test-1',
  date: '2026-09-28',
  timestamp: new Date().toISOString(),
  mood: 'good',
  energyLevel: 8,
  sleepQuality: 9,
  painLevel: 0,
  bloodPressure: { measured: true, systolic: 122, diastolic: 78, pulse: 72 },
  medicationStatus: 'taken',
  symptoms: [],
  weight: 152.0,
  dailyNotes: 'Feeling active and hydrated',
  inputMode: 'standard',
};

const summary = HealthAnalyticsService.generateDailySummary(sampleRecord, [], DEFAULT_PROFILE);
assert(summary.headline.includes("Today's check-in has been completed"), 'Headline matches requirements');
assert(summary.insights.some(i => i.includes('healthy target range')), 'Blood pressure insight is within target');
assert(summary.insights.some(i => i.includes('scheduled morning medications')), 'Medication taken acknowledged');
assert(summary.disclaimer.includes('This is not medical advice'), 'Required medical disclaimer is present');
assert(summary.motivation.length > 5, 'Daily motivation tip is populated');

console.log('\n--- 2. Testing Smart Alerts Engine ---');

// Test Missed Meds Alert
const missedMedsHistory = HealthStorageService.generateSampleHistory('missed_meds');
const missedAlerts = HealthAnalyticsService.evaluateSmartAlerts(missedMedsHistory, DEFAULT_PROFILE);
assert(missedAlerts.some(a => a.type === 'medication'), 'Medication adherence alert triggered on >= 3 missed doses');

// Test Rising BP Alert
const risingBpHistory = HealthStorageService.generateSampleHistory('rising_bp');
const bpAlerts = HealthAnalyticsService.evaluateSmartAlerts(risingBpHistory, DEFAULT_PROFILE);
assert(bpAlerts.some(a => a.type === 'blood_pressure'), 'Blood pressure trend alert triggered on gradual elevation');

// Test Dizziness Doctor Follow-up Alert
const dizzinessHistory = HealthStorageService.generateSampleHistory('dizziness_fatigue');
const docAlerts = HealthAnalyticsService.evaluateSmartAlerts(dizzinessHistory, DEFAULT_PROFILE);
assert(docAlerts.some(a => a.type === 'doctor_followup' && a.title.includes('Dizziness')), 'Doctor follow-up alert triggered for recurring dizziness');

console.log('\n--- 3. Testing Retrospective AI Q&A Assistant ---');

// Query 1: Fatigue onset
const fatigueQueryRes = HealthAnalyticsService.queryRetrospective(
  'When did my fatigue start?',
  dizzinessHistory,
  DEFAULT_PROFILE
);
assert(fatigueQueryRes.answer.includes('fatigue was first noted'), 'Retrospective assistant locates fatigue onset');
assert(fatigueQueryRes.bulletPoints.length > 0, 'Bullet points returned with structured breakdown');

// Query 2: Blood Pressure improvement
const bpQueryRes = HealthAnalyticsService.queryRetrospective(
  'Have my blood pressure readings improved?',
  risingBpHistory,
  DEFAULT_PROFILE
);
assert(bpQueryRes.answer.includes('blood pressure readings'), 'Retrospective assistant analyzes BP history');

// Query 3: Past month overall feeling
const monthQueryRes = HealthAnalyticsService.queryRetrospective(
  'How have I been feeling during the last month?',
  missedMedsHistory,
  DEFAULT_PROFILE
);
// Query 4: Reminders Q&A
const remindersQueryRes = HealthAnalyticsService.queryRetrospective(
  'What are my urgent reminders?',
  missedMedsHistory,
  DEFAULT_PROFILE
);
assert(remindersQueryRes.answer.includes('urgent reminder'), 'Retrospective assistant answers urgent reminders query');
assert(remindersQueryRes.bulletPoints.some(b => b.includes('Urgent')), 'Reminders categorized correctly in bullet points');

console.log('\n🎉 ALL 13 HEALTH SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
