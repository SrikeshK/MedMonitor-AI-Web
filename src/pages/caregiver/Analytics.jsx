import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend, Cell, PieChart, Pie
} from 'recharts';
import {
  TrendingUp,
  Users,
  AlertCircle,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Medal,
  Activity,
  SearchX,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToPatients,
  subscribeToPatientLogs,
  calculatePatientAdherence
} from '../../services/caregiverService';
import EmptyState from '../../components/EmptyState';

const CaregiverAnalytics = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [patientsData, setPatientsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubPatients = subscribeToPatients(
      currentUser.uid,
      (patientList) => {
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
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubPatients();
  }, [currentUser]);

  const analytics = useMemo(() => {
    const data = Object.values(patientsData);
    if (data.length === 0) return null;

    // 1. Leaderboard
    const leaderboard = data.map(({ patient, logs }) => ({
      name: patient.name || 'Unknown Patient',
      adherence: calculatePatientAdherence(logs),
      total: logs?.length || 0,
      missed: logs?.filter(l => l.status === 'MISSED').length || 0
    })).sort((a, b) => b.adherence - a.adherence);

    // 2. Overall Adherence
    const overallAdherence = leaderboard.length === 0 ? 0 : Math.round(
      leaderboard.reduce((acc, curr) => acc + curr.adherence, 0) / leaderboard.length
    );

    // 3. At Risk
    const atRiskPatient = leaderboard.length > 0 ? [...leaderboard].sort((a, b) => a.adherence - b.adherence)[0] : null;

    // 4. Status Distribution
    const allLogs = data.flatMap(d => d.logs || []);
    const statusCounts = {
      TAKEN: allLogs.filter(l => ['TAKEN', 'COMPLETED', 'DELAYED'].includes(l.status)).length,
      MISSED: allLogs.filter(l => l.status === 'MISSED').length,
      DELAYED: allLogs.filter(l => l.status === 'DELAYED').length
    };

    const statusDistribution = [
      { name: 'Taken', value: statusCounts.TAKEN, color: '#22d3ee' },
      { name: 'Missed', value: statusCounts.MISSED, color: '#f43f5e' },
      { name: 'Delayed', value: statusCounts.DELAYED, color: '#fbbf24' }
    ];

    // 5. Weekly Trend from Real Logs
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const weeklyTrend = last7Days.map(date => {
      const dayLogs = allLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === date.getTime();
      });

      const taken = dayLogs.filter(l => ['TAKEN', 'COMPLETED', 'DELAYED'].includes(l.status)).length;
      const total = dayLogs.length;
      const rate = total === 0 ? 0 : Math.round((taken / total) * 100);

      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        rate: rate
      };
    });

    return {
      leaderboard,
      overallAdherence,
      atRiskPatient,
      statusDistribution,
      weeklyTrend
    };
  }, [patientsData]);

  if (loading) {
    return (
      <div className="space-y-8" data-testid="analytics-loading">
        <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-white/5 animate-pulse rounded-3xl" />
          <div className="h-96 bg-white/5 animate-pulse rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Analytics Offline"
        description="We're unable to load the clinical intelligence dashboard. Please check your connection."
        actionLabel="Retry"
        onAction={() => window.location.reload()}
        data-testid="analytics-error"
      />
    );
  }

  if (patients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Patients Monitored"
        description="You are not currently monitoring any patients. Add patients to your fleet to begin receiving clinical intelligence."
        actionLabel="Add Patient"
        onAction={() => navigate('/caregiver/patients')}
        data-testid="analytics-no-patients"
      />
    );
  }

  if (!analytics) {
    return (
      <EmptyState
        icon={SearchX}
        title="Insufficient Clinical Data"
        description="Waiting for monitored patients to log medication data. Detailed analytics will appear as soon as logs are synchronized."
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/caregiver/dashboard')}
        data-testid="analytics-no-data"
      />
    );
  }

  return (
    <div className="space-y-8 pb-10" data-testid="caregiver-analytics-page">
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/caregiver/dashboard')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-4"
        data-testid="back-button"
      >
        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-primary-purple/20 transition-all">
          <ArrowLeft size={18} />
        </div>
        <span className="font-medium">Back to Dashboard</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold font-display text-white tracking-tight">
            Clinical <span className="text-primary-purple">Intelligence</span>
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-purple" />
            Comprehensive multi-patient performance analytics.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            disabled
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-500 cursor-not-allowed flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Last 30 Days <span className="text-[8px] bg-white/5 px-1 rounded">Soon</span>
          </button>
        </div>
      </div>

      {/* Top Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnalyticsStat
          title="Fleet Adherence"
          value={`${analytics.overallAdherence}%`}
          icon={TrendingUp}
          description="Average across all patients"
          trend="Real-time"
          isPositive={true}
          testid="stat-fleet-adherence"
        />
        <AnalyticsStat
          title="Most At-Risk"
          value={analytics.atRiskPatient?.name || 'N/A'}
          icon={AlertCircle}
          description={analytics.atRiskPatient ? `${analytics.atRiskPatient.adherence}% Adherence rate` : "No data available"}
          trend={analytics.atRiskPatient ? "Needs Attention" : "Steady"}
          isPositive={!analytics.atRiskPatient || analytics.atRiskPatient.adherence > 80}
          variant={analytics.atRiskPatient && analytics.atRiskPatient.adherence < 70 ? "error" : "default"}
          testid="stat-at-risk"
        />
        <AnalyticsStat
          title="Active Monitoring"
          value={patients.length}
          icon={Users}
          description="Total patients enrolled"
          trend="Steady"
          isPositive={true}
          variant="info"
          testid="stat-active-monitoring"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          data-testid="leaderboard-chart"
          className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-purple" />
              Patient Leaderboard
            </h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.leaderboard} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={true} vertical={false} />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  fontSize={12}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="adherence" radius={[0, 4, 4, 0]} barSize={20}>
                  {analytics.leaderboard.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.adherence > 80 ? '#22d3ee' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Weekly Performance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          data-testid="fleet-trend-chart"
          className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-purple" />
              Fleet Trend
            </h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weeklyTrend}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Adherence Mix */}
        <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl lg:col-span-1" data-testid="aggregate-status-chart">
          <h3 className="text-lg font-bold text-white mb-6">Aggregate Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.statusDistribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Leaderboard Table */}
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl lg:col-span-2 overflow-hidden">
          <div className="p-8 pb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Ranking Details</h3>
            <span className="text-xs text-slate-500">Live sorting</span>
          </div>
          <div className="overflow-x-auto p-8 pt-0">
            <table className="w-full text-left" data-testid="leaderboard-table">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                  <th className="pb-4 px-2">Rank</th>
                  <th className="pb-4 px-2">Patient</th>
                  <th className="pb-4 px-2">Adherence</th>
                  <th className="pb-4 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {analytics.leaderboard.map((p, idx) => (
                  <tr key={idx} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 px-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-500' :
                        idx === 1 ? 'bg-slate-300/20 text-slate-300' :
                        idx === 2 ? 'bg-orange-600/20 text-orange-600' : 'text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm font-bold text-white group-hover:text-primary-purple transition-colors">{p.name}</span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full max-w-[100px] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.adherence > 80 ? 'bg-success' : p.adherence > 50 ? 'bg-warning' : 'bg-error'}`}
                            style={{ width: `${p.adherence}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-400">{p.adherence}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      {p.adherence > 90 ? (
                        <Medal className="w-4 h-4 text-amber-500 inline" />
                      ) : p.adherence < 60 ? (
                        <AlertCircle className="w-4 h-4 text-error inline" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-success inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsStat = ({ title, value, icon: Icon, description, trend, isPositive, variant = 'default', testid }) => {
  const variants = {
    default: 'border-primary-purple/20 from-primary-purple/5',
    error: 'border-rose-500/20 from-rose-500/5',
    info: 'border-blue-500/20 from-blue-500/5'
  };

  const iconColors = {
    default: 'text-primary-purple bg-primary-purple/10',
    error: 'text-rose-500 bg-rose-500/10',
    info: 'text-blue-500 bg-blue-500/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      data-testid={testid}
      className={`bg-white/[0.03] border p-6 rounded-3xl bg-gradient-to-br ${variants[variant]} group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconColors[variant]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-success' : 'text-error'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <h2 className="text-3xl font-bold text-white mt-1 group-hover:text-glow transition-all">{value}</h2>
        <p className="text-xs text-slate-500 mt-2">{description}</p>
      </div>
    </motion.div>
  );
};

export default CaregiverAnalytics;
