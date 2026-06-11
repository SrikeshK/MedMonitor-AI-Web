import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToDoseLogs,
  calculateWeeklyAdherence,
  calculateTakenVsMissed,
  calculateCurrentStreak,
  getMedicinePerformance
} from '../services/analyticsService';

export const useAnalytics = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    console.log("[useAnalytics] Initializing subscription...");
    setLoading(true);

    const unsubscribe = subscribeToDoseLogs(
      currentUser.uid,
      (data) => {
        console.log("[useAnalytics] Received data, logs count:", data.length);
        setLogs(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("[useAnalytics] Subscription error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      console.log("[useAnalytics] Cleaning up subscription");
      unsubscribe();
    };
  }, [currentUser]);

  const stats = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    try {
      const taken = logs.filter(l => l.status === 'TAKEN').length;
      const delayed = logs.filter(l => l.status === 'DELAYED').length;
      const missed = logs.filter(l => l.status === 'MISSED').length;

      const numerator = taken + delayed;
      const denominator = taken + delayed + missed;

      return {
        weeklyTrend: calculateWeeklyAdherence(logs),
        statusDistribution: calculateTakenVsMissed(logs),
        currentStreak: calculateCurrentStreak(logs),
        medicinePerformance: getMedicinePerformance(logs),
        totalLogs: logs.length,
        overallAdherence: denominator === 0 ? 0 : Math.round((numerator / denominator) * 100)
      };
    } catch (err) {
      console.error("[useAnalytics] Error calculating stats:", err);
      return null;
    }
  }, [logs]);

  const insights = useMemo(() => {
    if (!stats) return [];

    try {
      const result = [];

      // Streak Insight
      if (stats.currentStreak >= 3) {
        result.push({
          type: 'success',
          text: `Impressive! You're on a ${stats.currentStreak}-day perfect streak.`
        });
      }

      // Adherence Insight
      if (stats.overallAdherence >= 90) {
        result.push({
          type: 'success',
          text: 'Your overall adherence is excellent. Keep it up!'
        });
      } else if (stats.overallAdherence < 70) {
        result.push({
          type: 'warning',
          text: 'Adherence has dropped below 70%. Consider setting more reminders.'
        });
      }

      // Performance Insight
      const worstMed = stats.medicinePerformance?.find(m => m.adherence < 80);
      if (worstMed) {
        result.push({
          type: 'info',
          text: `You seem to be missing "${worstMed.name}" more often than others.`
        });
      }

      return result;
    } catch (err) {
      console.error("[useAnalytics] Error calculating insights:", err);
      return [];
    }
  }, [stats]);

  return { stats, insights, loading, error };
};
