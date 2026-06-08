'use client';

import { useState, useCallback, useEffect } from 'react';
import { format, subDays } from 'date-fns';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  serving: string;
  carbs?: number;
  protein?: number;
  fat?: number;
  loggedAt: string;
}

export interface Habit {
  id: string;
  title: string;
  category: 'morning' | 'bedtime';
  streak: number;
  note?: string;
}

export interface TrackerData {
  waterCount: number;
  waterGoal: number;
  waterHistory: Record<string, number>;

  calorieGoal: number;
  foodLog: FoodItem[];
  calorieHistory: Record<string, number>;

  habits: Habit[];
  habitCompletion: Record<string, Record<string, boolean>>;
  habitStreaks: Record<string, number>;

  bedtime: string;
  wakeTime: string;
  sleepHistory: Record<string, number>;
  sleepQualityHistory: Record<string, string>;

  lastActiveDate: string;

  // Extended fields
  achievements: string[];
  dailyScores: Record<string, number>;
  moodHistory: Record<string, string>;

  // Settings
  hasCompletedOnboarding: boolean;
  glassSize: number;

  // New features
  dailyNotes: Record<string, string>;
  profile: UserProfile | null;
  weeklyChallenge: WeeklyChallenge | null;
  waterRemindersEnabled: boolean;
}

export type MoodType = 'happy' | 'neutral' | 'sad';
export type SleepQualityType = 'great' | 'good' | 'average' | 'poor';

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  target: number; // days to complete
   completedDays: number;
  startDate: string; // yyyy-MM-dd
  isActive: boolean;
  isCompleted: boolean;
}

const STORAGE_KEY = 'daily-tracker-data';

const defaultHabits: Habit[] = [
  { id: 'h1', title: 'Morning Meditation', category: 'morning', streak: 12 },
  { id: 'h2', title: 'Morning Affirmations', category: 'morning', streak: 8 },
  { id: 'h3', title: 'Morning Exercise', category: 'morning', streak: 5 },
  { id: 'h4', title: 'Read 10 Pages', category: 'morning', streak: 15 },
  { id: 'h5', title: 'Bedtime Meditation', category: 'bedtime', streak: 10 },
  { id: 'h6', title: 'Gratitude Journal', category: 'bedtime', streak: 7 },
  { id: 'h7', title: 'Read Before Bed', category: 'bedtime', streak: 3 },
  { id: 'h8', title: 'Skincare Routine', category: 'bedtime', streak: 20 },
];

const ACHIEVEMENT_DEFS: Record<string, { id: string; name: string; emoji: string; desc: string }> = {
  first_glass: { id: 'first_glass', name: 'First Glass', emoji: '💧', desc: 'Log your first glass of water' },
  hydration_hero: { id: 'hydration_hero', name: 'Hydration Hero', emoji: '🌊', desc: 'Meet water goal 7 days' },
  early_bird: { id: 'early_bird', name: 'Early Bird', emoji: '🌅', desc: 'Complete all morning habits' },
  night_owl: { id: 'night_owl', name: 'Night Owl', emoji: '🦉', desc: 'Complete all bedtime habits' },
  perfect_day: { id: 'perfect_day', name: 'Perfect Day', emoji: '⭐', desc: 'All trackers at 100%' },
  seven_streak: { id: 'seven_streak', name: '7-Day Streak', emoji: '🔥', desc: 'Maintain a 7-day habit streak' },
  data_master: { id: 'data_master', name: 'Data Master', emoji: '📊', desc: 'Log data for 30 days' },
};

export { ACHIEVEMENT_DEFS };

