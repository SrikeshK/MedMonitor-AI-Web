import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';

/**
 * Service to handle dose logs and analytics
 * Preserves Android App Schema
 * Updated for Android Analytics Parity
 */

export const subscribeToDoseLogs = (userId, callback, onError) => {
  console.log(`[AnalyticsService] Subscribing to dose_logs for user: ${userId}`);

  const q = query(
    collection(db, 'dose_logs'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    })).sort((a, b) => b.timestamp - a.timestamp);
    callback(logs);
  }, (error) => {
    console.error("[AnalyticsService] Error subscribing to dose logs:", error);
    if (onError) onError(error);
  });
};

/**
 * Android Adherence Parity
 * Formula: (TAKEN + DELAYED) / (TAKEN + DELAYED + MISSED)
 * Excludes OUT_OF_STOCK from calculations
 */
export const calculateWeeklyAdherence = (logs) => {
  if (!logs || logs.length === 0) return [];

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  return last7Days.map(date => {
    const dayLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === date.getTime();
    });

    const takenOnly = dayLogs.filter(l => l.status === 'TAKEN' || l.status === 'COMPLETED').length;
    const delayed = dayLogs.filter(l => l.status === 'DELAYED').length;
    const missed = dayLogs.filter(l => l.status === 'MISSED').length;

    // Denominator excludes OUT_OF_STOCK by only summing these three
    const numerator = takenOnly + delayed;
    const denominator = takenOnly + delayed + missed;

    const rate = denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);

    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      adherence: rate,
      taken: takenOnly,
      delayed: delayed,
      missed: missed,
      total: denominator
    };
  });
};

export const calculateTakenVsMissed = (logs) => {
  if (!logs) return [];
  const taken = logs.filter(l => l.status === 'TAKEN' || l.status === 'COMPLETED').length;
  const missed = logs.filter(l => l.status === 'MISSED').length;
  const delayed = logs.filter(l => l.status === 'DELAYED').length;
  const outOfStock = logs.filter(l => l.status === 'OUT_OF_STOCK').length;

  return [
    { name: 'Taken', value: taken, color: '#22d3ee' },
    { name: 'Missed', value: missed, color: '#f43f5e' },
    { name: 'Delayed', value: delayed, color: '#8b5cf6' },
    { name: 'Out of Stock', value: outOfStock, color: '#64748b' }
  ];
};

/**
 * Android Streak Engine Parity
 */
export const calculateCurrentStreak = (logs) => {
  if (!logs) return 0;

  const logsByDate = {};
  logs.forEach(log => {
    const d = new Date(log.timestamp);
    const dateStr = d.toISOString().split('T')[0];
    if (!logsByDate[dateStr]) logsByDate[dateStr] = [];
    logsByDate[dateStr].push(log);
  });

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    const dayLogs = logsByDate[dateStr] || [];
    const takenCount = dayLogs.filter(l => ['TAKEN', 'COMPLETED', 'DELAYED'].includes(l.status)).length;
    const missedCount = dayLogs.filter(l => l.status === 'MISSED').length;

    if (dateStr === todayStr && dayLogs.length === 0) {
      continue;
    }

    if (takenCount > 0 && missedCount === 0) {
      streak++;
    } else if (missedCount > 0 || dayLogs.length === 0) {
      break;
    }
  }

  return streak;
};

export const getMedicinePerformance = (logs) => {
  if (!logs) return [];
  const medicineStats = {};

  logs.forEach(log => {
    if (!log.medicineName || log.status === 'OUT_OF_STOCK') return;
    if (!medicineStats[log.medicineName]) {
      medicineStats[log.medicineName] = { taken: 0, missed: 0, delayed: 0, total: 0 };
    }

    if (['TAKEN', 'COMPLETED', 'DELAYED', 'MISSED'].includes(log.status)) {
       medicineStats[log.medicineName].total++;
       if (log.status === 'MISSED') {
         medicineStats[log.medicineName].missed++;
       } else if (log.status === 'DELAYED') {
         medicineStats[log.medicineName].delayed++;
       } else {
         medicineStats[log.medicineName].taken++;
       }
    }
  });

  return Object.entries(medicineStats).map(([name, stats]) => {
    const adherentCount = stats.taken + stats.delayed;
    return {
      name,
      adherence: stats.total === 0 ? 0 : Math.round((adherentCount / stats.total) * 100),
      taken: stats.taken,
      delayed: stats.delayed,
      missed: stats.missed,
      total: stats.total
    };
  }).sort((a, b) => b.adherence - a.adherence);
};
