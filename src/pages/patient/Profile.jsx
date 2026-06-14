import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Calendar,
  Droplets, Shield, Bell, LogOut, Edit3,
  CheckCircle2, Flame, Package, Activity, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMedicines } from '../../hooks/useMedicines';
import { useAnalytics } from '../../hooks/useAnalytics';
import { subscribeToUserProfile } from '../../services/userService';
import GlowButton from '../../components/GlowButton';
import { cn } from '../../utils/cn';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { medicines, adherence } = useMedicines();
  const { stats: analyticsStats } = useAnalytics();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const initials = currentUser?.displayName
    ?.split(' ')
    .map(n => n[0])
    .join('') || 'U';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20" data-testid="profile-page">
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

      {/* Profile Header */}
      <section className="relative h-48 rounded-3xl overflow-hidden mb-20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-cyan/20 to-primary-purple/20 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <div className="w-32 h-32 rounded-3xl bg-slate-900 border-4 border-background flex items-center justify-center shadow-2xl relative group">
            <span className="text-4xl font-bold text-primary-cyan font-display group-hover:scale-110 transition-transform">{initials}</span>
            <div className="absolute inset-0 bg-primary-cyan/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="pb-4">
            <h1 className="text-3xl font-bold text-white mb-1">{currentUser?.displayName || 'Patient'}</h1>
            <p className="text-slate-400 flex items-center gap-2 text-sm font-medium">
              <Mail size={14} className="text-primary-cyan" />
              {currentUser?.email}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col - Vital Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-md">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Vital Metrics</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-cyan/10 rounded-lg text-primary-cyan">
                    <Droplets size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Blood Type</span>
                </div>
                <span className="text-sm font-bold text-white">{userProfile?.bloodType || 'O+'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-purple/10 rounded-lg text-primary-purple">
                    <Calendar size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Age</span>
                </div>
                <span className="text-sm font-bold text-white">{userProfile?.age || '24'} Years</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg text-success">
                    <MapPin size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Zone</span>
                </div>
                <span className="text-sm font-bold text-white">{userProfile?.zone || 'GMT-5'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            data-testid="logout-button"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-error/10 border border-error/20 text-error font-bold text-sm hover:bg-error/20 transition-all group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out Profile
          </button>
        </div>

        {/* Right Col - Medical Summary & Settings */}
        <div className="md:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
               <div className="relative z-10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Prescriptions</p>
                  <h3 className="text-3xl font-bold text-white mb-2">{medicines.length}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary-cyan bg-primary-cyan/10 w-fit px-2 py-1 rounded-md">
                    <Package size={10} /> INVENTORY SYNCED
                  </div>
               </div>
               <Package className="absolute -right-4 -bottom-4 opacity-5 text-primary-cyan group-hover:scale-110 transition-transform" size={100} />
            </div>

            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
               <div className="relative z-10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Clinical Adherence</p>
                  <h3 className="text-3xl font-bold text-white mb-2">{adherence}%</h3>
                  <div className={cn(
                    "flex items-center gap-2 text-[10px] font-bold w-fit px-2 py-1 rounded-md",
                    adherence >= 80 ? "text-success bg-success/10" : "text-warning bg-warning/10"
                  )}>
                    <Activity size={10} /> {adherence >= 80 ? 'EXCELLENT' : 'REQUIRES FOCUS'}
                  </div>
               </div>
               <Flame className="absolute -right-4 -bottom-4 opacity-5 text-error group-hover:scale-110 transition-transform" size={100} />
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Profile;
