import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Shield, Bell, LogOut,
  Users, Activity, ShieldCheck, MapPin,
  Calendar, Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToUserProfile } from '../../services/userService';
import { subscribeToPatients } from '../../services/caregiverService';
import GlowButton from '../../components/GlowButton';
import { cn } from '../../utils/cn';

const CaregiverProfile = () => {
  const { currentUser, logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [patientCount, setPatientCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const unsubProfile = subscribeToUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile);
    });

    const unsubPatients = subscribeToPatients(currentUser.uid, (patients) => {
      setPatientCount(patients.length);
    });

    return () => {
      unsubProfile();
      unsubPatients();
    };
  }, [currentUser]);

  const initials = currentUser?.displayName
    ?.split(' ')
    .map(n => n[0])
    .join('') || 'C';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Profile Header */}
      <section className="relative h-48 rounded-3xl overflow-hidden mb-20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-purple/20 to-indigo-500/20 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <div className="w-32 h-32 rounded-3xl bg-slate-900 border-4 border-background flex items-center justify-center shadow-2xl relative group">
            <span className="text-4xl font-bold text-primary-purple font-display group-hover:scale-110 transition-transform">{initials}</span>
            <div className="absolute inset-0 bg-primary-purple/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="pb-4">
            <div className="flex items-center gap-2 mb-1">
               <h1 className="text-3xl font-bold text-white">{currentUser?.displayName || 'Caregiver'}</h1>
               <ShieldCheck className="text-primary-purple" size={20} />
            </div>
            <p className="text-slate-400 flex items-center gap-2 text-sm font-medium">
              <Mail size={14} className="text-primary-purple" />
              {currentUser?.email}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col - Professional Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-md">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Staff Credentials</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-purple/10 rounded-lg text-primary-purple">
                    <Briefcase size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Department</span>
                </div>
                <span className="text-sm font-bold text-white">{userProfile?.department || 'Monitoring'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Shield size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Staff ID</span>
                </div>
                <span className="text-sm font-bold text-white">#{currentUser?.uid?.slice(-6).toUpperCase()}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg text-success">
                    <MapPin size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Facility</span>
                </div>
                <span className="text-sm font-bold text-white">{userProfile?.facility || 'Main Clinic'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-error/10 border border-error/20 text-error font-bold text-sm hover:bg-error/20 transition-all group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Terminate Session
          </button>
        </div>

        {/* Right Col - Impact Summary */}
        <div className="md:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
               <div className="relative z-10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Managed Patients</p>
                  <h3 className="text-3xl font-bold text-white mb-2">{patientCount}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary-purple bg-primary-purple/10 w-fit px-2 py-1 rounded-md">
                    <Users size={10} /> ACTIVE FLEET
                  </div>
               </div>
               <Users className="absolute -right-4 -bottom-4 opacity-5 text-primary-purple group-hover:scale-110 transition-transform" size={100} />
            </div>

            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
               <div className="relative z-10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">System Alerts</p>
                  <h3 className="text-3xl font-bold text-white mb-2">Live</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-success bg-success/10 w-fit px-2 py-1 rounded-md">
                    <Activity size={10} /> MONITORING ACTIVE
                  </div>
               </div>
               <Activity className="absolute -right-4 -bottom-4 opacity-5 text-success group-hover:scale-110 transition-transform" size={100} />
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
             <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Administrative Settings</h3>
                <GlowButton variant="secondary" className="h-9 px-4 text-xs">Update Profile</GlowButton>
             </div>
             <div className="divide-y divide-white/5">
                {[
                  { icon: Bell, label: 'Alert Configurations', sub: 'Critical patient notification logic', status: 'Optimal' },
                  { icon: Shield, label: 'Security & Auth', sub: 'Two-factor and session management', status: 'High' },
                  { icon: Users, label: 'Patient Access Rights', sub: 'Manage delegation and permissions', status: 'Managed' }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-white/5 text-slate-400 group-hover:text-primary-purple transition-colors">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.sub}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-primary-purple uppercase tracking-widest bg-primary-purple/5 px-2 py-1 rounded border border-primary-purple/10">
                      {item.status}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaregiverProfile;
