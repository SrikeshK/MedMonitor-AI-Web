import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

/**
 * Service to handle medicine data from Firestore
 * Mirrors Android App Architecture and Schema Exactly
 */

export const INVENTORY_STATES = {
  EMPTY: 'EMPTY',
  CRITICAL: 'CRITICAL',
  LOW: 'LOW',
  NORMAL: 'NORMAL'
};

export const getInventoryState = (medicine) => {
  const remainingQuantity = medicine.remainingQuantity || 0;
  const dosageAmount = medicine.dosageAmount || 0;
  const threshold = medicine.stockThreshold || 10; // Default threshold if not provided
  const dosagePerDay = medicine.dosagePerDay || 0;
  const scheduleTimes = medicine.scheduleTimes || {};

  if (remainingQuantity <= 0) {
    return INVENTORY_STATES.EMPTY;
  }

  const usage = Math.max(
    dosagePerDay,
    Object.keys(scheduleTimes).length
  );

  const daysLeft = usage > 0 ? Math.ceil(remainingQuantity / usage) : Infinity;

  if (remainingQuantity < dosageAmount || daysLeft <= 1) {
    return INVENTORY_STATES.CRITICAL;
  }

  if (remainingQuantity <= threshold) {
    return INVENTORY_STATES.LOW;
  }

  return INVENTORY_STATES.NORMAL;
};

export const getDaysLeft = (medicine) => {
  const remainingQuantity = medicine.remainingQuantity || 0;
  const dosagePerDay = medicine.dosagePerDay || 0;
  const scheduleTimes = medicine.scheduleTimes || {};

  const usage = Math.max(
    dosagePerDay,
    Object.keys(scheduleTimes).length
  );

  if (usage <= 0) return null;
  return Math.ceil(remainingQuantity / usage);
};

/**
 * Case-insensitive slot status lookup helper
 */
export const getNormalizedSlotStatus = (slotStatus, slotName) => {
  if (!slotStatus || !slotName) return 'PENDING';
  let val = slotStatus[slotName];
  if (val === undefined) {
    const target = slotName.toLowerCase();
    const foundKey = Object.keys(slotStatus).find(k => k.toLowerCase() === target);
    val = foundKey ? slotStatus[foundKey] : 'PENDING';
  }
  return String(val || 'PENDING').toUpperCase();
};

