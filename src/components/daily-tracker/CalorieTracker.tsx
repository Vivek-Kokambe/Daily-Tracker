'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, Trash2, Search, Target, Utensils, AlertTriangle, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { FoodItem, SavedFood } from '@/hooks/useTrackerStore';
import AddFoodDialog from './AddFoodDialog';

interface CalorieTrackerProps {
  calorieGoal: number;
  foodLog: FoodItem[];
  todayCalories: number;
  onAddFood: (food: { name: string; calories: number; serving: string; carbs: number; protein: number; fat: number }) => void;
  onRemoveFood: (id: string) => void;
  onSetGoal: (goal: number) => void;
  onUndoFood: () => void;
  savedFoods: SavedFood[];
  onSaveFoodToLibrary: (food: Omit<SavedFood, 'id'>) => void;
  onRemoveSavedFood: (id: string) => void;
}

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

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const QUICK_PRESETS = [
  { name: 'Banana', calories: 105, serving: '1 medium', emoji: '🍌', carbs: 27, protein: 1, fat: 0 },
  { name: 'Coffee', calories: 5, serving: '1 cup', emoji: '☕', carbs: 0, protein: 0, fat: 0 },
  { name: 'Rice Bowl', calories: 300, serving: '1 bowl', emoji: '🍚', carbs: 53, protein: 5, fat: 1 },
  { name: 'Chicken', calories: 165, serving: '1 breast', emoji: '🍗', carbs: 0, protein: 31, fat: 4 },
  { name: 'Salad', calories: 150, serving: '1 plate', emoji: '🥗', carbs: 12, protein: 6, fat: 8 },
  { name: 'Egg', calories: 78, serving: '1 large', emoji: '🥚', carbs: 1, protein: 6, fat: 5 },
];

function getFoodEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('oat') || lower.includes('cereal')) return '🥣';
  if (lower.includes('chicken') || lower.includes('meat') || lower.includes('steak')) return '🍗';
  if (lower.includes('salad') || lower.includes('vegetable') || lower.includes('veggie')) return '🥗';
  if (lower.includes('rice') || lower.includes('grain') || lower.includes('pasta')) return '🍚';
  if (lower.includes('shake') || lower.includes('smoothie') || lower.includes('juice')) return '🥤';
  if (lower.includes('bread') || lower.includes('toast') || lower.includes('sandwich')) return '🍞';
  if (lower.includes('fruit') || lower.includes('apple') || lower.includes('berry') || lower.includes('banana')) return '🍎';
  if (lower.includes('egg') || lower.includes('breakfast')) return '🍳';
  if (lower.includes('fish') || lower.includes('salmon') || lower.includes('tuna')) return '🐟';
  if (lower.includes('coffee') || lower.includes('tea')) return '☕';
  if (lower.includes('pizza')) return '🍕';
  if (lower.includes('soup')) return '🍲';
  if (lower.includes('dessert') || lower.includes('cake') || lower.includes('cookie')) return '🍰';
  if (lower.includes('yogurt')) return '🥛';
  return '🍽️';
}

function MacroBar({ label, value, max, color, emoji }: { label: string; value: number; max: number; color: string; emoji: string }) {
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] w-5 shrink-0">{emoji}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-normal" style={{ color: '#c8c8d8' }}>{label}</span>
          <span className="text-[10px] font-bold" style={{ color }}>{value}g</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <motion.div className="h-full rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}30` }} initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
        </div>
      </div>
    </div>
  );
}

