import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-24 h-24 bg-primary-cyan/20 rounded-3xl flex items-center justify-center border border-primary-cyan/30 shadow-cyan-glow"
      >
        <div className="w-12 h-12 bg-primary-cyan rounded-full" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-primary-cyan font-display font-semibold tracking-widest uppercase text-sm"
      >
        Initializing MedMonitor AI
      </motion.p>
    </div>
  );
};

export default LoadingScreen;
