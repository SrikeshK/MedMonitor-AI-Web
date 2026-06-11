import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  History,
  ShoppingCart,
  CheckCircle2,
  Trash2,
  Edit3,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { subscribeToMedicines, getInventoryState, getDaysLeft, INVENTORY_STATES } from '../../services/medicineService';
import GlowButton from '../../components/GlowButton';
import EmptyState from '../../components/EmptyState';
import { MedicineCardSkeleton } from '../../components/Skeleton';
import { cn } from '../../utils/cn';

const Inventory = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToast } = useUI();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToMedicines(currentUser.uid, (data) => {
      setMedicines(data);
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const filteredMeds = medicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inventoryAlerts = medicines.filter(m => getInventoryState(m) !== INVENTORY_STATES.NORMAL);

  const getInventoryBadgeStyle = (state) => {
    switch (state) {
      case INVENTORY_STATES.EMPTY:
        return "text-error bg-error/10 border-error/20";
      case INVENTORY_STATES.CRITICAL:
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case INVENTORY_STATES.LOW:
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      default:
        return "text-success bg-success/10 border-success/20";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8" data-testid="inventory-loading">
        <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <MedicineCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Inventory Sync Failed"
        description="We're having trouble connecting to your medicine cabinet. Please verify your connection."
        actionLabel="Retry Connection"
        onAction={() => window.location.reload()}
        data-testid="inventory-error"
      />
    );
  }

  return (
    <div className="space-y-8 pb-20" data-testid="inventory-page">
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/patient/dashboard')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-4"
        data-testid="back-button"
      >
        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-warning/20 transition-all">
          <ArrowLeft size={18} />
        </div>
        <span className="font-medium">Back to Dashboard</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-warning mb-2"
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Supply Chain Management</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold font-display text-white tracking-tight"
          >
            Stock <span className="text-warning">Inventory</span>
          </motion.h1>
          <p className="text-slate-400 mt-1 font-medium">Monitor your medication supplies and automate refill alerts.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <GlowButton
              disabled
              className="w-auto px-6 bg-slate-800 text-slate-500 border-white/5 cursor-not-allowed opacity-50"
              data-testid="order-refills-button"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Order Refills
            </GlowButton>
            <div className="absolute -top-2 -right-2 bg-warning/20 text-warning text-[8px] font-bold px-1.5 py-0.5 rounded border border-warning/30 uppercase tracking-tighter">
              Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InventoryStat
          label="Items Tracked"
          value={medicines.length}
          icon={Package}
          color="text-primary-cyan"
          bg="bg-primary-cyan/10"
          testid="stat-items-tracked"
        />
        <InventoryStat
          label="Inventory Alerts"
          value={inventoryAlerts.length}
          icon={AlertTriangle}
          color="text-error"
          bg="bg-error/10"
          pulse={inventoryAlerts.length > 0}
          testid="stat-inventory-alerts"
        />
        <InventoryStat
          label="Last Audit"
          value="Today"
          icon={History}
          color="text-success"
          bg="bg-success/10"
          testid="stat-last-audit"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-warning transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search inventory..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-warning/30 transition-all backdrop-blur-md font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="inventory-search"
          />
        </div>
      </div>

      {filteredMeds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredMeds.map((med, idx) => {
              const percentage = (med.remainingQuantity / med.totalQuantity) * 100;
              const inventoryState = getInventoryState(med);
              const daysLeft = getDaysLeft(med);
              const isAlert = inventoryState !== INVENTORY_STATES.NORMAL;

              return (
                <motion.div
                  key={med.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  data-testid="inventory-card"
                  className={cn(
                    "bg-white/[0.03] border rounded-3xl p-6 group transition-all hover:bg-white/[0.05]",
                    isAlert ? "border-error/30" : "border-white/5 hover:border-warning/30"
                  )}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex gap-4">
                      <div className={cn(
                        "p-3 rounded-2xl transition-all shadow-lg",
                        isAlert ? "bg-error/10 text-error" : "bg-warning/10 text-warning"
                      )}>
                        <Package size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-warning transition-colors">{med.name}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{med.type}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate('/patient/medicines')}
                        className="p-2 text-slate-500 hover:text-white transition-colors"
                        data-testid="edit-inventory-btn"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2 font-bold uppercase tracking-widest">
                        <span className="text-slate-500">Current Stock</span>
                        <span className={cn(isAlert ? "text-error" : "text-slate-300")}>
                          {med.remainingQuantity} / {med.totalQuantity} {med.type === 'Tablet' ? 'Pills' : 'Units'}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full relative",
                            isAlert ? "bg-gradient-to-r from-error to-rose-400" : "bg-gradient-to-r from-warning to-amber-300"
                          )}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                        </motion.div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Status</p>
                        <p className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded border inline-block",
                          getInventoryBadgeStyle(inventoryState)
                        )}>
                          {inventoryState}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Availability</p>
                        <p className="text-xs font-bold text-white">
                          {daysLeft !== null ? `~${daysLeft} Days` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <GlowButton
                      variant="outline"
                      disabled
                      className={cn(
                        "h-10 py-0 text-xs mt-2 transition-all cursor-not-allowed opacity-50",
                        isAlert ? "border-error/30 text-error" : "border-warning/30 text-warning"
                      )}
                      data-testid="quick-stock-add"
                    >
                      Quick Stock Add <span className="text-[8px] bg-white/5 px-1 rounded ml-1">Soon</span>
                    </GlowButton>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : searchTerm ? (
        <EmptyState
          icon={Search}
          title="No items found"
          description={`We couldn't find any medications matching "${searchTerm}" in your inventory.`}
          actionLabel="Clear Search"
          onAction={() => setSearchTerm('')}
          data-testid="inventory-search-empty"
        />
      ) : (
        <EmptyState
          icon={Package}
          title="Inventory Clear"
          description="Your medication inventory is currently empty. Add medicines to begin tracking your stock levels automatically."
          actionLabel="Add Medicine"
          onAction={() => navigate('/patient/medicines')}
          data-testid="inventory-empty"
        />
      )}
    </div>
  );
};

const InventoryStat = ({ label, value, icon: Icon, color, bg, pulse, testid }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    data-testid={testid}
    className={cn(
      "bg-white/[0.03] border border-white/5 p-6 rounded-3xl relative overflow-hidden group",
      pulse && "animate-pulse-subtle border-error/30"
    )}
  >
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <h3 className={cn("text-3xl font-bold text-white", color)}>{value}</h3>
      </div>
      <div className={cn("p-4 rounded-2xl group-hover:scale-110 transition-transform", bg, color)}>
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);

export default Inventory;
