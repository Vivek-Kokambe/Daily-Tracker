'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Droplets, Flame, CheckCircle2, Moon, BarChart3 } from 'lucide-react';

export type TabType = 'home' | 'water' | 'calories' | 'habits' | 'sleep' | 'analytics';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: typeof Home; color: string }[] = [
  { id: 'home', label: 'Home', icon: Home, color: '#00b4d8' },
  { id: 'water', label: 'Water', icon: Droplets, color: '#00b4d8' },
  { id: 'calories', label: 'Calories', icon: Flame, color: '#ff6b35' },
  { id: 'habits', label: 'Habits', icon: CheckCircle2, color: '#4caf50' },
  { id: 'sleep', label: 'Sleep', icon: Moon, color: '#9c27b0' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: '#3b82f6' },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const activeIdx = tabs.findIndex((t) => t.id === activeTab);
  const activeColor = tabs[activeIdx]?.color || '#00b4d8';
  const [tapFlash, setTapFlash] = useState<string | null>(null);

  const handleTap = (tabId: string) => {
    setTapFlash(tabId);
    setTimeout(() => setTapFlash(null), 200);
    onTabChange(tabId as TabType);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 frosted-glass" style={{ background: 'linear-gradient(180deg, rgba(10,10,15,0) 0%, rgba(10,10,15,0.92) 15%, rgba(10,10,15,0.97) 100%)' }}>
      <div className="max-w-md mx-auto px-6">
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)' }} />
      </div>
      <div className="max-w-md mx-auto px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around p-1.5 rounded-2xl relative" style={{ backgroundColor: 'rgba(20,20,30,0.85)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 -4px 30px rgba(0,0,0,0.4)' }}>
          {/* Sliding pill indicator with gradient */}
          <motion.div layoutId="activeTabPill" className="absolute top-1.5 bottom-1.5 rounded-xl pointer-events-none" style={{ width: `calc((100% - 12px) / 6)`, left: `calc(4px + (100% - 12px) / 6 * ${activeIdx})`, background: `linear-gradient(135deg, ${activeColor}20, ${activeColor}10)`, border: `1.5px solid ${activeColor}30`, boxShadow: `0 0 20px ${activeColor}15, inset 0 0 20px ${activeColor}08` }} transition={{ type: 'spring', stiffness: 350, damping: 30 }} />

          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <motion.button key={tab.id} whileTap={{ scale: 0.88 }} onClick={() => handleTap(tab.id)} className="flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl relative transition-all z-10 cursor-pointer" style={{ minWidth: 44 }}>
                {/* Tap flash overlay */}
                {tapFlash === tab.id && (
                  <motion.div className="absolute inset-0 rounded-xl z-0 pointer-events-none" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.2 }} />
                )}
                <div className="relative flex flex-col items-center" style={{ filter: isActive ? `drop-shadow(0 0 8px ${tab.color}40)` : 'none' }}>
                  <Icon size={isActive ? 22 : 19} className={`transition-all duration-200 ${isActive ? 'animate-breathing-glow' : ''}`} style={{ color: isActive ? tab.color : '#5a5a6e', '--tw-animate-duration': isActive ? '3s' : '0s' } as React.CSSProperties} strokeWidth={isActive ? 2.2 : 1.6} />
                </div>
                <span className="text-[10px] font-bold transition-all duration-200" style={{ color: isActive ? tab.color : '#5a5a6e' }}>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
