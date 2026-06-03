import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { EASE_OUT, useReducedMotion } from '../lib/motion';

export type ToastVariant = 'info' | 'success' | 'error';

interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  /** Backward-compatible: showToast(message) shows an info toast. */
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLE: Record<ToastVariant, { bar: string; icon: ReactNode }> = {
  success: { bar: '#0f9d76', icon: <CheckCircle2 className="w-5 h-5" style={{ color: '#0f9d76' }} /> },
  error: { bar: '#e11d48', icon: <AlertTriangle className="w-5 h-5" style={{ color: '#e11d48' }} /> },
  info: { bar: 'var(--bx-accent-2)', icon: <Info className="w-5 h-5" style={{ color: 'var(--bx-accent-2)' }} /> },
};

function ToastViewport({ toasts, onClose }: { toasts: ToastMessage[]; onClose: (id: number) => void }) {
  const reduce = useReducedMotion();
  return (
    <div
      className="fixed inset-x-0 bottom-5 z-[9999] flex flex-col items-center gap-2 px-4 pointer-events-none"
      role="region"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="pointer-events-auto w-full max-w-sm flex items-center gap-3 rounded-xl bg-white pl-3 pr-2 py-3 shadow-xl border border-gray-100"
            style={{ borderLeft: `4px solid ${VARIANT_STYLE[t.variant].bar}` }}
          >
            <span className="flex-shrink-0">{VARIANT_STYLE[t.variant].icon}</span>
            <p className="flex-1 text-sm font-medium text-gray-800">{t.message}</p>
            <button
              onClick={() => onClose(t.id)}
              aria-label="Dismiss notification"
              className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 3500) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
      window.setTimeout(() => removeToast(id), duration);
    },
    [removeToast],
  );

  const value: ToastContextValue = {
    showToast,
    success: useCallback((m: string, d?: number) => showToast(m, 'success', d), [showToast]),
    error: useCallback((m: string, d?: number) => showToast(m, 'error', d), [showToast]),
    info: useCallback((m: string, d?: number) => showToast(m, 'info', d), [showToast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Access the app-wide toast API. Must be used under <ToastProvider> (mounted in App).
 * Returns showToast + success/error/info helpers.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
