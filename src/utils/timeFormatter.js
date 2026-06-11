/**
 * Formats 24-hour time to 12-hour AM/PM format matching Android implementation
 * Output Format: "hh:mm a" (e.g., "08:00 AM")
 */
export const formatTo12Hour = (hours, minutes) => {
  const h = parseInt(hours);
  const m = parseInt(minutes);

  const ampm = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  h12 = h12 ? h12 : 12; // the hour '0' should be '12'

  const hh = h12.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');

  return `${hh}:${mm} ${ampm}`;
};

/**
 * Normalizes a time string to ensure it matches the strict "hh:mm a" format
 */
export const normalizeTimeString = (timeStr) => {
  if (!timeStr) return "";

  // If it's already in "hh:mm a" format, just ensure padding and casing
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    const ampm = match[3].toUpperCase();
    return `${h}:${m} ${ampm}`;
  }

  // If it's in 24h format "HH:mm"
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return formatTo12Hour(match24[1], match24[2]);
  }

  return timeStr;
};

/**
 * Parses "hh:mm a" string back into numeric components
 */
export const parse12HourTime = (timeStr) => {
  if (!timeStr) return { hour: 8, minute: 0, ampm: 'AM' };

  const match = timeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return { hour: 8, minute: 0, ampm: 'AM' };

  return {
    hour: parseInt(match[1]),
    minute: parseInt(match[2]),
    ampm: match[3]
  };
};
