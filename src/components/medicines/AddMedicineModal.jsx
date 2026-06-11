import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Plus, Calendar, Package, Info } from 'lucide-react';
import GlowButton from '../GlowButton';
import TimePicker from './TimePicker';
import { addMedicine } from '../../services/medicineService';
import { useAuth } from '../../context/AuthContext';
import { formatTo12Hour } from '../../utils/timeFormatter';

const AddMedicineModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosageAmount: '',
    unit: 'mg',
    type: 'TABLET',
    foodTiming: 'BEFORE_FOOD',
    totalQuantity: '',
    threshold: '',
    startDate: '',
    endDate: '',
    scheduleTimes: {},
  });

  // Handle ESC key and Browser Back
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };

      // Browser back button to close modal
      const handlePopState = (e) => {
        if (isOpen) {
          e.preventDefault();
          onClose();
          // Stay on the same page
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

  const slots = [
    { id: 'MORNING', label: 'Morning' },
    { id: 'AFTERNOON', label: 'Afternoon' },
    { id: 'NIGHT', label: 'Night' }
  ];

  const handleSlotToggle = (slotId) => {
    const newSchedule = { ...formData.scheduleTimes };
    if (newSchedule[slotId]) {
      delete newSchedule[slotId];
    } else {
      let defaultTime = "08:00 AM";
      if (slotId === 'AFTERNOON') defaultTime = "01:00 PM";
      if (slotId === 'NIGHT') defaultTime = "08:00 PM";
      newSchedule[slotId] = defaultTime;
    }
    setFormData({ ...formData, scheduleTimes: newSchedule });
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
      const slotStatus = {};
      scheduleSlots.forEach(slot => {
        slotStatus[slot] = "PENDING";
      });

      const dosageAmount = parseFloat(formData.dosageAmount);
      const totalQuantity = parseFloat(formData.totalQuantity);
      const frequency = scheduleSlots.length;

      const dataToSave = {
        userId: currentUser.uid,
        name: formData.name,
        type: formData.type,
        dosageAmount: dosageAmount,
        totalQuantity: totalQuantity,
        remainingQuantity: totalQuantity,
        unit: formData.unit,
        frequency: frequency,
        startDate: new Date(formData.startDate).getTime(),
        endDate: new Date(formData.endDate).getTime(),
        foodTiming: formData.foodTiming,
        scheduleSlots: scheduleSlots,
        scheduleTimes: formData.scheduleTimes,
        slotStatus: slotStatus,
        scheduledTime: new Date(formData.startDate).getTime(),
        status: "PENDING",
        isTaken: false,
        isCompleted: false,
        completedTime: 0,
        createdAt: Date.now(),
        lastUpdatedTime: Date.now(),
        threshold: parseFloat(formData.threshold),
        dosagePerDay: dosageAmount * frequency,
        lowStockAlertSent: false,
        imageUrl: ""
      };

      await addMedicine(dataToSave);
      onSuccess();
      onClose();
      setFormData({
        name: '', dosageAmount: '', unit: 'mg', type: 'TABLET',
        foodTiming: 'BEFORE_FOOD', totalQuantity: '', threshold: '',
        startDate: '', endDate: '', scheduleTimes: {},
      });
    } catch (error) {
      console.error("Error adding medicine:", error);
      alert("Failed to add medicine.");
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
          data-testid="add-medicine-modal"
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

            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="text-cyan-400" /> Add New Medicine
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Medicine Name</label>
                  <input
                    required
                    data-testid="med-name-input"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="e.g. Paracetamol"
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
                      data-testid="med-dosage-input"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="500"
                      value={formData.dosageAmount}
                      onChange={(e) => setFormData({...formData, dosageAmount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Unit</label>
                    <input
                      required
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      value={formData.unit}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Package size={16} /> Total Quantity
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
                    <Info size={16} /> Low Stock Limit
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
                  Add Medicine
                </GlowButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddMedicineModal;
