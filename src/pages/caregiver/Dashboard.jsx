import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Plus,
  Bell,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  SearchX
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import {
  subscribeToPatients,
  subscribeToPatientLogs,
  calculateOverallCaregiverStats
} from '../../services/caregiverService';
import GlowButton from '../../components/GlowButton';
import AddPatientModal from '../../components/caregiver/AddPatientModal';
import { DashboardCardSkeleton } from '../../components/Skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { cn } from '../../utils/cn';

const CaregiverDashboard = () => {
  const { currentUser } = useAuth();
  const { addToast } = useUI();
  const [patients, setPatients] = useState([]);
  const [patientsData, setPatientsData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsubPatients = subscribeToPatients(currentUser.uid, (patientList) => {
      setPatients(patientList);
      if (patientList.length === 0) {
        setLoading(false);
        return;
      }

      const unsubscribers = patientList.map(patient => {
        return subscribeToPatientLogs(patient.id, (logs) => {
          setPatientsData(prev => ({
            ...prev,
            [patient.id]: { patient, logs }
          }));
          setLoading(false);
        });
      });

      return () => unsubscribers.forEach(unsub => unsub());
    }, (error) => {
      setLoading(false);
      addToast({ message: "Failed to load patient data", type: "error" });
    });

    return () => unsubPatients();
  }, [currentUser, addToast]);

  const { stats, recentLogs, chartData } = useMemo(() => {
    const dataArray = Object.values(patientsData);
    if (dataArray.length === 0) {
      return {
        stats: { totalPatients: patients.length, adherence: 0, missedToday: 0, activeAlerts: 0 },
        recentLogs: [],
        chartData: []
      };
    }

    const calculatedStats = calculateOverallCaregiverStats(dataArray);

    const allLogs = dataArray
      .flatMap(d => d.logs.map(log => ({
        ...log,
        patientName: d.patient.name,
        patientId: d.patient.id,
        timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)
      })))
      .sort((a, b) => b.timestamp - a.timestamp);

    // Group logs by day for the chart
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const historicalData = last7Days.map(date => {
      const dayLogs = allLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === date.getTime();
      });

      const taken = dayLogs.filter(l => ['TAKEN', 'COMPLETED', 'DELAYED'].includes(l.status)).length;
      const total = dayLogs.length;
      const rate = total === 0 ? 0 : Math.round((taken / total) * 100);

      return {
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: rate
      };
    });

    return {
      stats: calculatedStats,
      recentLogs: allLogs.slice(0, 8),
      chartData: historicalData
    };
  }, [patientsData, patients.length]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg" />
          <div className="h-12 w-40 bg-white/5 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[400px] bg-white/5 animate-pulse rounded-3xl" />
          <div className="h-[400px] bg-white/5 animate-pulse rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-2 text-primary-purple mb-2">
            <ShieldCheck size={18} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Command Center Active</span>
          </div>
          <h1 className="text-4xl font-bold font-display text-white tracking-tight">
            Caregiver <span className="text-primary-purple">Insights</span>
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 font-medium">
            <Activity className="w-4 h-4 text-primary-purple" />
            Real-time monitoring for {patients.length} active patients.
          </p>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <GlowButton
            variant="secondary"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6"
          >
            <Plus className="w-5 h-5" />
            Add Patient
          </GlowButton>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          color="blue"
          trend="Live count"
          index={0}
        />
        <StatCard
          title="Avg Adherence"
          value={`${stats.adherence}%`}
          icon={TrendingUp}
          color="purple"
          trend="Overall performance"
          index={1}
        />
        <StatCard
          title="Missed Today"
          value={stats.missedToday}
          icon={AlertTriangle}
          color="red"
          trend={stats.missedToday > 0 ? "Immediate Attention" : "All on track"}
          urgent={stats.missedToday > 0}
          index={2}
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          icon={Bell}
          color="yellow"
          trend="Real-time notifications"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Adherence Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-3xl p-8 overflow-hidden group relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-purple/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-primary-purple transition-colors">
                Population Adherence
              </h3>
              <p className="text-sm text-slate-500 font-medium">Real-time performance trend</p>
            </div>
          </div>

          <div className="h-[300px] w-full relative z-10">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#475569"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{fontWeight: 600}}
                  />
                  <YAxis
                    stroke="#475569"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tick={{fontWeight: 600}}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#8b5cf6', fontWeight: 700 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8b5cf6"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorAdherence)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                 <SearchX className="text-slate-700 mb-2" size={48} />
                 <p className="text-slate-500 font-medium">Insufficient data for trend analysis</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Alerts Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2" data-testid="live-activity-heading">
              <Clock className="w-5 h-5 text-primary-purple" />
              Live Activity
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-primary-purple/10 text-primary-purple px-3 py-1 rounded-full border border-primary-purple/20">
              Synced
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {recentLogs.length > 0 ? (
              recentLogs.map((log, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  key={idx}
                  className="flex gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary-purple/20 hover:bg-white/5 transition-all group"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                    log.status === 'TAKEN' ? 'bg-success/10 text-success' :
                    log.status === 'MISSED' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                  )}>
                    {log.status === 'TAKEN' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-white truncate">{log.patientName}</p>
                      <p className="text-[9px] text-slate-500 font-bold whitespace-nowrap">
                        {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {log.medicineName} • {log.status.toLowerCase()}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                   <Clock className="text-slate-700" size={24} />
                </div>
                <p className="text-slate-500 text-sm font-medium">Monitoring system active. Waiting for patient data...</p>
              </div>
            )}
          </div>

          <button
            onClick={() => window.location.href = '/caregiver/patients'}
            className="w-full mt-6 py-3 text-xs font-bold text-slate-500 hover:text-white transition-all border-t border-white/5 uppercase tracking-widest flex items-center justify-center gap-2 group"
          >
            View Patient Fleet
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      <AddPatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, trend, urgent, index }) => {
  const themes = {
    blue: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
    purple: 'border-primary-purple/30 text-primary-purple bg-primary-purple/5',
    red: 'border-error/30 text-error bg-error/5',
    yellow: 'border-warning/30 text-warning bg-warning/5'
  };

  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    purple: 'text-primary-purple bg-primary-purple/10',
    red: 'text-error bg-error/10',
    yellow: 'text-warning bg-warning/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className={cn(
        "relative overflow-hidden bg-white/[0.03] border p-6 rounded-3xl transition-all duration-300 group",
        themes[color],
        urgent && "animate-pulse-subtle shadow-[0_0_20px_rgba(239,68,68,0.1)]"
      )}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", colors[color])}>
            <Icon size={24} />
          </div>
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded-md bg-white/5",
            urgent ? 'text-error' : 'text-slate-500'
          )}>
            {trend}
          </span>
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{title}</p>
          <p className="text-4xl font-bold text-white mt-1 tracking-tight">{value}</p>
        </div>
      </div>

      <div className={cn(
        "absolute -right-6 -bottom-6 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 rounded-full",
        urgent ? 'bg-error' : `bg-${color === 'blue' ? 'blue' : color === 'purple' ? 'primary-purple' : 'warning'}-500`
      )} />
    </motion.div>
  );
};

export default CaregiverDashboard;
