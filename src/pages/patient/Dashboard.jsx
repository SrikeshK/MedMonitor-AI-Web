import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame,
  Plus,
  Users,
  Package,
  BarChart3,
  TrendingUp,
  Calendar,
  AlertCircle,
  Layout,
  SearchX,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMedicines } from '../../hooks/useMedicines';
import { useAnalytics } from '../../hooks/useAnalytics';
import { subscribeToUserProfile } from '../../services/userService';
import { getInventoryState, INVENTORY_STATES } from '../../services/medicineService';
import DashboardCard from '../../components/dashboard/DashboardCard';
import SectionHeader from '../../components/dashboard/SectionHeader';
import MedicineDashboardCard from '../../components/dashboard/MedicineDashboardCard';
import CircularProgressCard from '../../components/dashboard/CircularProgressCard';
import QuickActionCard from '../../components/dashboard/QuickActionCard';
import { DashboardCardSkeleton, MedicineCardSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { cn } from '../../utils/cn';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { dashboardMeds, adherence, stats: medicineStats, loading: medsLoading, medicines } = useMedicines();
  const { stats: analyticsStats, loading: analyticsLoading } = useAnalytics();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const loading = medsLoading || analyticsLoading;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8" data-testid="dashboard-loading">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg" />
            <div className="h-4 w-64 bg-white/5 animate-pulse rounded-lg" />
          </div>
          <div className="h-20 w-48 bg-white/5 animate-pulse rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-64 bg-white/5 animate-pulse rounded-3xl" />
            <div className="space-y-4">
              <div className="h-8 w-48 bg-white/5 animate-pulse rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MedicineCardSkeleton />
                <MedicineCardSkeleton />
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Updated inventory logic using Android Inventory Status Engine
  const inventoryAlerts = medicines
    .map(m => ({ ...m, inventoryState: getInventoryState(m) }))
    .filter(m => m.inventoryState !== INVENTORY_STATES.NORMAL)
    .sort((a, b) => {
      const order = { [INVENTORY_STATES.EMPTY]: 1, [INVENTORY_STATES.CRITICAL]: 2, [INVENTORY_STATES.LOW]: 3 };
      return (order[a.inventoryState] || 99) - (order[b.inventoryState] || 99);
    });

  const getInventoryBadgeStyle = (state) => {
    switch (state) {
      case INVENTORY_STATES.EMPTY:
        return "text-error bg-error/10 border-error/20";
      case INVENTORY_STATES.CRITICAL:
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case INVENTORY_STATES.LOW:
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      default:
        return "text-success bg-success/10 border-success/20";
    }
  };

  const streak = analyticsStats?.currentStreak || 0;
  const weeklyTrend = analyticsStats?.weeklyTrend || [];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
      data-testid="patient-dashboard"
    >
      {/* A. HEADER SECTION */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
          <h1 className="text-4xl font-bold font-display text-white tracking-tight">
            Hello, <span className="text-primary-cyan">{userProfile?.fullName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'Patient'}</span>
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2 font-medium">
            <TrendingUp size={16} className="text-success" />
            {adherence >= 80 ? "You're doing great! Keep up the consistency." : "Let's try to improve your adherence today."}
          </p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
          whileHover={{ scale: 1.05, translateY: -5 }}
          data-testid="streak-badge"
          className="bg-white/[0.03] border border-primary-purple/20 backdrop-blur-xl px-6 py-4 rounded-2xl flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-primary-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-full bg-primary-purple/20 flex items-center justify-center text-primary-purple shadow-[0_0_15px_rgba(124,77,255,0.3)] relative z-10">
            <Flame size={24} fill="currentColor" />
          </div>
          <div className="relative z-10">
            <p className="text-2xl font-bold text-white leading-none">
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Consistency Streak</p>
          </div>
        </motion.div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column - Adherence & Medicines */}
        <div className="lg:col-span-2 space-y-8">

          {/* B. MAIN ADHERENCE CARD */}
          <DashboardCard data-testid="adherence-card" className="bg-gradient-to-br from-white/[0.05] to-transparent border-white/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-cyan/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
              <CircularProgressCard
                percentage={adherence}
                title="Daily Adherence"
                subtitle={adherence === 100 ? "Perfect Score!" : "Daily Progress"}
                info={[
                  { label: 'Taken', value: medicineStats.taken },
                  { label: 'Missed', value: medicineStats.missed },
                  { label: 'Remaining', value: medicineStats.remaining }
                ]}
              />
              <div className="flex-1 space-y-4 w-full">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-primary-cyan" />
                    Weekly Insights
                  </h4>
                  <div className="flex items-end gap-3 h-24">
                    {weeklyTrend.length > 0 ? (
                      weeklyTrend.map((dayData, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${dayData.adherence}%` }}
                            transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                            className={cn(
                              "w-full rounded-t-lg transition-all duration-300 relative",
                              dayData.adherence > 80 ? "bg-primary-cyan shadow-[0_0_15px_rgba(0,229,255,0.3)]" : "bg-white/10 group-hover:bg-white/20"
                            )}
                          />
                          <span className="text-[10px] text-slate-500 font-bold">
                            {dayData.day[0]}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                         <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No historical data yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* C. TODAY'S MEDICINES SECTION */}
          <section>
            <SectionHeader
              title="Today's Schedule"
              subtitle={dashboardMeds.length > 0 ? "Realtime health tracking active" : ""}
            />
            {dashboardMeds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" data-testid="today-schedule">
                {dashboardMeds.map((med, idx) => (
                  <MedicineDashboardCard
                    key={med.id}
                    name={med.name}
                    dosage={med.dosage}
                    slots={med.slots}
                    overallStatus={med.overallStatus}
                    delay={0.2 + idx * 0.05}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="No medicines scheduled"
                description="Your treatment plan is clear for today. Add medicines to start tracking your health journey."
                actionLabel="Add Medicine"
                onAction={() => navigate('/patient/medicines')}
                data-testid="schedule-empty"
              />
            )}
          </section>
        </div>

        {/* Right Column - Quick Actions & Info */}
        <div className="space-y-8">
          {/* D. QUICK ACTIONS */}
          <section>
            <SectionHeader title="Quick Actions" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <QuickActionCard
                title="Add Med"
                icon={Plus}
                color="cyan"
                delay={0.4}
                onClick={() => navigate('/patient/medicines')}
                data-testid="quick-add-med"
              />
              <QuickActionCard
                title="Circle"
                icon={Users}
                color="purple"
                delay={0.5}
                onClick={() => navigate('/patient/care-circle')}
                data-testid="quick-care-circle"
              />
              <QuickActionCard
                title="Stock"
                icon={Package}
                color="orange"
                delay={0.6}
                onClick={() => navigate('/patient/inventory')}
                data-testid="quick-inventory"
              />
              <QuickActionCard
                title="Stats"
                icon={BarChart3}
                color="success"
                delay={0.7}
                onClick={() => navigate('/patient/analytics')}
                data-testid="quick-analytics"
              />
            </div>
          </section>

          {/* E. HEALTH TIP CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-6 rounded-3xl bg-primary-cyan/5 border border-primary-cyan/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <AlertCircle size={80} className="text-primary-cyan" />
            </div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary-cyan/20 text-primary-cyan shadow-lg shadow-primary-cyan/10">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">MedMonitor AI Tip</h4>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Consistency is key. Try setting your medicines near a common daily object to never miss a dose.
                </p>
              </div>
            </div>
          </motion.div>

          {/* F. INVENTORY ALERTS */}
          <section>
            <SectionHeader title="Inventory Alerts" />
            <div className="space-y-3 mt-4" data-testid="inventory-alerts-list">
              {inventoryAlerts.length > 0 ? (
                inventoryAlerts.slice(0, 4).map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between group hover:bg-white/[0.05] transition-all"
                  >
                    <div>
                      <p className="font-bold text-slate-200 group-hover:text-primary-cyan transition-colors">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.remainingQuantity} units remaining</p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md border",
                        getInventoryBadgeStyle(item.inventoryState)
                      )}>
                        {item.inventoryState}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-6 rounded-2xl bg-success/5 border border-success/10 text-center">
                  <p className="text-xs text-success font-bold uppercase tracking-widest">Inventory Optimized</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default PatientDashboard;
