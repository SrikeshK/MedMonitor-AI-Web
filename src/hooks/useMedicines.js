import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToMedicines, getTodayMedicines, calculateAdherence, getMedicineDashboardData } from '../services/medicineService';
import { subscribeToDoseLogs } from '../services/analyticsService';

export const useMedicines = () => {
  const { currentUser } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [todayMeds, setTodayMeds] = useState([]);
  const [dashboardMeds, setDashboardMeds] = useState([]);
  const [adherence, setAdherence] = useState(0);
  const [stats, setStats] = useState({ taken: 0, missed: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let latestMeds = null;
    let latestLogs = null;
    let logsReady = false;

    const isLogToday = (logTimestamp) => {
      if (!logTimestamp) return false;
      const date = new Date(logTimestamp);
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };

    /**
     * Parses a schedule time string like "10:14 am" into minutes since midnight (local).
     */
    const parseScheduleMinutes = (timeStr) => {
      if (!timeStr) return -1;
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return -1;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    /**
     * Given a dose_log (which may NOT have a slot field — Android omits it),
     * determine which scheduled slot it corresponds to.
     *
     * Strategy:
     *  1. If log.slot exists → match case-insensitively to scheduleTimes keys.
     *  2. If log.slot is missing AND medicine has 1 slot → use that slot.
     *  3. If log.slot is missing AND medicine has multiple slots → find the
     *     scheduled slot whose time is closest to the log's timestamp.
     */
    const resolveSlotKey = (log, med) => {
      const scheduleEntries = Object.entries(med.scheduleTimes || {});
      if (scheduleEntries.length === 0) return null;

      if (log.slot) {
        // Explicit slot in log — find the matching key (case-insensitive)
        const logSlotLower = log.slot.toLowerCase();
        return (
          scheduleEntries.find(([k]) => k.toLowerCase() === logSlotLower)?.[0] ||
          log.slot.toUpperCase()
        );
      }

      // No slot field in log. Use schedule time proximity.
      if (scheduleEntries.length === 1) {
        return scheduleEntries[0][0];
      }

      // Multiple slots — find the one whose scheduled time is closest to log timestamp
      const logDate = new Date(log.timestamp);
      const logMinutes = logDate.getHours() * 60 + logDate.getMinutes();
      let bestKey = null;
      let minDiff = Infinity;

      scheduleEntries.forEach(([slotKey, timeStr]) => {
        const slotMinutes = parseScheduleMinutes(timeStr);
        if (slotMinutes < 0) return;
        const diff = Math.abs(logMinutes - slotMinutes);
        if (diff < minDiff) {
          minDiff = diff;
          bestKey = slotKey;
        }
      });

      return bestKey;
    };

    const processMergedData = (medsData, logsData) => {
      try {
        const todayLogs = (logsData || []).filter(log => isLogToday(log.timestamp));

        const mergedMeds = medsData.map(med => {
          // Start with whatever slotStatus Firestore has (may be {} if Android doesn't write it)
          const mergedSlotStatus = { ...med.slotStatus };

          // Find all today's logs for this medicine
          const todayMedLogs = todayLogs.filter(log =>
            log.medicineId === med.id ||
            (log.medicineName && med.name &&
              log.medicineName.toLowerCase() === med.name.toLowerCase())
          );

          todayMedLogs.forEach(log => {
            const statusVal = String(log.status || '').toUpperCase();
            if (!['TAKEN', 'COMPLETED', 'DELAYED', 'MISSED', 'OUT_OF_STOCK'].includes(statusVal)) return;

            // Resolve which slot this log belongs to (handles missing slot field)
            const targetSlotKey = resolveSlotKey(log, med);
            if (!targetSlotKey) return;

            // Find the existing key in mergedSlotStatus at its original casing.
            // This prevents creating duplicate keys with different casing
            // (e.g., both "morning" and "MORNING"), which would cause the exact-match
            // lookup in getNormalizedSlotStatus to find the old value instead of the new one.
            const existingKey = Object.keys(mergedSlotStatus).find(
              k => k.toLowerCase() === targetSlotKey.toLowerCase()
            ) || targetSlotKey;

            const existingStatus = String(mergedSlotStatus[existingKey] || '').toUpperCase();

            // Apply status — never downgrade from TAKEN/COMPLETED/DELAYED
            if (['TAKEN', 'COMPLETED', 'DELAYED'].includes(statusVal)) {
              if (!['TAKEN', 'COMPLETED', 'DELAYED'].includes(existingStatus)) {
                mergedSlotStatus[existingKey] = 'TAKEN';
              }
            } else if (statusVal === 'MISSED') {
              if (!['TAKEN', 'COMPLETED', 'DELAYED'].includes(existingStatus)) {
                mergedSlotStatus[existingKey] = 'MISSED';
              }
            } else if (statusVal === 'OUT_OF_STOCK') {
              if (!['TAKEN', 'COMPLETED', 'DELAYED'].includes(existingStatus)) {
                mergedSlotStatus[existingKey] = 'OUT_OF_STOCK';
              }
            }
          });

          return { ...med, slotStatus: mergedSlotStatus };
        });

        setMedicines(mergedMeds);

        const processed = getTodayMedicines(mergedMeds);
        setTodayMeds(processed);

        const dashboardData = getMedicineDashboardData(mergedMeds);
        setDashboardMeds(dashboardData);

        const adh = calculateAdherence(mergedMeds);
        setAdherence(adh);

        const currentStats = {
          taken: processed.filter(m => m.status === 'Taken').length,
          missed: processed.filter(m => m.status === 'Missed').length,
          remaining: processed.filter(m => m.status === 'Due Now' || m.status === 'Upcoming').length
        };
        setStats(currentStats);

        setLoading(false);
      } catch (err) {
        console.error('Error processing medicine/log data:', err);
        setError('Failed to process medicine data');
        setLoading(false);
      }
    };

    // Subscribe to Medicines collection
    const unsubscribeMeds = subscribeToMedicines(
      currentUser.uid,
      (medsData) => {
        latestMeds = medsData;
        if (logsReady) {
          // Logs already loaded — process immediately
          processMergedData(latestMeds, latestLogs || []);
        } else {
          // Wait up to 1s for dose_logs before rendering.
          // This ensures Android TAKEN logs override any stale slotStatus.
          setTimeout(() => {
            if (latestMeds !== null && !logsReady) {
              logsReady = true;
              processMergedData(latestMeds, latestLogs || []);
            }
          }, 1000);
        }
      },
      (err) => {
        console.error('Firestore error on Medicines subscription:', err);
        setError('Failed to sync medicines');
        setLoading(false);
      }
    );

    // Subscribe to dose_logs — authoritative source for what was actually taken on Android
    const unsubscribeLogs = subscribeToDoseLogs(
      currentUser.uid,
      (logsData) => {
        latestLogs = logsData;
        logsReady = true;
        if (latestMeds !== null) {
          processMergedData(latestMeds, latestLogs);
        }
      },
      (err) => {
        // Non-fatal — fall back to slotStatus alone
        console.warn('dose_logs subscription error (non-fatal):', err);
        latestLogs = [];
        logsReady = true;
        if (latestMeds !== null) {
          processMergedData(latestMeds, latestLogs);
        }
      }
    );

    return () => {
      unsubscribeMeds();
      unsubscribeLogs();
    };
  }, [currentUser]);

  return { medicines, todayMeds, dashboardMeds, adherence, stats, loading, error };
};
