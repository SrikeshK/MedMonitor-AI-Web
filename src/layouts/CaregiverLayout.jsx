import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, BarChart3, FileText, User, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserProfile } from '../services/userService';
import EditUsernameModal from '../components/EditUsernameModal';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/caregiver/dashboard' },
  { icon: Users, label: 'Patients', path: '/caregiver/patients' },
  { icon: Bell, label: 'Alerts', path: '/caregiver/alerts' },
  { icon: BarChart3, label: 'Analytics', path: '/caregiver/analytics' },
];

const CaregiverLayout = () => {
  const { logout, currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile);
    });
    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="flex h-screen bg-background overflow-hidden text-slate-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white/[0.02] border-r border-white/5 p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-purple/5 to-transparent pointer-events-none" />

        <div className="mb-10 relative px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-purple rounded-xl flex items-center justify-center shadow-lg shadow-primary-purple/20">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-tight">MedMonitor</h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary-purple font-bold">Caregiver AI</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 relative">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive
                  ? "bg-primary-purple/10 text-primary-purple border border-primary-purple/20 shadow-[0_0_20px_rgba(124,77,255,0.1)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} className={cn("transition-transform duration-300 group-hover:scale-110")} />
              <span className="font-semibold tracking-wide">{item.label}</span>
              <motion.div
                className="absolute inset-y-0 left-0 w-1 bg-primary-purple"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: window.location.pathname === item.path ? 1 : 0 }}
              />
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5 relative">

          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 text-error/70 hover:text-error hover:bg-error/5 rounded-xl transition-all w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md border-b border-white/5 z-10">
          <div className="lg:hidden flex items-center gap-3">
             <div className="w-8 h-8 bg-primary-purple rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
             </div>
             <h1 className="text-lg font-bold text-white font-display">MedMonitor</h1>
          </div>

          <div className="flex items-center gap-6 ml-auto">
             <div 
               className="hidden md:flex flex-col items-end cursor-pointer select-none group"
               onClick={() => setIsEditModalOpen(true)}
               title="Click to edit username"
             >
                <p className="text-sm font-bold text-white group-hover:text-primary-purple transition-colors">
                  {userProfile?.fullName || currentUser?.displayName || 'Caregiver'}
                </p>
                <p className="text-[10px] text-primary-purple font-bold uppercase tracking-widest">Medical Professional</p>
             </div>
             <NavLink to="/caregiver/profile">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-2xl bg-primary-purple/10 flex items-center justify-center border border-primary-purple/20 shadow-lg shadow-primary-purple/5 group cursor-pointer"
                >
                  <User size={24} className="text-primary-purple group-hover:scale-110 transition-transform" />
                </motion.div>
             </NavLink>
          </div>
        </header>

        <EditUsernameModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentName={userProfile?.fullName || currentUser?.displayName || ''}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary-purple/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-primary-cyan/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto p-6 md:p-10 pb-32 lg:pb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={window.location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-4 z-50">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300 px-2 py-1 rounded-lg",
                isActive ? "text-primary-purple scale-110" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                window.location.pathname === item.path ? "bg-primary-purple/10" : ""
              )}>
                <item.icon size={22} />
              </div>
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default CaregiverLayout;
