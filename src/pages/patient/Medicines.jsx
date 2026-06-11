import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, AlertTriangle,
  ChevronDown, ChevronUp, Package, Clock,
  Calendar, Info, Edit2, CheckCircle2,
  AlertCircle, XCircle, SearchX
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { subscribeToMedicines, getInventoryState, getDaysLeft, INVENTORY_STATES } from '../../services/medicineService';
import AddMedicineModal from '../../components/medicines/AddMedicineModal';
import EditMedicineModal from '../../components/medicines/EditMedicineModal';
import GlowButton from '../../components/GlowButton';
import EmptyState from '../../components/EmptyState';
import { MedicineCardSkeleton } from '../../components/Skeleton';
import { cn } from '../../utils/cn';

const Medicines = () => {
  const { currentUser } = useAuth();
  const { addToast } = useUI();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, LOW_STOCK, ACTIVE

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToMedicines(currentUser.uid, (data) => {
      setMedicines(data);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      addToast({ message: "Failed to sync medicines", type: "error" });
    });

    return () => unsubscribe();
  }, [currentUser, addToast]);

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase());
    const inventoryState = getInventoryState(med);
    const isProblematicStock = inventoryState !== INVENTORY_STATES.NORMAL;

    if (filter === 'LOW_STOCK') return matchesSearch && isProblematicStock;
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'TAKEN':
      case 'COMPLETED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'MISSED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'PENDING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'TAKEN':
      case 'COMPLETED': return <CheckCircle2 size={14} />;
      case 'MISSED': return <XCircle size={14} />;
      case 'PENDING': return <Clock size={14} />;
      default: return <Info size={14} />;
    }
  };

  const getInventoryBadgeStyle = (state) => {
    switch (state) {
      case INVENTORY_STATES.EMPTY:
        return "text-error bg-error/10 border-error/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
      case INVENTORY_STATES.CRITICAL:
        return "text-orange-500 bg-orange-500/10 border-orange-500/20 animate-pulse";
      case INVENTORY_STATES.LOW:
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      default:
        return "text-success bg-success/10 border-success/20";
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold font-display text-white tracking-tight"
          >
            Medicine <span className="text-primary-cyan">Inventory</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 mt-1"
          >
            Manage and track your daily medication schedule.
          </motion.p>
        </div>
        <GlowButton onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 w-full md:w-auto">
          <Plus size={20} /> Add Medicine
        </GlowButton>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: 'Total Medications',
            value: medicines.length,
            icon: Package,
            color: 'text-primary-cyan',
            bg: 'bg-primary-cyan/10',
            border: 'border-primary-cyan/20'
          },
          {
            label: 'Inventory Alerts',
            value: medicines.filter(m => getInventoryState(m) !== INVENTORY_STATES.NORMAL).length,
            icon: AlertTriangle,
            color: 'text-error',
            bg: 'bg-error/10',
            border: 'border-error/20',
            pulse: medicines.some(m => getInventoryState(m) !== INVENTORY_STATES.NORMAL)
          },
          {
            label: 'System Status',
            value: 'Healthy',
            icon: CheckCircle2,
            color: 'text-success',
            bg: 'bg-success/10',
            border: 'border-success/20'
          }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "bg-white/[0.03] border backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden group transition-all",
              stat.border,
              stat.pulse && "animate-pulse-subtle shadow-[0_0_20px_rgba(239,68,68,0.1)]"
            )}
          >
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className={cn("text-3xl font-bold", stat.color)}>{stat.value}</h3>
              </div>
              <div className={cn("p-4 rounded-2xl group-hover:scale-110 transition-transform", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-cyan transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search your medicine cabinet..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/30 transition-all backdrop-blur-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['ALL', 'LOW_STOCK'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3.5 rounded-2xl border transition-all whitespace-nowrap font-bold text-sm ${
                filter === f
                  ? 'bg-primary-cyan/10 border-primary-cyan/30 text-primary-cyan shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {f === 'LOW_STOCK' ? 'STOCK ALERTS' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines List */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <MedicineCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredMedicines.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredMedicines.map((med) => {
              const inventoryState = getInventoryState(med);
              const daysLeft = getDaysLeft(med);
              const isAlert = inventoryState !== INVENTORY_STATES.NORMAL;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={med.id}
                  whileHover={{ y: -4 }}
                  className={cn(
                    "bg-white/[0.03] border rounded-3xl overflow-hidden transition-all duration-300 group hover:bg-white/[0.05]",
                    isAlert ? 'border-error/30 ring-1 ring-error/10' : 'border-white/10 hover:border-primary-cyan/30'
                  )}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex gap-4">
                        <div className={cn(
                          "p-4 rounded-2xl transition-all shadow-lg group-hover:scale-110",
                          isAlert
                            ? 'bg-error/10 text-error shadow-error/5'
                            : 'bg-primary-cyan/10 text-primary-cyan shadow-primary-cyan/5'
                        )}>
                          <Package size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-white group-hover:text-primary-cyan transition-colors">
                              {med.name}
                            </h3>
                            <span className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider",
                              getInventoryBadgeStyle(inventoryState)
                            )}>
                              {inventoryState}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm font-medium">{med.dosageAmount} • {med.type}</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedMedicine(med)}
                        data-testid="edit-medicine-button"
                        className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </motion.button>
                    </div>

                    {/* Inventory Mini Indicator */}
                    <div className="mb-6 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between text-xs mb-2 font-bold tracking-tight">
                        <span className="text-slate-500 uppercase">Inventory Status</span>
                        <span className={isAlert ? 'text-error' : 'text-slate-300'}>
                          {med.remainingQuantity} / {med.totalQuantity} units
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(med.remainingQuantity / med.totalQuantity) * 100}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full relative",
                            isAlert
                              ? 'bg-gradient-to-r from-error to-rose-400'
                              : 'bg-gradient-to-r from-primary-cyan to-blue-400'
                          )}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                        </motion.div>
                      </div>
                      <div className="flex justify-between items-center mt-2.5">
                        {isAlert ? (
                          <p className="text-[10px] text-error flex items-center gap-1.5 font-bold uppercase tracking-wider">
                            <AlertTriangle size={12} className={inventoryState === INVENTORY_STATES.CRITICAL ? "animate-pulse" : ""} />
                            {inventoryState === INVENTORY_STATES.EMPTY ? "Stock Depleted" : "Refill Recommended"}
                          </p>
                        ) : (
                          <div />
                        )}
                        {daysLeft !== null && (
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {daysLeft <= 0 ? "Out of stock" : `~${daysLeft} days left`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Schedule Slots */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(med.scheduleTimes || {}).map(([slot, time]) => (
                        <div
                          key={slot}
                          className={cn(
                            "px-3.5 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-2 transition-colors uppercase tracking-wider",
                            getStatusColor(med.slotStatus?.[slot.charAt(0).toUpperCase() + slot.slice(1).toLowerCase()] || med.slotStatus?.[slot])
                          )}
                        >
                          {getStatusIcon(med.slotStatus?.[slot.charAt(0).toUpperCase() + slot.slice(1).toLowerCase()] || med.slotStatus?.[slot])}
                          <span>{slot}: {time}</span>
                        </div>
                      ))}
                    </div>

                    {/* Expandable Details */}
                    <button
                      onClick={() => setExpandedId(expandedId === med.id ? null : med.id)}
                      className="w-full mt-6 flex items-center justify-center gap-2 text-slate-500 hover:text-primary-cyan text-[11px] font-bold uppercase tracking-widest py-2.5 rounded-xl hover:bg-white/5 transition-all"
                    >
                      {expandedId === med.id ? (
                        <>Collapse Details <ChevronUp size={14} /></>
                      ) : (
                        <>Expand Overview <ChevronDown size={14} /></>
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedId === med.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-white/5 mt-4 pt-6 space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { icon: Calendar, label: 'Start Date', value: med.startDate },
                              { icon: Clock, label: 'Food Timing', value: med.foodTiming?.replace('_', ' ') },
                              { icon: Info, label: 'Refill Limit', value: `${med.threshold} units` },
                              { icon: Package, label: 'Capacity', value: `${med.totalQuantity} units` }
                            ].map((item, idx) => (
                              <div key={idx} className="flex flex-col gap-1">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.label}</span>
                                <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
                                  <item.icon size={14} className="text-primary-cyan" />
                                  <span>{item.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : searchQuery ? (
        <EmptyState
          icon={SearchX}
          title="Medicine not found"
          description={`We couldn't find "${searchQuery}" in your current inventory. Please check the spelling or add it as a new medicine.`}
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <EmptyState
          icon={Package}
          title="Your cabinet is empty"
          description="You haven't added any medications yet. Add your first medicine to begin tracking your adherence and health."
          actionLabel="Add Your First Medicine"
          onAction={() => setIsAddModalOpen(true)}
        />
      )}

      {/* Modals */}
      <AddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {}} // Realtime sync will handle update
      />

      <EditMedicineModal
        isOpen={!!selectedMedicine}
        medicine={selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
        onSuccess={() => setSelectedMedicine(null)}
      />
    </div>
  );
};

export default Medicines;
