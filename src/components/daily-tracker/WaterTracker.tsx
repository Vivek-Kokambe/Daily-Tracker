'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Undo2, PartyPopper, Target, Sparkles, Clock, Bell } from 'lucide-react';
import { format, subDays } from 'date-fns';
import ConfettiEffect from './ConfettiEffect';

interface WaterTrackerProps {
  waterCount: number;
  waterGoal: number;
  waterHistory: Record<string, number>;
  glassSize: number;
  onAdd: () => void;
  onUndo: () => void;
  onSetGlassSize: (size: number) => void;
}

const GLASS_SIZES = [
  { ml: 150, label: '150ml' },
  { ml: 200, label: '200ml' },
  { ml: 250, label: '250ml' },
  { ml: 300, label: '300ml' },
  { ml: 350, label: '350ml' },
];

const CARD_STYLE = {
  border: '1px solid rgba(255,255,255,0.06)' as const,
  boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)' as const,
};

const SECTION_HEADER_STYLE = {
  letterSpacing: '0.06em' as const,
};

function formatNumber(num: number): string {
  return num.toLocaleString();
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function WaterTracker({ waterCount, waterGoal, waterHistory, glassSize, onAdd, onUndo, onSetGlassSize }: WaterTrackerProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rippleActive, setRippleActive] = useState(false);

  const progress = Math.min(waterCount / waterGoal, 1);
  const ringSize = 190;
  const strokeWidth = 14;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;
  const currentMl = waterCount * glassSize;
  const goalMl = waterGoal * glassSize;
  const isNearGoal = progress >= 0.75 && progress < 1;

  // Water history for last 3 days
  const recentHistory = (() => {
    const history: { key: string; label: string; count: number; goal: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      const date = subDays(new Date(), i);
      const key = format(date, 'yyyy-MM-dd');
      const label = format(date, 'EEE');
      const count = waterHistory[key] ?? 0;
      history.push({ key, label, count, goal: waterGoal });
    }
    return history.reverse();
  })();

  // Next reminder time calculation
  const nextReminder = (() => {
    if (waterCount >= waterGoal) return null;
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 0, 0);
    const remainingMs = endOfDay.getTime() - now.getTime();
    const remainingHrs = remainingMs / (1000 * 60 * 60);
    const remainingGlasses = waterGoal - waterCount;
    if (remainingGlasses <= 0 || remainingHrs <= 0) return null;
    const intervalHrs = remainingHrs / remainingGlasses;
    const nextTime = new Date(now.getTime() + intervalHrs * 60 * 60 * 1000);
    const minsLeft = Math.round((nextTime.getTime() - now.getTime()) / (1000 * 60));
    return minsLeft;
  })();

  const handleAdd = useCallback(() => {
    onAdd();
    setRippleActive(true);
    setTimeout(() => setRippleActive(false), 600);
    if (waterCount + 1 >= waterGoal && waterCount < waterGoal) {
      setShowConfetti(true);
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
      confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [onAdd, waterCount, waterGoal]);

  const handleUndo = useCallback(() => {
    onUndo();
  }, [onUndo]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="px-5 pt-2 pb-4 antialiased">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-60 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(0,180,216,0.06) 0%, transparent 70%)' }} />
      <ConfettiEffect active={showConfetti} />

      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00b4d8, #0096c7)', boxShadow: '0 4px 15px rgba(0,180,216,0.3)' }}>
          <Droplets size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white" style={{ letterSpacing: '0.02em' }}>Water Tracker</h2>
          <p className="text-xs font-normal" style={{ color: '#8a8a9f' }}>Stay hydrated throughout the day</p>
        </div>
        <div className="px-2.5 py-1 rounded-lg text-xs font-bold cursor-default" style={{ backgroundColor: 'rgba(0,180,216,0.12)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.2)' }}>
          Goal: {waterGoal}
        </div>
      </motion.div>

      {/* Glass Size Selector */}
      <motion.div variants={item} className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={12} className="text-[#00b4d8]" />
          <p className="text-[11px] font-bold uppercase" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>Glass Size</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {GLASS_SIZES.map((size) => (
            <motion.button key={size.ml} whileTap={{ scale: 0.92 }} onClick={() => onSetGlassSize(size.ml)} className="flex-shrink-0 px-3 py-2 rounded-xl transition-all cursor-pointer" style={{ backgroundColor: glassSize === size.ml ? 'rgba(0,180,216,0.12)' : 'rgba(255,255,255,0.03)', border: glassSize === size.ml ? '1.5px solid rgba(0,180,216,0.3)' : '1px solid rgba(255,255,255,0.06)', boxShadow: glassSize === size.ml ? '0 0 12px rgba(0,180,216,0.1)' : 'none' }}>
              <span className="text-[11px] font-bold" style={{ color: glassSize === size.ml ? '#00b4d8' : '#8a8a9f' }}>{size.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Progress Ring Card with wave effect */}
      <motion.div variants={item} className="rounded-2xl p-6 mb-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #12121e 100%)', ...CARD_STYLE }}>
        <div className="absolute inset-0 opacity-[0.05]" style={{ background: 'radial-gradient(circle at center, #00b4d8, transparent 60%)' }} />
        <div className="relative flex justify-center mb-4">
          <div className="relative" style={{ width: ringSize, height: ringSize }}>
            {progress > 0 && (
              <motion.div className="absolute inset-[-8px] rounded-full" animate={isNearGoal ? { boxShadow: [`0 0 20px rgba(0,180,216,${progress * 0.15})`, `0 0 35px rgba(0,180,216,${progress * 0.25})`, `0 0 20px rgba(0,180,216,${progress * 0.15})`] } : { boxShadow: `0 0 25px rgba(0,180,216,${progress * 0.15})` }} transition={isNearGoal ? { duration: 1.5, repeat: Infinity } : { duration: 0.5 }} />
            )}
            <svg width={ringSize} height={ringSize} className="-rotate-90">
              <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
              <defs>
                <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00b4d8" />
                  <stop offset="100%" stopColor="#0077b6" />
                </linearGradient>
              </defs>
              <motion.circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="url(#waterGradient)" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: 'easeOut' }} style={{ filter: 'drop-shadow(0 0 6px rgba(0,180,216,0.3))' }} />
            </svg>
            {/* Wave effect inside ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-full" style={{ width: ringSize - strokeWidth * 2 - 8, height: ringSize - strokeWidth * 2 - 8, margin: strokeWidth + 4 }}>
              {progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0" style={{ height: `${Math.min(progress, 1) * 100}%`, overflow: 'hidden' }}>
                  <div className="absolute inset-x-0 bottom-0 h-[200%] animate-water-wave" style={{ background: 'rgba(0,180,216,0.12)', borderRadius: '40% 40% 0 0' }} />
                  <div className="absolute inset-x-0 bottom-0 h-[200%] animate-water-wave-2" style={{ background: 'rgba(0,119,182,0.08)', borderRadius: '40% 40% 0 0' }} />
                </div>
              )}
              <div className="relative flex flex-col items-center z-10 pt-4">
                <Droplets size={24} className="text-[#00b4d8] mb-1 opacity-70" />
                <div className="text-center">
                  <span className="text-3xl font-bold text-white" style={{ letterSpacing: '0.01em' }}>{waterCount}</span>
                  <span className="text-lg font-normal" style={{ color: '#8a8a9f' }}>/</span>
                  <span className="text-lg font-medium" style={{ color: '#c8c8d8' }}>{waterGoal}</span>
                </div>
                <span className="text-[11px] font-normal" style={{ color: '#8a8a9f' }}>glasses</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{formatNumber(currentMl)} <span className="text-sm font-normal" style={{ color: '#8a8a9f' }}>/ {formatNumber(goalMl)} ml</span></p>
        </div>
      </motion.div>

      {/* Glass Icons Row with fill + bounce animation */}
      <motion.div variants={item} className="flex items-center justify-center gap-2 mb-4 px-2">
        {Array.from({ length: waterGoal }, (_, i) => (
          <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }} className="flex-1 flex justify-center">
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 overflow-hidden" style={{ backgroundColor: i < waterCount ? 'rgba(0,180,216,0.18)' : 'rgba(255,255,255,0.03)', border: i < waterCount ? '1.5px solid rgba(0,180,216,0.4)' : '1px solid rgba(255,255,255,0.06)', boxShadow: i < waterCount ? '0 2px 8px rgba(0,180,216,0.15)' : 'none' }}>
              {i < waterCount && (
                <motion.div className="absolute bottom-0 left-0 right-0 rounded-b-lg" style={{ backgroundColor: 'rgba(0,180,216,0.2)' }} initial={{ height: 0 }} animate={{ height: '100%' }} transition={{ delay: i * 0.04 + 0.1, duration: 0.5, ease: 'easeOut' }} />
              )}
              <motion.div animate={i === waterCount - 1 && waterCount > 0 ? { y: [0, -4, 0] } : {}} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}>
                <Droplets size={14} className="relative transition-all duration-300" style={{ color: i < waterCount ? '#00b4d8' : '#5a5a6e' }} fill={i < waterCount ? '#00b4d8' : 'none'} />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Action Buttons with ripple effect */}
      <motion.div variants={item} className="flex gap-3 mb-4">
        <motion.button whileTap={{ scale: 0.96 }} onClick={handleAdd} className="relative flex-1 py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer overflow-hidden" style={{ background: 'linear-gradient(135deg, #00b4d8, #0096c7)', boxShadow: '0 6px 20px rgba(0,180,216,0.3)' }}>
          {rippleActive && (
            <motion.div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} initial={{ scale: 0, opacity: 1, borderRadius: '50%' }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 0.6 }} />
          )}
          <motion.div animate={rippleActive ? { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] } : {}} transition={{ duration: 0.4 }}>
            <Droplets size={18} />
          </motion.div>
          Add Glass (+{glassSize}ml)
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={handleUndo} disabled={waterCount === 0} className="px-5 py-3.5 rounded-xl font-semibold transition-all disabled:opacity-30 cursor-pointer" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)', color: '#c8c8d8' }}>
          <Undo2 size={18} />
        </motion.button>
      </motion.div>

      {/* Next Reminder */}
      {nextReminder !== null && nextReminder > 0 && (
        <motion.div variants={item} className="mb-4">
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
            <Bell size={14} className="text-[#00b4d8]" />
            <div className="flex-1">
              <p className="text-[11px] font-normal" style={{ color: '#c8c8d8' }}>Next drink in <span className="text-white font-bold">{nextReminder} min</span></p>
            </div>
            <Clock size={14} className="text-[#5a5a6e]" />
          </div>
        </motion.div>
      )}

      {/* Progress Bar */}
      <motion.div variants={item} className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-normal" style={{ color: '#c8c8d8' }}>Daily Progress</p>
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} style={{ color: '#00b4d8' }} />
            <p className="text-xs font-bold" style={{ color: '#00b4d8' }}>{Math.round(progress * 100)}%</p>
          </div>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #00b4d8, #0077b6)', boxShadow: '0 0 8px rgba(0,180,216,0.25)' }} initial={{ width: 0 }} animate={{ width: `${Math.min(progress * 100, 100)}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
        </div>
      </motion.div>

      {/* Water History - Last 3 Days with stagger */}
      <motion.div variants={item} className="mb-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
          <p className="text-xs font-bold uppercase mb-3" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>📊 Water History</p>
          <div className="space-y-2.5">
            {recentHistory.map((day, idx) => {
              const dayProgress = Math.min(day.count / day.goal, 1);
              return (
                <motion.div key={day.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + idx * 0.15 }} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold w-8" style={{ color: '#8a8a9f' }}>{day.label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <motion.div className="h-full rounded-full" style={{ background: dayProgress >= 1 ? 'linear-gradient(90deg, #00b4d8, #0077b6)' : 'linear-gradient(90deg, rgba(0,180,216,0.4), rgba(0,119,182,0.4))' }} initial={{ width: 0 }} animate={{ width: `${dayProgress * 100}%` }} transition={{ duration: 0.8, delay: 0.2 + idx * 0.15 }} />
                  </div>
                  <span className="text-[11px] font-bold w-12 text-right" style={{ color: dayProgress >= 1 ? '#00b4d8' : '#8a8a9f' }}>{day.count}/{day.goal}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Motivational Card */}
      <AnimatePresence mode="wait">
        {waterCount >= waterGoal ? (
          <motion.div key="goal-reached" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,180,216,0.15), rgba(0,150,199,0.08))', border: '1px solid rgba(0,180,216,0.25)' }}>
            <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/[0.05]" />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,180,216,0.2)' }}>
              <PartyPopper size={20} className="text-[#00b4d8]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">🎉 Goal reached!</p>
              <p className="text-xs font-normal" style={{ color: '#c8c8d8' }}>Amazing! You hit your water goal today!</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="motivation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,180,216,0.08), rgba(0,150,199,0.04))', border: '1px solid rgba(0,180,216,0.12)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,180,216,0.12)' }}>
              <Target size={20} className="text-[#00b4d8]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Reach your goal!</p>
              <p className="text-xs font-normal" style={{ color: '#c8c8d8' }}>{waterGoal - waterCount} more glass{waterGoal - waterCount !== 1 ? 'es' : ''} to go. You can do it!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
