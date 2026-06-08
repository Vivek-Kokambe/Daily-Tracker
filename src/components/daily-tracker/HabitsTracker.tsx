'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Circle, Zap, Moon, Trophy, Sparkles, Flame, Plus, Trash2, StickyNote } from 'lucide-react';
import { Habit, type MoodType } from '@/hooks/useTrackerStore';
import CelebrationEffect from './CelebrationEffect';
import AddHabitDialog from './AddHabitDialog';
import HabitHeatmap from './HabitHeatmap';

interface HabitsTrackerProps {
  habits: Habit[];
  todayHabitsDone: number;
  todayHabitsTotal: number;
  allHabitsDone: boolean;
  getHabitCompletion: (habitId: string) => boolean;
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (habit: { title: string; category: 'morning' | 'bedtime' }) => void;
  onRemoveHabit: (habitId: string) => void;
  todayMood: MoodType | null;
  onSetMood: (mood: MoodType) => void;
  habitHeatmapData: { key: string; date: string; completionRate: number }[];
  setHabitNote: (habitId: string, note: string) => void;
}

const MOOD_OPTIONS: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'happy', emoji: '😊', label: 'Great' },
  { type: 'neutral', emoji: '😐', label: 'Okay' },
  { type: 'sad', emoji: '😢', label: 'Tough' },
];

const CARD_STYLE = {
  border: '1px solid rgba(255,255,255,0.06)' as const,
  boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)' as const,
};

const SECTION_HEADER_STYLE = {
  letterSpacing: '0.06em' as const,
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const sectionContainer = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const sectionItem = { hidden: { opacity: 0, x: -15 }, show: { opacity: 1, x: 0, transition: { duration: 0.3 } } };

function CheckmarkSVG({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <motion.path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }} style={{ strokeDasharray: 30, strokeDashoffset: 30 }} />
    </svg>
  );
}

