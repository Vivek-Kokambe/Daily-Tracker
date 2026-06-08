'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Flame, CheckCircle2, Moon, Bell, TrendingUp, Sun, CloudMoon, BookOpen, Trophy, Sparkles, RotateCcw } from 'lucide-react';
import { format, subDays } from 'date-fns';
import SettingsDialog from './SettingsDialog';
import { ACHIEVEMENT_DEFS, type WeeklyChallenge, type UserProfile } from '@/hooks/useTrackerStore';

interface HomeScreenProps {
  waterCount: number;
  waterGoal: number;
  todayCalories: number;
  calorieGoal: number;
  todayHabitsDone: number;
  todayHabitsTotal: number;
  sleepDuration: number;
  bestStreak: number;
  waterStreakDays: number;
  dailyScore: number;
  weeklyScores: number[];
  achievements: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  onResetToday: () => void;
  onResetAll: () => void;
  onExportData: () => string;
  onImportData: (json: string) => boolean;
  onCompleteOnboarding: () => void;
  // New props
  todayNote: string;
  onSetDailyNote: (note: string) => void;
  weeklyChallenge: WeeklyChallenge | null;
  onGenerateChallenge: () => void;
  // Profile / BMI (needed by SettingsDialog)
  profile: UserProfile | null;
  onSetProfile: (profile: UserProfile | null) => void;
  bmi: number | null;
}

const CARD_STYLE = {
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
};

const SECTION_HEADER_STYLE = {
  letterSpacing: '0.06em' as const,
};

function ProgressRing({ progress, size, strokeWidth, color, children }: { progress: number; size: number; strokeWidth: number; color: string; children: React.ReactNode }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 1) * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <defs>
          <linearGradient id={`ring-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}aa`} />
          </linearGradient>
        </defs>
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`url(#ring-${color.replace('#', '')})`} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: 'easeOut' }} style={{ filter: `drop-shadow(0 0 4px ${color}30)` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span key={value} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
      {value}
    </motion.span>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const width = 100;
  const height = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <motion.circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="3" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} />
    </svg>
  );
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function getTimeConfig(timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night') {
  switch (timeOfDay) {
    case 'morning':
      return { gradient: 'radial-gradient(ellipse at top, rgba(255,183,77,0.1) 0%, rgba(255,140,0,0.04) 40%, transparent 70%)', tipGradient: 'linear-gradient(135deg, #ff9800, #f57c00)', tipIcon: '☀️', tips: ['Start your day with a full glass of water', 'Morning sunlight boosts your energy', 'Plan your meals for better nutrition'], greeting: { text: 'Good Morning', emoji: '☀️', icon: Sun } };
    case 'afternoon':
      return { gradient: 'radial-gradient(ellipse at top, rgba(156,120,80,0.06) 0%, transparent 70%)', tipGradient: 'linear-gradient(135deg, #8d6e63, #795548)', tipIcon: '🌿', tips: ['Take a 5-minute stretch break every hour', 'Stay hydrated — dehydration causes fatigue', 'A balanced lunch keeps afternoon slumps away'], greeting: { text: 'Good Afternoon', emoji: '🌤️', icon: Sun } };
    case 'evening':
      return { gradient: 'radial-gradient(ellipse at top, rgba(156,39,176,0.08) 0%, rgba(233,30,99,0.04) 40%, transparent 70%)', tipGradient: 'linear-gradient(135deg, #e91e63, #9c27b0)', tipIcon: '🌅', tips: ['Wind down screen time before bed', 'Light stretching improves evening relaxation', 'Review your day and celebrate small wins'], greeting: { text: 'Good Evening', emoji: '🌙', icon: CloudMoon } };
    case 'night':
      return { gradient: 'radial-gradient(ellipse at top, rgba(25,25,112,0.1) 0%, rgba(63,63,191,0.05) 40%, transparent 70%)', tipGradient: 'linear-gradient(135deg, #3f51b5, #283593)', tipIcon: '🌌', tips: ['Aim to be in bed by your target time', 'Dark environments promote melatonin production', 'Avoid caffeine at least 6 hours before sleep'], greeting: { text: 'Good Night', emoji: '🌟', icon: Moon } };
  }
}

