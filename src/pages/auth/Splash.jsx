import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Pill, ShieldCheck, Activity } from 'lucide-react';

const Splash = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (currentUser) {
          navigate('/mode-selection');
        } else {
          navigate('/login');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, loading, navigate]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Background Ambient Glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-cyan/10 blur-[120px] rounded-full pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary-purple/10 blur-[120px] rounded-full pointer-events-none"
      />

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
          }}
          className="relative z-10"
        >
          {/* Logo Container */}
          <div className="w-32 h-32 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative group">
            <div className="absolute inset-0 bg-primary-cyan/5 rounded-[2.5rem] animate-pulse" />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border border-dashed border-primary-cyan/20 rounded-[2rem]"
            />

            <Pill size={56} className="text-primary-cyan drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" />

            {/* Orbiting Icons */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-background border border-primary-cyan/30 rounded-lg flex items-center justify-center shadow-lg">
                <ShieldCheck size={16} className="text-primary-cyan" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-background border border-primary-purple/30 rounded-lg flex items-center justify-center shadow-lg">
                <Activity size={16} className="text-primary-purple" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center z-10"
        >
          <h1 className="text-6xl font-black font-display tracking-tighter text-white flex items-center gap-1">
            MED<span className="text-primary-cyan">MONITOR</span>
            <span className="text-primary-purple">AI</span>
          </h1>
          <p className="mt-4 text-slate-500 font-bold uppercase tracking-[0.5em] text-xs">
            The Future of Healthcare Monitoring
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
               <motion.div
                 initial={{ x: "-100%" }}
                 animate={{ x: "100%" }}
                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 className="w-1/2 h-full bg-gradient-to-r from-transparent via-primary-cyan to-transparent"
               />
            </div>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest animate-pulse">
              Initializing Clinical Systems...
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12 flex items-center gap-2 text-slate-600"
      >
        <ShieldCheck size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise Grade Security Enabled</span>
      </motion.div>
    </div>
  );
};

export default Splash;
