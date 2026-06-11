import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const ModeSelection = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  const handleModeSelect = (mode) => {
    localStorage.setItem('medmonitor_mode', mode);
    if (mode === 'patient') {
      navigate('/patient/dashboard');
    } else {
      navigate('/caregiver/dashboard');
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-white font-display mb-3"
        >
          Welcome, {currentUser?.displayName || 'User'}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400"
        >
          Select your portal to continue
        </motion.p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Patient Mode */}
        <motion.button
          variants={item}
          onClick={() => handleModeSelect('patient')}
          className="group relative glass-card p-8 text-left transition-all duration-500 hover:border-primary-cyan/50 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <User size={80} className="text-primary-cyan" />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-primary-cyan/10 flex items-center justify-center text-primary-cyan mb-6 group-hover:shadow-cyan-glow transition-all duration-300">
              <User size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Patient Portal</h3>
            <p className="text-slate-400 mb-6">Access your personal health records, medicine tracking, and analytics.</p>
            <div className="flex items-center text-primary-cyan font-semibold group-hover:translate-x-2 transition-transform">
              Enter Dashboard →
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-cyan/0 via-primary-cyan/50 to-primary-cyan/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </motion.button>

        {/* Caregiver Mode */}
        <motion.button
          variants={item}
          onClick={() => handleModeSelect('caregiver')}
          className="group relative glass-card p-8 text-left transition-all duration-500 hover:border-primary-purple/50 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={80} className="text-primary-purple" />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-primary-purple/10 flex items-center justify-center text-primary-purple mb-6 group-hover:shadow-[0_0_20px_rgba(124,77,255,0.4)] transition-all duration-300">
              <Users size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Caregiver Portal</h3>
            <p className="text-slate-400 mb-6">Monitor multiple patients, manage alerts, and generate clinical reports.</p>
            <div className="flex items-center text-primary-purple font-semibold group-hover:translate-x-2 transition-transform">
              Enter Portal →
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-purple/0 via-primary-purple/50 to-primary-purple/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex justify-center"
      >
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5"
        >
          <LogOut size={18} />
          Sign out of account
        </button>
      </motion.div>
    </div>
  );
};

export default ModeSelection;
