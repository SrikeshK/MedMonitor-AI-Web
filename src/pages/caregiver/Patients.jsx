import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Activity,
  Calendar,
  ChevronRight,
  Users,
  SearchX
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { subscribeToPatients, subscribeToPatientLogs, calculatePatientAdherence } from '../../services/caregiverService';
import AddPatientModal from '../../components/caregiver/AddPatientModal';
import GlowButton from '../../components/GlowButton';
import { PatientCardSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const Patients = () => {
  const { currentUser } = useAuth();
  const { addToast } = useUI();
  const [patients, setPatients] = useState([]);
  const [patientStats, setPatientStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToPatients(currentUser.uid, (patientList) => {
      setPatients(patientList);
      setLoading(false);

      patientList.forEach(patient => {
        subscribeToPatientLogs(patient.id, (logs) => {
          const adherence = calculatePatientAdherence(logs);
          const missedToday = logs.filter(l => {
            const today = new Date();
            today.setHours(0,0,0,0);
            const logDate = new Date(l.timestamp);
            logDate.setHours(0,0,0,0);
            return logDate.getTime() === today.getTime() && l.status === 'MISSED';
          }).length;

          setPatientStats(prev => ({
            ...prev,
            [patient.id]: {
              adherence,
              missedToday,
              lastActivity: logs[0]?.timestamp || null,
              status: missedToday > 0 ? 'Action Required' : 'Stable'
            }
          }));
        });
      });
    }, (error) => {
      setLoading(false);
      addToast({ message: "Failed to load patients", type: "error" });
    });

    return () => unsubscribe();
  }, [currentUser, addToast]);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.relation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold font-display text-white tracking-tight"
          >
            Patient <span className="text-primary-purple">Registry</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 mt-1"
          >
            Manage and monitor all your assigned patients in real-time.
          </motion.p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary-purple transition-colors" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all backdrop-blur-sm"
            />
          </div>
          <GlowButton onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 whitespace-nowrap w-full sm:w-auto">
            <UserPlus className="w-4 h-4" />
            Add Patient
          </GlowButton>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <PatientCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPatients.map((patient, index) => {
              const stats = patientStats[patient.id] || { adherence: 0, status: 'Stable', lastActivity: null, missedToday: 0 };

              return (
                <motion.div
                  key={patient.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={`/caregiver/patient/${patient.id}`}
                    className="block bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-primary-purple/40 hover:bg-white/[0.05] transition-all group relative overflow-hidden h-full"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-5 transition-opacity group-hover:opacity-10 ${
                      stats.status === 'Stable' ? 'bg-success' : 'bg-error'
                    }`} />

                    <div className="relative z-10 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-purple/20 to-primary-purple/5 border border-primary-purple/20 flex items-center justify-center shadow-lg group-hover:shadow-primary-purple/20 transition-all">
                            <span className="text-xl font-bold text-primary-purple">
                              {patient.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-primary-purple transition-colors leading-tight">
                              {patient.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400 font-medium">{patient.relation}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span className="text-xs text-slate-400 font-medium">{patient.age} yrs</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          stats.status === 'Stable'
                            ? 'bg-success/10 text-success border border-success/20'
                            : 'bg-error/10 text-error border border-error/20 animate-pulse'
                        }`}>
                          {stats.status === 'Stable' ? <ShieldCheck className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {stats.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Adherence</p>
                          <div className="flex items-end justify-between">
                            <p className="text-xl font-bold text-white">{stats.adherence}%</p>
                            <TrendingUp className={`w-4 h-4 ${stats.adherence > 80 ? 'text-success' : 'text-warning'}`} />
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Missed Today</p>
                          <div className="flex items-end justify-between">
                            <p className={`text-xl font-bold ${stats.missedToday > 0 ? 'text-error' : 'text-white'}`}>
                              {stats.missedToday}
                            </p>
                            <Activity className={`w-4 h-4 ${stats.missedToday > 0 ? 'text-error' : 'text-slate-600'}`} />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Last Active: {stats.lastActivity ? new Date(stats.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-purple group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : searchTerm ? (
        <EmptyState
          icon={SearchX}
          title="No results found"
          description={`We couldn't find any patient matching "${searchTerm}". Please try a different search term.`}
          actionLabel="Clear Search"
          onAction={() => setSearchTerm('')}
        />
      ) : (
        <EmptyState
          icon={Users}
          title="Registry is empty"
          description="You haven't added any patients to your registry yet. Add your first patient to begin monitoring."
          actionLabel="Add First Patient"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      <AddPatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Patients;