const MOTIVATIONAL_QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Take care of your body. It\'s the only place you have to live.', author: 'Jim Rohn' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Unknown' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Your body hears everything your mind says.', author: 'Naomi Judd' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'An ounce of prevention is worth a pound of cure.', author: 'Benjamin Franklin' },
  { text: 'The greatest wealth is health.', author: 'Virgil' },
  { text: 'Motivation is what gets you started. Habit is what keeps you going.', author: 'Jim Ryun' },
  { text: 'A healthy outside starts from the inside.', author: 'Robert Urich' },
  { text: 'It is health that is real wealth and not pieces of gold and silver.', author: 'Mahatma Gandhi' },
  { text: 'Wellness is the complete integration of body, mind, and spirit.', author: 'Greg Anderson' },
  { text: 'Every day is a new opportunity to grow and get closer to your goals.', author: 'Unknown' },
];

function getDailyQuote() {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// Onboarding welcome screen component
function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const features = [
    { emoji: '💧', title: 'Water Tracking', desc: 'Stay hydrated with smart reminders' },
    { emoji: '🍎', title: 'Nutrition Log', desc: 'Track calories and macros' },
    { emoji: '✅', title: 'Habit Builder', desc: 'Build lasting daily routines' },
  ];

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ backgroundColor: '#0a0a0f' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.5 }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,180,216,0.08) 0%, transparent 70%)' }} />
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }} className="text-6xl mb-4">💪</motion.div>
      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-2xl font-black text-white text-center mb-1" style={{ letterSpacing: '0.02em' }}>Welcome to Daily Tracker</motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 }} className="text-sm font-normal text-center mb-10" style={{ color: '#8a8a9f' }}>Your all-in-one health & habit companion</motion.p>
      <div className="w-full max-w-xs flex flex-col gap-3 mb-10">
        {features.map((feat, idx) => (
          <motion.div key={feat.title} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 + idx * 0.15, type: 'spring', stiffness: 200 }} className="flex items-center gap-4 p-4 rounded-2xl" style={{ ...CARD_STYLE, backgroundColor: '#1a1a2e' }}>
            <span className="text-2xl">{feat.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-white" style={{ letterSpacing: '0.01em' }}>{feat.title}</p>
              <p className="text-xs font-normal" style={{ color: '#8a8a9f' }}>{feat.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.button whileTap={{ scale: 0.96 }} onClick={onComplete} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.1, type: 'spring', stiffness: 200 }} className="w-full max-w-xs py-4 rounded-2xl font-bold text-white text-base cursor-pointer" style={{ background: 'linear-gradient(135deg, #00b4d8, #0096c7)', boxShadow: '0 8px 30px rgba(0,180,216,0.3)', letterSpacing: '0.02em' }}>Get Started</motion.button>
    </motion.div>
  );
}

