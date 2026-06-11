import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showLoading = useCallback((show) => setGlobalLoading(show), []);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <UIContext.Provider value={{ showLoading, addToast, removeToast }}>
      {children}

      {/* Global Loading Overlay */}
      <AnimatePresence>
        {globalLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-24 h-24 rounded-full border-2 border-primary-cyan shadow-[0_0_30px_rgba(0,229,255,0.3)]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-primary-cyan rounded-full animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast System */}
      <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </UIContext.Provider>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success" />,
    error: <AlertCircle className="w-5 h-5 text-error" />,
    info: <Info className="w-5 h-5 text-primary-cyan" />,
    warning: <AlertCircle className="w-5 h-5 text-warning" />,
  };

  const glows = {
    success: "shadow-[0_0_15px_rgba(34,197,94,0.2)] border-success/20",
    error: "shadow-[0_0_15px_rgba(239,68,68,0.2)] border-error/20",
    info: "shadow-[0_0_15px_rgba(0,229,255,0.2)] border-primary-cyan/20",
    warning: "shadow-[0_0_15px_rgba(245,158,11,0.2)] border-warning/20",
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-background/90 backdrop-blur-xl border rounded-xl min-w-[300px] ${glows[toast.type]}`}>
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <p className="text-sm font-medium text-white/90 flex-grow">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-white/40 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
