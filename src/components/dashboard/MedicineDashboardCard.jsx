import React from 'react';
import { motion } from 'framer-motion';
import { Pill, Clock, CheckCircle2, Circle, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const statusBadgeStyles = {
  'UPCOMING': 'text-primary-cyan bg-primary-cyan/10 border-primary-cyan/20',
  'COMPLETED': 'text-success bg-success/10 border-success/20',
  'MISSED': 'text-error bg-error/10 border-error/20',
  'DUE_NOW': 'text-warning bg-warning/10 border-warning/20 animate-pulse',
  'PARTIAL': 'text-primary-purple bg-primary-purple/10 border-primary-purple/20',
};

const slotStatusIcons = {
  'Taken': <CheckCircle2 size={14} className="text-success" />,
  'Missed': <AlertCircle size={14} className="text-error" />,
  'Upcoming': <Circle size={14} className="text-slate-500" />,
  'Due Now': <Clock size={14} className="text-warning animate-pulse" />,
};

const MedicineDashboardCard = ({ name, dosage, slots, overallStatus, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ translateY: -5 }}
      className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:border-primary-cyan/30 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-cyan/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-cyan/10 transition-colors" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-cyan/10 flex items-center justify-center text-primary-cyan group-hover:scale-110 transition-transform">
            <Pill size={20} />
          </div>
          <div>
            <h4 className="font-bold text-white group-hover:text-primary-cyan transition-colors">{name}</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{dosage}</p>
          </div>
        </div>
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-md border tracking-widest",
          statusBadgeStyles[overallStatus] || statusBadgeStyles['UPCOMING']
        )}>
          {overallStatus}
        </span>
      </div>

      <div className="space-y-3 relative z-10">
        {slots.map((slot, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 capitalize">{slot.slot}:</span>
              <span className="text-[10px] text-slate-500 font-medium">{slot.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[10px] font-bold",
                slot.status === 'Taken' ? "text-success" :
                slot.status === 'Missed' ? "text-error" :
                slot.status === 'Due Now' ? "text-warning" : "text-slate-400"
              )}>
                {slot.status}
              </span>
              {slotStatusIcons[slot.status] || <HelpCircle size={14} className="text-slate-500" />}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default MedicineDashboardCard;
