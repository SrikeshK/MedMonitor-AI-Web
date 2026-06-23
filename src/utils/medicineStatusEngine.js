/**
 * MedMonitor AI - Medicine Status Engine
 * Mirrors Android App Alert Engine Logic EXACTLY
 */

/**
 * Normalizes slot names to strict uppercase (e.g., "morning" -> "MORNING")
 */
export const normalizeSlot = (slot) => {
  if (!slot) return "";
  return slot.trim().toUpperCase();
};

/**
 * Checks if a given timestamp (in millis) is within today
 */
export const isToday = (millis) => {
  if (!millis) return false;
  const date = new Date(millis);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Parses "hh:mm a" string into total milliseconds for the current day
 * Example: "08:00 AM" -> Today's date at 08:00:00.000
 */
export const parseTimeToTodayMillis = (timeStr) => {
  try {
    if (!timeStr) return 0;

    // Strict regex for "hh:mm a"
    const match = timeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    return today.getTime();
  } catch (e) {
    return 0;
  }
};

/**
 * Classification constants matching Android
 */
export const STATUS = {
  PENDING: 'PENDING',
  TAKEN: 'TAKEN',
  MISSED: 'MISSED',
  COMPLETED: 'COMPLETED'
};

export const CLASSIFICATION = {
  UPCOMING: 'UPCOMING',
  DUE_NOW: 'DUE_NOW',
  MISSED: 'MISSED',
  COMPLETED: 'COMPLETED'
};

/**
 * Android Classification Logic
 * Updated for Android Parity Fix
 */
export const classifyDose = (medicine, slot, slotTimeStr) => {
  const now = Date.now();
  const GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes

  const slotMillis = parseTimeToTodayMillis(slotTimeStr);
  const normalizedSlotName = normalizeSlot(slot);

  const getNormalizedSlotStatus = (slotStatusObj, slotName) => {
    if (!slotStatusObj || !slotName) return 'PENDING';
    let val = slotStatusObj[slotName];
    if (val === undefined) {
      const target = slotName.toLowerCase();
      const foundKey = Object.keys(slotStatusObj).find(k => k.toLowerCase() === target);
      val = foundKey ? slotStatusObj[foundKey] : 'PENDING';
    }
    return String(val || 'PENDING').toUpperCase();
  };

  const slotStatus = getNormalizedSlotStatus(medicine.slotStatus, normalizedSlotName);

  // 1. FIRESTORE STATUS OVERRIDES
  // Android behavior: If slotStatus is TAKEN/COMPLETED/DELAYED, return COMPLETED immediately.
  if (slotStatus === 'TAKEN' || slotStatus === 'COMPLETED' || slotStatus === 'DELAYED') {
    return CLASSIFICATION.COMPLETED;
  }

  // Android behavior: If slotStatus is MISSED, return MISSED immediately (ignore clock).
  if (slotStatus === 'MISSED') {
    return CLASSIFICATION.MISSED;
  }

  // 2. UPCOMING (Clock check)
  // Android: now < slotMillis
  if (now < slotMillis) {
    return CLASSIFICATION.UPCOMING;
  }

  // 3. DUE NOW (Clock check)
  // Android: now >= slotMillis AND now <= slotMillis + 30 mins
  if (now >= slotMillis && now <= (slotMillis + GRACE_PERIOD_MS)) {
    return CLASSIFICATION.DUE_NOW;
  }

  // 4. MISSED with SAFE FIRST-DAY PROTECTION
  // Before assigning MISSED from time calculations, apply First-Day Protection.
  const creationTimestamp = medicine.createdAt || medicine.startDate;
  if (creationTimestamp && isToday(creationTimestamp) && creationTimestamp > slotMillis) {
    // New medicines created late in the day do not generate false MISSED alerts.
    return CLASSIFICATION.UPCOMING;
  }

  // Android: now > slotMillis + 30 mins
  return CLASSIFICATION.MISSED;
};

/**
 * Get and filter alerts matching Android's engine
 */
export const getAlertsFromMedicines = (medicines) => {
  const now = Date.now();
  const results = {
    [CLASSIFICATION.MISSED]: [],
    [CLASSIFICATION.DUE_NOW]: [],
    [CLASSIFICATION.UPCOMING]: []
  };

  medicines.forEach(med => {
    // Skip if medicine schedule is over
    if (med.endDate && now > med.endDate) return;

    const scheduleTimes = med.scheduleTimes || {};

    Object.entries(scheduleTimes).forEach(([slot, timeStr]) => {
      const status = classifyDose(med, slot, timeStr);

      // Hide COMPLETED/TAKEN doses from alerts
      if (status === CLASSIFICATION.COMPLETED) return;

      const alertItem = {
        id: `${med.id}-${slot}`,
        medId: med.id,
        name: med.name,
        dosage: `${med.dosageAmount} ${med.unit || ''}`,
        type: med.type,
        slot: normalizeSlot(slot),
        time: timeStr,
        classification: status,
        foodTiming: med.foodTiming,
        remainingQuantity: med.remainingQuantity,
        threshold: med.threshold,
        slotMillis: parseTimeToTodayMillis(timeStr)
      };

      if (results[status]) {
        results[status].push(alertItem);
      }
    });
  });

  // Sort each group by time (slotMillis)
  Object.keys(results).forEach(key => {
    results[key].sort((a, b) => a.slotMillis - b.slotMillis);
  });

  return results;
};
