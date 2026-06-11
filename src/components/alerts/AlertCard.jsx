import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle2, AlertCircle,
  XCircle, ChevronRight, Pill,
  Droplets, Eye, Check
} from 'lucide-react';
import { CLASSIFICATION } from '../../utils/medicineStatusEngine';

const AlertCard = ({ alert, onView, onMarkViewed }) => {
  const getStyles = () => {
    switch (alert.classification) {
      case CLASSIFICATION.DUE_NOW:
        return {
          container: 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
          icon: 'text-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          label: 'DUE NOW',
          glow: 'after:absolute after:inset-0 after:rounded-2xl after:shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]'
        };
      case CLASSIFICATION.MISSED:
        return {
          container: 'border-rose-500/50 bg-rose-500/5 animate-pulse-subtle',
          icon: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          label: 'MISSED',
          glow: ''
        };
      case CLASSIFICATION.COMPLETED:
        return {
          container: 'border-emerald-500/30 bg-emerald-500/5 opacity-80',
          icon: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          label: 'TAKEN',
          glow: ''
        };
      default:
        return {
          container: 'border-slate-700 bg-slate-900/40',
          icon: 'text-slate-400',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          label: 'UPCOMING',
          glow: ''
        };
    }
  };

  const styles = getStyles();
  const Icon = alert.type === 'SYRUP' ? Droplets : Pill;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card p-5 relative overflow-hidden group transition-all duration-300 ${styles.container} ${styles.glow}`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex gap-4">
          <div className={`p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 ${styles.icon}`}>
            <Icon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                {alert.name}
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wider ${styles.badge}`}>
                {styles.label}
              </span>
            </div>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <span className="font-medium text-slate-300">{alert.dosage}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>{alert.slot}</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-white font-mono font-bold text-lg">
            <Clock size={16} className="text-cyan-400" />
            {alert.time}
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Scheduled</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Food Timing</span>
            <span className="text-xs text-slate-300 font-medium">{alert.foodTiming?.replace('_', ' ')}</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          {alert.remainingQuantity <= alert.threshold && (
             <div className="flex items-center gap-1.5 text-rose-400">
                <AlertCircle size={14} />
                <span className="text-[10px] font-bold uppercase">Low Stock</span>
             </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onView(alert)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium border border-slate-700/50 transition-all"
            title="View Medicine Details"
          >
            <Eye size={14} /> View
          </button>
          <button
            onClick={() => onMarkViewed(alert.id)}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 rounded-lg text-[11px] font-medium border border-cyan-500/20 transition-all"
            title="Acknowledge Alert"
          >
            <Check size={14} /> Mark Viewed
          </button>
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-10 ${styles.icon}`} />
    </motion.div>
  );
};

export default AlertCard;
