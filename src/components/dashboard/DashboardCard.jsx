import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const DashboardCard = ({ children, className, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "glass-card p-6 relative overflow-hidden group hover:bg-white/[0.07] transition-colors duration-500",
        className
      )}
    >
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-cyan/5 to-primary-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default DashboardCard;
