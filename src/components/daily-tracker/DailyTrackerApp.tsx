'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrackerStore } from '@/hooks/useTrackerStore';
import BottomNav, { type TabType } from './BottomNav';
import HomeScreen, { WelcomeScreen } from './HomeScreen';
import WaterTracker from './WaterTracker';
import CalorieTracker from './CalorieTracker';
import HabitsTracker from './HabitsTracker';
import SleepTracker from './SleepTracker';
import AnalyticsScreen from './AnalyticsScreen';
import { ToastProvider, useToast } from './Toast';
import { ACHIEVEMENT_DEFS } from '@/hooks/useTrackerStore';

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

const pageVariants = {
  initial: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const TAB_ORDER: TabType[] = ['home', 'water', 'calories', 'habits', 'sleep', 'analytics'];

function computeBMI(profile: { weight: number; height: number } | null): number | null {
  if (!profile || !profile.weight || !profile.height) return null;
  const heightM = profile.height / 100;
  if (heightM <= 0) return null;
  return profile.weight / (heightM * heightM);
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [direction, setDirection] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>(() => getTimeOfDay());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const store = useTrackerStore();
  const { showToast } = useToast();

  // Prevent hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      if (!store.hasCompletedOnboarding) { setShowOnboarding(true); }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Track previous values for toast notifications
  const prevWaterRef = useState(store.data.waterCount);
  const prevHabitsDoneRef = useState(store.todayHabitsDone);

  useEffect(() => {
    if (store.data.waterCount > prevWaterRef[0] && prevWaterRef[0] < store.data.waterGoal && store.data.waterCount >= store.data.waterGoal) {
      showToast('🎉 Water goal reached! Great job!', 'success', 'water', store.undoWater);
    } else if (store.data.waterCount > prevWaterRef[0]) {
      showToast(`💧 +1 glass (${store.data.waterCount}/${store.data.waterGoal})`, 'info', 'water', store.undoWater);
    }
    prevWaterRef[1](store.data.waterCount);
  }, [store.data.waterCount, store.data.waterGoal, showToast, store.undoWater]);

  useEffect(() => {
    if (store.todayHabitsDone > prevHabitsDoneRef[0] && store.todayHabitsDone === store.todayHabitsTotal) {
      showToast('🏆 All habits completed!', 'success', 'habits');
    }
    prevHabitsDoneRef[1](store.todayHabitsDone);
  }, [store.todayHabitsDone, store.todayHabitsTotal, showToast]);

  // Watch for new achievements
  useEffect(() => {
    if (store.newAchievements.length > 0) {
      const ach = store.consumeNewAchievements();
      for (const achId of ach) {
        const def = ACHIEVEMENT_DEFS[achId];
        if (def) { showToast(`${def.emoji} Achievement: ${def.name}!`, 'success', 'achievement'); }
      }
    }
  }, [store.newAchievements, store.consumeNewAchievements, showToast]);

  const handleTabChange = (tab: TabType) => {
    const currentIdx = TAB_ORDER.indexOf(activeTab);
    const nextIdx = TAB_ORDER.indexOf(tab);
    setDirection(nextIdx > currentIdx ? 1 : -1);
    setActiveTab(tab);
  };

  const handleCompleteOnboarding = () => {
    store.completeOnboarding();
    setShowOnboarding(false);
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIdx = TAB_ORDER.indexOf(activeTab);
      if (e.key === 'ArrowRight' && currentIdx < TAB_ORDER.length - 1) { handleTabChange(TAB_ORDER[currentIdx + 1]); }
      else if (e.key === 'ArrowLeft' && currentIdx > 0) { handleTabChange(TAB_ORDER[currentIdx - 1]); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const bmi = computeBMI(store.profile);

  if (!mounted || !store.isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: '#00b4d8', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#0a0a0f' }}>
      <AnimatePresence>
        {showOnboarding && <WelcomeScreen onComplete={handleCompleteOnboarding} />}
      </AnimatePresence>

      <div className="max-w-md mx-auto relative">
        <main className="pb-28 pt-4 min-h-screen overflow-x-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={activeTab} custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="will-change-transform">
              {activeTab === 'home' && (
                <HomeScreen
                  waterCount={store.data.waterCount}
                  waterGoal={store.data.waterGoal}
                  todayCalories={store.todayCalories}
                  calorieGoal={store.data.calorieGoal}
                  todayHabitsDone={store.todayHabitsDone}
                  todayHabitsTotal={store.todayHabitsTotal}
                  sleepDuration={store.sleepDuration}
                  bestStreak={store.bestStreak}
                  waterStreakDays={store.waterStreakDays}
                  dailyScore={store.dailyScore}
                  weeklyScores={store.weeklyScores}
                  achievements={store.achievements}
                  timeOfDay={timeOfDay}
                  onResetToday={store.resetToday}
                  onResetAll={store.resetAll}
                  onExportData={store.exportData}
                  onImportData={store.importData}
                  onCompleteOnboarding={handleCompleteOnboarding}
                  todayNote={store.todayNote}
                  onSetDailyNote={store.setDailyNote}
                  weeklyChallenge={store.weeklyChallenge}
                  onGenerateChallenge={store.generateWeeklyChallenge}
                />
              )}
              {activeTab === 'water' && (
                <WaterTracker
                  waterCount={store.data.waterCount}
                  waterGoal={store.data.waterGoal}
                  waterHistory={store.data.waterHistory}
                  glassSize={store.glassSize}
                  onAdd={store.addWater}
                  onUndo={store.undoWater}
                  onSetGlassSize={store.setGlassSize}
                />
              )}
              {activeTab === 'calories' && (
                <CalorieTracker
                  calorieGoal={store.data.calorieGoal}
                  foodLog={store.data.foodLog}
                  todayCalories={store.todayCalories}
                  onAddFood={store.addFood}
                  onRemoveFood={store.removeFood}
                  onSetGoal={store.setCalorieGoal}
                  onUndoFood={store.undoFood}
                />
              )}
              {activeTab === 'habits' && (
                <HabitsTracker
                  habits={store.data.habits}
                  todayHabitsDone={store.todayHabitsDone}
                  todayHabitsTotal={store.todayHabitsTotal}
                  allHabitsDone={store.allHabitsDone}
                  getHabitCompletion={store.getHabitCompletion}
                  onToggleHabit={store.toggleHabit}
                  onAddHabit={store.addHabit}
                  onRemoveHabit={store.removeHabit}
                  todayMood={store.todayMood}
                  onSetMood={store.setMood}
                  habitHeatmapData={store.habitHeatmapData}
                  setHabitNote={store.setHabitNote}
                />
              )}
              {activeTab === 'sleep' && (
                <SleepTracker
                  bedtime={store.data.bedtime}
                  wakeTime={store.data.wakeTime}
                  sleepDuration={store.sleepDuration}
                  sleepHistory={store.data.sleepHistory}
                  todaySleepQuality={store.todaySleepQuality}
                  onSetBedtime={store.setBedtime}
                  onSetWakeTime={store.setWakeTime}
                  onLogSleep={store.logSleep}
                  onSetSleepQuality={store.setSleepQuality}
                />
              )}
              {activeTab === 'analytics' && (
                <AnalyticsScreen
                  waterGoal={store.data.waterGoal}
                  calorieGoal={store.data.calorieGoal}
                  waterHistory={store.data.waterHistory}
                  calorieHistory={store.data.calorieHistory}
                  habitCompletion={store.data.habitCompletion}
                  habits={store.data.habits}
                  sleepHistory={store.data.sleepHistory}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default function DailyTrackerApp() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