function RippleBackground({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;
  return (
    <motion.div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden" style={{ zIndex: 0 }} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.15, 0] }} transition={{ duration: 0.6 }}>
      <motion.div className="absolute rounded-full" style={{ width: 60, height: 60, top: '50%', left: '50%', marginTop: -30, marginLeft: -30, backgroundColor: color }} initial={{ scale: 0, opacity: 0.4 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 0.8 }} />
    </motion.div>
  );
}

export default function HabitsTracker({
  habits, todayHabitsDone, todayHabitsTotal, allHabitsDone,
  getHabitCompletion, onToggleHabit, onAddHabit, onRemoveHabit,
  todayMood, onSetMood, habitHeatmapData, setHabitNote,
}: HabitsTrackerProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingHabit, setDeletingHabit] = useState<string | null>(null);
  const [editingHabitNote, setEditingHabitNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const handleToggle = (habitId: string, e: React.MouseEvent) => {
    const isCurrentlyCompleted = getHabitCompletion(habitId);
    onToggleHabit(habitId);
    if (!isCurrentlyCompleted) {
      const willBeDone = todayHabitsDone + 1;
      if (willBeDone === todayHabitsTotal) { setShowCelebration(true); setTimeout(() => setShowCelebration(false), 3000); }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const newSparkles = Array.from({ length: 6 }, (_, i) => ({ id: Date.now() + i, x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 40, y: rect.top + rect.height / 2 + (Math.random() - 0.5) * 40 }));
      setSparkles((prev) => [...prev, ...newSparkles]);
      setTimeout(() => setSparkles((prev) => prev.filter((s) => !newSparkles.find((ns) => ns.id === s.id))), 800);
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    if (deletingHabit === habitId) { onRemoveHabit(habitId); setDeletingHabit(null); }
    else { setDeletingHabit(habitId); setTimeout(() => setDeletingHabit(null), 3000); }
  };

  const handleStartEditNote = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    setEditingHabitNote(habitId);
    setNoteText(habit?.note || '');
  };

  const handleSaveNote = () => {
    if (editingHabitNote) {
      setHabitNote(editingHabitNote, noteText);
      setEditingHabitNote(null);
      setNoteText('');
    }
  };

  const morningHabits = habits.filter((h) => h.category === 'morning');
  const bedtimeHabits = habits.filter((h) => h.category === 'bedtime');
  const overallProgress = todayHabitsTotal > 0 ? todayHabitsDone / todayHabitsTotal : 0;

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="px-5 pt-2 pb-4 antialiased">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-60 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(76,175,80,0.06) 0%, transparent 70%)' }} />
        <CelebrationEffect active={showCelebration} />

        {/* Sparkle particles */}
        <div className="fixed inset-0 pointer-events-none z-50">
          <AnimatePresence>
            {sparkles.map((spark) => (
              <motion.div key={spark.id} initial={{ opacity: 1, scale: 1, x: spark.x, y: spark.y }} animate={{ opacity: 0, scale: 0, y: spark.y - 30 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} className="fixed w-2 h-2 rounded-full" style={{ background: 'radial-gradient(circle, #ffd54f, #ff9800)', boxShadow: '0 0 6px #ffd54f' }} />
            ))}
          </AnimatePresence>
        </div>

        {/* Header */}
        <motion.div variants={item} className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4caf50, #66bb6a)', boxShadow: '0 4px 15px rgba(76,175,80,0.3)' }}>
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white" style={{ letterSpacing: '0.02em' }}>Today&apos;s Habits</h2>
            <p className="text-xs font-normal" style={{ color: '#8a8a9f' }}>Build consistency, one day at a time</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddDialog(true)} className="p-2 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.2)' }}>
            <Plus size={18} className="text-[#4caf50]" />
          </motion.button>
        </motion.div>

        {/* Habit Calendar Heatmap */}
        <motion.div variants={item} className="mb-4">
          <HabitHeatmap heatmapData={habitHeatmapData} />
        </motion.div>

        {/* Mood Selector with ripple */}
        <motion.div variants={item} className="mb-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
            <p className="text-xs font-bold uppercase mb-2.5" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>🎯 How&apos;s your mood today?</p>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((opt) => (
                <motion.button key={opt.type} whileTap={{ scale: 0.9 }} onClick={() => onSetMood(opt.type)} className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all cursor-pointer relative overflow-hidden" style={{ backgroundColor: todayMood === opt.type ? 'rgba(76,175,80,0.12)' : 'rgba(255,255,255,0.03)', border: todayMood === opt.type ? '1.5px solid rgba(76,175,80,0.3)' : '1px solid rgba(255,255,255,0.06)', boxShadow: todayMood === opt.type ? '0 2px 10px rgba(76,175,80,0.1)' : 'none' }}>
                  <RippleBackground active={todayMood === opt.type} color="#4caf50" />
                  <motion.span className="text-2xl relative z-10" animate={todayMood === opt.type ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}>{opt.emoji}</motion.span>
                  <span className="text-[10px] font-semibold relative z-10" style={{ color: todayMood === opt.type ? '#4caf50' : '#8a8a9f' }}>{opt.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Overall Progress Card with gradient stripes */}
        <motion.div variants={item} className="rounded-2xl p-4 mb-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #12121e 100%)', ...CARD_STYLE }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ background: 'radial-gradient(circle at top right, #4caf50, transparent 60%)' }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: overallProgress >= 1 ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.1)' }}>
                  <Trophy size={16} className={overallProgress >= 1 ? 'text-[#ffd54f]' : 'text-[#4caf50]'} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white"><span className="text-[#4caf50] font-bold text-lg">{todayHabitsDone}</span><span className="text-[#8a8a9f]"> of </span><span className="font-bold text-lg">{todayHabitsTotal}</span></p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-lg text-sm font-bold" style={{ backgroundColor: overallProgress >= 1 ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.08)', color: overallProgress >= 1 ? '#4caf50' : '#c8c8d8', border: `1px solid ${overallProgress >= 1 ? 'rgba(76,175,80,0.3)' : 'rgba(76,175,80,0.1)'}` }}>
                {Math.round(overallProgress * 100)}%
              </div>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <motion.div className="h-full rounded-full relative" style={{ background: overallProgress >= 1 ? 'linear-gradient(90deg, #4caf50, #2e7d32)' : 'linear-gradient(90deg, #4caf50, #2e7d3280)', boxShadow: '0 0 8px rgba(76,175,80,0.25)' }} initial={{ width: 0 }} animate={{ width: `${overallProgress * 100}%` }} transition={{ duration: 1, ease: 'easeOut' }}>
                <div className="absolute inset-0 animate-gradient-stripes rounded-full" />
              </motion.div>
            </div>
            {allHabitsDone && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 mt-2.5">
                <span className="text-base">🏆</span>
                <span className="text-xs font-bold text-[#ffd54f]">All habits completed! Amazing work!</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Morning Section */}
        {morningHabits.length > 0 && (
          <motion.div variants={item} className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: 'rgba(76,175,80,0.15)' }}><Zap size={12} className="text-[#4caf50]" /></div>
              <h3 className="text-xs font-bold uppercase" style={{ color: '#4caf50', ...SECTION_HEADER_STYLE }}>MORNING</h3>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(76,175,80,0.3), transparent)' }} />
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(76,175,80,0.08)', color: '#4caf50' }}>{morningHabits.filter(h => getHabitCompletion(h.id)).length}/{morningHabits.length}</span>
            </div>
            <motion.div variants={sectionContainer} initial="hidden" animate="show" className="space-y-2">
              {morningHabits.map((habit) => (
                <HabitItem key={habit.id} habit={habit} isCompleted={getHabitCompletion(habit.id)} isDeleting={deletingHabit === habit.id} color="#4caf50" onToggle={handleToggle} onDelete={handleDeleteHabit} editingNote={editingHabitNote === habit.id} noteText={noteText} onStartEditNote={handleStartEditNote} onSaveNote={handleSaveNote} onNoteTextChange={setNoteText} />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Bedtime Section */}
        {bedtimeHabits.length > 0 && (
          <motion.div variants={item} className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: 'rgba(156,39,176,0.15)' }}><Moon size={12} className="text-[#9c27b0]" /></div>
              <h3 className="text-xs font-bold uppercase" style={{ color: '#9c27b0', ...SECTION_HEADER_STYLE }}>BEDTIME</h3>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(156,39,176,0.3), transparent)' }} />
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(156,39,176,0.08)', color: '#9c27b0' }}>{bedtimeHabits.filter(h => getHabitCompletion(h.id)).length}/{bedtimeHabits.length}</span>
            </div>
            <motion.div variants={sectionContainer} initial="hidden" animate="show" className="space-y-2">
              {bedtimeHabits.map((habit) => (
                <HabitItem key={habit.id} habit={habit} isCompleted={getHabitCompletion(habit.id)} isDeleting={deletingHabit === habit.id} color="#9c27b0" onToggle={handleToggle} onDelete={handleDeleteHabit} editingNote={editingHabitNote === habit.id} noteText={noteText} onStartEditNote={handleStartEditNote} onSaveNote={handleSaveNote} onNoteTextChange={setNoteText} />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Celebration with particle rain */}
        <AnimatePresence>
          {allHabitsDone && (
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="rounded-2xl p-5 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(76,175,80,0.12), rgba(76,175,80,0.04))', border: '1px solid rgba(76,175,80,0.2)' }}>
              <div className="absolute inset-0">
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/[0.03]" />
                <div className="absolute -left-2 -bottom-2 w-14 h-14 rounded-full bg-white/[0.02]" />
                {/* Particle rain */}
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="absolute w-1.5 h-1.5 rounded-full animate-particle-fall" style={{ backgroundColor: ['#4caf50', '#66bb6a', '#81c784', '#ffd54f', '#ffffff'][i % 5], left: `${10 + i * 7}%`, top: 0, '--fall-duration': `${1.5 + Math.random()}s`, '--fall-delay': `${i * 0.15}s` } as React.CSSProperties} />
                ))}
              </div>
              <div className="relative">
                <motion.p className="text-3xl mb-1" animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 0.6, delay: 0.2 }}>🏆</motion.p>
                <p className="text-sm font-bold text-white">All habits completed today!</p>
                <p className="text-xs font-normal mt-1" style={{ color: '#c8c8d8' }}>You&apos;re on fire! Keep the streak going!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <AddHabitDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} onAdd={onAddHabit} />
    </>
  );
}

