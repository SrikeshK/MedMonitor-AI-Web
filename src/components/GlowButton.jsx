import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const GlowButton = ({
  children,
  className,
  onClick,
  type = "button",
  disabled,
  loading,
  variant = "primary",
  'data-testid': dataTestId
}) => {
  const variants = {
    primary: "bg-primary-cyan text-background hover:shadow-cyan-glow-lg",
    secondary: "bg-primary-purple text-white hover:shadow-[0_0_20px_rgba(124,77,255,0.4)]",
    outline: "bg-transparent border border-white/10 text-white hover:bg-white/5"
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={dataTestId}
      className={cn(
        "relative w-full py-3.5 rounded-xl font-bold tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
};

export default GlowButton;
