import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToMedicines, getTodayMedicines, calculateAdherence, getMedicineDashboardData } from '../services/medicineService';

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

    // Realtime subscription
    const unsubscribe = subscribeToMedicines(currentUser.uid, (data) => {
      try {
        setMedicines(data);

        // Calculate today's schedule (dose-level)
        const processed = getTodayMedicines(data);
        setTodayMeds(processed);

        // Calculate medicine-level dashboard data
        const dashboardData = getMedicineDashboardData(data);
        setDashboardMeds(dashboardData);

        // Calculate adherence
        const adh = calculateAdherence(data);
        setAdherence(adh);

        // Calculate stats locally
        const currentStats = {
          taken: processed.filter(m => m.status === 'Taken').length,
          missed: processed.filter(m => m.status === 'Missed').length,
          remaining: processed.filter(m => m.status === 'Due Now' || m.status === 'Upcoming').length
        };
        setStats(currentStats);

        setLoading(false);
      } catch (err) {
        console.error("Error processing medicine data:", err);
        setError("Failed to process medicine data");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  return {
    medicines,
    todayMeds,
    dashboardMeds,
    adherence,
    stats,
    loading,
    error
  };
};
