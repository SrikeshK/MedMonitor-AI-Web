import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Save, Trash2, Calendar, Package, Info } from 'lucide-react';
import GlowButton from '../GlowButton';
import TimePicker from './TimePicker';
import { updateMedicine, deleteMedicine } from '../../services/medicineService';

const EditMedicineModal = ({ isOpen, onClose, medicine, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);

  const parseDateToTime = (dateStr) => {
    if (!dateStr) return Date.now();
    if (!isNaN(dateStr)) return Number(dateStr);
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day).getTime();
    }
    const parsed = new Date(dateStr).getTime();
    return isNaN(parsed) ? Date.now() : parsed;
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      if (dateVal.toDate && typeof dateVal.toDate === 'function') {
        return dateVal.toDate().toISOString().split('T')[0];
      }
      // If it is numeric, parse it as a timestamp
      if (!isNaN(dateVal)) {
        const d = new Date(Number(dateVal));
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      }
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }
    return '';
  };

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

  useEffect(() => {
    if (medicine) {
      const formattedStart = formatDate(medicine.startDate);
      const formattedEnd = formatDate(medicine.endDate);
      setFormData({
        ...medicine,
        scheduleTimes: medicine.scheduleTimes || {},
        slotStatus: medicine.slotStatus || {},
        startDate: formattedStart,
        endDate: formattedEnd,
      });
    }
  }, [medicine]);

  const slots = [
    { id: 'MORNING', label: 'Morning' },
    { id: 'AFTERNOON', label: 'Afternoon' },
    { id: 'NIGHT', label: 'Night' }
  ];

  const handleSlotToggle = (slotId) => {
    const newSchedule = { ...formData.scheduleTimes };
    const newStatus = { ...formData.slotStatus };
    const newSlots = [...(formData.scheduleSlots || [])];

    if (newSchedule[slotId]) {
      delete newSchedule[slotId];
      delete newStatus[slotId];
      const index = newSlots.indexOf(slotId);
      if (index > -1) newSlots.splice(index, 1);
    } else {
      let defaultTime = "08:00 AM";
      if (slotId === 'AFTERNOON') defaultTime = "01:00 PM";
      if (slotId === 'NIGHT') defaultTime = "08:00 PM";

      newSchedule[slotId] = defaultTime;
      newStatus[slotId] = "PENDING";
      newSlots.push(slotId);
    }
    setFormData({
      ...formData,
      scheduleTimes: newSchedule,
      slotStatus: newStatus,
      scheduleSlots: newSlots
    });
  };

  const handleTimeChange = (slotId, time) => {
    setFormData({
      ...formData,
      scheduleTimes: { ...formData.scheduleTimes, [slotId]: time }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scheduleSlots = Object.keys(formData.scheduleTimes);

    if (scheduleSlots.length === 0) {
      alert("Please select at least one schedule slot");
      return;
    }

    setLoading(true);
    try {
      const { id, ...updateData } = formData;
      const dosageAmount = parseFloat(formData.dosageAmount);
      const frequency = scheduleSlots.length;

      const dataToSave = {
        ...updateData,
        dosageAmount: dosageAmount,
        totalQuantity: parseFloat(formData.totalQuantity),
        remainingQuantity: parseFloat(formData.remainingQuantity),
        threshold: parseFloat(formData.threshold),
        frequency: frequency,
        dosagePerDay: dosageAmount * frequency,
        startDate: parseDateToTime(formData.startDate),
        endDate: parseDateToTime(formData.endDate),
        lastUpdatedTime: Date.now(),
        scheduleSlots: scheduleSlots,
      };

      await updateMedicine(id, dataToSave);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating medicine:", error);
      alert("Failed to update medicine.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      setLoading(true);
      try {
        await deleteMedicine(medicine.id);
        onSuccess();
        onClose();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && formData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
          data-testid="edit-medicine-modal"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative border border-cyan-500/30"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              data-testid="close-modal-button"
            >
              <X size={24} />
            </button>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Package className="text-cyan-400" /> Edit Medicine
              </h2>
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete Medicine"
                data-testid="delete-medicine-button"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Medicine Name</label>
                  <input
                    required
                    data-testid="edit-med-name"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Dosage</label>
                    <input
                      required
                      type="number"
                      step="any"
                      data-testid="edit-med-dosage"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      value={formData.dosageAmount}
                      onChange={(e) => setFormData({...formData, dosageAmount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Unit</label>
                    <input
                      required
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      value={formData.unit || ''}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Clock size={18} className="text-cyan-400" /> Schedule Doses
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {slots.map(slot => (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-xl border transition-all ${
                        formData.scheduleTimes[slot.id] ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-slate-900/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white">{slot.label}</span>
                        <input
                          type="checkbox"
                          checked={!!formData.scheduleTimes[slot.id]}
                          onChange={() => handleSlotToggle(slot.id)}
                          className="accent-cyan-500 h-4 w-4"
                        />
                      </div>
                      {formData.scheduleTimes[slot.id] && (
                        <TimePicker
                          value={formData.scheduleTimes[slot.id]}
                          onChange={(time) => handleTimeChange(slot.id, time)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Package size={16} /> Remaining
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    value={formData.remainingQuantity}
                    onChange={(e) => setFormData({...formData, remainingQuantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Package size={16} /> Total
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({...formData, totalQuantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Info size={16} /> Limit
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    value={formData.threshold}
                    onChange={(e) => setFormData({...formData, threshold: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Calendar size={16} /> Start Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Calendar size={16} /> End Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
                <GlowButton type="submit" loading={loading} className="px-8 py-2" data-testid="save-medicine-button">
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

export default EditMedicineModal;
