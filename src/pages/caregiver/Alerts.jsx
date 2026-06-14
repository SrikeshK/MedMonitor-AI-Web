import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  Clock,
  User,
  Pill,
  ChevronRight,
  Phone,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToPatients, subscribeToPatientLogs } from '../../services/caregiverService';
import EmptyState from '../../components/EmptyState';

const CaregiverAlerts = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, MISSED, DELAYED, DUE
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const unsubPatients = subscribeToPatients(currentUser.uid, (patients) => {
      const allUnsubscribers = [];

      if (patients.length === 0) {
        setLoading(false);
        return;
      }

      patients.forEach(patient => {
        const unsubLogs = subscribeToPatientLogs(patient.id, (logs) => {
          // Process logs into alerts
          const patientAlerts = logs
            .filter(log => ['MISSED', 'DELAYED', 'PENDING'].includes(log.status))
            .map(log => ({
              id: log.id,
              patientId: patient.id,
              patientName: patient.name,
              patientPhone: patient.phone,
              medicineName: log.medicineName,
              status: log.status,
              timestamp: log.timestamp,
              slot: log.slot,
              priority: log.status === 'MISSED' ? 1 : log.status === 'DELAYED' ? 2 : 3
            }));

          setAlerts(prev => {
            const otherPatientsAlerts = prev.filter(a => a.patientId !== patient.id);
            const combined = [...otherPatientsAlerts, ...patientAlerts];
            return combined.sort((a, b) => {
              if (a.priority !== b.priority) return a.priority - b.priority;
              return b.timestamp - a.timestamp;
            });
          });
          setLoading(false);
        });
        allUnsubscribers.push(unsubLogs);
      });

      return () => allUnsubscribers.forEach(unsub => unsub());
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => unsubPatients();
  }, [currentUser]);

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'ALL' || alert.status === filter;
    const matchesSearch = alert.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.medicineName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const criticalCount = alerts.filter(a => a.status === 'MISSED').length;

  if (loading) {
    return (
      <div className="space-y-8" data-testid="alerts-loading">
        <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="h-64 bg-white/5 animate-pulse rounded-3xl" />
          <div className="lg:col-span-3 h-96 bg-white/5 animate-pulse rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Sync Failed"
        description="We're having trouble connecting to the live alert feed. Please verify your connection."
        actionLabel="Retry Connection"
        onAction={() => window.location.reload()}
        data-testid="alerts-error"
      />
    );
  }

  return (
    <div className="space-y-8 pb-10" data-testid="caregiver-alerts-page">
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
            Alert <span className="text-primary-purple">Center</span>
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-purple" />
            Real-time critical event monitoring feed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary-purple transition-colors" />
            <input
              type="text"
              placeholder="Filter alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="alerts-search"
              className="bg-slate-900/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-4">
          <div className="dashboard-card border-t-4 border-primary-purple">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Intelligence Filter
            </h3>
            <div className="space-y-2">
              <FilterButton
                active={filter === 'ALL'}
                onClick={() => setFilter('ALL')}
                label="All Activity"
                count={alerts.length}
                testid="filter-all"
              />
              <FilterButton
                active={filter === 'MISSED'}
                onClick={() => setFilter('MISSED')}
                label="Missed Doses"
                count={alerts.filter(a => a.status === 'MISSED').length}
                variant="error"
                testid="filter-missed"
              />
              <FilterButton
                active={filter === 'DELAYED'}
                onClick={() => setFilter('DELAYED')}
                label="Delayed Doses"
                count={alerts.filter(a => a.status === 'DELAYED').length}
                variant="warning"
                testid="filter-delayed"
              />
              <FilterButton
                active={filter === 'PENDING'}
                onClick={() => setFilter('PENDING')}
                label="Due Now"
                count={alerts.filter(a => a.status === 'PENDING').length}
                variant="info"
                testid="filter-due"
              />
            </div>
          </div>

          <div className="dashboard-card bg-gradient-to-br from-error/10 to-transparent border-error/20">
            <h4 className="text-error font-bold flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4" />
              Critical Attention
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {criticalCount > 0
                ? `${criticalCount} patients have missed doses in the last 24 hours. Immediate follow-up recommended.`
                : "No critical medication failures detected in the system currenty."
              }
            </p>
          </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  data-testid="alert-card"
                  className={`dashboard-card group relative overflow-hidden border-l-4 ${
                    alert.status === 'MISSED' ? 'border-error' :
                    alert.status === 'DELAYED' ? 'border-warning' : 'border-primary-cyan'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        alert.status === 'MISSED' ? 'bg-error/10 text-error' :
                        alert.status === 'DELAYED' ? 'bg-warning/10 text-warning' : 'bg-primary-cyan/10 text-primary-cyan'
                      }`}>
                        {alert.status === 'MISSED' ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white group-hover:text-primary-purple transition-colors">
                            {alert.patientName}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                            alert.status === 'MISSED' ? 'bg-error/10 text-error' :
                            alert.status === 'DELAYED' ? 'bg-warning/10 text-warning' : 'bg-primary-cyan/10 text-primary-cyan'
                          }`}>
                            {alert.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                          <Pill className="w-4 h-4 text-slate-500" />
                          {alert.medicineName} • {alert.slot} Slot
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          Logged {new Date(alert.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={`tel:${alert.patientPhone}`}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Contact Patient"
                        data-testid="contact-patient-btn"
                      >
                        <Phone className="w-5 h-5" />
                      </a>

                    </div>
                  </div>

                  {/* Glass Background Effect */}
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 blur-3xl opacity-5 group-hover:opacity-10 transition-opacity bg-primary-purple rounded-full" />
                </motion.div>
              ))
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="System Clear"
                description="No active medication alerts detected. All patients are currently on schedule or up to date."
                data-testid="alerts-empty"
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ active, onClick, label, count, variant = 'default', testid }) => {
  const variants = {
    default: active ? 'bg-primary-purple text-white shadow-lg shadow-primary-purple/20' : 'text-slate-400 hover:bg-white/5',
    error: active ? 'bg-error text-white shadow-lg shadow-error/20' : 'text-slate-400 hover:bg-error/5',
    warning: active ? 'bg-warning text-black shadow-lg shadow-warning/20' : 'text-slate-400 hover:bg-warning/5',
    info: active ? 'bg-primary-cyan text-black shadow-lg shadow-primary-cyan/20' : 'text-slate-400 hover:bg-primary-cyan/5'
  };

  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${variants[variant]}`}
    >
      <span>{label}</span>
      <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-black/20' : 'bg-white/5'}`}>
        {count}
      </span>
    </button>
  );
};

export default CaregiverAlerts;
