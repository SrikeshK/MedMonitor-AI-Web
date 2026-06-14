import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Pill,
  Bell,
  Calendar,
  User,
  Phone,
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  SearchX
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  getPatientDetails,
  subscribeToPatientMedicines,
  subscribeToPatientLogs,
  calculatePatientAdherence
} from '../../services/caregiverService';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { DashboardCardSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchPatient = async () => {
      try {
        const data = await getPatientDetails(id);
        if (!data) throw new Error("Patient not found");
        setPatient(data);
      } catch (err) {
        console.error("Error fetching patient:", err);
        setError(err);
        setLoading(false);
      }
    };

    fetchPatient();

    // Subscription for medicines
    const unsubMeds = subscribeToPatientMedicines(id, (medList) => {
      setMedicines(medList);
    });

    // Subscription for logs
    const unsubLogs = subscribeToPatientLogs(id, (logList) => {
      setLogs(logList);
      setLoading(false);
    });

    return () => {
      unsubMeds();
      unsubLogs();
    };
  }, [id]);

  const adherence = calculatePatientAdherence(logs);

  const recentLogs = logs.slice(0, 10);
  const missedDoses = logs.filter(l => l.status === 'MISSED').slice(0, 5);

  const statsData = [
    { name: 'Taken', value: logs.filter(l => ['TAKEN', 'COMPLETED', 'DELAYED'].includes(l.status)).length, color: '#22d3ee' },
    { name: 'Missed', value: logs.filter(l => l.status === 'MISSED').length, color: '#f43f5e' },
    { name: 'Delayed', value: logs.filter(l => l.status === 'DELAYED').length, color: '#fbbf24' },
  ];

  if (loading) {
    return (
      <div className="space-y-8" data-testid="patient-details-loading">
        <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-64 bg-white/5 animate-pulse rounded-3xl" />
          <div className="h-64 bg-white/5 animate-pulse rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <EmptyState
        icon={User}
        title="Patient Record Unavailable"
        description="The patient record could not be retrieved. It may have been removed or you may lack permissions."
        actionLabel="Back to Patients"
        onAction={() => navigate('/caregiver/patients')}
        data-testid="patient-details-error"
      />
    );
  }

  return (
    <div className="space-y-8 pb-10" data-testid="patient-details-page">
      {/* Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/caregiver/patients')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          data-testid="back-button"
        >
          <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-primary-purple/20 transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="font-medium">Back to Patients</span>
        </button>


      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="patient-hero-card"
          className="lg:col-span-3 bg-white/[0.03] border border-white/10 p-8 rounded-3xl overflow-hidden"
        >
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-purple/30 to-primary-purple/5 border border-primary-purple/20 flex items-center justify-center shadow-2xl mb-4">
                <span className="text-4xl font-bold text-primary-purple">
                  {patient?.name?.split(' ').map(n => n[0]).join('') || <User size={64} />}
                </span>
              </div>
              <div className="text-center">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  adherence > 80 ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
                }`}>
                  {adherence > 80 ? 'Optimal Adherence' : 'Needs Attention'}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{patient?.name || 'Unknown Patient'}</h1>
                <div className="flex flex-wrap gap-4 text-slate-400">
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg">
                    <Calendar size={14} />
                    <span className="text-sm">Age: {patient?.age || 'N/A'} yrs</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg">
                    <Heart size={14} className="text-rose-400" />
                    <span className="text-sm">{patient?.relation || 'Patient'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg">
                    <Activity size={14} className="text-primary-cyan" />
                    <span className="text-sm">Active Monitoring</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <QuickStat label="Adherence Rate" value={`${adherence}%`} icon={TrendingUp} color="purple" testid="stat-adherence" />
                <QuickStat label="Active Meds" value={medicines.length} icon={Pill} color="blue" testid="stat-meds" />
                <QuickStat label="Missed (7d)" value={logs.filter(l => l.status === 'MISSED').length} icon={AlertTriangle} color="red" testid="stat-missed" />
                <QuickStat label="Last Update" value={recentLogs[0] ? 'Just now' : 'N/A'} icon={Clock} color="green" testid="stat-update" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Patient Info Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl space-y-6"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={20} className="text-primary-purple" />
            Vitals Overview
          </h3>

          <div className="space-y-4">
            <VitalRow label="Heart Rate" value={patient?.vitals?.heartRate || '-- bpm'} status="Stable" />
            <VitalRow label="Blood Sugar" value={patient?.vitals?.bloodSugar || '-- mg/dL'} status="Normal" />
            <VitalRow label="Body Temp" value={patient?.vitals?.temp || '-- °F'} status="Stable" />
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Clinical Notes</p>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed italic">
              {patient?.notes || "No recent clinical notes for this patient."}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Medications and Logs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Medications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Active Medications</h3>
              <span className="text-xs text-slate-500">{medicines.length} items total</span>
            </div>
            {medicines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="patient-medications">
                {medicines.map((med, idx) => (
                  <div key={med.id || idx} className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 hover:border-primary-purple/30 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-primary-purple/10 text-primary-purple group-hover:scale-110 transition-transform">
                        <Pill size={24} />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Status</span>
                        <span className="text-xs font-medium text-success">Active</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-bold text-white group-hover:text-primary-purple transition-colors">{med.medicineName || med.name}</h4>
                      <p className="text-sm text-slate-400 mt-1">{med.dosage || med.dosageAmount || '1 tablet'} • {med.frequency || med.type || 'Daily'}</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      {med.slotStatus && Object.keys(med.slotStatus).map(slot => (
                        <span key={slot} className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                          ['TAKEN', 'COMPLETED'].includes(med.slotStatus[slot]) ? 'bg-success/20 text-success' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl text-center">
                 <Pill className="text-slate-700 mx-auto mb-2" size={32} />
                 <p className="text-slate-500 font-medium italic">No active medications tracked.</p>
              </div>
            )}
          </section>

          {/* Activity Log */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Adherence History</h3>

            </div>
            {recentLogs.length > 0 ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden" data-testid="patient-history">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500">
                        <th className="px-6 py-4">Medicine</th>
                        <th className="px-6 py-4">Time</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-white">{log.medicineName}</p>
                            <p className="text-[10px] text-slate-500">{log.slot || 'Scheduled'}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              ['TAKEN', 'COMPLETED'].includes(log.status) ? 'bg-success/10 text-success' :
                              log.status === 'MISSED' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-primary-cyan">
                              <CheckCircle2 size={14} />
                              <span className="text-[10px] font-medium">Verified</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl text-center">
                 <SearchX className="text-slate-700 mx-auto mb-2" size={32} />
                 <p className="text-slate-500 font-medium italic">No activity logs recorded yet.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right: Charts and Alerts */}
        <div className="space-y-8">
          {/* Adherence Pie Chart */}
          <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl" data-testid="performance-mix-chart">
            <h3 className="text-lg font-bold text-white mb-6">Performance Mix</h3>
            <div className="h-64">
              {logs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                   <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">No chart data</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {statsData.map(stat => (
                <div key={stat.name} className="text-center">
                  <div className="text-[10px] text-slate-500 mb-1">{stat.name}</div>
                  <div className="font-bold text-white" style={{ color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Missed Dose Alerts */}
          <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl border-l-4 border-error" data-testid="critical-alerts">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Bell size={20} className="text-error" />
              Critical Alerts
            </h3>
            <div className="space-y-4">
              {missedDoses.length > 0 ? missedDoses.map((alert, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-error/5 border border-error/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-error uppercase">Missed Dose</span>
                    <span className="text-[10px] text-slate-500">
                      {alert.timestamp instanceof Date ? alert.timestamp.toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium">{alert.medicineName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Scheduled for {alert.slot || 'Unknown Slot'}</span>

                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                  <CheckCircle2 size={32} className="text-success mx-auto mb-2 opacity-20" />
                  <p className="text-slate-500 text-sm">No critical alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickStat = ({ label, value, icon: Icon, color, testid }) => {
  const colors = {
    purple: 'text-primary-purple',
    blue: 'text-primary-cyan',
    red: 'text-error',
    green: 'text-success'
  };

  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/5" data-testid={testid}>
      <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest mb-1">
        <Icon size={12} className={colors[color]} />
        {label}
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
};

const VitalRow = ({ label, value, status }) => (
  <div className="flex items-center justify-between group">
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-white group-hover:text-primary-purple transition-colors">{value}</p>
    </div>
    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-success/10 text-success border border-success/20">
      {status}
    </span>
  </div>
);

export default PatientDetails;
