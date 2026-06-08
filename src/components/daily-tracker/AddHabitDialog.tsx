'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles } from 'lucide-react';
import type { Habit } from '@/hooks/useTrackerStore';

interface AddHabitDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (habit: { title: string; category: 'morning' | 'bedtime' }) => void;
}

const CATEGORY_OPTIONS: { value: 'morning' | 'bedtime'; label: string; emoji: string; color: string }[] = [
  { value: 'morning', label: 'Morning', emoji: '🌅', color: '#4caf50' },
  { value: 'bedtime', label: 'Bedtime', emoji: '🌙', color: '#9c27b0' },
];

export default function AddHabitDialog({ open, onClose, onAdd }: AddHabitDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'morning' | 'bedtime'>('morning');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({ title: name.trim(), category });
    setName('');
    setCategory('morning');
    onClose();
  };

  const isValid = name.trim().length > 0;

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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(76,175,80,0.15)' }}>
                  <Plus size={16} className="text-[#4caf50]" />
                </div>
                <h3 className="text-lg font-bold text-white" style={{ letterSpacing: '0.02em' }}>Add Habit</h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <X size={18} className="text-white/60" />
              </motion.button>
            </div>

            {/* Category Selector */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: '#8a8a9f', letterSpacing: '0.06em' }}>Category</label>
              <div className="flex gap-2">
                {CATEGORY_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCategory(opt.value)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all cursor-pointer"
                    style={{
                      backgroundColor: category === opt.value ? `${opt.color}15` : 'rgba(255,255,255,0.03)',
                      border: category === opt.value ? `1.5px solid ${opt.color}40` : '1px solid #2a2a3e',
                      boxShadow: category === opt.value ? `0 0 16px ${opt.color}15` : 'none',
                    }}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: category === opt.value ? opt.color : '#8a8a9f' }}
                    >
                      {opt.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Habit Name */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8a8a9f', letterSpacing: '0.06em' }}>Habit Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning Yoga, Read 20 pages..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                style={{ backgroundColor: '#0f0f1a', border: '1px solid #2a2a3e' }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all cursor-pointer disabled:opacity-40"
              style={{
                background: isValid ? 'linear-gradient(135deg, #4caf50, #66bb6a)' : '#2a2a3e',
                boxShadow: isValid ? '0 6px 20px rgba(76,175,80,0.3)' : 'none',
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles size={16} />
                Add Habit
              </div>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
