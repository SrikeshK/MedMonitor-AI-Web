import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Phone, Mail, User, Bell, AlertTriangle } from 'lucide-react';
import GlowButton from '../GlowButton';
import { addFamilyMember } from '../../services/familyService';
import { useAuth } from '../../context/AuthContext';

const AddFamilyMemberModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    phone: '',
    email: '',
    backupPhone: '',
    notifyAfterMissedDose: true,
    notifyImmediately: false,
    status: 'Active'
  });

  // Handle ESC key and Browser Back
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };

      const handlePopState = (e) => {
        if (isOpen) {
          e.preventDefault();
          onClose();
          window.history.pushState(null, null, window.location.pathname);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.history.pushState(null, null, window.location.pathname);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        userId: currentUser.uid,
        lastAlertTime: null
      };
      await addFamilyMember(dataToSave);
      onClose();
    } catch (error) {
      console.error("Error adding family member:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
          data-testid="add-family-modal"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 relative border border-primary-purple/30"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              data-testid="close-modal-button"
            >
              <X size={24} />
            </button>

            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary-purple/10 flex items-center justify-center text-primary-purple mb-4">
                <UserPlus size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">Add Care Circle Member</h2>
              <p className="text-slate-400 text-sm">Add a trusted family member to help monitor your health.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      required
                      data-testid="member-name-input"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary-purple/50 transition-all"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Relation</label>
                  <input
                    required
                    data-testid="member-relation-input"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary-purple/50 transition-all"
                    placeholder="e.g. Brother"
                    value={formData.relation}
                    onChange={(e) => setFormData({...formData, relation: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    required
                    data-testid="member-phone-input"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary-purple/50 transition-all"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    required
                    type="email"
                    data-testid="member-email-input"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary-purple/50 transition-all"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Backup Phone (Optional)</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary-purple/50 transition-all"
                  placeholder="+1 098 765 4321"
                  value={formData.backupPhone}
                  onChange={(e) => setFormData({...formData, backupPhone: e.target.value})}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <Bell size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Missed Dose Alert</p>
                      <p className="text-[10px] text-slate-500">Notify after a missed dose</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notifyAfterMissedDose}
                    onChange={(e) => setFormData({...formData, notifyAfterMissedDose: e.target.checked})}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary-purple focus:ring-primary-purple/20"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Immediate Alert</p>
                      <p className="text-[10px] text-slate-500">Notify immediately for all events</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notifyImmediately}
                    onChange={(e) => setFormData({...formData, notifyImmediately: e.target.checked})}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary-purple focus:ring-primary-purple/20"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-2xl bg-white/5 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
                <GlowButton type="submit" loading={loading} className="flex-[2]" data-testid="save-member-button">
                  Add Member
                </GlowButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddFamilyMemberModal;
