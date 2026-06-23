import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, AlertCircle, Check } from 'lucide-react';
import GlowButton from './GlowButton';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { updateUserProfileName } from '../services/userService';

const EditUsernameModal = ({ isOpen, onClose, currentName }) => {
  const { currentUser, updateDisplayName } = useAuth();
  const { addToast } = useUI();
  const [name, setName] = useState(currentName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(currentName || '');
      setError('');
    }
  }, [isOpen, currentName]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Username cannot be empty.');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Username must be at least 2 characters.');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Username cannot exceed 50 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Update Firebase Auth displayName
      if (updateDisplayName) {
        await updateDisplayName(trimmedName);
      }
      
      // 2. Update Firestore Users document
      if (currentUser?.uid) {
        await updateUserProfileName(currentUser.uid, trimmedName);
      }

      addToast({ message: 'Username updated successfully!', type: 'success' });
      onClose();
    } catch (err) {
      console.error('Error updating username:', err);
      setError('Failed to update username. Please try again.');
      addToast({ message: 'Failed to update username.', type: 'error' });
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
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card w-full max-w-md relative border border-primary-cyan/20 p-6 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-cyan/5 to-primary-purple/5 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-cyan/10 border border-primary-cyan/20 text-primary-cyan">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-white leading-tight">Edit Username</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Account Profile</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
              {error && (
                <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-center gap-3 text-error text-sm">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
                  Username / Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter new username"
                  required
                  disabled={loading}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-primary-cyan/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-primary-cyan/5 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <GlowButton
                  type="submit"
                  loading={loading}
                  disabled={loading || name.trim() === currentName}
                  className="px-6 py-2.5 h-10 text-sm font-semibold rounded-xl"
                >
                  Save Changes
                </GlowButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditUsernameModal;
