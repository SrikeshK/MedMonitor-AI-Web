import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { updateMedicine } from '../../services/medicineService';
import { useMedicines } from '../../hooks/useMedicines';
import { getAlertsFromMedicines, CLASSIFICATION } from '../../utils/medicineStatusEngine';
import AlertCard from '../../components/alerts/AlertCard';
import EmptyState from '../../components/EmptyState';
import { DashboardCardSkeleton } from '../../components/Skeleton';
import EditMedicineModal from '../../components/medicines/EditMedicineModal';

const Alerts = () => {
  const { addToast } = useUI();
  const { medicines = [], loading, error } = useMedicines();
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  useEffect(() => {
    if (error) {
      addToast({ message: "Failed to sync alerts", type: "error" });
    }
  }, [error, addToast]);

  const alertGroups = useMemo(() => {
    return getAlertsFromMedicines(medicines);
  }, [medicines]);

  const handleMarkViewed = async (alertId) => {
    try {
      // alertId is "medId-SLOT"
      const parts = alertId.split('-');
      const medId = parts[0];
      const slot = parts.slice(1).join('-'); // Handle slots with dashes if any

      const med = medicines.find(m => m.id === medId);
      if (!med) return;

      const newSlotStatus = { ...med.slotStatus, [slot]: 'TAKEN' };

      await updateMedicine(medId, {
        slotStatus: newSlotStatus,
        lastUpdatedTime: Date.now(),
        isTaken: true
      });

      addToast({ message: "Dose marked as taken", type: "success" });
    } catch (error) {
      console.error("Error marking dose as taken:", error);
      addToast({ message: "Failed to update dose status", type: "error" });
    }
  };

  const handleViewDetails = (alert) => {
    const med = medicines.find(m => m.id === alert.medId);
    if (med) {
      setSelectedMedicine(med);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <DashboardCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="p-3 bg-primary-cyan/10 rounded-2xl">
                <Bell className="text-primary-cyan" size={24} />
              </div>
              <motion.span
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full border-2 border-background"
              />
            </div>
            <h1 className="text-4xl font-bold font-display text-white tracking-tight">Alerts <span className="text-primary-cyan">Center</span></h1>
          </div>
          <p className="text-slate-400 font-medium">Realtime monitoring of your medication adherence.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-success/5 border border-success/20 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-xl">
             <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
             <div className="text-xs">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Medical Data Sync</p>
                <p className="text-success font-bold">SYSTEM ONLINE</p>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-16">
        {/* 1. MISSED SECTION */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-1.5 bg-error/10 rounded-lg">
              <AlertCircle size={18} className="text-error" />
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Missed Doses</h2>
          </div>

          {alertGroups[CLASSIFICATION.MISSED].length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {alertGroups[CLASSIFICATION.MISSED].map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onView={() => handleViewDetails(alert)}
                  onMarkViewed={handleMarkViewed}
                />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No missed doses"
              description="You've stayed on top of your schedule so far! Keep it up."
            />
          )}
        </section>

        {/* 2. DUE NOW SECTION */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-1.5 bg-primary-cyan/10 rounded-lg">
              <Clock size={18} className="text-primary-cyan" />
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Due Now</h2>
          </div>

          {alertGroups[CLASSIFICATION.DUE_NOW].length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {alertGroups[CLASSIFICATION.DUE_NOW].map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onView={() => handleViewDetails(alert)}
                  onMarkViewed={handleMarkViewed}
                />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="No medicines due right now"
              description="All current medications are up to date."
            />
          )}
        </section>

        {/* 3. UPCOMING SECTION */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-1.5 bg-slate-800 rounded-lg">
              <Clock size={18} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Upcoming Doses</h2>
          </div>

          {alertGroups[CLASSIFICATION.UPCOMING].length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {alertGroups[CLASSIFICATION.UPCOMING].map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onView={() => handleViewDetails(alert)}
                  onMarkViewed={handleMarkViewed}
                />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No upcoming doses scheduled"
              description="No further doses scheduled for the remainder of the day."
            />
          )}
        </section>
      </div>

      {selectedMedicine && (
        <EditMedicineModal
          isOpen={!!selectedMedicine}
          medicine={selectedMedicine}
          onClose={() => setSelectedMedicine(null)}
          onSuccess={() => setSelectedMedicine(null)}
        />
      )}
    </div>
  );
};

export default Alerts;
