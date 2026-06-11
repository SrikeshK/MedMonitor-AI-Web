import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const AuthCard = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "glass-card p-8 shadow-2xl relative overflow-hidden group border-white/10",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-cyan/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        className
      )}
    >
      {/* Decorative Cyan Glow in Corner */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary-cyan/10 rounded-full blur-2xl group-hover:bg-primary-cyan/20 transition-all duration-500" />

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default AuthCard;
