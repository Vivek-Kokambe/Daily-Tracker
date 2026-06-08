'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle2, Droplets, Flame, Moon, Undo2 } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  color: string;
  icon: typeof CheckCircle2;
  undoAction?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'info' | 'warning', category?: string, undoAction?: () => void) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const categoryConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  water: { color: '#00b4d8', icon: Droplets },
  calories: { color: '#ff6b35', icon: Flame },
  habits: { color: '#4caf50', icon: CheckCircle2 },
  sleep: { color: '#9c27b0', icon: Moon },
  achievement: { color: '#ffd54f', icon: CheckCircle2 },
  default: { color: '#00b4d8', icon: CheckCircle2 },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success', category = 'default', undoAction?: () => void) => {
    const config = categoryConfig[category] || categoryConfig.default;
    const id = Date.now().toString();
    const timeout = undoAction ? 4000 : 2500;
    setToasts((prev) => [...prev, { id, message, type, color: config.color, icon: config.icon, undoAction }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, timeout);
  }, []);

  const handleUndo = useCallback((toastId: string, undoAction?: () => void) => {
    if (undoAction) {
      undoAction();
    }
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-0 right-0 z-[60] flex flex-col items-center pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = toast.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="pointer-events-auto mb-2"
              >
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl max-w-xs"
                  style={{
                    backgroundColor: '#1a1a2e',
                    border: `1px solid ${toast.color}30`,
                    boxShadow: `0 8px 30px rgba(0,0,0,0.4), 0 0 20px ${toast.color}15`,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${toast.color}20` }}
                  >
                    <Icon size={12} style={{ color: toast.color }} />
                  </div>
                  <p className="text-xs font-medium text-white/90 flex-1">{toast.message}</p>
                  {toast.undoAction && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleUndo(toast.id, toast.undoAction)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
                      style={{
                        backgroundColor: `${toast.color}20`,
                        border: `1px solid ${toast.color}30`,
                      }}
                    >
                      <Undo2 size={10} style={{ color: toast.color }} />
                      <span className="text-[10px] font-bold" style={{ color: toast.color }}>Undo</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
