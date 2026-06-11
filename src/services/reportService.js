import jsPDF from 'jspdf';
import {
  calculateWeeklyAdherence,
  calculateTakenVsMissed,
  calculateCurrentStreak,
  getMedicinePerformance
} from './analyticsService';
import { getInventoryState, INVENTORY_STATES } from './medicineService';

/**
 * Service to generate clinical adherence reports
 * Upgraded for Clinical Reporting Requirements
 */

export const generateClinicalReport = (logs, medicines, user) => {
  const dailyAdherence = calculateWeeklyAdherence(logs);
  const stats = calculateTakenVsMissed(logs);
  const streak = calculateCurrentStreak(logs);
  const medPerformance = getMedicinePerformance(logs);

  const totalTaken = stats.find(s => s.name === 'Taken')?.value || 0;
  const totalMissed = stats.find(s => s.name === 'Missed')?.value || 0;
  const totalDelayed = stats.find(s => s.name === 'Delayed')?.value || 0;

  // Inventory Summary
  const inventorySummary = medicines.map(med => ({
    name: med.name,
    state: getInventoryState(med),
    remaining: med.remainingQuantity,
    unit: med.unit || 'units'
  }));

  const numerator = totalTaken + totalDelayed;
  const denominator = totalTaken + totalDelayed + totalMissed;
  const adherenceRate = denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);

  // Executive Summary
  const executiveSummary = generateExecutiveSummary(adherenceRate, streak, totalMissed, medPerformance);

  // Clinical Insights
  const insights = generateClinicalInsights(adherenceRate, totalMissed, streak, medPerformance);

  return {
    patientName: user?.displayName || 'Patient',
    reportingPeriod: {
      start: dailyAdherence[0]?.date || 'N/A',
      end: dailyAdherence[dailyAdherence.length - 1]?.date || 'N/A',
      label: 'Last 7 Days'
    },
    generatedAt: new Date().toLocaleString(),
    adherenceRate,
    executiveSummary,
    dailyAdherence,
    medPerformance,
    inventorySummary,
    insights,
    metrics: {
      totalTaken,
      totalMissed,
      totalDelayed,
      currentStreak: streak
    }
  };
};

const generateExecutiveSummary = (rate, streak, missed, medPerformance) => {
  const topMed = medPerformance[0];
  const bottomMed = medPerformance[medPerformance.length - 1];

  let summary = `Patient demonstrates a ${rate}% adherence rate over the current reporting period. `;

  if (streak > 0) {
    summary += `A consistent streak of ${streak} days has been maintained. `;
  }

  if (missed > 0) {
    summary += `There were ${missed} recorded missed doses. `;
  }

  if (topMed && topMed.adherence > 90) {
    summary += `Highest compliance observed with ${topMed.name} (${topMed.adherence}%). `;
  }

  if (bottomMed && bottomMed.adherence < 70) {
    summary += `Attention may be required for ${bottomMed.name} due to lower adherence (${bottomMed.adherence}%).`;
  }

  return summary;
};

const generateClinicalInsights = (rate, missed, streak, medPerformance) => {
  const insights = [];

  if (rate >= 90) {
    insights.push("Clinical compliance is within the optimal range for therapeutic efficacy.");
  } else if (rate >= 75) {
    insights.push("Sub-optimal compliance detected. Monitor for potential barriers to medication adherence.");
  } else {
    insights.push("Critical adherence deficit. Immediate intervention or reminder system review recommended.");
  }

  const strugglingMeds = medPerformance.filter(m => m.adherence < 80);
  if (strugglingMeds.length > 0) {
    insights.push(`Specific adherence challenges noted for: ${strugglingMeds.map(m => m.name).join(', ')}.`);
  }

  if (missed > 3) {
    insights.push("Frequency of missed doses suggests a pattern that may impact treatment outcomes.");
  }

  return insights;
};

