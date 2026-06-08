'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, AlertTriangle, Trash2, Download, Upload, CheckCircle2, User, Ruler, Activity } from 'lucide-react';
import type { UserProfile } from '@/hooks/useTrackerStore';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onResetToday: () => void;
  onResetAll: () => void;
  onExportData: () => string;
  onImportData: (json: string) => boolean;
  profile: UserProfile | null;
  onSetProfile: (profile: UserProfile | null) => void;
  bmi: number | null;
}

export default function SettingsDialog({ open, onClose, onResetToday, onResetAll, onExportData, onImportData, profile, onSetProfile, bmi }: SettingsDialogProps) {
  const [confirmAction, setConfirmAction] = useState<'today' | 'all' | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [height, setHeight] = useState(profile?.height?.toString() || '');

  const handleResetToday = () => {
    if (confirmAction === 'today') { onResetToday(); setConfirmAction(null); onClose(); }
    else setConfirmAction('today');
  };

  const handleResetAll = () => {
    if (confirmAction === 'all') { onResetAll(); setConfirmAction(null); onClose(); }
    else setConfirmAction('all');
  };

  const handleCancel = () => { setConfirmAction(null); };

  const handleExport = () => {
    const json = onExportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => { fileInputRef.current?.click(); };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        const success = onImportData(text);
        setImportStatus(success ? 'success' : 'error');
        setTimeout(() => { setImportStatus('idle'); if (success) onClose(); }, 2000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = () => {
    const w = parseFloat(weight) || 0;
    const h = parseFloat(height) || 0;
    const a = parseInt(age, 10) || 0;
    if (name.trim()) {
      onSetProfile({ name: name.trim(), age: a, weight: w, height: h });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => { setConfirmAction(null); onClose(); }} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[85%] max-w-sm max-h-[85vh] overflow-y-auto">
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.15), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-base font-bold text-white" style={{ letterSpacing: '0.02em' }}>Settings</h3>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setConfirmAction(null); onClose(); }} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <X size={16} className="text-white/60" />
                </motion.button>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col gap-3">
                {/* Profile Section */}
                <div className="rounded-xl p-3.5" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <User size={14} className="text-[#3b82f6]" />
                    <p className="text-xs font-bold uppercase" style={{ color: '#c8c8d8', letterSpacing: '0.06em' }}>Profile</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-medium text-white/40 mb-1">Name</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 outline-none" style={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.06)' }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-white/40 mb-1">Age</label>
                        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 outline-none" style={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.06)' }} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-white/40 mb-1">Weight (kg)</label>
                        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 outline-none" style={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.06)' }} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-white/40 mb-1">Height (cm)</label>
                        <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 outline-none" style={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.06)' }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveProfile} className="px-3 py-2 rounded-lg text-xs font-medium text-white cursor-pointer" style={{ backgroundColor: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>Save Profile</motion.button>
                      {bmi !== null && bmi > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: bmi < 18.5 ? 'rgba(76,175,80,0.1)' : bmi < 25 ? 'rgba(255,193,7,0.1)' : 'rgba(244,67,54,0.1)', border: '1px solid ' + (bmi < 18.5 ? 'rgba(76,175,80,0.2)' : bmi < 25 ? 'rgba(255,193,7,0.2)' : 'rgba(244,67,54,0.2)') }}>
                          <Activity size={12} style={{ color: bmi < 18.5 ? '#4caf50' : bmi < 25 ? '#ffc107' : '#f44336' }} />
                          <div>
                            <span className="text-[10px] font-bold" style={{ color: bmi < 18.5 ? '#4caf50' : bmi < 25 ? '#ffc107' : '#f44336' }}>BMI: {bmi.toFixed(1)}</span>
                            <span className="text-[9px] font-normal" style={{ color: '#8a8a9f' }}> ({bmi < 18.5 ? 'Under' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'})</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Export Data */}
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleExport} className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left cursor-pointer" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.15)' }}><Download size={18} className="text-[#3b82f6]" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white" style={{ letterSpacing: '0.01em' }}>Export Data</p>
                    <p className="text-xs font-normal mt-0.5" style={{ color: '#8a8a9f' }}>Download all tracking data as JSON file</p>
                  </div>
                </motion.button>

                {/* Import Data */}
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleImportClick} className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left cursor-pointer" style={{ backgroundColor: importStatus === 'success' ? 'rgba(76,175,80,0.1)' : importStatus === 'error' ? 'rgba(244,67,54,0.1)' : 'rgba(59,130,246,0.06)', border: importStatus === 'success' ? '1px solid rgba(76,175,80,0.25)' : importStatus === 'error' ? '1px solid rgba(244,67,54,0.25)' : '1px solid rgba(59,130,246,0.15)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: importStatus === 'success' ? 'rgba(76,175,80,0.15)' : importStatus === 'error' ? 'rgba(244,67,54,0.15)' : 'rgba(59,130,246,0.12)', border: '1px solid ' + (importStatus === 'success' ? 'rgba(76,175,80,0.2)' : importStatus === 'error' ? 'rgba(244,67,54,0.2)' : 'rgba(59,130,246,0.15)') }}>
                    {importStatus === 'success' ? <CheckCircle2 size={18} className="text-[#4caf50]" /> : importStatus === 'error' ? <AlertTriangle size={18} className="text-[#f44336]" /> : <Upload size={18} className="text-[#3b82f6]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white" style={{ letterSpacing: '0.01em' }}>{importStatus === 'success' ? 'Import Successful!' : importStatus === 'error' ? 'Import Failed' : 'Import Data'}</p>
                    <p className="text-xs font-normal mt-0.5" style={{ color: '#8a8a9f' }}>{importStatus === 'success' ? 'Data has been restored' : importStatus === 'error' ? 'Invalid file format' : 'Restore data from a JSON backup file'}</p>
                  </div>
                </motion.button>
                <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-[10px] font-medium" style={{ color: '#5a5a6e' }}>Danger Zone</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Reset Today */}
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleResetToday} className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left cursor-pointer" style={{ backgroundColor: confirmAction === 'today' ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)', border: confirmAction === 'today' ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: confirmAction === 'today' ? 'rgba(255,107,53,0.2)' : 'rgba(255,107,53,0.1)', border: '1px solid ' + (confirmAction === 'today' ? 'rgba(255,107,53,0.3)' : 'rgba(255,107,53,0.15)') }}>
                    {confirmAction === 'today' ? <AlertTriangle size={18} className="text-[#ff6b35]" /> : <RotateCcw size={18} className="text-[#ff6b35]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white" style={{ letterSpacing: '0.01em' }}>Reset Today&apos;s Data</p>
                    <p className="text-xs font-normal mt-0.5" style={{ color: '#8a8a9f' }}>{confirmAction === 'today' ? 'Are you sure? This clears today\'s water, food, and habits.' : 'Clear today\'s water count, food log, and habit completions'}</p>
                  </div>
                  {confirmAction === 'today' && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); handleCancel(); }} className="px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)', color: '#8a8a9f' }}>Cancel</motion.button>
                  )}
                </motion.button>

                {/* Reset All */}
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleResetAll} className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left cursor-pointer" style={{ backgroundColor: confirmAction === 'all' ? 'rgba(244,67,54,0.12)' : 'rgba(255,255,255,0.03)', border: confirmAction === 'all' ? '1px solid rgba(244,67,54,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: confirmAction === 'all' ? 'rgba(244,67,54,0.2)' : 'rgba(244,67,54,0.1)', border: '1px solid ' + (confirmAction === 'all' ? 'rgba(244,67,54,0.3)' : 'rgba(244,67,54,0.15)') }}>
                    {confirmAction === 'all' ? <AlertTriangle size={18} className="text-[#f44336]" /> : <Trash2 size={18} className="text-[#f44336]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white" style={{ letterSpacing: '0.01em' }}>Reset All Data</p>
                    <p className="text-xs font-normal mt-0.5" style={{ color: '#8a8a9f' }}>{confirmAction === 'all' ? '⚠️ This is permanent! All tracking data will be lost.' : 'Clear everything — water, food, habits, sleep, and history'}</p>
                  </div>
                  {confirmAction === 'all' && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); handleCancel(); }} className="px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)', color: '#8a8a9f' }}>Cancel</motion.button>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
