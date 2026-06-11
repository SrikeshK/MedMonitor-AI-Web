import React from 'react';
import { motion } from 'framer-motion';
import { Pill, Clock, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const statusStyles = {
  'Upcoming': 'text-primary-cyan bg-primary-cyan/10 border-primary-cyan/20',
  'Taken': 'text-success bg-success/10 border-success/20',
  'Missed': 'text-error bg-error/10 border-error/20',
  'Due Now': 'text-warning bg-warning/10 border-warning/20 animate-pulse',
};

const MedicineStatusCard = ({ name, dosage, time, status, icon: Icon = Pill, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12",
        status === 'Taken' ? "bg-success/20 text-success" : "bg-primary-cyan/20 text-primary-cyan"
      )}>
        <Icon size={24} />
      </div>

      <div className="flex-1">
        <h4 className="font-semibold text-slate-100 group-hover:text-primary-cyan transition-colors">{name}</h4>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={12} />
            {time}
          </span>
          <span className="text-xs text-slate-400">{dosage}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className={cn(
          "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border",
          statusStyles[status] || statusStyles['Upcoming']
        )}>
          {status}
        </span>
        <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
      </div>
    </motion.div>
  );
};

export default MedicineStatusCard;
