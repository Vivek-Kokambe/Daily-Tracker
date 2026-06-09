'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, Brain, ArrowUpRight, ArrowDownRight, BarChart3Icon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine, Tooltip, Area, AreaChart } from 'recharts';
import { format, subDays } from 'date-fns';

interface AnalyticsScreenProps {
  waterGoal: number;
  calorieGoal: number;
  waterHistory: Record<string, number>;
  calorieHistory: Record<string, number>;
  habitCompletion: Record<string, Record<string, boolean>>;
  habits: { id: string }[];
  sleepHistory: Record<string, number>;
}

type Period = 'weekly' | 'monthly';
type ComparisonMode = 'this-week' | 'vs-last-week';

const CARD_STYLE = {
  border: '1px solid rgba(255,255,255,0.06)' as const,
  boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)' as const,
};

const SECTION_HEADER_STYLE = {
  letterSpacing: '0.06em' as const,
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const key = format(date, 'yyyy-MM-dd');
    return { date, key, day: format(date, 'EEE') };
  });
}

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const key = format(date, 'yyyy-MM-dd');
    return { date, key, day: format(date, 'MMM d') };
  });
}

function getLast7DaysOffset(weeksAgo: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), (weeksAgo * 7 + 6) - i);
    const key = format(date, 'yyyy-MM-dd');
    return { date, key, day: format(date, 'EEE') };
  });
}

function getLast7DaysPrev() {
  return getLast7DaysOffset(1);
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-white/60 mb-0.5">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">{entry.name}: {entry.value}</p>
      ))}
    </div>
  );
}

