'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface TimePickerDialogProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onSave: (time: string) => void;
  label: string;
}

function parseTime(time: string): [number, number] {
  const [h, m] = time.split(':').map(Number);
  return [h, m];
}

function formatTimeDisplay(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

function TimePickerInner({ value, onSave, onClose, label }: Omit<TimePickerDialogProps, 'open'>) {
  const [hour, setHour] = useState(() => parseTime(value)[0]);
  const [minute, setMinute] = useState(() => parseTime(value)[1]);

  const handleSave = () => {
    onSave(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    onClose();
  };

  const incrementHour = () => setHour((h) => (h + 1) % 24);
  const decrementHour = () => setHour((h) => (h - 1 + 24) % 24);
  const incrementMinute = () => setMinute((m) => (m + 5) % 60);
  const decrementMinute = () => setMinute((m) => (m - 5 + 60) % 60);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-72 rounded-3xl p-6"
        style={{ backgroundColor: '#1a1a2e' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">{label}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} className="text-white/60" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={incrementHour}
              className="w-12 h-10 flex items-center justify-center rounded-xl text-white/60 hover:bg-white/10 transition-colors"
              style={{ backgroundColor: '#0a0a0f' }}
            >
              ▲
            </button>
            <div
              className="w-16 h-16 flex items-center justify-center rounded-2xl text-2xl font-bold text-white"
              style={{ backgroundColor: '#0a0a0f' }}
            >
              {hour.toString().padStart(2, '0')}
            </div>
            <button
              onClick={decrementHour}
              className="w-12 h-10 flex items-center justify-center rounded-xl text-white/60 hover:bg-white/10 transition-colors"
              style={{ backgroundColor: '#0a0a0f' }}
            >
              ▼
            </button>
          </div>

          <span className="text-3xl font-bold text-white/40 mt-[-8px]">:</span>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={incrementMinute}
              className="w-12 h-10 flex items-center justify-center rounded-xl text-white/60 hover:bg-white/10 transition-colors"
              style={{ backgroundColor: '#0a0a0f' }}
            >
              ▲
            </button>
            <div
              className="w-16 h-16 flex items-center justify-center rounded-2xl text-2xl font-bold text-white"
              style={{ backgroundColor: '#0a0a0f' }}
            >
              {minute.toString().padStart(2, '0')}
            </div>
            <button
              onClick={decrementMinute}
              className="w-12 h-10 flex items-center justify-center rounded-xl text-white/60 hover:bg-white/10 transition-colors"
              style={{ backgroundColor: '#0a0a0f' }}
            >
              ▼
            </button>
          </div>
        </div>

        <div className="text-center mb-6">
          <span className="text-xl font-semibold" style={{ color: '#9c27b0' }}>
            {formatTimeDisplay(hour, minute)}
          </span>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #9c27b0, #ba68c8)' }}
        >
          Save
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function TimePickerDialog({ open, ...props }: TimePickerDialogProps) {
  if (!open) return null;
  return <TimePickerInner key={props.value + props.label} {...props} />;
}
