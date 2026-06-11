import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const AuthLayout = () => {
  const location = useLocation();
  const isModeSelection = location.pathname === '/mode-selection';
  const isSplash = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary-cyan/20 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-purple/20 rounded-full blur-[120px]"
      />

      <div className={cn(
        "w-full z-10 flex flex-col items-center",
        isModeSelection ? "max-w-5xl" : "max-w-md"
      )}>
        {!isSplash && !isModeSelection && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient mb-2 font-display tracking-tight">MedMonitor AI</h1>
            <p className="text-slate-400 font-medium tracking-wide uppercase text-xs">Next-gen Healthcare Monitoring</p>
          </div>
        )}

        <div className={cn(
          "w-full",
          !isSplash && !isModeSelection ? "glass-card p-8 shadow-2xl" : ""
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
