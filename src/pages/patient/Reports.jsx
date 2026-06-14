import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  Download,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Search,
  FileBarChart,
  ClipboardList,
  Package,
  Clock,
  ChevronRight,
  Info,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { subscribeToDoseLogs } from '../../services/analyticsService';
import { subscribeToMedicines } from '../../services/medicineService';
import { generateClinicalReport, exportReportAsPDF } from '../../services/reportService';
import ReportCard from '../../components/reports/ReportCard';
import EmptyState from '../../components/EmptyState';
import GlowButton from '../../components/GlowButton';
import { cn } from '../../utils/cn';

const Reports = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToast, showLoading } = useUI();
  const [logs, setLogs] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync Logs and Medicines
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubLogs = () => {};
    let unsubMeds = () => {};

    try {
      unsubLogs = subscribeToDoseLogs(
        currentUser.uid,
        (newLogs) => setLogs(newLogs || []),
        (err) => setError(err)
      );

      unsubMeds = subscribeToMedicines(
        currentUser.uid,
        (newMeds) => setMedicines(newMeds || [])
      );
    } catch (err) {
      setError(err);
      setLoading(false);
    }

    return () => {
      unsubLogs();
      unsubMeds();
    };
  }, [currentUser]);

  // Generate Clinical Report when data changes
  useEffect(() => {
    if (logs.length > 0 && medicines.length > 0) {
      try {
        const reportData = generateClinicalReport(logs, medicines, currentUser);
        setReport(reportData);
        setLoading(false);
      } catch (err) {
        console.error("[Reports] Generation error:", err);
      }
    } else if (!loading && (logs.length === 0 || medicines.length === 0)) {
      setReport(null);
    }
  }, [logs, medicines, currentUser, loading]);

  const handleExportPDF = async () => {
    if (!report) return;
    showLoading(true);
    try {
      await exportReportAsPDF(report);
      addToast({ message: "Clinical adherence report exported successfully", type: "success" });
    } catch (error) {
      addToast({ message: "Failed to generate medical PDF", type: "error" });
    } finally {
      showLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8" data-testid="reports-loading">
        <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-96 bg-white/5 animate-pulse rounded-3xl" />
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white/5 animate-pulse rounded-3xl" />
            <div className="h-48 bg-white/5 animate-pulse rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Diagnostic Error"
        description="We couldn't compile your clinical data. Please verify your connection."
        actionLabel="Retry Analysis"
        onAction={() => window.location.reload()}
        data-testid="reports-error"
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12" data-testid="reports-page">
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

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary-cyan mb-2"
          >
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">Clinical Intelligence Unit</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-white font-display tracking-tight"
          >
            Adherence <span className="text-primary-cyan">Analysis</span>
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-slate-400 backdrop-blur-md">
            <Calendar className="w-4 h-4 mr-2 text-primary-cyan" />
            <span className="text-sm font-bold">{report?.reportingPeriod.label || 'Last 7 Days'}</span>
          </div>
          <GlowButton
            onClick={handleExportPDF}
            disabled={!report}
            data-testid="report-export-button"
            className={cn("w-auto px-5 py-2.5 h-auto text-sm", !report && "opacity-50 cursor-not-allowed")}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Clinical PDF
          </GlowButton>
        </motion.div>
      </div>

      {!report ? (
        <EmptyState
          icon={FileBarChart}
          title="Insufficient Clinical Data"
          description="Log more doses and ensure your medicine list is active to generate a clinical adherence report."
          actionLabel="View Dashboard"
          onAction={() => navigate('/patient/dashboard')}
          data-testid="reports-empty"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Overview & Summary */}
          <div className="lg:col-span-1 space-y-8">
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-1">Vital Statistics</h2>
              <ReportCard report={report} />
            </section>

            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-1">Executive Summary</h2>
              <div className="bg-primary-cyan/5 border border-primary-cyan/10 p-6 rounded-3xl backdrop-blur-sm">
                <p className="text-slate-300 text-sm leading-relaxed font-medium italic">
                  "{report.executiveSummary}"
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-1">Inventory Status</h2>
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 space-y-3">
                  {report.inventorySummary.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <Package className={cn(
                          "w-4 h-4",
                          item.state === 'NORMAL' ? 'text-success' : 'text-warning'
                        )} />
                        <div>
                          <p className="text-sm text-white font-bold">{item.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">{item.remaining} {item.unit} Left</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full border font-bold",
                        item.state === 'NORMAL' ? 'text-success border-success/20 bg-success/5' :
                        item.state === 'LOW' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' :
                        'text-error border-error/20 bg-error/5'
                      )}>
                        {item.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Detailed Breakdowns */}
          <div className="lg:col-span-2 space-y-8">

            {/* Primary: Daily Adherence Matrix */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daily Adherence Matrix</h2>
                <span className="text-[10px] text-primary-cyan font-bold uppercase tracking-wider bg-primary-cyan/10 px-2 py-0.5 rounded-full">Primary Metric</span>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="grid grid-cols-5 p-4 border-b border-white/5 bg-white/[0.02] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Date</span>
                  <span className="text-center">Taken</span>
                  <span className="text-center">Missed</span>
                  <span className="text-center">Delayed</span>
                  <span className="text-right">Adherence</span>
                </div>
                <div className="divide-y divide-white/5">
                  {report.dailyAdherence.map((day, idx) => (
                    <div key={idx} className="grid grid-cols-5 p-4 items-center hover:bg-white/[0.01] transition-colors">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{day.day}</span>
                        <span className="text-[10px] text-slate-500">{day.date}</span>
                      </div>
                      <span className="text-center text-success font-mono font-bold">{day.taken}</span>
                      <span className={cn("text-center font-mono font-bold", day.missed > 0 ? "text-error" : "text-slate-600")}>{day.missed}</span>
                      <span className="text-center text-purple-400 font-mono font-bold">{day.delayed}</span>
                      <div className="text-right">
                        <span className={cn(
                          "text-sm font-bold font-mono",
                          day.adherence >= 80 ? "text-success" : "text-error"
                        )}>
                          {day.adherence}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Secondary: Medicine Performance */}
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-1">Medicine Performance Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.medPerformance.map((med, idx) => (
                  <div key={idx} className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-primary-cyan/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-bold group-hover:text-primary-cyan transition-colors">{med.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Historical Performance</p>
                      </div>
                      <span className={cn(
                        "text-lg font-bold font-mono",
                        med.adherence >= 80 ? "text-success" : "text-error"
                      )}>
                        {med.adherence}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${med.adherence}%` }}
                        className={cn(
                          "h-full rounded-full",
                          med.adherence >= 80 ? "bg-success" : "bg-error"
                        )}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <span>{med.taken} Taken</span>
                      <span>{med.missed} Missed</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Clinical Insights */}
            <section className="bg-primary-cyan/5 border border-primary-cyan/20 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                <ClipboardList size={120} className="text-primary-cyan" />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary-cyan/10 rounded-2xl shadow-lg shadow-primary-cyan/5">
                  <Info className="w-6 h-6 text-primary-cyan" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Clinical Insights</h3>
                  <p className="text-[10px] text-primary-cyan font-bold uppercase tracking-[0.2em]">Medical Intelligence Output</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 relative z-10">
                {report.insights.map((insight, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i}
                    className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex gap-4 backdrop-blur-md"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary-cyan shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 font-medium">{insight}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}


    </div>
  );
};

export default Reports;
