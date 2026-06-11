import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Shield, MessageSquare, Heart, Activity, UserCheck, Trash2, Phone, Bell, AlertTriangle, ArrowLeft } from 'lucide-react';
import DashboardCard from '../../components/dashboard/DashboardCard';
import { useAuth } from '../../context/AuthContext';
import { subscribeToFamilyMembers, deleteFamilyMember } from '../../services/familyService';
import EmptyState from '../../components/EmptyState';
import { DashboardCardSkeleton } from '../../components/Skeleton';
import AddFamilyMemberModal from '../../components/dashboard/AddFamilyMemberModal';

const CareCircle = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const unsubscribe = subscribeToFamilyMembers(currentUser.uid, (data) => {
      setMembers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleDelete = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member from your Care Circle?')) {
      try {
        await deleteFamilyMember(memberId);
      } catch (error) {
        console.error("Error deleting member:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8" data-testid="care-circle-loading">
        <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <DashboardCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10" data-testid="care-circle-page">
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/patient/dashboard')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-4"
        data-testid="back-button"
      >
        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-primary-purple/20 transition-all">
          <ArrowLeft size={18} />
        </div>
        <span className="font-medium">Back to Dashboard</span>
      </button>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary-purple mb-2"
          >
            <Heart className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Support Network</span>
          </motion.div>
          <h1 className="text-4xl font-bold font-display text-white tracking-tight">Care <span className="text-primary-purple">Circle</span></h1>
          <p className="text-slate-400 mt-1">Manage your family members connected to your profile for remote monitoring.</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          data-testid="add-member-button"
          className="flex items-center gap-2 bg-primary-purple/10 hover:bg-primary-purple/20 border border-primary-purple/20 px-6 py-3 rounded-2xl text-primary-purple transition-all group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span className="font-bold text-sm uppercase tracking-widest">Add Member</span>
        </motion.button>
      </header>

      {members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="members-list">
          {members.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              data-testid={`member-card-${member.id}`}
            >
              <DashboardCard className="h-full hover:border-primary-purple/30 transition-colors group relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-purple/10 border border-primary-purple/20 flex items-center justify-center text-primary-purple group-hover:scale-110 transition-transform shadow-lg shadow-primary-purple/5">
                      <Users size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-primary-purple transition-colors truncate max-w-[150px]">{member.name}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{member.relation}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest ${
                      member.status === 'Active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {member.status || 'Active'}
                    </span>
                    <button
                      onClick={() => handleDelete(member.id)}
                      data-testid={`delete-member-${member.id}`}
                      className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Phone size={14} />
                    </div>
                    <span className="text-sm font-medium">{member.phone}</span>
                  </div>

                  <div className="flex gap-2">
                    {member.notifyAfterMissedDose && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-tight">
                        <Bell size={12} />
                        Missed Dose
                      </div>
                    )}
                    {member.notifyImmediately && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-tight">
                        <AlertTriangle size={12} />
                        Immediate
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                    Last Alert: {member.lastAlertTime ? new Date(member.lastAlertTime).toLocaleDateString() : 'Never'}
                  </div>
                  <button
                    disabled
                    className="text-slate-600 cursor-not-allowed text-[11px] font-bold uppercase tracking-widest flex items-center gap-1"
                  >
                    View Details <span className="text-[8px] bg-white/5 px-1 rounded">Soon</span>
                  </button>
                </div>
              </DashboardCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UserCheck}
          title="No Care Circle Members"
          description="You haven't added any family members to your Care Circle yet. Add trusted members to help monitor your health and receive emergency alerts."
          actionLabel="Add First Member"
          onAction={() => setIsModalOpen(true)}
          data-testid="care-circle-empty"
        />
      )}

      <AddFamilyMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default CareCircle;