export default function HomeScreen({
  waterCount, waterGoal, todayCalories, calorieGoal, todayHabitsDone, todayHabitsTotal,
  sleepDuration, bestStreak, waterStreakDays, dailyScore, weeklyScores, achievements,
  timeOfDay, onResetToday, onResetAll, onExportData, onImportData, onCompleteOnboarding,
  todayNote, onSetDailyNote, weeklyChallenge, onGenerateChallenge,
  profile, onSetProfile, bmi,
  }: HomeScreenProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  const waterProgress = waterCount / waterGoal;
  const calorieProgress = Math.min(todayCalories / calorieGoal, 1);
  const habitProgress = todayHabitsTotal > 0 ? todayHabitsDone / todayHabitsTotal : 0;
  const sleepProgress = Math.min(sleepDuration / 8, 1);
  const timeConfig = getTimeConfig(timeOfDay);
  const todayDate = format(new Date(), 'EEEE, MMM d');

  const unlockedAchievements = useMemo(() => {
    return achievements.map((id) => ACHIEVEMENT_DEFS[id]).filter(Boolean);
  }, [achievements]);

  const scoreColor = dailyScore >= 75 ? '#4caf50' : dailyScore >= 50 ? '#ffc107' : dailyScore >= 25 ? '#ff9800' : '#f44336';
  const dailyQuote = useMemo(() => getDailyQuote(), []);

  const summaryCards = [
    { icon: Droplets, label: 'Water', color: '#00b4d8', progress: waterProgress, value: `${waterCount}/${waterGoal}`, pct: `${Math.round(waterProgress * 100)}%` },
    { icon: Flame, label: 'Calories', color: '#ff6b35', progress: calorieProgress, value: formatNumber(todayCalories), pct: `${Math.round(calorieProgress * 100)}% of goal` },
    { icon: CheckCircle2, label: 'Habits', color: '#4caf50', progress: habitProgress, value: `${todayHabitsDone}/${todayHabitsTotal}`, pct: `${Math.round(habitProgress * 100)}% done` },
    { icon: Moon, label: 'Sleep', color: '#9c27b0', progress: sleepProgress, value: `${sleepDuration} hrs`, pct: sleepDuration >= 7 ? 'Good' : sleepDuration >= 5 ? 'Fair' : 'Poor' },
  ];

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="px-5 pt-2 pb-4 antialiased">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-60 pointer-events-none" style={{ background: timeConfig.gradient }} />

        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00b4d8, #0096c7)', boxShadow: '0 4px 15px rgba(0,180,216,0.3)' }}>
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white" style={{ letterSpacing: '0.02em' }}>Daily Tracker</h1>
              <p className="text-[10px] font-normal" style={{ color: '#8a8a9f' }}>{todayDate}</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowSettings(true)} className="relative p-2.5 rounded-xl transition-colors cursor-pointer" style={{ ...CARD_STYLE, backgroundColor: '#1a1a2e' }}>
            <Bell size={18} className="text-white/60" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: '#ff6b35', boxShadow: '0 0 6px rgba(255,107,53,0.5)' }} />
          </motion.button>
        </motion.div>

        {/* Greeting + Daily Score Card with animated gradient border */}
        <motion.div variants={item} className="rounded-2xl mb-4 relative overflow-hidden p-[1px]" style={{ borderRadius: 16 }}>
          {/* Animated rotating gradient border */}
          <div className="absolute inset-0 animate-rotating-gradient rounded-2xl" style={{ background: `conic-gradient(from 0deg, ${scoreColor}40, transparent 30%, ${scoreColor}20 50%, transparent 70%, ${scoreColor}40)` }} />
          <div className="relative rounded-2xl p-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,180,216,0.06) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full" style={{ background: `radial-gradient(circle, ${scoreColor}10 0%, transparent 70%)` }} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white" style={{ letterSpacing: '0.02em' }}>{timeConfig.greeting.text} {timeConfig.greeting.emoji}</h2>
                  <p className="text-xs font-normal mt-1" style={{ color: '#c8c8d8' }}>Let&apos;s make today count. Here&apos;s your overview.</p>
                </div>
                <div className="text-center">
                  <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${scoreColor}30, ${scoreColor}10)`, border: `1.5px solid ${scoreColor}30`, boxShadow: `0 0 24px ${scoreColor}20, inset 0 0 20px ${scoreColor}08` }} animate={dailyScore >= 75 ? { boxShadow: [`0 0 24px ${scoreColor}20`, `0 0 32px ${scoreColor}35`, `0 0 24px ${scoreColor}20`] } : {}} transition={dailyScore >= 75 ? { duration: 2, repeat: Infinity } : {}}>
                    <span className="text-3xl font-black text-white" style={{ letterSpacing: '0.01em' }}><AnimatedNumber value={dailyScore} /></span>
                  </motion.div>
                  <p className="text-[9px] mt-1.5 font-bold" style={{ color: scoreColor, ...SECTION_HEADER_STYLE }}>DAILY SCORE</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards Grid with gradient overlay + micro-interaction */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          {summaryCards.map((card, idx) => (
            <motion.div key={card.label} whileTap={{ scale: 0.95 }} className="rounded-2xl p-4 relative overflow-hidden cursor-pointer" style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #151525 100%)', ...CARD_STYLE }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.08 }}>
              <div className="absolute inset-0 opacity-[0.07]" style={{ background: `radial-gradient(circle at top right, ${card.color}, transparent 70%)` }} />
              {/* Gradient overlay top-left to bottom-right */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ background: `linear-gradient(135deg, ${card.color}, transparent)` }} />
              <div className="relative flex flex-col items-center">
                <ProgressRing progress={card.progress} size={52} strokeWidth={5} color={card.color}>
                  <card.icon size={16} style={{ color: card.color }} />
                </ProgressRing>
                <p className="text-[11px] font-bold mt-2" style={{ color: card.color }}>{card.label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{card.value}</p>
                <p className="text-[12px] font-normal mt-0.5" style={{ color: '#8a8a9f' }}>{card.pct}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Achievements Section with shimmer */}
        {unlockedAchievements.length > 0 && (
          <motion.div variants={item} className="mt-4">
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
              <p className="text-xs font-bold uppercase mb-3" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>🏆 Achievements</p>
              <div className="flex flex-wrap gap-2">
                {unlockedAchievements.map((ach) => (
                  <motion.div key={ach.id} whileHover={{ scale: 1.05 }} className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl cursor-pointer animate-shimmer-badge" style={{ background: 'linear-gradient(135deg, rgba(255,213,79,0.1), rgba(255,183,77,0.05))', border: '1px solid rgba(255,213,79,0.2)' }} title={ach.desc}>
                    <span className="text-base">{ach.emoji}</span>
                    <span className="text-[10px] font-bold" style={{ color: '#ffd54f' }}>{ach.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Weekly Report Card */}
        <motion.div variants={item} className="mt-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>📈 This Week</p>
              <span className="text-[11px] font-bold" style={{ color: '#00b4d8' }}>Avg: {Math.round(weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length)}</span>
            </div>
            <div className="flex items-center justify-center py-1">
              <MiniSparkline data={weeklyScores} color="#00b4d8" />
            </div>
            <div className="flex justify-between mt-1 px-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <span key={i} className="text-[9px] font-normal" style={{ color: i === weeklyScores.length - 1 ? '#00b4d8' : '#5a5a6e' }}>{day}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Weekly Challenge */}
        <motion.div variants={item} className="mt-4">
          {weeklyChallenge && !weeklyChallenge.isCompleted ? (
            <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,180,216,0.1), rgba(76,175,80,0.06))', border: '1px solid rgba(0,180,216,0.2)' }}>
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/[0.04]" />
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">{weeklyChallenge.emoji}</span>
                <p className="text-xs font-bold uppercase" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>Weekly Challenge</p>
              </div>
              <p className="text-sm font-bold text-white">{weeklyChallenge.title}</p>
              <p className="text-[11px] font-normal mt-0.5 mb-3" style={{ color: '#8a8a9f' }}>{weeklyChallenge.description}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <motion.div className="h-full rounded-full animate-gradient-stripes" style={{ background: 'linear-gradient(90deg, #00b4d8, #4caf50)', width: `${Math.min((weeklyChallenge.completedDays / weeklyChallenge.target) * 100, 100)}%` }} initial={{ width: 0 }} animate={{ width: `${Math.min((weeklyChallenge.completedDays / weeklyChallenge.target) * 100, 100)}%` }} transition={{ duration: 0.8 }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: '#00b4d8' }}>{weeklyChallenge.completedDays}/{weeklyChallenge.target}</span>
              </div>
            </div>
          ) : weeklyChallenge?.isCompleted ? (
            <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(76,175,80,0.15), rgba(76,175,80,0.05))', border: '1px solid rgba(76,175,80,0.3)' }}>
              <div className="flex items-center gap-3">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.6, delay: 0.2 }}><span className="text-3xl">🎉</span></motion.div>
                <div>
                  <p className="text-sm font-bold text-white">Challenge Complete!</p>
                  <p className="text-[11px] font-normal" style={{ color: '#8a8a9f' }}>{weeklyChallenge.title}</p>
                </div>
              </div>
            </div>
          ) : (
            <motion.button whileTap={{ scale: 0.97 }} onClick={onGenerateChallenge} className="w-full rounded-2xl p-4 relative overflow-hidden cursor-pointer" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.06)', ...CARD_STYLE }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00b4d8, #4caf50)' }}>
                  <Trophy size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Start a Weekly Challenge</p>
                  <p className="text-[11px] font-normal" style={{ color: '#8a8a9f' }}>Get a random challenge to push yourself</p>
                </div>
              </div>
            </motion.button>
          )}
        </motion.div>

        {/* Daily Journal Card */}
        <motion.div variants={item} className="mt-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={12} style={{ color: '#00b4d8' }} />
              <p className="text-xs font-bold uppercase" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>📝 Daily Journal</p>
            </div>
            <AnimatePresence mode="wait">
              {showJournal ? (
                <motion.div key="journal-open" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <textarea
                    value={todayNote}
                    onChange={(e) => onSetDailyNote(e.target.value)}
                    placeholder="How are you feeling today? What are you grateful for?..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none"
                    style={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.06)', minHeight: 80 }}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-normal" style={{ color: '#5a5a6e' }}>{todayNote.length}/500</span>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowJournal(false)} className="px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer" style={{ backgroundColor: 'rgba(0,180,216,0.12)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.2)' }}>Done</motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="journal-closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {todayNote ? (
                    <p className="text-xs font-normal leading-relaxed" style={{ color: '#c8c8d8' }}>{todayNote.length > 120 ? todayNote.slice(0, 120) + '...' : todayNote}</p>
                  ) : (
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowJournal(true)} className="w-full text-left p-3 rounded-xl cursor-pointer transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <p className="text-xs font-normal" style={{ color: '#5a5a6e' }}>Tap to write your daily thoughts...</p>
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Motivational Card with animated gradient text */}
        <motion.div variants={item} className="mt-4 rounded-2xl p-4 relative overflow-hidden" style={{ background: timeConfig.tipGradient, boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/[0.08]" />
            <div className="absolute -right-2 -bottom-4 w-20 h-20 rounded-full bg-white/[0.05]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-white/[0.03]" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">{timeConfig.tipIcon}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white animate-gradient-text" style={{ backgroundImage: 'linear-gradient(90deg, #ffffff, #ffffffcc, #ffffff)', letterSpacing: '0.01em' }}>{dailyQuote.text}</p>
              <p className="text-xs font-normal text-white/50 mt-0.5">— {dailyQuote.author}</p>
            </div>
          </div>
        </motion.div>

        {/* Today's Streaks */}
        <motion.div variants={item} className="mt-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
            <p className="text-xs font-bold uppercase mb-3" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>🔥 Today&apos;s Streaks</p>
            <div className="grid grid-cols-2 gap-3">
              <motion.div whileTap={{ scale: 0.97 }} className="rounded-xl p-3 text-center cursor-pointer" style={{ backgroundColor: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.15)' }}>
                <motion.div animate={bestStreak > 0 ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}>
                  <p className="text-2xl mb-0.5">🏆</p>
                </motion.div>
                <p className="text-lg font-bold text-white"><AnimatedNumber value={bestStreak} /></p>
                <p className="text-[11px] font-normal" style={{ color: '#8a8a9f' }}>Best habit streak (days)</p>
              </motion.div>
              <motion.div whileTap={{ scale: 0.97 }} className="rounded-xl p-3 text-center cursor-pointer" style={{ backgroundColor: 'rgba(0,180,216,0.08)', border: '1px solid rgba(0,180,216,0.15)' }}>
                <motion.div animate={waterStreakDays > 0 ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}>
                  <p className="text-2xl mb-0.5">💧</p>
                </motion.div>
                <p className="text-lg font-bold text-white"><AnimatedNumber value={waterStreakDays} /></p>
                <p className="text-[11px] font-normal" style={{ color: '#8a8a9f' }}>Water goal streak (days)</p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Quick Tips */}
        <motion.div variants={item} className="mt-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>
              💡 {timeOfDay === 'night' ? 'Sleep Tips' : timeOfDay === 'evening' ? 'Wind-Down Tips' : timeOfDay === 'afternoon' ? 'Productivity Tips' : 'Morning Tips'}
            </p>
            <div className="flex flex-col gap-2">
              {timeConfig.tips.map((tip, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.15 }} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: scoreColor }} />
                  <p className="text-[11px] font-normal" style={{ color: '#8a8a9f' }}>{tip}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} onResetToday={onResetToday} onResetAll={onResetAll} onExportData={onExportData} onImportData={onImportData} profile={profile} onSetProfile={onSetProfile} bmi={bmi} />
      </motion.div>
    </>
  );
}

export { WelcomeScreen };
