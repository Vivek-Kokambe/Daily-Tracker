'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface HabitHeatmapProps {
  heatmapData: { key: string; date: string; completionRate: number }[];
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getCellColor(rate: number): { bg: string; border: string } {
  if (rate === 0) return { bg: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  if (rate < 50) return { bg: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.2)' };
  if (rate < 100) return { bg: 'rgba(76,175,80,0.35)', border: '1px solid rgba(76,175,80,0.3)' };
  return { bg: 'rgba(76,175,80,0.6)', border: '1px solid rgba(76,175,80,0.5)' };
}

export default function HabitHeatmap({ heatmapData }: HabitHeatmapProps) {
  const todayKey = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return todayStr;
  }, []);

  // Reorganize data into 5 rows × 7 columns grid
  // The data is in chronological order (oldest first), 35 days
  const rows = useMemo(() => {
    const grid: { key: string; completionRate: number; isToday: boolean }[][] = [];
    for (let row = 0; row < 5; row++) {
      const rowData: { key: string; completionRate: number; isToday: boolean }[] = [];
      for (let col = 0; col < 7; col++) {
        const idx = row * 7 + col;
        if (idx < heatmapData.length) {
          rowData.push({
            key: heatmapData[idx].key,
            completionRate: heatmapData[idx].completionRate,
            isToday: heatmapData[idx].key === todayKey,
          });
        } else {
          rowData.push({ key: '', completionRate: 0, isToday: false });
        }
      }
      grid.push(rowData);
    }
    return grid;
  }, [heatmapData, todayKey]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.01 },
    },
  };

  const cellItem = {
    hidden: { opacity: 0, scale: 0.5 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  };

  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#c8c8d8', letterSpacing: '0.06em' }}>📅 5-Week Overview</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
            <span className="text-[9px]" style={{ color: '#5a5a6e' }}>None</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(76,175,80,0.35)' }} />
            <span className="text-[9px]" style={{ color: '#5a5a6e' }}>Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(76,175,80,0.6)' }} />
            <span className="text-[9px]" style={{ color: '#5a5a6e' }}>Full</span>
          </div>
        </div>
      </div>

      {/* Day labels */}
      <div className="flex gap-1 mb-1 pl-0">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] font-medium" style={{ color: '#5a5a6e' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-1">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1">
            {row.map((cell, colIdx) => {
              const colors = getCellColor(cell.completionRate);
              return (
                <motion.div
                  key={`${rowIdx}-${colIdx}`}
                  variants={cellItem}
                  className="flex-1 aspect-square rounded-sm relative"
                  style={{
                    backgroundColor: colors.bg,
                    border: colors.border,
                  }}
                  title={`${cell.key}: ${cell.completionRate}%`}
                >
                  {cell.isToday && (
                    <div
                      className="absolute inset-0 rounded-sm"
                      style={{
                        boxShadow: 'inset 0 0 0 1.5px #4caf50',
                        boxShadow: '0 0 0 1.5px #4caf50',
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </motion.div>

      {/* Week labels */}
      <div className="flex gap-1 mt-1">
        <div className="flex-1 flex justify-between px-0.5">
          {['5w', '4w', '3w', '2w', '1w'].map((label) => (
            <span key={label} className="text-[8px]" style={{ color: '#3a3a4e' }}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