function HabitItem({ habit, isCompleted, isDeleting, color, onToggle, onDelete, editingNote, noteText, onStartEditNote, onSaveNote, onNoteTextChange }: { habit: Habit; isCompleted: boolean; isDeleting: boolean; color: string; onToggle: (id: string, e: React.MouseEvent) => void; onDelete: (id: string) => void; editingNote: boolean; noteText: string; onStartEditNote: (id: string) => void; onSaveNote: () => void; onNoteTextChange: (t: string) => void }) {
  // Pre-compute style values to avoid nested template literals in JSX
  const itemBorder = isCompleted ? (color + '30') : 'rgba(255,255,255,0.06)';
  const itemBg = isCompleted ? (color + '10') : '#1a1a2e';
  const checkBg = isCompleted ? color : 'rgba(255,255,255,0.04)';
  const checkBorder = isCompleted ? 'none' : '2px solid #3a3a4e';
  const checkShadow = isCompleted ? ('0 2px 10px ' + color + '50') : 'none';
  const isHot = habit.streak >= 7;
  const streakBg = isHot ? 'linear-gradient(135deg, rgba(255,152,0,0.15), rgba(255,87,34,0.15))' : isCompleted ? (color + '10') : 'rgba(255,255,255,0.03)';
  const streakBorderInner = isHot ? 'rgba(255,152,0,0.25)' : isCompleted ? (color + '20') : 'rgba(255,255,255,0.06)';
  const streakColor = isHot ? '#ff9800' : isCompleted ? color : '#8a8a9f';
  const streakFilter = isHot ? 'drop-shadow(0 0 4px rgba(255,152,0,0.5))' : 'none';
  const saveBtnBg = color + '20';

  return (
    <motion.div variants={sectionItem} whileTap={{ scale: 0.98 }} className="rounded-xl overflow-hidden" style={{ border: '1px solid ' + itemBorder }}>
      <div className="flex items-center gap-3 p-3.5 cursor-pointer transition-all" style={{ backgroundColor: itemBg }} onClick={(e) => onToggle(habit.id, e)}>
        <motion.div whileTap={{ scale: 0.85 }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all" style={{ backgroundColor: checkBg, border: checkBorder, boxShadow: checkShadow }}>
          {isCompleted ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
              <CheckmarkSVG color="#ffffff" />
            </motion.div>
          ) : (
            <Circle size={14} className="text-[#3a3a4e]" />
          )}
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium transition-all duration-300 cursor-pointer ${isCompleted ? 'line-through text-white/40' : 'text-white'}`} onClick={(e) => { e.stopPropagation(); onStartEditNote(habit.id); }}>{habit.title}</p>
          {habit.note && !editingNote && <p className="text-[10px] font-normal mt-0.5 truncate" style={{ color: '#5a5a6e' }}>{habit.note}</p>}
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0" style={{ background: streakBg, border: '1px solid ' + streakBorderInner }}>
          <Flame size={12} style={{ color: streakColor, filter: streakFilter }} />
          <span className="text-[11px] font-bold" style={{ color: streakColor }}>{habit.streak}d</span>
        </div>
        <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }} className="p-1.5 rounded-lg shrink-0 cursor-pointer" style={{ backgroundColor: isDeleting ? 'rgba(244,67,54,0.2)' : 'transparent' }}>
          <Trash2 size={12} style={{ color: isDeleting ? '#f44336' : '#5a5a6e' }} />
        </motion.button>
      </div>
      {isDeleting && <div className="px-3.5 pb-2"><p className="text-[10px] font-medium" style={{ color: '#f44336' }}>Tap again to delete</p></div>}
      {/* Note editor */}
      <AnimatePresence>
        {editingNote && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-white/[0.04]" style={{ backgroundColor: '#0f0f1a' }}>
            <div className="p-3.5 flex items-center gap-2">
              <StickyNote size={12} className="text-[#5a5a6e] shrink-0" />
              <input type="text" value={noteText} onChange={(e) => onNoteTextChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSaveNote()} placeholder="Add a note..." className="flex-1 text-xs text-white placeholder-white/20 outline-none bg-transparent" autoFocus maxLength={50} />
              <motion.button whileTap={{ scale: 0.9 }} onClick={onSaveNote} className="px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer" style={{ backgroundColor: saveBtnBg, color }}>Save</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
