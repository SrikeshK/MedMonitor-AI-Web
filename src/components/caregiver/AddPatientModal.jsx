import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Heart, Phone, User, Calendar, Activity } from 'lucide-react';
import { addPatient } from '../../services/caregiverService';
import { useAuth } from '../../context/AuthContext';
import GlowButton from '../GlowButton';

const AddPatientModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    relation: ''
  });
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      await addPatient(currentUser.uid, {
        ...formData,
        age: parseInt(formData.age),
      });
      onClose();
    } catch (error) {
      console.error("Error adding patient:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="add-patient-modal">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden bg-slate-900/90 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-primary-purple/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-purple/20 rounded-lg">
                  <UserPlus className="w-5 h-5 text-primary-purple" />
                </div>
                <h2 className="text-xl font-bold text-white">Add New Patient</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                data-testid="close-modal-button"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      required
                      type="text"
                      data-testid="patient-name-input"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Patient Name"
                      className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      required
                      type="tel"
                      data-testid="patient-phone-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Phone"
                      className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 ml-1">Age</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      required
                      type="number"
                      data-testid="patient-age-input"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      placeholder="Age"
                      className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 ml-1">Gender</label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all appearance-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Relation</label>
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    required
                    type="text"
                    data-testid="patient-relation-input"
                    value={formData.relation}
                    onChange={(e) => setFormData({...formData, relation: e.target.value})}
                    placeholder="e.g. Father, Mother, Patient"
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/5 text-slate-400 hover:bg-white/5 transition-all"
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
                <GlowButton
                  type="submit"
                  loading={loading}
                  className="flex-1"
                  data-testid="save-patient-button"
                >
                  Add Patient
                </GlowButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddPatientModal;