export const exportReportAsPDF = (reportData) => {
  const doc = new jsPDF();
  const primaryColor = '#0ea5e9'; // Cyan-500
  const secondaryColor = '#64748b'; // Slate-500
  const errorColor = '#f43f5e';
  const successColor = '#10b981';

  // Header
  doc.setFontSize(22);
  doc.setTextColor(primaryColor);
  doc.text('MedMonitor AI - Clinical Adherence Report', 20, 20);

  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);
  doc.text(`Generated on: ${reportData.generatedAt}`, 20, 28);

  // Reporting Period & Patient
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 35, 190, 35);

  doc.setFontSize(11);
  doc.setTextColor('#1e293b');
  doc.text(`Patient: ${reportData.patientName}`, 20, 45);
  doc.text(`Period: ${reportData.reportingPeriod.start} - ${reportData.reportingPeriod.end} (${reportData.reportingPeriod.label})`, 20, 52);

  // Adherence Score
  doc.setFillColor(248, 250, 252);
  doc.rect(140, 40, 50, 20, 'F');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.text(`${reportData.adherenceRate}%`, 150, 50);
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor);
  doc.text('OVERALL ADHERENCE', 145, 55);

  // Executive Summary
  let y = 70;
  doc.setFontSize(14);
  doc.setTextColor('#0f172a');
  doc.text('Executive Summary', 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor('#475569');
  const summaryLines = doc.splitTextToSize(reportData.executiveSummary, 170);
  doc.text(summaryLines, 20, y);
  y += (summaryLines.length * 5) + 10;

  // Daily Adherence Breakdown (Primary Table)
  doc.setFontSize(14);
  doc.setTextColor('#0f172a');
  doc.text('Daily Adherence Breakdown', 20, y);
  y += 10;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor('#475569');
  doc.text('Date', 25, y + 5);
  doc.text('Taken', 60, y + 5);
  doc.text('Missed', 85, y + 5);
  doc.text('Delayed', 110, y + 5);
  doc.text('Adherence %', 145, y + 5);
  y += 8;

  reportData.dailyAdherence.forEach(day => {
    doc.setTextColor('#1e293b');
    doc.text(`${day.date} (${day.day})`, 25, y + 5);
    doc.text(`${day.taken}`, 60, y + 5);
    doc.setTextColor(day.missed > 0 ? errorColor : '#1e293b');
    doc.text(`${day.missed}`, 85, y + 5);
    doc.setTextColor('#1e293b');
    doc.text(`${day.delayed}`, 110, y + 5);

    const rateColor = day.adherence >= 80 ? successColor : errorColor;
    doc.setTextColor(rateColor);
    doc.text(`${day.adherence}%`, 145, y + 5);

    doc.setDrawColor(241, 245, 249);
    doc.line(20, y + 8, 190, y + 8);
    y += 8;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  // Medicine Performance (Secondary)
  y += 15;
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(14);
  doc.setTextColor('#0f172a');
  doc.text('Medicine Breakdown', 20, y);
  y += 10;

  reportData.medPerformance.forEach(med => {
    doc.setFontSize(10);
    doc.setTextColor('#1e293b');
    doc.text(`${med.name}:`, 25, y);
    doc.setTextColor(med.adherence >= 80 ? successColor : errorColor);
    doc.text(`${med.adherence}%`, 80, y);
    y += 7;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  // Inventory Summary
  y += 10;
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(14);
  doc.setTextColor('#0f172a');
  doc.text('Inventory Status', 20, y);
  y += 10;

  reportData.inventorySummary.forEach(inv => {
    doc.setFontSize(10);
    doc.setTextColor('#475569');
    doc.text(`${inv.name}:`, 25, y);

    let stateColor = successColor;
    if (inv.state === 'EMPTY') stateColor = errorColor;
    else if (inv.state === 'CRITICAL') stateColor = '#f97316';
    else if (inv.state === 'LOW') stateColor = '#fbbf24';

    doc.setTextColor(stateColor);
    doc.text(`${inv.state}`, 80, y);
    doc.setTextColor('#64748b');
    doc.text(`(${inv.remaining} ${inv.unit} left)`, 110, y);
    y += 7;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  // Clinical Insights
  y += 10;
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(14);
  doc.setTextColor('#0f172a');
  doc.text('Clinical Insights', 20, y);
  y += 10;

  reportData.insights.forEach(insight => {
    const lines = doc.splitTextToSize(`• ${insight}`, 160);
    doc.setFontSize(10);
    doc.setTextColor('#475569');
    doc.text(lines, 25, y);
    y += (lines.length * 6);
    if (y > 270) { doc.addPage(); y = 20; }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor);
  doc.text('CONFIDENTIAL MEDICAL REPORT - GENERATED BY MEDMONITOR AI', 20, 285);

  doc.save(`Clinical_Report_${reportData.patientName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};