function NutritionDonut({ carbs, protein, fat }: { carbs: number; protein: number; fat: number }) {
  const total = carbs + protein + fat;
  if (total === 0) return null;
  const data = [
    { name: 'Carbs', value: carbs, color: '#60a5fa' },
    { name: 'Protein', value: protein, color: '#66bb6a' },
    { name: 'Fat', value: fat, color: '#ffd54f' },
  ].filter((d) => d.value > 0);
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 h-16 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={20} outerRadius={30} paddingAngle={2} dataKey="value" stroke="none" animationBegin={0} animationDuration={800}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[10px] font-normal" style={{ color: '#c8c8d8' }}>{d.name}: {Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalorieTracker({ calorieGoal, foodLog, todayCalories, onAddFood, onRemoveFood, onSetGoal, onUndoFood, savedFoods, onSaveFoodToLibrary, onRemoveSavedFood }: CalorieTrackerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [goalInput, setGoalInput] = useState(calorieGoal.toString());
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remaining = calorieGoal - todayCalories;
  const progress = Math.min(todayCalories / calorieGoal, 1);
  const totalCarbs = foodLog.reduce((sum, f) => sum + (f.carbs || 0), 0);
  const totalProtein = foodLog.reduce((sum, f) => sum + (f.protein || 0), 0);
  const totalFat = foodLog.reduce((sum, f) => sum + (f.fat || 0), 0);
  const isOverGoal = todayCalories > calorieGoal;

  const filteredLog = searchQuery ? foodLog.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())) : foodLog;

  const handleSaveGoal = () => {
    const val = parseInt(goalInput, 10);
    if (val > 0 && val !== calorieGoal) { onSetGoal(val); }
    setShowGoalEditor(false);
  };

  const handleDelete = (id: string) => {
    if (pendingDelete === id) {
      onRemoveFood(id);
      setPendingDelete(null);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    } else {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      setPendingDelete(id);
      deleteTimerRef.current = setTimeout(() => setPendingDelete(null), 3000);
    }
  };

  const handleQuickPreset = (preset: typeof QUICK_PRESETS[number]) => {
    onAddFood({ name: preset.name, calories: preset.calories, serving: preset.serving, carbs: preset.carbs, protein: preset.protein, fat: preset.fat });
  };

  return (
    <>
    <motion.div variants={container} initial="hidden" animate="show" className="px-5 pt-2 pb-4 antialiased">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-60 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(255,107,53,0.06) 0%, transparent 70%)' }} />

      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff6b35, #ff8c42)', boxShadow: '0 4px 15px rgba(255,107,53,0.3)' }}>
          <Flame size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white" style={{ letterSpacing: '0.02em' }}>Calorie Tracker</h2>
          <p className="text-xs font-normal" style={{ color: '#8a8a9f' }}>Track your daily nutrition</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowGoalEditor(!showGoalEditor)} className="px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer" style={{ backgroundColor: 'rgba(255,107,53,0.12)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.2)' }}>
          Goal: {formatNumber(calorieGoal)}
        </motion.button>
      </motion.div>

      {/* Goal Editor */}
      <AnimatePresence>
        {showGoalEditor && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,107,53,0.2)' }}>
              <input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-sm text-white text-center outline-none" style={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.06)' }} autoFocus />
              <span className="text-xs shrink-0 font-normal" style={{ color: '#8a8a9f' }}>kcal</span>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveGoal} className="px-3 py-2 rounded-lg text-xs font-medium text-white shrink-0 cursor-pointer" style={{ backgroundColor: 'rgba(255,107,53,0.2)', border: '1px solid rgba(255,107,53,0.3)' }}>Save</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Food Presets with shimmer on hover */}
      <motion.div variants={item} className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap size={12} className="text-[#ff6b35]" />
          <p className="text-[11px] font-bold uppercase" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>Quick Add</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {QUICK_PRESETS.map((preset) => (
            <motion.button key={preset.name} whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.03 }} onClick={() => handleQuickPreset(preset)} className="group flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer relative overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer" />
              <span className="text-lg relative z-10">{preset.emoji}</span>
              <div className="text-left relative z-10">
                <p className="text-[11px] font-semibold text-white leading-tight">{preset.name}</p>
                <p className="text-[9px] font-bold" style={{ color: '#ff6b35' }}>{preset.calories} kcal</p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a9f]" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search food log..." className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }} />
      </motion.div>

      {/* Calorie Progress Card */}
      <motion.div variants={item} className="rounded-2xl p-4 mb-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #12121e 100%)', ...CARD_STYLE }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ background: 'radial-gradient(circle at top right, #ff6b35, transparent 60%)' }} />
        <div className="relative">
          <div className="flex items-end justify-between mb-1">
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>Today&apos;s Intake</p>
              <p className="text-2xl font-bold text-white mt-0.5">{formatNumber(todayCalories)} <span className="text-base font-normal" style={{ color: '#8a8a9f' }}>/ {formatNumber(calorieGoal)} kcal</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <motion.div className={`h-full rounded-full ${isOverGoal ? 'animate-red-pulse' : ''}`} style={{ background: remaining >= 0 ? 'linear-gradient(90deg, #ff6b35, #e85d26)' : 'linear-gradient(90deg, #f44336, #ff6b35)', boxShadow: remaining >= 0 ? '0 0 8px rgba(255,107,53,0.25)' : '0 0 8px rgba(244,67,54,0.25)' }} initial={{ width: 0 }} animate={{ width: `${Math.min(progress * 100, 100)}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
            </div>
            <p className={`text-xs font-bold shrink-0 ${remaining >= 0 ? 'text-[#4caf50]' : 'text-[#f44336]'}`}>{remaining >= 0 ? `${formatNumber(remaining)} left` : `+${formatNumber(Math.abs(remaining))}`}</p>
          </div>

          {/* Nutritional Donut */}
          <div className="mb-3">
            <NutritionDonut carbs={totalCarbs} protein={totalProtein} fat={totalFat} />
          </div>

          {/* Macro Progress Bars */}
          <div className="space-y-2">
            <MacroBar label="Carbs" value={totalCarbs} max={300} color="#60a5fa" emoji="🍞" />
            <MacroBar label="Protein" value={totalProtein} max={120} color="#66bb6a" emoji="🥩" />
            <MacroBar label="Fat" value={totalFat} max={80} color="#ffd54f" emoji="🥑" />
          </div>
        </div>
      </motion.div>

      {/* Recently Logged - slide from right */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white" style={{ letterSpacing: '0.01em' }}>Recently Logged</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-normal" style={{ backgroundColor: '#1a1a2e', color: '#8a8a9f', border: '1px solid rgba(255,255,255,0.06)' }}>{foodLog.length} items</span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
          <AnimatePresence>
            {filteredLog.map((food, idx) => (
              <motion.div key={food.id} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }} transition={{ duration: 0.3, delay: idx * 0.05, type: 'spring', stiffness: 200 }} className="flex items-center gap-3 p-3.5 rounded-xl" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.1)' }}>{getFoodEmoji(food.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{food.name}</p>
                  <p className="text-[11px] font-normal" style={{ color: '#8a8a9f' }}>{food.serving} · {food.loggedAt}</p>
                </div>
                <div className="text-right shrink-0 mr-1">
                  <span className="text-sm font-bold text-[#ff6b35]">{food.calories}</span>
                  <p className="text-[9px] font-normal" style={{ color: '#8a8a9f' }}>kcal</p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(food.id)} className="p-2 rounded-lg transition-all shrink-0 cursor-pointer" style={{ backgroundColor: pendingDelete === food.id ? 'rgba(244,67,54,0.2)' : 'transparent', border: pendingDelete === food.id ? '1px solid rgba(244,67,54,0.3)' : '1px solid transparent' }}>
                  {pendingDelete === food.id ? <AlertTriangle size={14} className="text-[#f44336]" /> : <Trash2 size={14} className="text-white/20" />}
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredLog.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE, borderRadius: 16 }}>
              <Utensils size={32} className="mx-auto mb-3 text-[#5a5a6e]" />
              <p className="text-sm font-medium text-white/60">{searchQuery ? 'No items match your search' : 'No food logged yet'}</p>
              <p className="text-xs font-normal mt-1" style={{ color: '#8a8a9f' }}>Use quick add above or tap &quot;Add Food&quot; to start</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Add Food Button */}
      <motion.div variants={item} className="mt-4">
        <button onClick={() => setShowAddDialog(true)} className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] cursor-pointer" style={{ background: 'linear-gradient(135deg, #ff6b35, #ff8c42)', boxShadow: '0 6px 20px rgba(255,107,53,0.3)' }}>
          <Plus size={18} />
          Add Food
        </button>
      </motion.div>
    </motion.div>
    <AddFoodDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} onAdd={onAddFood} savedFoods={savedFoods} onSaveFoodToLibrary={onSaveFoodToLibrary} onRemoveSavedFood={onRemoveSavedFood} />
    </>
  );
}
