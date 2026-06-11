import React from 'react';

const CaregiverSettings = () => {
  return (
    <div className="space-y-6 text-white" data-testid="caregiver-settings-page">
      <h1 className="text-3xl font-bold font-display" data-testid="caregiver-settings-title">Caregiver Settings</h1>
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4">Portal Configuration</h3>
        <p className="text-slate-400">Configure alert thresholds and dashboard preferences for your patient roster.</p>
      </div>
    </div>
  );
};

export default CaregiverSettings;