export const getUserMedicines = async (userId) => {
  const q = query(collection(db, 'Medicines'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToMedicines = (userId, callback, onError) => {
  const q = query(collection(db, 'Medicines'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const medicines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(medicines);
  }, (error) => {
    console.error("Error subscribing to medicines:", error);
    if (onError) onError(error);
  });
};

/**
 * Add a new medicine document
 * Preserves Android App Schema: lastUpdatedTime is Long (epoch milliseconds)
 */
export const addMedicine = async (medicineData) => {
  try {
    const docRef = await addDoc(collection(db, 'Medicines'), {
      ...medicineData,
      createdAt: medicineData.createdAt || Date.now(),
      lastUpdatedTime: Date.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding medicine:", error);
    throw error;
  }
};

/**
 * Update medicine document
 */
export const updateMedicine = async (medicineId, updateData) => {
  try {
    const medicineRef = doc(db, 'Medicines', medicineId);
    await updateDoc(medicineRef, {
      ...updateData,
      lastUpdatedTime: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating medicine:", error);
    throw error;
  }
};

/**
 * Delete medicine document
 */
export const deleteMedicine = async (medicineId) => {
  try {
    const medicineRef = doc(db, 'Medicines', medicineId);
    await deleteDoc(medicineRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting medicine:", error);
    throw error;
  }
};

/**
 * Logic to determine if a dose is "Due Now", "Upcoming", or "Missed"
 * based on Android logic.
 */
export const getTodayMedicines = (medicines) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const GRACE_PERIOD = 30; // 30 minutes based on Android logic

  const processedMeds = [];

  medicines.forEach(med => {
    const scheduleTimes = med.scheduleTimes || {};
    const slotStatus = med.slotStatus || {};
    const creationTimestamp = med.createdAt || med.startDate;

    Object.entries(scheduleTimes).forEach(([slot, timeStr]) => {
      // Parse "hh:mm a" format
      const match = timeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return;

      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const scheduledMinutes = hours * 60 + minutes;
      const currentSlotStatus = getNormalizedSlotStatus(slotStatus, slot);

      let status = "Upcoming";

      if (currentSlotStatus === 'TAKEN' || currentSlotStatus === 'COMPLETED' || currentSlotStatus === 'DELAYED') {
        status = 'Taken';
      } else if (currentSlotStatus === 'MISSED') {
        status = 'Missed';
      } else {
        if (currentMinutes < scheduledMinutes) {
          status = 'Upcoming';
        } else if (currentMinutes >= scheduledMinutes && currentMinutes <= scheduledMinutes + GRACE_PERIOD) {
          status = 'Due Now';
        } else {
          status = 'Missed';
        }

        // Android First-Day Protection
        if (status === 'Missed' && currentSlotStatus === 'PENDING' && creationTimestamp) {
          const creationDate = new Date(creationTimestamp);
          const isToday = creationDate.toDateString() === now.toDateString();
          const creationMinutes = creationDate.getHours() * 60 + creationDate.getMinutes();

          if (isToday && creationMinutes > scheduledMinutes) {
            status = 'Upcoming';
          }
        }
      }

      processedMeds.push({
        id: `${med.id}-${slot}`,
        medId: med.id,
        name: med.name,
        dosage: `${med.dosageAmount} ${med.unit || ''} ${med.type}`,
        time: timeStr,
        slot: slot,
        status: status,
        rawStatus: currentSlotStatus,
        scheduledMinutes
      });
    });
  });

  return processedMeds.sort((a, b) => a.scheduledMinutes - b.scheduledMinutes);
};

/**
 * Aggregates doses into medicine-level objects matching Android behavior.
 */
export const getMedicineDashboardData = (medicines) => {
  const doses = getTodayMedicines(medicines);
  const grouped = {};

  doses.forEach(dose => {
    if (!grouped[dose.medId]) {
      grouped[dose.medId] = {
        id: dose.medId,
        name: dose.name,
        dosage: dose.dosage,
        slots: []
      };
    }
    grouped[dose.medId].slots.push({
      slot: dose.slot,
      time: dose.time,
      status: dose.status,
      scheduledMinutes: dose.scheduledMinutes
    });
  });

  return Object.values(grouped).map(med => {
    const statuses = med.slots.map(s => s.status);

    let overallStatus = 'UPCOMING';

    const hasDueNow = statuses.includes('Due Now');
    const hasTaken = statuses.includes('Taken');
    const hasMissed = statuses.includes('Missed');
    const hasUpcoming = statuses.includes('Upcoming');

    if (hasDueNow) {
      overallStatus = 'DUE_NOW';
    } else if (statuses.every(s => s === 'Taken')) {
      overallStatus = 'COMPLETED';
    } else if (statuses.every(s => s === 'Missed')) {
      overallStatus = 'MISSED';
    } else if (hasTaken && (hasUpcoming || hasMissed)) {
      overallStatus = 'PARTIAL';
    } else if (statuses.every(s => s === 'Upcoming')) {
      overallStatus = 'UPCOMING';
    } else if (hasMissed && hasUpcoming) {
      overallStatus = 'PARTIAL';
    }

    return {
      ...med,
      overallStatus,
      slots: med.slots.sort((a, b) => a.scheduledMinutes - b.scheduledMinutes)
    };
  });
};

/**
 * Calculate adherence dynamically based on Android status values
 */
export const calculateAdherence = (medicines) => {
  let totalDoses = 0;
  let takenDoses = 0;

  medicines.forEach(med => {
    const slotStatus = med.slotStatus || {};
    Object.values(slotStatus).forEach(val => {
      const status = String(val || '').toUpperCase();
      if (status === 'TAKEN' || status === 'COMPLETED' || status === 'DELAYED' || status === 'MISSED') {
        totalDoses++;
        if (status === 'TAKEN' || status === 'COMPLETED' || status === 'DELAYED') {
          takenDoses++;
        }
      }
    });
  });

  if (totalDoses === 0) return 0;
  return Math.round((takenDoses / totalDoses) * 100);
};
