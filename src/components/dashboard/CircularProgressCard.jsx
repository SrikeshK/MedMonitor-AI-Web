import React from 'react';
import { motion } from 'framer-motion';

const CircularProgressCard = ({ percentage, title, subtitle, info }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-40 h-40">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-white/5"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            className="text-primary-cyan drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-white font-display leading-none">{percentage}%</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Adherence</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <p className="text-sm text-slate-400">{subtitle}</p>
        <div className="flex gap-4 mt-4">
          {info.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-xl font-bold text-white">{item.value}</span>
              <span className="text-[10px] uppercase text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CircularProgressCard;
