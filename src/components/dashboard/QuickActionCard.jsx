import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const QuickActionCard = ({ title, icon: Icon, color, onClick, delay = 0 }) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card p-6 flex flex-col items-center justify-center text-center gap-4 group transition-all duration-300"
    >
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:shadow-lg",
        color === 'cyan' ? "bg-primary-cyan/10 text-primary-cyan group-hover:bg-primary-cyan group-hover:text-background group-hover:shadow-primary-cyan/40" :
        color === 'purple' ? "bg-primary-purple/10 text-primary-purple group-hover:bg-primary-purple group-hover:text-background group-hover:shadow-primary-purple/40" :
        color === 'orange' ? "bg-warning/10 text-warning group-hover:bg-warning group-hover:text-background group-hover:shadow-warning/40" :
        "bg-success/10 text-success group-hover:bg-success group-hover:text-background group-hover:shadow-success/40"
      )}>
        <Icon size={28} />
      </div>
      <div>
        <h4 className="font-bold text-slate-100 group-hover:text-white transition-colors">{title}</h4>
      </div>
    </motion.button>
  );
};

export default QuickActionCard;
