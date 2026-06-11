import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

/**
 * Caregiver Service
 * Preserves Android Caregiver Architecture
 */

export const subscribeToPatients = (caregiverId, callback, onError) => {
  console.log(`[CaregiverService] Subscribing to patients for caregiver: ${caregiverId}`);
  const q = query(
    collection(db, 'patients'),
    where('caregiverId', '==', caregiverId)
  );

  return onSnapshot(q, (snapshot) => {
    console.log(`[CaregiverService] Patients snapshot received. Size: ${snapshot.size}`);
    const patients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(patients);
  }, (error) => {
    console.error("[CaregiverService] Error subscribing to patients:", error);
    if (onError) onError(error);
  });
};

export const getPatientDetails = async (patientId) => {
  try {
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching patient details:", error);
    throw error;
  }
};

export const subscribeToPatientMedicines = (patientId, callback, onError) => {
  const q = query(
    collection(db, 'patient_medicines'),
    where('patientId', '==', patientId)
  );

  return onSnapshot(q, (snapshot) => {
    const medicines = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(medicines);
  }, (error) => {
    console.error("[CaregiverService] Error subscribing to patient medicines:", error);
    if (onError) onError(error);
  });
};

export const subscribeToPatientLogs = (patientId, callback, onError) => {
  console.log(`[CaregiverService] Subscribing to logs for patient: ${patientId}`);
  const q = query(
    collection(db, 'patient_logs'),
    where('patientId', '==', patientId)
  );

  return onSnapshot(q, (snapshot) => {
    console.log(`[CaregiverService] Patient logs snapshot received. Size: ${snapshot.size}`);
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    })).sort((a, b) => b.timestamp - a.timestamp);
    callback(logs);
  }, (error) => {
    console.error("[CaregiverService] Error subscribing to patient logs:", error);
    if (onError) onError(error);
  });
};

export const addPatient = async (caregiverId, patientData) => {
  try {
    const docRef = await addDoc(collection(db, 'patients'), {
      ...patientData,
      caregiverId,
      createdAt: serverTimestamp(),
      status: 'ACTIVE'
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding patient:", error);
    throw error;
  }
};

export const calculatePatientAdherence = (logs) => {
  if (!logs || logs.length === 0) return 0;

  const relevantLogs = logs.filter(log => ['TAKEN', 'MISSED', 'COMPLETED', 'DELAYED'].includes(log.status));
  if (relevantLogs.length === 0) return 0;

  const takenCount = relevantLogs.filter(log => ['TAKEN', 'COMPLETED', 'DELAYED'].includes(log.status)).length;
  return Math.round((takenCount / relevantLogs.length) * 100);
};

export const calculateOverallCaregiverStats = (patientsData) => {
  // patientsData would be an array of objects: { patient, logs, medicines }
  let totalPatients = patientsData.length;
  let totalLogs = 0;
  let totalTaken = 0;
  let totalMissedToday = 0;
  let activeAlerts = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  patientsData.forEach(p => {
    const logs = p.logs || [];
    totalLogs += logs.length;
    totalTaken += logs.filter(l => ['TAKEN', 'COMPLETED', 'DELAYED'].includes(l.status)).length;

    const missedToday = logs.filter(l => {
      const logDate = new Date(l.timestamp);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime() && l.status === 'MISSED';
    }).length;

    totalMissedToday += missedToday;
    if (missedToday > 0) activeAlerts++;
  });

  const adherence = totalLogs === 0 ? 0 : Math.round((totalTaken / totalLogs) * 100);

  return {
    totalPatients,
    adherence,
    missedToday: totalMissedToday,
    activeAlerts
  };
};
