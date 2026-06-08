'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, BedDouble, BarChart3, Sparkles, TrendingUp, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { format, subDays } from 'date-fns';
import TimePickerDialog from './TimePickerDialog';
import type { SleepQualityType } from '@/hooks/useTrackerStore';

interface SleepTrackerProps {
  bedtime: string;
  wakeTime: string;
  sleepDuration: number;
  sleepHistory: Record<string, number>;
  todaySleepQuality: SleepQualityType | null;
  onSetBedtime: (time: string) => void;
  onSetWakeTime: (time: string) => void;
  onLogSleep: () => void;
  onSetSleepQuality: (quality: SleepQualityType) => void;
}

const CARD_STYLE = {
  border: '1px solid rgba(255,255,255,0.06)' as const,
  boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)' as const,
};

const SECTION_HEADER_STYLE = {
  letterSpacing: '0.06em' as const,
};

const SLEEP_QUALITY_OPTIONS: { type: SleepQualityType; emoji: string; label: string; color: string }[] = [
  { type: 'great', emoji: '😄', label: 'Great', color: '#4caf50' },
  { type: 'good', emoji: '😊', label: 'Good', color: '#00b4d8' },
  { type: 'average', emoji: '😐', label: 'Average', color: '#ffc107' },
  { type: 'poor', emoji: '😴', label: 'Poor', color: '#f44336' },
];

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

function getSleepQualityFromHours(hours: number): { label: string; color: string; bgColor: string; emoji: string } {
  if (hours >= 7) return { label: 'Good', color: '#4caf50', bgColor: 'rgba(76,175,80,0.15)', emoji: '😊' };
  if (hours >= 5) return { label: 'Average', color: '#ffc107', bgColor: 'rgba(255,193,7,0.15)', emoji: '😐' };
  return { label: 'Poor', color: '#f44336', bgColor: 'rgba(244,67,54,0.15)', emoji: '😴' };
}

function getBarColor(hours: number): string {
  if (hours >= 7) return '#7b1fa2';
  if (hours >= 5) return '#ab47bc';
  return '#ce93d8';
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const val = payload[0].value;
  const quality = getSleepQualityFromHours(val);
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-white/60 mb-0.5">{label}</p>
      <p className="font-medium text-white">{val} hrs {quality.emoji}</p>
    </div>
  );
}

