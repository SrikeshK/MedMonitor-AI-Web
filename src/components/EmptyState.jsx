import React from 'react';
import { motion } from 'framer-motion';
import GlowButton from './GlowButton';

const EmptyState = ({
  icon: IconComponent,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  'data-testid': dataTestId = 'empty-state'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      data-testid={dataTestId}
    >
      <div className="relative mb-8">
        {/* Animated Background Glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-primary-cyan rounded-full blur-[60px]"
        />

        {illustration ? (
          <div className="relative z-10 w-48 h-48 mb-4">
            {illustration}
          </div>
        ) : (
          <div className="relative z-10 w-24 h-24 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mb-4">
            {IconComponent && <IconComponent className="w-12 h-12 text-primary-cyan/50" />}
          </div>
        )}
      </div>

      <h3 className="text-2xl font-display font-bold text-white mb-3" data-testid={`${dataTestId}-title`}>
        {title}
      </h3>
      <p className="text-slate-400 max-w-md mb-8 leading-relaxed" data-testid={`${dataTestId}-description`}>
        {description}
      </p>

      {actionLabel && (
        <GlowButton
          onClick={onAction}
          className="w-auto px-8"
          data-testid={`${dataTestId}-action`}
        >
          {actionLabel}
        </GlowButton>
      )}
    </motion.div>
  );
};

export default EmptyState;
