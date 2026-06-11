import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  Bell,
  BarChart3,
  Users
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/patient/dashboard' },
  { icon: Pill, label: 'Meds', path: '/patient/medicines' },
  { icon: Users, label: 'Circle', path: '/patient/care-circle' },
  { icon: Bell, label: 'Alerts', path: '/patient/alerts' },
  { icon: BarChart3, label: 'Stats', path: '/patient/analytics' },
];

const BottomNav = () => {
  return (
    <nav className="lg:hidden fixed bottom-6 left-4 right-4 h-20 bg-background/60 backdrop-blur-2xl border border-white/10 flex items-center justify-around px-2 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] py-2">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-16 h-16 rounded-[2rem] relative group",
            isActive ? "text-primary-cyan" : "text-slate-500 hover:text-slate-300"
          )}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute inset-0 bg-primary-cyan/10 border border-primary-cyan/20 rounded-[2rem]"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                />
              )}
              <item.icon
                size={22}
                className={cn(
                  "transition-all duration-300 relative z-10",
                  isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" : "group-hover:scale-110"
                )}
              />
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest relative z-10 transition-all",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
