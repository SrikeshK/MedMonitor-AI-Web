import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Activity,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  Info,
  Calendar,
  Zap,
  BarChart3,
  SearchX,
  ArrowLeft
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';
import EmptyState from '../../components/EmptyState';
import { DashboardCardSkeleton } from '../../components/Skeleton';
import { cn } from '../../utils/cn';

const Analytics = () => {
  const navigate = useNavigate();
  const { stats, insights, loading, error } = useAnalytics();

  if (loading) {
    return (
      <div className="space-y-8" data-testid="analytics-loading">
        <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white/5 animate-pulse rounded-3xl" />
          <div className="h-96 bg-white/5 animate-pulse rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Intelligence Sync Failed"
        description="We're having trouble connecting to the neural engine. Please verify your connection and try again."
        actionLabel="Retry Connection"
        onAction={() => window.location.reload()}
        data-testid="analytics-error"
      />
    );
  }

  if (!stats) {
    return (
      <EmptyState
        icon={Activity}
        title="Intelligence Engine Offline"
        description="We don't have enough medication data to generate your adherence intelligence. Start logging your doses to see clinical insights."
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/patient/dashboard')}
        data-testid="analytics-empty"
      />
    );
  }

  const statusData = stats.statusDistribution || [];

  return (
    <div className="space-y-8 pb-20" data-testid="analytics-page">
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/patient/dashboard')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-4"
        data-testid="back-button"
      >
        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-primary-cyan/20 transition-all">
          <ArrowLeft size={18} />
        </div>
        <span className="font-medium">Back to Dashboard</span>
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary-cyan mb-2"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Advanced Health Analytics</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold font-display text-white tracking-tight"
          >
            Adherence <span className="text-primary-cyan">Intelligence</span>
          </motion.h1>
          <p className="text-slate-400 mt-1 font-medium italic">Real-time clinical synchronization with your medical history.</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-primary-cyan/5 border border-primary-cyan/20 px-4 py-2 rounded-xl flex items-center gap-2 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-primary-cyan animate-pulse shadow-[0_0_8px_rgba(0,229,255,1)]" />
              <span className="text-[10px] font-bold text-primary-cyan uppercase tracking-widest">Neural Engine Active</span>
           </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Current Streak',
            value: stats.currentStreak,
            unit: 'Days',
            icon: Zap,
            color: 'text-primary-cyan',
            bg: 'bg-primary-cyan/10',
            msg: 'Consistent Performance',
            testid: 'streak-card'
          },
          {
            label: 'Overall Adherence',
            value: stats.overallAdherence,
            unit: '%',
            icon: TrendingUp,
            color: 'text-primary-purple',
            bg: 'bg-primary-purple/10',
            progress: true,
            testid: 'adherence-card'
          },
          {
            label: 'Doses Taken',
            value: statusData.find(s => s.name === 'Taken')?.value || 0,
            unit: 'Total',
            icon: CheckCircle2,
            color: 'text-success',
            bg: 'bg-success/10',
            msg: 'Lifetime Records',
            testid: 'taken-card'
          },
          {
            label: 'Missed Doses',
            value: statusData.find(s => s.name === 'Missed')?.value || 0,
            unit: 'Total',
            icon: AlertCircle,
            color: 'text-error',
            bg: 'bg-error/10',
            msg: 'Requires Attention',
            testid: 'missed-card'
          }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            data-testid={stat.testid}
            className={cn(
              "bg-white/[0.03] border border-white/5 p-6 rounded-3xl relative overflow-hidden group transition-all hover:bg-white/[0.05]",
              stat.color === 'text-primary-cyan' && 'hover:border-primary-cyan/30',
              stat.color === 'text-primary-purple' && 'hover:border-primary-purple/30',
              stat.color === 'text-success' && 'hover:border-success/30',
              stat.color === 'text-error' && 'hover:border-error/30'
            )}
          >
            <div className="relative z-10">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white flex items-baseline gap-2">
                {stat.value} <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{stat.unit}</span>
              </h3>

              {stat.progress ? (
                <div className="mt-5 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.value}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={cn("h-full bg-gradient-to-r",
                      stat.color === 'text-primary-purple' ? "from-primary-purple to-primary-cyan" : "from-primary-cyan to-blue-400"
                    )}
                  />
                </div>
              ) : (
                <div className={cn("mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider w-fit px-2.5 py-1 rounded-lg", stat.bg, stat.color)}>
                  <stat.icon size={12} fill={stat.color === 'text-primary-cyan' ? "currentColor" : "none"} /> {stat.msg}
                </div>
              )}
            </div>
            <stat.icon className={cn("absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity", stat.color)} size={120} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-3xl p-8 relative group"
          data-testid="weekly-trend-chart"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary-cyan/5 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 group-hover:text-primary-cyan transition-colors">
                <TrendingUp size={22} /> Weekly Adherence Trend
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Consistency Analysis</p>
            </div>
          </div>

          <div className="h-80 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyTrend}>
                <defs>
                  <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis
                  dataKey="day"
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
                  tickFormatter={(val) => `${val}%`}
                  tick={{fontWeight: 600}}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1120',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                  itemStyle={{ color: '#00E5FF' }}
                />
                <Area
                  type="monotone"
                  dataKey="adherence"
                  stroke="#00E5FF"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorAdherence)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col"
          data-testid="status-pie-chart"
        >
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2 relative z-10">
            <Target className="text-primary-purple" size={22} /> Dose Distribution
          </h3>

          <div className="h-64 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="rgba(11,17,32,0.8)"
                      strokeWidth={4}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1120',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center">
                  <p className="text-2xl font-bold text-white">{statusData.reduce((acc, curr) => acc + curr.value, 0)}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Doses Logged</p>
               </div>
            </div>
          </div>

          <div className="space-y-3 mt-auto relative z-10">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }} />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Medicine Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/[0.03] border border-white/10 rounded-3xl p-8"
          data-testid="medicine-leaderboard"
        >
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Award className="text-warning" size={24} /> Medicine Leaderboard
          </h3>
          <div className="space-y-4">
            {stats.medicinePerformance?.map((med, idx) => (
              <div key={med.name} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-primary-cyan/20 transition-all relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600 font-bold font-mono text-lg">0{idx + 1}</span>
                    <span className="text-white font-bold group-hover:text-primary-cyan transition-colors tracking-tight">{med.name}</span>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold",
                    med.adherence >= 90 ? 'bg-success/10 text-success' : med.adherence >= 70 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                  )}>
                    {med.adherence}% Compliance
                  </div>
                </div>
                <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest relative z-10">
                  <div className="text-slate-500">Taken: <span className="text-success">{med.taken}</span></div>
                  <div className="text-slate-500">Missed: <span className="text-error">{med.missed}</span></div>
                </div>
                <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-primary-cyan/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Smart Insights */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-primary-cyan"><Info size={22} /></span> Clinical Insights
          </h3>
          <div className="grid grid-cols-1 gap-4" data-testid="clinical-insights">
            {insights.map((insight, idx) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                key={idx}
                className={cn(
                  "p-6 rounded-2xl border flex gap-4 backdrop-blur-md transition-all hover:translate-x-1",
                  insight.type === 'success' ? 'bg-success/5 border-success/20 text-success' :
                  insight.type === 'warning' ? 'bg-error/5 border-error/20 text-error' :
                  'bg-primary-cyan/5 border-primary-cyan/20 text-primary-cyan'
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {insight.type === 'success' ? <CheckCircle2 size={20} /> :
                   insight.type === 'warning' ? <AlertCircle size={20} /> : <Info size={20} />}
                </div>
                <p className="text-sm font-semibold leading-relaxed text-slate-200">
                  {insight.text}
                </p>
              </motion.div>
            ))}
            {insights.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                 <SearchX size={32} className="text-slate-700 mb-2" />
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Gathering Clinical Data...</p>
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="p-8 rounded-3xl bg-primary-cyan/5 border border-primary-cyan/20 relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                <Calendar size={80} className="text-primary-cyan" />
             </div>
             <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-3 bg-primary-cyan/20 rounded-2xl shadow-lg shadow-primary-cyan/5">
                   <Zap className="text-primary-cyan" size={20} />
                </div>
                <h4 className="text-white font-bold text-lg">Adherence Optimization</h4>
             </div>
             <p className="text-sm text-slate-400 leading-relaxed font-medium relative z-10">
                Consistency is key to effective treatment. Try to take your medications within the same 30-minute window every day to maintain optimal blood concentration levels and improve recovery rates.
             </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
