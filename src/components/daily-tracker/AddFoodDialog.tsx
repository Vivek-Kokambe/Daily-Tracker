'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles, BookOpen, Trash2, Check } from 'lucide-react';
import { SavedFood } from '@/hooks/useTrackerStore';

type FoodInput = { name: string; calories: number; serving: string; carbs: number; protein: number; fat: number };

interface AddFoodDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (food: FoodInput) => void;
  savedFoods: SavedFood[];
  onSaveFoodToLibrary: (food: Omit<SavedFood, 'id'>) => void;
  onRemoveSavedFood: (id: string) => void;
}

const QUICK_ADDS = [
  { name: 'Banana', calories: 105, serving: '1 medium', emoji: '🍌', carbs: 27, protein: 1, fat: 0 },
  { name: 'Apple', calories: 95, serving: '1 medium', emoji: '🍎', carbs: 25, protein: 0, fat: 0 },
  { name: 'Egg (boiled)', calories: 78, serving: '1 large', emoji: '🥚', carbs: 1, protein: 6, fat: 5 },
  { name: 'Coffee (black)', calories: 5, serving: '1 cup', emoji: '☕', carbs: 0, protein: 0, fat: 0 },
  { name: 'Greek Yogurt', calories: 130, serving: '170g', emoji: '🥛', carbs: 6, protein: 17, fat: 0 },
  { name: 'Protein Bar', calories: 220, serving: '1 bar', emoji: '🍫', carbs: 24, protein: 20, fat: 7 },
  { name: 'Orange Juice', calories: 112, serving: '1 cup', emoji: '🍊', carbs: 26, protein: 2, fat: 0 },
  { name: 'Rice Bowl', calories: 240, serving: '1 bowl', emoji: '🍚', carbs: 53, protein: 5, fat: 1 },
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

type Tab = 'quick' | 'custom' | 'saved';

export default function AddFoodDialog({ open, onClose, onAdd, savedFoods, onSaveFoodToLibrary, onRemoveSavedFood }: AddFoodDialogProps) {
  const [tab, setTab] = useState<Tab>('quick');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [serving, setServing] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setCalories('');
    setServing('');
    setCarbs('');
    setProtein('');
    setFat('');
    setSaveToLibrary(false);
    setPendingDelete(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleQuickAdd = (item: typeof QUICK_ADDS[number]) => {
    onAdd({ name: item.name, calories: item.calories, serving: item.serving, carbs: item.carbs, protein: item.protein, fat: item.fat });
    handleClose();
  };

  const handleSubmit = () => {
    if (!name.trim() || !calories.trim()) return;
    const food: FoodInput = {
      name: name.trim(),
      calories: parseInt(calories, 10) || 0,
      serving: serving.trim() || '1 serving',
      carbs: parseInt(carbs, 10) || 0,
      protein: parseInt(protein, 10) || 0,
      fat: parseInt(fat, 10) || 0,
    };
    onAdd(food);
    if (saveToLibrary) {
      onSaveFoodToLibrary({ name: food.name, calories: food.calories, serving: food.serving, carbs: food.carbs, protein: food.protein, fat: food.fat });
    }
    handleClose();
  };

  const handleLogSaved = (food: SavedFood) => {
    onAdd({ name: food.name, calories: food.calories, serving: food.serving, carbs: food.carbs, protein: food.protein, fat: food.fat });
    handleClose();
  };

  const handleDeleteSaved = (id: string) => {
    if (pendingDelete === id) {
      onRemoveSavedFood(id);
      setPendingDelete(null);
    } else {
      setPendingDelete(id);
      setTimeout(() => setPendingDelete(null), 2500);
    }
  };

  const isValid = name.trim() && calories.trim();

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'quick', label: 'Quick Add', icon: <Sparkles size={12} /> },
    { key: 'saved', label: `My Foods${savedFoods.length > 0 ? ` (${savedFoods.length})` : ''}`, icon: <BookOpen size={12} /> },
    { key: 'custom', label: 'Custom', icon: <Plus size={12} /> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-t-3xl p-6 pb-8"
            style={{ backgroundColor: '#1a1a2e' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full" style={{ backgroundColor: '#4a4a5e' }} />

            {/* Header */}
            <div className="flex items-center justify-between mb-5 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,107,53,0.15)' }}>
                  <Plus size={16} className="text-[#ff6b35]" />
                </div>
                <h3 className="text-lg font-bold text-white">Add Food</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <X size={18} className="text-white/60" />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ backgroundColor: '#0f0f1a' }}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: tab === t.key ? '#ff6b35' : 'transparent',
                    color: tab === t.key ? '#fff' : '#6b6b80',
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Quick Add tab */}
            {tab === 'quick' && (
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ADDS.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleQuickAdd(item)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all active:scale-95"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a3e', color: '#b0b0c0' }}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.name}</span>
                    <span style={{ color: '#ff6b35' }}>{item.calories}</span>
                  </button>
                ))}
              </div>
            )}

            {/* My Foods tab */}
            {tab === 'saved' && (
              <div>
                {savedFoods.length === 0 ? (
                  <div className="text-center py-10">
                    <BookOpen size={32} className="mx-auto mb-3" style={{ color: '#5a5a6e' }} />
                    <p className="text-sm font-medium text-white/60">No saved foods yet</p>
                    <p className="text-xs mt-1" style={{ color: '#6b6b80' }}>
                      Use the Custom tab and tick &quot;Save to My Foods&quot;
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
                    <AnimatePresence>
                      {savedFoods.map((food) => (
                        <motion.div
                          key={food.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ backgroundColor: '#0f0f1a', border: '1px solid #2a2a3e' }}
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0" style={{ backgroundColor: 'rgba(255,107,53,0.1)' }}>
                            {getFoodEmoji(food.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{food.name}</p>
                            <p className="text-[10px]" style={{ color: '#6b6b80' }}>{food.serving} · {food.calories} kcal</p>
                          </div>
                          {/* Log button */}
                          <button
                            onClick={() => handleLogSaved(food)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 shrink-0"
                            style={{ backgroundColor: 'rgba(255,107,53,0.15)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.25)' }}
                          >
                            Log
                          </button>
                          {/* Delete button — confirm on second tap */}
                          <button
                            onClick={() => handleDeleteSaved(food.id)}
                            className="p-1.5 rounded-lg transition-all shrink-0"
                            style={{
                              backgroundColor: pendingDelete === food.id ? 'rgba(244,67,54,0.2)' : 'transparent',
                              border: pendingDelete === food.id ? '1px solid rgba(244,67,54,0.3)' : '1px solid transparent',
                            }}
                          >
                            <Trash2 size={13} style={{ color: pendingDelete === food.id ? '#f44336' : '#5a5a6e' }} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* Custom entry tab */}
            {tab === 'custom' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Food Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Grilled Chicken Salad"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-[#ff6b35]/40"
                    style={{ backgroundColor: '#0f0f1a', border: '1px solid #2a2a3e' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Calories (kcal) *</label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-[#ff6b35]/40"
                      style={{ backgroundColor: '#0f0f1a', border: '1px solid #2a2a3e' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Serving</label>
                    <input
                      type="text"
                      value={serving}
                      onChange={(e) => setServing(e.target.value)}
                      placeholder="1 serving"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-[#ff6b35]/40"
                      style={{ backgroundColor: '#0f0f1a', border: '1px solid #2a2a3e' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Carbs (g)', val: carbs, set: setCarbs },
                    { label: 'Protein (g)', val: protein, set: setProtein },
                    { label: 'Fat (g)', val: fat, set: setFat },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-[#ff6b35]/40"
                        style={{ backgroundColor: '#0f0f1a', border: '1px solid #2a2a3e' }}
                      />
                    </div>
                  ))}
                </div>

                {/* Save to library toggle */}
                <button
                  onClick={() => setSaveToLibrary((v) => !v)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{
                    backgroundColor: saveToLibrary ? 'rgba(255,107,53,0.08)' : 'rgba(255,255,255,0.03)',
                    border: saveToLibrary ? '1px solid rgba(255,107,53,0.3)' : '1px solid #2a2a3e',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                    style={{
                      backgroundColor: saveToLibrary ? '#ff6b35' : 'transparent',
                      border: saveToLibrary ? 'none' : '1.5px solid #4a4a5e',
                    }}
                  >
                    {saveToLibrary && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold" style={{ color: saveToLibrary ? '#ff6b35' : '#b0b0c0' }}>
                      Save to My Foods
                    </p>
                    <p className="text-[10px]" style={{ color: '#6b6b80' }}>
                      Reuse this food without re-entering it
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className="w-full py-3.5 rounded-xl font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{
                    background: isValid ? 'linear-gradient(135deg, #ff6b35, #ff8c42)' : '#2a2a3e',
                    boxShadow: isValid ? '0 6px 20px rgba(255,107,53,0.3)' : 'none',
                  }}
                >
                  Add Food
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
