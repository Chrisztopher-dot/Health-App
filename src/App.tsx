import React, { useState, useEffect } from 'react';
import { 
  CheckInRecord, 
  UserProfile, 
  SmartAlert, 
  DailySummary,
  AppTab
} from './types/health';
import { HealthStorageService } from './services/healthStorage';
import { HealthAnalyticsService } from './services/healthAnalytics';
import { Header } from './components/common/Header';
import { CheckInWizard } from './components/checkin/CheckInWizard';
import { DailySummaryCard } from './components/checkin/DailySummaryCard';
import { ConversationalCheckIn } from './components/chat/ConversationalCheckIn';
import { HealthTimeline } from './components/timeline/HealthTimeline';
import { SmartAlertsList } from './components/alerts/SmartAlertsList';
import { ActivitiesTracker } from './components/activities/ActivitiesTracker';
import { RemindersTracker } from './components/reminders/RemindersTracker';
import { BayAreaHappenings } from './components/happenings/BayAreaHappenings';
import { HealthyRecipes } from './components/recipes/HealthyRecipes';
import { AIFoodScanner } from './components/foodscanner/AIFoodScanner';
import { SettingsModal } from './components/settings/SettingsModal';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(() => HealthStorageService.getProfile());
  const [history, setHistory] = useState<CheckInRecord[]>(() => HealthStorageService.getCheckIns());
  const [todayRecord, setTodayRecord] = useState<CheckInRecord | null>(() => HealthStorageService.getTodayCheckIn());
  const [activeTab, setActiveTab] = useState<AppTab>('checkin');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isReDoingCheckIn, setIsReDoingCheckIn] = useState<boolean>(false);

  // Evaluate alerts based on history
  const [alerts, setAlerts] = useState<SmartAlert[]>(() => 
    HealthAnalyticsService.evaluateSmartAlerts(history, profile)
  );

  // Keep alerts in sync when history or profile changes
  useEffect(() => {
    const computedAlerts = HealthAnalyticsService.evaluateSmartAlerts(history, profile);
    setAlerts(computedAlerts);
  }, [history, profile]);

  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    HealthStorageService.saveProfile(updated);
  };

  const handleCompleteCheckIn = (newRecord: CheckInRecord) => {
    HealthStorageService.addCheckIn(newRecord);
    setTodayRecord(newRecord);
    const updatedHistory = HealthStorageService.getCheckIns();
    setHistory(updatedHistory);
    setIsReDoingCheckIn(false);
    setActiveTab('checkin');
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSelectScenario = (
    scenario: 'balanced' | 'rising_bp' | 'missed_meds' | 'dizziness_fatigue'
  ) => {
    const seed = HealthStorageService.generateSampleHistory(scenario);
    HealthStorageService.saveCheckIns(seed);
    setHistory(seed);
    setTodayRecord(null);
    setIsReDoingCheckIn(false);
    setActiveTab('checkin');
  };

  // Text scaling classes
  const textScaleClasses = {
    normal: 'text-base',
    large: 'text-lg',
    'extra-large': 'text-xl',
  }[profile.textScale];

  // Daily Summary if today's checkin is completed
  const dailySummary: DailySummary | null = todayRecord
    ? HealthAnalyticsService.generateDailySummary(todayRecord, history, profile)
    : null;

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${textScaleClasses}`}>
      {/* Top Accessible Navigation */}
      <Header
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        alertCount={alerts.length}
        onSelectScenario={handleSelectScenario}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tab 1: Daily Check-In */}
        {activeTab === 'checkin' && (
          <div>
            {!todayRecord || isReDoingCheckIn ? (
              <div className="space-y-4">
                {/* Switch to conversational banner */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 text-amber-950 font-bold text-sm sm:text-base">
                    <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>Prefer speaking your check-in instead of tapping buttons?</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('conversational')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-extrabold shadow-sm transition-all whitespace-nowrap active:scale-95"
                  >
                    Try Voice Check-In Mode
                  </button>
                </div>

                <CheckInWizard
                  profile={profile}
                  onComplete={handleCompleteCheckIn}
                  initialData={todayRecord || undefined}
                />
              </div>
            ) : (
              <DailySummaryCard
                record={todayRecord}
                summary={dailySummary!}
                profile={profile}
                onRedoCheckIn={() => setIsReDoingCheckIn(true)}
                onGoToTimeline={() => setActiveTab('timeline')}
                onGoToScanner={() => setActiveTab('scanner')}
              />
            )}
          </div>
        )}

        {/* Tab 2: Conversational Check-In Mode */}
        {activeTab === 'conversational' && (
          <ConversationalCheckIn
            profile={profile}
            onComplete={handleCompleteCheckIn}
            onCancel={() => setActiveTab('checkin')}
            onUpdateVoiceSpeed={(speed) => handleUpdateProfile({ ...profile, voiceSpeed: speed })}
          />
        )}

        {/* Tab 3: Health (Diagrams & Trends + Medicine Tracker) */}
        {(activeTab === 'timeline' || activeTab === 'medicine') && (
          <HealthTimeline
            history={history}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            defaultSection={activeTab === 'medicine' ? 'medicine' : 'diagram'}
          />
        )}

        {/* Tab 4: Smart Risk Alerts */}
        {activeTab === 'alerts' && (
          <SmartAlertsList
            alerts={alerts}
            profile={profile}
            onDismissAlert={handleDismissAlert}
          />
        )}

        {/* Tab 6: Physical Activities & Exercise Tracker */}
        {activeTab === 'activities' && (
          <ActivitiesTracker
            profile={profile}
          />
        )}

        {/* Tab 7: Reminders & Tasks */}
        {activeTab === 'reminders' && (
          <RemindersTracker
            profile={profile}
          />
        )}

        {/* Tab 8: Bay Area Fun & Events */}
        {activeTab === 'happenings' && (
          <BayAreaHappenings
            profile={profile}
          />
        )}

        {/* Tab 9: Healthy Meals & Low-Sodium / Vegetarian Recipes */}
        {activeTab === 'recipes' && (
          <HealthyRecipes
            profile={profile}
            onNavigateToScanner={() => setActiveTab('scanner')}
          />
        )}

        {/* Tab 10: AI Food Scanner & Dining Out Assistant */}
        {activeTab === 'scanner' && (
          <AIFoodScanner
            profile={profile}
            onNavigateToRecipes={() => setActiveTab('recipes')}
            onNavigateToCheckin={() => setActiveTab('checkin')}
          />
        )}
      </main>

      {/* Settings & Medication Manager Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={handleUpdateProfile}
        onResetData={handleSelectScenario}
      />
    </div>
  );
};
export default App;