const defaultData: TrackerData = {
  waterCount: 4,
  waterGoal: 8,
  waterHistory: {},

  calorieGoal: 2000,
  foodLog: [
    { id: 'f1', name: 'Oatmeal with Berries', calories: 350, serving: '1 bowl', carbs: 60, protein: 12, fat: 8, loggedAt: '08:30' },
    { id: 'f2', name: 'Grilled Chicken Salad', calories: 450, serving: '1 plate', carbs: 20, protein: 40, fat: 15, loggedAt: '12:15' },
    { id: 'f3', name: 'Protein Shake', calories: 200, serving: '1 glass', carbs: 15, protein: 30, fat: 5, loggedAt: '15:00' },
    { id: 'f4', name: 'Brown Rice & Vegetables', calories: 380, serving: '1 plate', carbs: 55, protein: 10, fat: 12, loggedAt: '19:00' },
  ],
  calorieHistory: {},

  habits: defaultHabits,
  habitCompletion: {},
  habitStreaks: {},

  bedtime: '22:30',
  wakeTime: '06:00',
  sleepHistory: {},
  sleepQualityHistory: {},

  lastActiveDate: getTodayKey(),

  achievements: [],
  dailyScores: {},
  moodHistory: {},

  hasCompletedOnboarding: false,
  glassSize: 250,

  dailyNotes: {},
  profile: null,
  weeklyChallenge: null,
  waterRemindersEnabled: true,
};

function getTodayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function loadFromStorage(): TrackerData {
  if (typeof window === 'undefined') return defaultData;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultData;
    const parsed = JSON.parse(stored) as TrackerData;
    return {
      ...defaultData,
      ...parsed,
      habits: parsed.habits || defaultData.habits,
      hasCompletedOnboarding: parsed.hasCompletedOnboarding ?? false,
      glassSize: parsed.glassSize ?? 250,
      sleepQualityHistory: parsed.sleepQualityHistory ?? {},
      dailyNotes: parsed.dailyNotes ?? {},
      profile: parsed.profile ?? null,
      weeklyChallenge: parsed.weeklyChallenge ?? null,
      waterRemindersEnabled: parsed.waterRemindersEnabled ?? true,
    };
  } catch {
    return defaultData;
  }
}

function saveToStorage(data: TrackerData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

function checkAndResetForNewDay(data: TrackerData): TrackerData {
  const today = getTodayKey();
  if (data.lastActiveDate === today) {
    return data;
  }

  // New day detected — reset daily data
  const updated = {
    ...data,
    waterCount: 0,
    foodLog: [] as FoodItem[],
    habitCompletion: {
      ...data.habitCompletion,
    },
    lastActiveDate: today,
  };
  // Remove today's key from habitCompletion if present
  const todayCompletion = updated.habitCompletion[today];
  if (todayCompletion) {
    const { [today]: _, ...rest } = updated.habitCompletion;
    updated.habitCompletion = rest;
  }
  return updated;
}

function computeDailyScore(data: TrackerData): number {
  const todayKey = getTodayKey();
  const waterProgress = Math.min(data.waterCount / data.waterGoal, 1);
  const totalCalories = data.foodLog.reduce((s, f) => s + f.calories, 0);
  const calorieProgress = Math.min(totalCalories / data.calorieGoal, 1);
  const habitsDone = data.habits.filter((h) => data.habitCompletion[todayKey]?.[h.id]).length;
  const habitProgress = data.habits.length > 0 ? habitsDone / data.habits.length : 0;
  const sleepHrs = data.sleepHistory[todayKey] ?? 7.5;
  const sleepProgress = Math.min(sleepHrs / 8, 1);
  return Math.round(
    (waterProgress * 0.25 + calorieProgress * 0.25 + habitProgress * 0.25 + sleepProgress * 0.25) * 100
  );
}

function checkAchievements(data: TrackerData, prevAchievements: string[]): string[] {
  const newOnes: string[] = [...prevAchievements];
  const has = (id: string) => newOnes.includes(id);
  const todayKey = getTodayKey();

  // First Glass: ever logged water
  if (!has('first_glass') && data.waterCount >= 1) {
    newOnes.push('first_glass');
  }

  // Hydration Hero: 7 days meeting water goal
  if (!has('hydration_hero')) {
    let daysMet = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = subDays(today, i);
      const key = format(d, 'yyyy-MM-dd');
      const val = data.waterHistory[key];
      if (val !== undefined && val >= data.waterGoal) daysMet++;
      else if (i > 0) break;
      if (daysMet >= 7) break;
    }
    if (daysMet >= 7) newOnes.push('hydration_hero');
  }

  // Early Bird: complete all morning habits today
  if (!has('early_bird')) {
    const morningHabits = data.habits.filter((h) => h.category === 'morning');
    const morningDone = morningHabits.filter((h) => data.habitCompletion[todayKey]?.[h.id]).length;
    if (morningHabits.length > 0 && morningDone === morningHabits.length) {
      newOnes.push('early_bird');
    }
  }

  // Night Owl: complete all bedtime habits today
  if (!has('night_owl')) {
    const bedtimeHabits = data.habits.filter((h) => h.category === 'bedtime');
    const bedtimeDone = bedtimeHabits.filter((h) => data.habitCompletion[todayKey]?.[h.id]).length;
    if (bedtimeHabits.length > 0 && bedtimeDone === bedtimeHabits.length) {
      newOnes.push('night_owl');
    }
  }

  // Perfect Day: all trackers at 100%
  if (!has('perfect_day')) {
    const score = computeDailyScore(data);
    if (score >= 100) newOnes.push('perfect_day');
  }

  // 7-Day Streak: any habit with streak >= 7
  if (!has('seven_streak')) {
    const hasLongStreak = data.habits.some((h) => h.streak >= 7);
    if (hasLongStreak) newOnes.push('seven_streak');
  }

  // Data Master: logged data for 30 days
  if (!has('data_master')) {
    const totalDays = new Set([
      ...Object.keys(data.waterHistory),
      ...Object.keys(data.calorieHistory),
      ...Object.keys(data.habitCompletion),
      ...Object.keys(data.sleepHistory),
    ]).size;
    if (totalDays >= 30) newOnes.push('data_master');
  }

  return newOnes;
}

