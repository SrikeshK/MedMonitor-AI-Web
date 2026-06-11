import React from 'react';

const SectionHeader = ({ title, subtitle, action }) => {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 font-display">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && (
        <button className="text-sm font-semibold text-primary-cyan hover:underline transition-all">
          {action}
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
