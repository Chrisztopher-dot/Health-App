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
import { ThemeService } from './services/themeService';
import { SpeechService } from './services/speechService';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MobileNav } from './components/layout/MobileNav';
import { DailySummaryCard } from './components/checkin/DailySummaryCard';
import { ConversationalCheckIn } from './components/chat/ConversationalCheckIn';
import { HealthTimeline } from './components/timeline/HealthTimeline';
import { SmartAlertsList } from './components/alerts/SmartAlertsList';
import { ActivitiesTracker } from './components/activities/ActivitiesTracker';
import { RemindersTracker } from './components/reminders/RemindersTracker';
import { BayAreaHappenings } from './components/happenings/BayAreaHappenings';
import { HealthyRecipes } from './components/recipes/HealthyRecipes';
import { AIFoodScanner } from './components/foodscanner/AIFoodScanner';
import { VoiceOrTextAssistant } from './components/assistant/VoiceOrTextAssistant';
import { SettingsModal } from './components/settings/SettingsModal';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(() => HealthStorageService.getProfile());
  const [history, setHistory] = useState<CheckInRecord[]>(() => HealthStorageService.getCheckIns());
  const [todayRecord, setTodayRecord] = useState<CheckInRecord | null>(() => HealthStorageService.getTodayCheckIn());
  const [activeTab, setActiveTab] = useState<AppTab>('conversational');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isReDoingCheckIn, setIsReDoingCheckIn] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Evaluate alerts based on history
  const [alerts, setAlerts] = useState<SmartAlert[]>(() => 
    HealthAnalyticsService.evaluateSmartAlerts(history, profile)
  );

  // Keep alerts in sync when history or profile changes
  useEffect(() => {
    const computedAlerts = HealthAnalyticsService.evaluateSmartAlerts(history, profile);
    setAlerts(computedAlerts);
  }, [history, profile]);

  // Keep SpeechService active voice and persona in sync with profile
  useEffect(() => {
    SpeechService.setActiveVoiceConfig({
      voicePersona: profile.voicePersona || 'samantha',
      voiceId: profile.voiceId,
      voicePitch: profile.voicePitch || 1.0,
    });
  }, [profile.voicePersona, profile.voiceId, profile.voicePitch]);

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
    setActiveTab('conversational');
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
    setActiveTab('conversational');
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

  // Dynamic Wellbeing Avatar State & Adaptive Theme
  const avatarState = HealthAnalyticsService.evaluateWellbeingAvatarState(history, profile);
  const activeTheme = avatarState.theme || ThemeService.getThemeForCategory(avatarState.category);

  return (
    <div className={`min-h-screen min-h-screen-dynamic bg-gradient-to-br ${activeTheme.bgGradient} text-slate-900 flex relative transition-colors duration-500 ${textScaleClasses}`}>
      {/* Adaptive Ambient Atmospheric Glow based on Current Wellbeing State */}
      <div className={`fixed top-0 right-1/4 w-96 h-96 ${activeTheme.ambientGlow} rounded-full blur-3xl pointer-events-none -z-0 transition-all duration-700`} />
      <div className={`fixed bottom-10 left-1/3 w-[32rem] h-[32rem] ${activeTheme.ambientGlow} rounded-full blur-3xl pointer-events-none -z-0 transition-all duration-700`} />

      {/* Sleek Collapsible Sidebar (Desktop + Tablet) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        alertCount={alerts.length}
        isTodayDone={!!todayRecord}
        avatarState={avatarState}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileDrawerOpen}
        setIsMobileOpen={setIsMobileDrawerOpen}
      />

      {/* Main Canvas Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64 lg:ml-72'
        } pb-28 md:pb-10`}
      >
        {/* Top App Header & Controls */}
        <TopBar
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          activeTab={activeTab}
          avatarState={avatarState}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          onSelectScenario={handleSelectScenario}
          alertCount={alerts.length}
        />

        {/* View Content Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 animate-fadeIn">
          {/* Primary Voice AI Check-In / Daily Summary */}
          {(activeTab === 'conversational' || activeTab === 'checkin') && (
            <div className="space-y-4">
              {!todayRecord || isReDoingCheckIn ? (
                <ConversationalCheckIn
                  profile={profile}
                  onComplete={handleCompleteCheckIn}
                  onCancel={() => {
                    if (todayRecord) {
                      setIsReDoingCheckIn(false);
                    }
                  }}
                  onUpdateVoiceSpeed={(speed) => handleUpdateProfile({ ...profile, voiceSpeed: speed })}
                  onUpdateVoicePersona={(personaId) => handleUpdateProfile({ ...profile, voicePersona: personaId, voiceId: undefined })}
                  onToggleSound={() => handleUpdateProfile({ ...profile, soundEnabled: !profile.soundEnabled })}
                />
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

          {/* Tab 3: Health (Medicine Tracker + BP & Pulse Register + Diagrams & Trends) */}
          {(activeTab === 'timeline' || activeTab === 'medicine') && (
            <HealthTimeline
              history={history}
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onHistoryUpdated={(newHistory) => setHistory(newHistory)}
              defaultSection="medicine"
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

          {/* Tab 11: Voice & Text Assistant with Linked Access to all AI & Health data */}
          {activeTab === 'assistant' && (
            <VoiceOrTextAssistant
              profile={profile}
              history={history}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alerts.length}
        isTodayDone={!!todayRecord}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

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