let hasLoadedFromStorage = false;

export function useTrackerStore() {
  const [data, setData] = useState<TrackerData>(() => {
    if (typeof window === 'undefined') return defaultData;
    if (hasLoadedFromStorage) return loadFromStorage();
    hasLoadedFromStorage = true;
    const loaded = loadFromStorage();
    return checkAndResetForNewDay(loaded);
  });
  const [isLoaded] = useState(true);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  // Persist to localStorage when data changes
  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  const updateData = useCallback((updater: (prev: TrackerData) => TrackerData) => {
    setData((prev) => {
      const next = updater(prev);
      // Check for new achievements
      const updatedAchievements = checkAchievements(next, prev.achievements);
      if (updatedAchievements.length > prev.achievements.length) {
        const justUnlocked = updatedAchievements.filter((a) => !prev.achievements.includes(a));
        setTimeout(() => {
          setNewAchievements((prev) => [...prev, ...justUnlocked]);
        }, 0);
        return { ...next, achievements: updatedAchievements };
      }
      return next;
    });
  }, []);

  // Water actions
  const addWater = useCallback(() => {
    updateData((prev) => {
      const newCount = Math.min(prev.waterCount + 1, prev.waterGoal * 2);
      const todayKey = getTodayKey();
      return {
        ...prev,
        waterCount: newCount,
        waterHistory: { ...prev.waterHistory, [todayKey]: newCount },
      };
    });
  }, [updateData]);

  const undoWater = useCallback(() => {
    updateData((prev) => {
      const newCount = Math.max(prev.waterCount - 1, 0);
      const todayKey = getTodayKey();
      return {
        ...prev,
        waterCount: newCount,
        waterHistory: { ...prev.waterHistory, [todayKey]: newCount },
      };
    });
  }, [updateData]);

  const setWaterGoal = useCallback((goal: number) => {
    updateData((prev) => ({ ...prev, waterGoal: goal }));
  }, [updateData]);

  // Glass size
  const setGlassSize = useCallback((size: number) => {
    updateData((prev) => ({ ...prev, glassSize: size }));
  }, [updateData]);

  // Calorie actions
  const addFood = useCallback((food: Omit<FoodItem, 'id' | 'loggedAt'>) => {
    updateData((prev) => {
      const id = `f${Date.now()}`;
      const loggedAt = format(new Date(), 'HH:mm');
      const newFood: FoodItem = { ...food, id, loggedAt };
      const newLog = [...prev.foodLog, newFood];
      const totalCalories = newLog.reduce((sum, f) => sum + f.calories, 0);
      const todayKey = getTodayKey();
      return {
        ...prev,
        foodLog: newLog,
        calorieHistory: { ...prev.calorieHistory, [todayKey]: totalCalories },
      };
    });
  }, [updateData]);

  const undoFood = useCallback(() => {
    updateData((prev) => {
      if (prev.foodLog.length === 0) return prev;
      const newLog = prev.foodLog.slice(0, -1);
      const totalCalories = newLog.reduce((sum, f) => sum + f.calories, 0);
      const todayKey = getTodayKey();
      return {
        ...prev,
        foodLog: newLog,
        calorieHistory: { ...prev.calorieHistory, [todayKey]: totalCalories },
      };
    });
  }, [updateData]);

  const removeFood = useCallback((foodId: string) => {
    updateData((prev) => {
      const newLog = prev.foodLog.filter((f) => f.id !== foodId);
      const totalCalories = newLog.reduce((sum, f) => sum + f.calories, 0);
      const todayKey = getTodayKey();
      return {
        ...prev,
        foodLog: newLog,
        calorieHistory: { ...prev.calorieHistory, [todayKey]: totalCalories },
      };
    });
  }, [updateData]);

  const setCalorieGoal = useCallback((goal: number) => {
    updateData((prev) => ({ ...prev, calorieGoal: goal }));
  }, [updateData]);

  // Habit actions
  const toggleHabit = useCallback((habitId: string) => {
    updateData((prev) => {
      const todayKey = getTodayKey();
      const todayCompletion = prev.habitCompletion[todayKey] || {};
      const wasCompleted = todayCompletion[habitId] || false;
      const newCompletion = !wasCompleted;

      const habit = prev.habits.find((h) => h.id === habitId);
      const currentStreak = habit?.streak || 0;

      return {
        ...prev,
        habitCompletion: {
          ...prev.habitCompletion,
          [todayKey]: {
            ...todayCompletion,
            [habitId]: newCompletion,
          },
        },
        habits: prev.habits.map((h) =>
          h.id === habitId
            ? { ...h, streak: newCompletion ? currentStreak + 1 : Math.max(0, currentStreak - 1) }
            : h
        ),
      };
    });
  }, [updateData]);

  const getHabitCompletion = useCallback(
    (habitId: string): boolean => {
      const todayKey = getTodayKey();
      return data.habitCompletion[todayKey]?.[habitId] || false;
    },
    [data.habitCompletion]
  );

  // Add custom habit
  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'streak'>) => {
    updateData((prev) => {
      const id = `h_${Date.now()}`;
      const newHabit: Habit = { ...habit, id, streak: 0 };
      return { ...prev, habits: [...prev.habits, newHabit] };
    });
  }, [updateData]);

  // Remove habit
  const removeHabit = useCallback((habitId: string) => {
    updateData((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== habitId),
    }));
  }, [updateData]);

  // Mood
  const setMood = useCallback((mood: MoodType) => {
    updateData((prev) => {
      const todayKey = getTodayKey();
      return {
        ...prev,
        moodHistory: { ...prev.moodHistory, [todayKey]: mood },
      };
    });
  }, [updateData]);

  const todayMood: MoodType | null = data.moodHistory[getTodayKey()] || null;

  // Sleep actions
  const setBedtime = useCallback((time: string) => {
    updateData((prev) => ({ ...prev, bedtime: time }));
  }, [updateData]);

  const setWakeTime = useCallback((time: string) => {
    updateData((prev) => ({ ...prev, wakeTime: time }));
  }, [updateData]);

  const logSleep = useCallback(() => {
    updateData((prev) => {
      const bedtimeParts = prev.bedtime.split(':').map(Number);
      const wakeParts = prev.wakeTime.split(':').map(Number);
      let bedtimeHours = bedtimeParts[0] + bedtimeParts[1] / 60;
      let wakeHours = wakeParts[0] + wakeParts[1] / 60;

      if (wakeHours < bedtimeHours) {
        wakeHours += 24;
      }
      const sleepHours = parseFloat((wakeHours - bedtimeHours).toFixed(1));
      const todayKey = getTodayKey();
      return {
        ...prev,
        sleepHistory: { ...prev.sleepHistory, [todayKey]: sleepHours },
      };
    });
  }, [updateData]);

  // Sleep quality
  const setSleepQuality = useCallback((quality: SleepQualityType) => {
    updateData((prev) => {
      const todayKey = getTodayKey();
      return {
        ...prev,
        sleepQualityHistory: { ...prev.sleepQualityHistory, [todayKey]: quality },
      };
    });
  }, [updateData]);

  const todaySleepQuality: SleepQualityType | null = (data.sleepQualityHistory[getTodayKey()] as SleepQualityType) || null;

  // Onboarding
  const completeOnboarding = useCallback(() => {
    updateData((prev) => ({ ...prev, hasCompletedOnboarding: true }));
  }, [updateData]);

  // Reset actions
  const resetToday = useCallback(() => {
    updateData((prev) => {
      const todayKey = getTodayKey();
      return {
        ...prev,
        waterCount: 0,
        foodLog: [] as FoodItem[],
        habitCompletion: {
          ...prev.habitCompletion,
          [todayKey]: {},
        },
      };
    });
  }, [updateData]);

  const resetAll = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    hasLoadedFromStorage = false;
    setData({ ...defaultData, lastActiveDate: getTodayKey() });
  }, []);

  // Export data
  const exportData = useCallback((): string => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  // Import data
  const importData = useCallback((jsonStr: string) => {
    try {
      const imported = JSON.parse(jsonStr) as TrackerData;
      updateData(() => ({
        ...defaultData,
        ...imported,
        habits: imported.habits || defaultData.habits,
        hasCompletedOnboarding: true,
        glassSize: imported.glassSize ?? 250,
        sleepQualityHistory: imported.sleepQualityHistory ?? {},
      }));
      return true;
    } catch {
      return false;
    }
  }, [updateData]);

  // Computed values
  const todayKey = getTodayKey();
  const todayCalories = data.foodLog.reduce((sum, f) => sum + f.calories, 0);
  const todayHabitsDone = data.habits.filter((h) => data.habitCompletion[todayKey]?.[h.id]).length;
  const todayHabitsTotal = data.habits.length;
  const allHabitsDone = todayHabitsTotal > 0 && todayHabitsDone === todayHabitsTotal;
  const waterGoalReached = data.waterCount >= data.waterGoal;
  const sleepDuration = data.sleepHistory[todayKey] ?? 7.5;

  // Daily score
  const dailyScore = computeDailyScore(data);

  // Streak calculations
  const bestStreak = data.habits.length > 0 ? Math.max(...data.habits.map((h) => h.streak)) : 0;

  // Water streak: count consecutive days ending at yesterday where water >= waterGoal
  const waterStreakDays = (() => {
    let streak = 0;
    const today = new Date();
    for (let i = 1; i <= 365; i++) {
      const date = subDays(today, i);
      const key = format(date, 'yyyy-MM-dd');
      const val = data.waterHistory[key];
      if (val !== undefined && val >= data.waterGoal) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  })();

  // Get weekly score history for sparkline
  const weeklyScores = (() => {
    const scores: number[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const key = format(date, 'yyyy-MM-dd');
      scores.push(data.dailyScores[key] ?? Math.round(Math.random() * 40 + 40));
    }
    return scores;
  })();

  // Get habit heatmap data for last 35 days (5 weeks × 7 days)
  const habitHeatmapData = (() => {
    const heatmap: { key: string; date: string; completionRate: number }[] = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const date = subDays(today, i);
      const key = format(date, 'yyyy-MM-dd');
      const completion = data.habitCompletion[key] || {};
      const total = data.habits.length;
      const done = Object.values(completion).filter(Boolean).length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      heatmap.push({ key, date: format(date, 'MMM d'), completionRate: rate });
    }
    return heatmap;
  })();

  // Save daily score periodically
  useEffect(() => {
    const todayKey = getTodayKey();
    if (dailyScore > 0) {
      setData((prev) => ({
        ...prev,
        dailyScores: { ...prev.dailyScores, [todayKey]: dailyScore },
      }));
    }
  }, [data.waterCount, todayCalories, todayHabitsDone, sleepDuration]);

  // Consume new achievements so they can trigger toasts
  const consumeNewAchievements = useCallback(() => {
    const copy = [...newAchievements];
    setNewAchievements([]);
    return copy;
  }, [newAchievements]);

  // Daily Notes
  const setDailyNote = useCallback((note: string) => {
    updateData((prev) => {
      const todayKey = getTodayKey();
      return { ...prev, dailyNotes: { ...prev.dailyNotes, [todayKey]: note } };
    });
  }, [updateData]);

  const todayNote: string = data.dailyNotes[getTodayKey()] || '';

  // Profile
  const setProfile = useCallback((profile: UserProfile | null) => {
    updateData((prev) => ({ ...prev, profile }));
  }, [updateData]);

  // Weekly Challenge
  const generateWeeklyChallenge = useCallback(() => {
    const challenges = [
      { title: 'Drink 10 glasses every day', description: 'Stay super hydrated this week!', emoji: '💧', target: 7 },
      { title: 'Complete all habits for 5 days', description: 'Build strong routines this week!', emoji: '✅', target: 5 },
      { title: 'Log all meals for 7 days', description: 'Track every calorie this week!', emoji: '🍎', target: 7 },
      { title: 'Sleep 8+ hours for 5 nights', description: 'Prioritize rest this week!', emoji: '😴', target: 5 },
      { title: 'Score 80+ daily for 5 days', description: 'Aim for excellence this week!', emoji: '⭐', target: 5 },
    ];
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    const id = `wc_${Date.now()}`;
    const todayKey = getTodayKey();
    const newChallenge: WeeklyChallenge = {
      id,
      title: challenge.title,
      description: challenge.description,
      emoji: challenge.emoji,
      target: challenge.target,
      completedDays: 0,
      startDate: todayKey,
      isActive: true,
      isCompleted: false,
    };
    updateData((prev) => ({ ...prev, weeklyChallenge: newChallenge }));
  }, [updateData]);

  const incrementChallengeDays = useCallback(() => {
    updateData((prev) => {
      if (!prev.weeklyChallenge || !prev.weeklyChallenge.isActive) return prev;
      const newCompleted = prev.weeklyChallenge.completedDays + 1;
      const isCompleted = newCompleted >= prev.weeklyChallenge.target;
      return {
        ...prev,
        weeklyChallenge: {
          ...prev.weeklyChallenge,
          completedDays: newCompleted,
          isCompleted,
          isActive: !isCompleted,
        },
      };
    });
  }, [updateData]);

  // Habit notes
  const setHabitNote = useCallback((habitId: string, note: string) => {
    updateData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => h.id === habitId ? { ...h, note } : h),
    }));
  }, [updateData]);

  // Water reminders toggle
  const setWaterRemindersEnabled = useCallback((enabled: boolean) => {
    updateData((prev) => ({ ...prev, waterRemindersEnabled: enabled }));
  }, [updateData]);

  return {
    data,
    isLoaded,
    // Water
    addWater,
    undoWater,
    setWaterGoal,
    setGlassSize,
    // Calories
    addFood,
    undoFood,
    removeFood,
    setCalorieGoal,
    todayCalories,
    // Habits
    toggleHabit,
    getHabitCompletion,
    addHabit,
    removeHabit,
    todayHabitsDone,
    todayHabitsTotal,
    allHabitsDone,
    habitHeatmapData,
    // Mood
    setMood,
    todayMood,
    // Sleep
    setBedtime,
    setWakeTime,
    logSleep,
    sleepDuration,
    setSleepQuality,
    todaySleepQuality,
    // Meta
    waterGoalReached,
    todayKey,
    // Score
    dailyScore,
    weeklyScores,
    // Streaks
    bestStreak,
    waterStreakDays,
    // Achievements
    achievements: data.achievements,
    newAchievements,
    consumeNewAchievements,
    // Onboarding
    hasCompletedOnboarding: data.hasCompletedOnboarding,
    completeOnboarding,
    // Settings
    glassSize: data.glassSize,
    // Reset
    resetToday,
    resetAll,
    // Import/Export
    exportData,
    importData,
    // Daily Notes
    setDailyNote,
    todayNote,
    // Profile
    setProfile,
    profile: data.profile,
    // Weekly Challenge
    weeklyChallenge: data.weeklyChallenge,
    generateWeeklyChallenge,
    incrementChallengeDays,
    // Habit Notes
    setHabitNote,
    // Water Reminders
    waterRemindersEnabled: data.waterRemindersEnabled,
    setWaterRemindersEnabled,
  };
}
