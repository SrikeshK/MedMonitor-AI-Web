import React from 'react';

const TimePicker = ({ value, onChange }) => {
  // value is expected to be "hh:mm a" e.g. "08:00 AM"
  const parseValue = (val) => {
    if (!val) return { hh: "08", mm: "00", a: "AM" };
    const match = val.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/);
    if (!match) return { hh: "08", mm: "00", a: "AM" };
    return { hh: match[1], mm: match[2], a: match[3] };
  };

  const { hh, mm, a } = parseValue(value);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleChange = (newHh, newMm, newA) => {
    onChange(`${newHh}:${newMm} ${newA}`);
  };

  return (
    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
      <select
        value={hh}
        onChange={(e) => handleChange(e.target.value, mm, a)}
        className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
      >
        {hours.map(h => <option key={h} value={h} className="bg-slate-900">{h}</option>)}
      </select>
      <span className="text-slate-500">:</span>
      <select
        value={mm}
        onChange={(e) => handleChange(hh, e.target.value, a)}
        className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
      >
        {minutes.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
      </select>
      <select
        value={a}
        onChange={(e) => handleChange(hh, mm, e.target.value)}
        className="ml-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold px-1 rounded focus:outline-none cursor-pointer"
      >
        <option value="AM" className="bg-slate-900">AM</option>
        <option value="PM" className="bg-slate-900">PM</option>
      </select>
    </div>
  );
};

export default TimePicker;
