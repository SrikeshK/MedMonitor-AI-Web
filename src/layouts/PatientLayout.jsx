import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopNavbar from '../components/layout/TopNavbar';
import BottomNav from '../components/layout/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';

const PatientLayout = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden text-slate-200">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopNavbar />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {/* Subtle background glow effects */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-cyan/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-purple/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto p-6 md:p-8 pb-32 lg:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={window.location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

export default PatientLayout;
