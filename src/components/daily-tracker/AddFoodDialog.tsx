'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles } from 'lucide-react';

interface AddFoodDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (food: { name: string; calories: number; serving: string; carbs: number; protein: number; fat: number }) => void;
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

export default function AddFoodDialog({ open, onClose, onAdd }: AddFoodDialogProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [serving, setServing] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !calories.trim()) return;
    onAdd({
      name: name.trim(),
      calories: parseInt(calories, 10) || 0,
      serving: serving.trim() || '1 serving',
      carbs: parseInt(carbs, 10) || 0,
      protein: parseInt(protein, 10) || 0,
      fat: parseInt(fat, 10) || 0,
    });
    resetForm();
    onClose();
  };

  const handleQuickAdd = (item: typeof QUICK_ADDS[number]) => {
    onAdd({
      name: item.name,
      calories: item.calories,
      serving: item.serving,
      carbs: item.carbs,
      protein: item.protein,
      fat: item.fat,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setCalories('');
    setServing('');
    setCarbs('');
    setProtein('');
    setFat('');
  };

  const isValid = name.trim() && calories.trim();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={onClose}
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
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full" style={{ backgroundColor: '#4a4a5e' }} />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,107,53,0.15)' }}>
                  <Plus size={16} className="text-[#ff6b35]" />
                </div>
                <h3 className="text-lg font-bold text-white">Add Food</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <X size={18} className="text-white/60" />
              </button>
            </div>

            {/* Quick Add Section */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles size={12} className="text-[#ff6b35]" />
                <p className="text-xs font-semibold" style={{ color: '#b0b0c0' }}>Quick Add</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ADDS.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleQuickAdd(item)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all active:scale-95"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid #2a2a3e',
                      color: '#b0b0c0',
                    }}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ backgroundColor: '#2a2a3e' }} />
              <span className="text-[10px] font-medium" style={{ color: '#6b6b80' }}>Custom Entry</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#2a2a3e' }} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Food Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grilled Chicken Salad"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all focus:ring-2 focus:ring-[#ff6b35]/40"
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
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all focus:ring-2 focus:ring-[#ff6b35]/40"
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
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all focus:ring-2 focus:ring-[#ff6b35]/40"
                    style={{ backgroundColor: '#0f0f1a', border: '1px solid #2a2a3e' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Carbs (g)</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all focus:ring-2 focus:ring-[#ff6b35]/40"
                    style={{ backgroundColor: '#0f0f1a', border: '1px solid #2a2a3e' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Protein (g)</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all focus:ring-2 focus:ring-[#ff6b35]/40"
                    style={{ backgroundColor: '#0f0f1a', border: '1px solid #2a2a3e' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Fat (g)</label>
                  <input
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all focus:ring-2 focus:ring-[#ff6b35]/40"
                    style={{ backgroundColor: '#0f0f1a', border: '1px solid #2a2a3e' }}
                  />
                </div>
              </div>

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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
