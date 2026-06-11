import React from 'react';
import { Search, Plus, Pill, Bell, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const TopNavbar = () => {
  const { currentUser } = useAuth();

  return (
    <header className="h-20 flex items-center justify-between px-6 md:px-8 border-b border-white/5 bg-background/50 backdrop-blur-xl z-30 sticky top-0">
      {/* Mobile Logo */}
      <div className="flex items-center gap-4 lg:hidden">
        <div className="w-10 h-10 rounded-xl bg-primary-cyan flex items-center justify-center shadow-lg shadow-primary-cyan/20">
          <Pill size={22} className="text-background" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white font-display leading-tight">MedMonitor</h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-primary-cyan font-bold">Health AI</p>
        </div>
      </div>

      {/* Search Bar - Desktop */}
      <div className="hidden lg:flex items-center gap-3 bg-white/[0.03] border border-white/10 px-5 py-2.5 rounded-2xl w-[400px] transition-all focus-within:border-primary-cyan/40 focus-within:bg-white/5 focus-within:ring-4 focus-within:ring-primary-cyan/5 group">
        <Search size={18} className="text-slate-500 group-focus-within:text-primary-cyan transition-colors" />
        <input
          type="text"
          placeholder="Search prescriptions, logs, or analytics..."
          className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder:text-slate-500 font-medium"
        />
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-500 font-bold">
          <span className="text-[12px]">⌘</span>K
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-success/5 border border-success/20 rounded-xl">
           <ShieldCheck size={14} className="text-success" />
           <span className="text-[10px] font-bold text-success uppercase tracking-widest">Encrypted</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-2.5 text-slate-400 hover:text-white transition-colors"
        >
          <Bell size={22} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-cyan rounded-full border-2 border-background" />
        </motion.button>

        <div className="w-px h-8 bg-white/10 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">{currentUser?.displayName || 'Patient'}</p>
            <p className="text-[10px] text-primary-cyan mt-1 font-bold uppercase tracking-widest">Medical ID: #MM-2401</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-cyan/20 to-primary-purple/20 p-[1px] shadow-xl group cursor-pointer"
          >
            <div className="w-full h-full rounded-[11px] bg-background flex items-center justify-center overflow-hidden border border-white/10">
               <img
                 src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid || 'default'}&backgroundColor=0B1120`}
                 alt="Avatar"
                 className="w-full h-full object-cover"
               />
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
