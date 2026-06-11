import React from 'react';
import { cn } from '../utils/cn';

const Skeleton = ({ className, variant = "rect" }) => {
  const variants = {
    rect: "rounded-lg",
    circle: "rounded-full",
    text: "rounded h-4 w-full",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-white/5 relative overflow-hidden",
        variants[variant],
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
  );
};

export const DashboardCardSkeleton = () => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
    <div className="flex justify-between items-start">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <Skeleton className="w-20 h-6" />
    </div>
    <div className="space-y-2">
      <Skeleton className="w-1/2 h-4" />
      <Skeleton className="w-3/4 h-8" />
    </div>
  </div>
);

export const MedicineCardSkeleton = () => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
    <div className="flex gap-4">
      <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
      <div className="flex-grow space-y-2">
        <Skeleton className="w-3/4 h-6" />
        <Skeleton className="w-1/2 h-4" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 pt-2">
      <Skeleton className="h-10 rounded-xl" />
      <Skeleton className="h-10 rounded-xl" />
    </div>
  </div>
);

export const PatientCardSkeleton = () => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
    <Skeleton className="w-12 h-12 rounded-full" />
    <div className="flex-grow space-y-2">
      <Skeleton className="w-1/3 h-5" />
      <Skeleton className="w-1/4 h-4" />
    </div>
    <Skeleton className="w-8 h-8 rounded-lg" />
  </div>
);

export default Skeleton;