function AnimatedCounter({ target, color, suffix }: { target: number; color: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setDisplay(target); clearInterval(timer); }
      else { setDisplay(Math.round(current)); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span className="text-sm font-bold" style={{ color }}>{display}{suffix || ''}</span>;
}

function ChartSummaryCard({ label, value, unit, color, trend, trendLabel }: { label: string; value: string | number; unit: string; color: string; trend?: 'up' | 'down' | 'neutral'; trendLabel?: string[] }) {
  return (
    <motion.div className="flex items-center justify-between px-3 py-2 rounded-xl mb-2" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}15` }}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-normal" style={{ color: '#c8c8d8' }}>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold" style={{ color }}>{value}</span>
        <span className="text-[10px] font-normal" style={{ color: '#8a8a9f' }}>{unit}</span>
        {trend && trend !== 'neutral' && (
          <div className="flex items-center gap-0.5 ml-1">
            {trend === 'up' ? <ArrowUpRight size={10} style={{ color: '#4caf50' }} /> : <ArrowDownRight size={10} style={{ color: '#f44336' }} />}
            <span className="text-[9px] font-bold" style={{ color: trend === 'up' ? '#4caf50' : '#f44336' }}>{trendLabel}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AnalyticsScreen({ waterGoal, calorieGoal, waterHistory, calorieHistory, habitCompletion, habits, sleepHistory }: AnalyticsScreenProps) {
  const [period, setPeriod] = useState<Period>('weekly');
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('this-week');
  const days = period === 'weekly' ? getLast7Days() : getLast30Days();
  const prevDays = period === 'weekly' ? getLast7DaysPrev() : getLast7DaysOffset(2);

  const demoWater = useMemo(() => [5, 7, 4, 8, 6, 3, 5, 7, 6, 8, 4, 5, 7, 6, 8, 5, 3, 7, 6, 4, 8, 5, 7, 6, 3, 8, 5, 7, 6, 4], []);
  const demoCalories = useMemo(() => [1800, 2200, 1500, 1900, 2100, 1700, 1600, 2000, 1850, 1750, 1900, 2100, 1600, 1800, 2200, 1700, 1500, 2000, 1850, 1650, 2100, 1800, 1900, 1700, 2200, 1600, 2[...], []);
  const demoHabits = useMemo(() => [75, 88, 50, 100, 63, 38, 75, 88, 50, 100, 63, 75, 88, 50, 100, 63, 38, 75, 88, 50, 100, 63, 75, 88, 50, 100, 63, 75, 88, 50], []);
  const demoSleep = useMemo(() => [7.2, 6.8, 8.1, 5.9, 7.5, 6.3, 7.8, 6.5, 8.0, 7.1, 6.9, 7.3, 6.7, 7.9, 5.8, 7.4, 6.2, 8.2, 7.0, 6.6, 7.7, 6.4, 8.0, 7.1, 6.8, 7.5, 6.3, 7.9, 6.7, 7.2], []);

  const waterData = useMemo(() => days.map((d, i) => ({ day: d.day, glasses: waterHistory[d.key] ?? demoWater[i % demoWater.length] })), [days, waterHistory, demoWater]);
  const calorieData = useMemo(() => days.map((d, i) => ({ day: d.day, calories: calorieHistory[d.key] ?? demoCalories[i % demoCalories.length] })), [days, calorieHistory, demoCalories]);
  const habitData = useMemo(() => days.map((d) => { const completion = habitCompletion[d.key] || {}; const total = habits.length; const done = Object.values(completion).filter(Boolean).length; const p[...], []);
  const sleepData = useMemo(() => days.map((d, i) => ({ day: d.day, hours: sleepHistory[d.key] ?? demoSleep[i % demoSleep.length] })), [days, sleepHistory, demoSleep]);

  // Previous week data for comparison
  const prevWaterData = useMemo(() => prevDays.map((d, i) => ({ day: d.day, glasses: waterHistory[d.key] ?? demoWater[(i + 7) % demoWater.length] })), [prevDays, waterHistory, demoWater]);
  const prevCalorieData = useMemo(() => prevDays.map((d, i) => ({ day: d.day, calories: calorieHistory[d.key] ?? demoCalories[(i + 7) % demoCalories.length] })), [prevDays, calorieHistory, demoCalorie[...]);
  const prevSleepData = useMemo(() => prevDays.map((d, i) => ({ day: d.day, hours: sleepHistory[d.key] ?? demoSleep[(i + 7) % demoSleep.length] })), [prevDays, sleepHistory, demoSleep]);

  const waterGoalHit = waterData.filter((d) => d.glasses >= waterGoal).length;
  const avgWater = waterData.length > 0 ? (waterData.reduce((sum, d) => sum + d.glasses, 0) / waterData.length).toFixed(1) : '0';
  const avgCalories = calorieData.length > 0 ? Math.round(calorieData.reduce((sum, d) => sum + d.calories, 0) / calorieData.length) : 0;
  const avgHabitPercent = habitData.length > 0 ? Math.round(habitData.reduce((sum, d) => sum + d.percentage, 0) / habitData.length) : 0;
  const avgSleepHours = sleepData.length > 0 ? (sleepData.reduce((sum, d) => sum + d.hours, 0) / sleepData.length).toFixed(1) : '0';

  // Previous week averages
  const prevAvgWater = prevWaterData.length > 0 ? (prevWaterData.reduce((sum, d) => sum + d.glasses, 0) / prevWaterData.length).toFixed(1) : '0';
  const prevAvgCalories = prevCalorieData.length > 0 ? Math.round(prevCalorieData.reduce((sum, d) => sum + d.calories, 0) / prevCalorieData.length) : 0;
  const prevAvgSleep = prevSleepData.length > 0 ? (prevSleepData.reduce((sum, d) => sum + d.hours, 0) / prevSleepData.length).toFixed(1) : '0';

  // Comparison percentages
  const waterChange = prevAvgWater > 0 ? Math.round(((parseFloat(avgWater) - parseFloat(prevAvgWater)) / parseFloat(prevAvgWater)) * 100) : 0;
  const calorieChange = prevAvgCalories > 0 ? Math.round(((avgCalories - prevAvgCalories) / prevAvgCalories) * 100) : 0;
  const sleepChange = prevAvgSleep > 0 ? Math.round(((parseFloat(avgSleepHours) - parseFloat(prevAvgSleep)) / parseFloat(prevAvgSleep)) * 100) : 0;

  const halfLen = Math.floor(days.length / 2);
  const waterTrend = waterData.length > 2 ? (() => { const first = waterData.slice(0, halfLen).reduce((s, d) => s + d.glasses, 0) / halfLen; const last = waterData.slice(halfLen).reduce((s, d) => s + [...];
  const calorieTrend = calorieData.length > 2 ? (() => { const first = calorieData.slice(0, halfLen).reduce((s, d) => s + d.calories, 0) / halfLen; const last = calorieData.slice(halfLen).reduce((s, d[...];
  const habitTrend = habitData.length > 2 ? (() => { const first = habitData.slice(0, halfLen).reduce((s, d) => s + d.percentage, 0) / halfLen; const last = habitData.slice(halfLen).reduce((s, d) => s[...];
  const sleepTrend = sleepData.length > 2 ? (() => { const first = sleepData.slice(0, halfLen).reduce((s, d) => s + d.hours, 0) / halfLen; const last = sleepData.slice(halfLen).reduce((s, d) => s + d.[...];

  const insights = useMemo(() => {
    const result: string[] = [];
    if (parseFloat(avgWater) >= waterGoal * 0.8) result.push('💧 Your hydration is on track — you\'re consistently hitting close to your water goal.');
    else if (parseFloat(avgWater) < waterGoal * 0.5) result.push('💧 Try increasing water intake gradually. Set hourly reminders to build the habit.');
    if (avgCalories <= calorieGoal * 1.05 && avgCalories >= calorieGoal * 0.85) result.push('🔥 Your calorie intake is well-balanced around your target. Great discipline!');
    else if (avgCalories > calorieGoal * 1.15) result.push('🔥 You\'re consistently over your calorie goal. Consider lighter meal options.');
    if (avgHabitPercent >= 75) result.push('✅ Excellent habit consistency! You\'re building strong routines.');
    else if (avgHabitPercent < 40) result.push('✅ Habit completion is low. Try focusing on 2-3 key habits to start.');
    if (parseFloat(avgSleepHours) >= 7) result.push('🌙 You\'re getting quality sleep. Keep your consistent bedtime schedule.');
    else if (parseFloat(avgSleepHours) < 6) result.push('🌙 Sleep is below recommended levels. Try adjusting your bedtime earlier by 30 minutes.');
    if (result.length === 0) result.push('📊 Keep tracking daily to get personalized insights. Consistency is key!');
    return result.slice(0, 4);
  }, [avgWater, avgCalories, avgHabitPercent, avgSleepHours, waterGoal, calorieGoal]);

  const tickStyle = { fontSize: 11, fill: '#8a8a9f', fontWeight: 600 };

  // Typewriter effect for insights
  const [visibleInsights, setVisibleInsights] = useState<number>(0);
  useEffect(() => {
    if (visibleInsights < insights.length) {
      const timer = setTimeout(() => setVisibleInsights((v) => v + 1), 200);
      return () => clearTimeout(timer);
    }
  }, [visibleInsights, insights.length]);

  const isComparing = comparisonMode === 'vs-last-week';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="px-5 pt-2 pb-20 antialiased">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-60 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(59,130,246,0.06) 0%, transparent 70%)' [...]

      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
          <BarChart3 size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white" style={{ letterSpacing: '0.02em' }}>Analytics</h2>
          <p className="text-xs font-normal" style={{ color: '#8a8a9f' }}>Track your progress over time</p>
        </div>
      </motion.div>

      {/* Period Toggle + Comparison Toggle */}
      <motion.div variants={item} className="flex gap-2 mb-4">
        <div className="flex-1 p-1 rounded-xl relative" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
          <motion.div className="absolute top-1 bottom-1 rounded-lg pointer-events-none" style={{ width: 'calc(50% - 4px)', left: period === 'weekly' ? '4px' : 'calc(50%)', background: 'linear-gradien[...]
          <button onClick={() => setPeriod('weekly')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all relative z-10 cursor-pointer ${period === 'weekly' ? 'text-white' : 'te[...]
          <button onClick={() => setPeriod('monthly')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all relative z-10 cursor-pointer ${period === 'monthly' ? 'text-white' : '[...]
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setComparisonMode(isComparing ? 'this-week' : 'vs-last-week')} className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bo[...]
          {isComparing ? '📊 Comparing' : '📊 Compare'}
        </motion.button>
      </motion.div>

      {/* Comparison Summary Cards */}
      {isComparing && (
        <motion.div variants={item} className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
          <p className="text-xs font-bold uppercase mb-3" style={{ color: '#c8c8d8', ...SECTION_HEADER_STYLE }}>📈 vs Last Week</p>
          <div className="space-y-2">
            {[
              { label: 'Water', current: parseFloat(avgWater), prev: parseFloat(prevAvgWater), unit: 'glasses', color: '#00b4d8' },
              { label: 'Calories', current: avgCalories, prev: prevAvgCalories, unit: 'kcal', color: '#ff6b35' },
              { label: 'Sleep', current: parseFloat(avgSleepHours), prev: parseFloat(prevAvgSleep), unit: 'hrs', color: '#9c27b0' },
            ].map((metric) => {
              const change = metric.prev > 0 ? Math.round(((metric.current - metric.prev) / metric.prev) * 100) : 0;
              const isImprovement = metric.label === 'Calories' ? change < 0 : change > 0;
              return (
                <div key={metric.label} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: `${metric.color}08`, border: `1px solid ${metric.color}15` }}>
                  <span className="text-[11px] font-normal" style={{ color: '#c8c8d8' }}>{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <AnimatedCounter target={Math.abs(change)} color={isImprovement ? '#4caf50' : '#f44336'} suffix="%" />
                    <div className="flex items-center gap-0.5">
                      {isImprovement ? <ArrowUpRight size={10} style={{ color: '#4caf50' }} /> : <ArrowDownRight size={10} style={{ color: '#f44336' }} />}
                      <span className="text-[9px] font-bold" style={{ color: isImprovement ? '#4caf50' : '#f44336' }}>{isImprovement ? 'Better' : 'Worse'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Water Chart */}
      <motion.div variants={item} className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
        <ChartSummaryCard label="Avg Water" value={avgWater} unit="glasses/day" color="#00b4d8" trend={waterTrend as 'up' | 'down' | 'neutral'} trendLabel={waterTrend === 'up' ? '+12%' : waterTrend ==[...]
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-[#00b4d8]" />
          <h3 className="text-sm font-semibold text-white">Water Intake</h3>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={waterData}>
              <defs>
                <linearGradient id="waterAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00b4d8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00b4d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tickStyle} />
              <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} tick={tickStyle} width={25} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={waterGoal} stroke="#00b4d8" strokeDasharray="4 4" opacity={0.5} />
              <Area type="monotone" dataKey="glasses" stroke="#00b4d8" strokeWidth={2.5} fill="url(#waterAreaFill)" dot={{ r: 4, fill: '#00b4d8', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#00b4d8', [...]
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Calorie Chart */}
      <motion.div variants={item} className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
        <ChartSummaryCard label="Avg Calories" value={avgCalories} unit="kcal/day" color="#ff6b35" trend={calorieTrend as 'up' | 'down' | 'neutral' | undefined} trendLabel={calorieTrend === 'up' ? 'On[...]
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-[#ff6b35]" />
          <h3 className="text-sm font-semibold text-white">Calorie Intake</h3>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={calorieData} barCategoryGap="20%">
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ ...tickStyle, fontSize: period === 'weekly' ? 11 : 8 }} />
              <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} tick={tickStyle} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={calorieGoal} stroke="#ff6b35" strokeDasharray="4 4" opacity={0.5} />
              <Bar dataKey="calories" radius={[4, 4, 0, 0]} maxBarSize={period === 'weekly' ? 28 : 12}>
                {calorieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.calories > calorieGoal ? '#f44336' : '#ff6b35'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Habit Chart */}
      <motion.div variants={item} className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
        <ChartSummaryCard label="Avg Completion" value={avgHabitPercent} unit="%" color="#4caf50" trend={habitTrend as 'up' | 'down' | 'neutral' | undefined} trendLabel={habitTrend === 'up' ? 'Improvi[...]
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-[#4caf50]" />
          <h3 className="text-sm font-semibold text-white">Habit Completion</h3>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={habitData}>
              <defs>
                <linearGradient id="habitAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4caf50" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#4caf50" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ ...tickStyle, fontSize: period === 'weekly' ? 11 : 8 }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={tickStyle} width={30} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="percentage" stroke="#4caf50" strokeWidth={2.5} fill="url(#habitAreaFill)" dot={{ r: 4, fill: '#4caf50', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Sleep Chart */}
      <motion.div variants={item} className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#1a1a2e', ...CARD_STYLE }}>
        <ChartSummaryCard label="Avg Sleep" value={avgSleepHours} unit="hrs/night" color="#9c27b0" trend={sleepTrend as 'up' | 'down' | 'neutral' | undefined} trendLabel={sleepTrend === 'up' ? 'Improv[...]
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-[#9c27b0]" />
          <h3 className="text-sm font-semibold text-white">Sleep Quality</h3>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sleepData} barCategoryGap="20%">
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ ...tickStyle, fontSize: period === 'weekly' ? 11 : 8 }} />
              <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={tickStyle} width={25} tickFormatter={(v: number) => `${v}h`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={period === 'weekly' ? 28 : 12}>
                {sleepData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hours >= 7 ? '#7b1fa2' : entry.hours >= 5 ? '#ab47bc' : '#ce93d8'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* AI Insights with typewriter effect */}
      <motion.div variants={item} className="rounded-2xl p-4 mb-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))', border: '1px s[...]
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}><Brain size={14} className="text-[#3b82f6]" /></div>
          <h3 className="text-sm font-bold text-white" style={{ letterSpacing: '0.01em' }}>AI Insights</h3>
        </div>
        <div className="flex flex-col gap-2">
          {insights.slice(0, visibleInsights).map((insight, idx) => (
            <motion.p key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="text-[11px] font-normal leading-relaxed animate-cursor-blink" styl[...]
              {insight}
            </motion.p>
          ))}
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.div variants={item} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(0,180,216,0.1), rgba(0,180,216,0.05))', border: '1px solid rgba[...]
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,180,216,0.15)' }}><TrendingUp size={20} className="text-[#00b4d8]" /></div>
        <div>
          <p className="text-sm font-semibold text-white">You hit your water goal {waterGoalHit}/{period === 'weekly' ? 7 : 30} days!</p>
          <p className="text-xs font-normal mt-0.5" style={{ color: '#c8c8d8' }}><Target size={10} className="inline mr-1" />Keep it up and stay hydrated!</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
