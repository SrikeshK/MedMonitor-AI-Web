import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  Bell,
  BarChart3,
  FileText,
  Package,
  User,
  Settings,
  Users,
  LogOut,
  Shield,
  MessageSquare
} from 'lucide-react';

import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/patient/dashboard' },
  { icon: Pill, label: 'Medicines', path: '/patient/medicines' },
  { icon: Bell, label: 'Alerts', path: '/patient/alerts' },
  { icon: BarChart3, label: 'Analytics', path: '/patient/analytics' },
  { icon: FileText, label: 'Reports', path: '/patient/reports' },
  { icon: Package, label: 'Inventory', path: '/patient/inventory' },
  { icon: Users, label: 'Care Circle', path: '/patient/care-circle' },
  { icon: MessageSquare, label: 'Community', path: '/patient/community' },

];

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-white/[0.01] border-r border-white/5 p-6 relative z-20 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-64 bg-primary-cyan/5 blur-[100px] pointer-events-none" />

      <div className="mb-10 flex items-center gap-3 px-4 relative z-10">
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.6 }}
          className="w-10 h-10 rounded-xl bg-primary-cyan shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center justify-center"
        >
          <Pill size={22} className="text-background" />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold text-white font-display tracking-tight leading-none">MedMonitor</h2>
          <p className="text-[9px] uppercase tracking-[0.3em] text-primary-cyan font-bold mt-1">Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 relative z-10">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
              isActive
                ? "bg-primary-cyan/10 text-primary-cyan border border-primary-cyan/20 shadow-[0_0_20px_rgba(0,229,255,0.05)]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute left-0 w-1 h-6 bg-primary-cyan rounded-r-full shadow-[0_0_15px_rgba(0,229,255,0.8)]"
                  />
                )}
                <item.icon size={20} className={cn("transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary-cyan" : "text-slate-500 group-hover:text-slate-300")} />
                <span className="font-semibold tracking-wide text-sm">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-2 pt-6 border-t border-white/5 relative z-10">

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-error/60 hover:text-error hover:bg-error/5 transition-all w-full"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>

        <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-primary-cyan/20 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Shield size={16} className="text-success" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Data Security</p>
              <p className="text-[11px] text-white font-bold">AES-256 Active</p>
            </div>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <motion.div
               animate={{ x: ['-100%', '100%'] }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
               className="h-full w-1/2 bg-gradient-to-r from-transparent via-success/40 to-transparent"
             />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
