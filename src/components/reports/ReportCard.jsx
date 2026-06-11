import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { exportReportAsPDF } from '../../services/reportService';

const ReportCard = ({ report }) => {
  const handleDownload = () => {
    exportReportAsPDF(report);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-card group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-cyan-500/10 rounded-xl">
            <FileText className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              report.adherenceRate >= 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {report.adherenceRate}% Adherence
            </span>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
          Weekly Health Summary
        </h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-slate-400 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            {report.generatedAt}
          </div>
          <div className="flex items-center text-slate-400 text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            {report.currentStreak} Day Streak
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Taken</p>
            <p className="text-lg font-bold text-white">{report.totalTaken}</p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Missed</p>
            <p className="text-lg font-bold text-rose-400">{report.totalMissed}</p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white rounded-xl transition-all duration-300 font-medium border border-cyan-500/20"
        >
          <Download className="w-4 h-4" />
          Download PDF Report
        </button>
      </div>

      {/* Hover glow effect */}
      <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </motion.div>
  );
};

export default ReportCard;