const SLEEP_TIPS = [
  'Avoid screens 30 minutes before bedtime for better sleep quality',
  'Keep your bedroom cool (65-68°F) for optimal sleep',
  'Consistent sleep schedule helps regulate your circadian rhythm',
  'Avoid caffeine at least 6 hours before your target bedtime',
  'A warm bath 1-2 hours before bed can help you fall asleep faster',
  'Deep breathing exercises calm the nervous system before sleep',
  'Avoid heavy meals within 3 hours of bedtime',
  'Natural light exposure in the morning improves nighttime sleep',
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function StarParticles() {
  const stars = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 40,
    size: 1 + Math.random() * 2,
    duration: 2 + Math.random() * 4,
    delay: Math.random() * 5,
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-star-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            '--twinkle-duration': `${star.duration}s`,
            '--twinkle-delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default function SleepTracker({
  bedtime, wakeTime, sleepDuration, sleepHistory,
  todaySleepQuality, onSetBedtime, onSetWakeTime, onLogSleep, onSetSleepQuality,
}: SleepTrackerProps) {
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);
  const [showWakePicker, setShowWakePicker] = useState(false);
  const quality = getSleepQualityFromHours(sleepDuration);

  const tipIndex = useMemo(() => new Date().getDate() % SLEEP_TIPS.length, []);

  const last7Days = useMemo(() => {
    const values = [7.2, 6.8, 8.1, 5.9, 7.5, 6.3, 0];
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const key = format(date, 'yyyy-MM-dd');
      const dayLabel = format(date, 'EEE');
      const hours = sleepHistory[key] ?? (i === 6 ? sleepDuration : values[i]);
      return { day: dayLabel, hours, key };
    });
  }, [sleepHistory, sleepDuration]);

  const avgSleep = last7Days.reduce((sum, d) => sum + d.hours, 0) / last7Days.length;

  const bedtimeParts = bedtime.split(':').map(Number);
  const wakeParts = wakeTime.split(':').map(Number);
  let bedHours = bedtimeParts[0] + bedtimeParts[1] / 60;
  let wakeHours = wakeParts[0] + wakeParts[1] / 60;
  if (wakeHours < bedHours) wakeHours += 24;
  const estimatedHours = parseFloat((wakeHours - bedHours).toFixed(1));

  return (
    <div className="px-5 pt-2 pb-4 antialiased">
      {/* Purple ambient gradient + star particles */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-80 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(156,39,176,0.06) 0%, transparent 70%)' }} />

      <motion.div variants={container} initial="hidden" animate="show" className="relative">
        <StarParticles />

        {/* Header */}
        <motion.div variants={item} className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9c27b0, #ba68c8)', boxShadow: '0 4px 15px rgba(156,39,176,0.3)' }}>
            <Moon size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white" style={{ letterSpacing: '0.02em' }}>Sleep Tracker</h2>
            <p className="text-xs font-normal" style={{ color: '#8a8a9f' }}>Monitor your rest quality</p>
          </div>
        </motion.div>

        {/* Moon Icon with breathing glow */}
        <motion.div variants={item} className="relative flex justify-center mb-4">
          <div className="relative">
            <motion.div className="absolute inset-0 w-20 h-20 rounded-full" style={{ background: 'radial-gradient(circle, rgba(156,39,176,0.25) 0%, transparent 70%)', transform: 'scale(3)' }} animate={{ opacity: [0.5, 0.9, 0.5], scale: [3, 3.8, 3] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative" style={{ background: 'linear-gradient(145deg, rgba(156,39,176,0.2), rgba(156,39,176,0.08))', border: '2px solid rgba(156,39,176,0.25)' }}>
              <Moon size={28} className="text-[#9c27b0]" />
            </div>
          </div>
        </motion.div>

        {/* Sleep Duration Card */}
        <motion.div variants={item} className="rounded-2xl p-5 mb-4 text-center relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #12121e 100%)', ...CARD_STYLE }}>
          <div className="absolute inset-0 opacity-[0.05]" style={{ background: 'radial-gradient(circle at center, #9c27b0, transparent 60%)' }} />
          <div className="relative">
            <p className="text-5xl font-black" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #ba68c8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{sleepDuration}</p>
            <p className="text-base font-normal mt-0.5" style={{ color: '#8a8a9f' }}>hours of sleep</p>
            <motion.div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mt-3" style={{ backgroundColor: quality.bgColor, border: `1px solid ${quality.color}25` }} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <span className="text-xs">{quality.emoji}</span>
              <span className="text-xs font-bold" style={{ color: quality.color }}>{quality.label} Quality</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Sleep Quality Selector with gradient transitions */}
        <motion.div variants={item} className="mb-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
            <p className="text-xs font-bold uppercase mb-2.5" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>💭 How did you sleep?</p>
            <div className="flex gap-2">
              {SLEEP_QUALITY_OPTIONS.map((opt) => (
                <motion.button key={opt.type} whileTap={{ scale: 0.9 }} onClick={() => onSetSleepQuality(opt.type)} className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all cursor-pointer" style={{ backgroundColor: todaySleepQuality === opt.type ? `${opt.color}15` : 'rgba(255,255,255,0.03)', border: todaySleepQuality === opt.type ? `1.5px solid ${opt.color}35` : '1px solid rgba(255,255,255,0.06)', boxShadow: todaySleepQuality === opt.type ? `0 0 12px ${opt.color}12` : 'none' }}>
                  <motion.span className="text-2xl" animate={todaySleepQuality === opt.type ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}>{opt.emoji}</motion.span>
                  <span className="text-[10px] font-semibold" style={{ color: todaySleepQuality === opt.type ? opt.color : '#8a8a9f' }}>{opt.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bedtime & Wake Up Cards */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowBedtimePicker(true)} className="rounded-2xl p-4 text-left transition-all cursor-pointer" style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #12121e 100%)', ...CARD_STYLE }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: 'rgba(156,39,176,0.15)' }}><Moon size={16} className="text-[#9c27b0]" /></div>
            <p className="text-[11px] font-normal" style={{ color: '#8a8a9f' }}>Bedtime</p>
            <p className="text-lg font-bold text-white mt-0.5">{formatTime12(bedtime)}</p>
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowWakePicker(true)} className="rounded-2xl p-4 text-left transition-all cursor-pointer" style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #12121e 100%)', ...CARD_STYLE }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: 'rgba(255,193,7,0.15)' }}><Sun size={16} className="text-[#ffc107]" /></div>
            <p className="text-[11px] font-normal" style={{ color: '#8a8a9f' }}>Wake Up</p>
            <p className="text-lg font-bold text-white mt-0.5">{formatTime12(wakeTime)}</p>
          </motion.button>
        </motion.div>

        {/* Estimated Duration */}
        <motion.div variants={item} className="rounded-xl p-3 mb-4 flex items-center gap-2" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
          <Sparkles size={14} className="text-[#9c27b0]" />
          <p className="text-xs font-normal" style={{ color: '#c8c8d8' }}>Schedule: {formatTime12(bedtime)} → {formatTime12(wakeTime)} = <span className="text-white font-semibold">~{estimatedHours} hrs</span><span className="ml-1 text-[10px]" style={{ color: '#5a5a6e' }}>(estimated)</span></p>
        </motion.div>

        {/* Sleep Tips */}
        <motion.div variants={item} className="rounded-2xl p-4 mb-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(156,39,176,0.1), rgba(63,81,181,0.05))', border: '1px solid rgba(156,39,176,0.15)' }}>
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/[0.03]" />
          <div className="relative flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(156,39,176,0.15)' }}><Lightbulb size={16} className="text-[#9c27b0]" /></div>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#ffffff', letterSpacing: '0.04em' }}>💤 Sleep Tip</p>
              <p className="text-[11px] font-normal leading-relaxed mt-1" style={{ color: '#c8c8d8' }}>{SLEEP_TIPS[tipIndex]}</p>
            </div>
          </div>
        </motion.div>

        {/* Last 7 Nights Chart with spring physics */}
        <motion.div variants={item} className="rounded-2xl p-4 mb-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #12121e 100%)', ...CARD_STYLE }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[#9c27b0]" />
              <h3 className="text-sm font-semibold text-white" style={{ letterSpacing: '0.01em' }}>Last 7 Nights</h3>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-[#9c27b0]" />
              <span className="text-[11px] font-medium" style={{ color: '#9c27b0' }}>Avg: {avgSleep.toFixed(1)}h</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7b1fa2' }} /><span className="text-[10px] font-normal" style={{ color: '#8a8a9f' }}>Good 7h+</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ab47bc' }} /><span className="text-[10px] font-normal" style={{ color: '#8a8a9f' }}>Fair 5-7h</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ce93d8' }} /><span className="text-[10px] font-normal" style={{ color: '#8a8a9f' }}>Poor &lt;5h</span></div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} barCategoryGap="20%">
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8a8a9f', fontWeight: 600 }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8a8a9f', fontWeight: 600 }} width={25} tickFormatter={(v: number) => `${v}h`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={28}>
                  {last7Days.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.hours)} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Log Sleep Button */}
        <motion.div variants={item}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onLogSleep} className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer" style={{ background: 'linear-gradient(135deg, #9c27b0, #ba68c8)', boxShadow: '0 6px 20px rgba(156,39,176,0.3)' }}>
            <BedDouble size={18} />
            Log Sleep
          </motion.button>
        </motion.div>
      </motion.div>
      <TimePickerDialog open={showBedtimePicker} onClose={() => setShowBedtimePicker(false)} value={bedtime} onSave={onSetBedtime} label="Set Bedtime" />
      <TimePickerDialog open={showWakePicker} onClose={() => setShowWakePicker(false)} value={wakeTime} onSave={onSetWakeTime} label="Set Wake Up Time" />
    </div>
  );
}
