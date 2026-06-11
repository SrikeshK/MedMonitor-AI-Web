import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../utils/cn';

const InputField = ({ label, type = 'text', placeholder, value, onChange, error, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-slate-400 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-cyan/50 focus:ring-1 focus:ring-primary-cyan/20 transition-all duration-200",
            error && "border-error/50 focus:border-error focus:ring-error/20",
            props.className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-error ml-1 mt-1">{error}</p>}
    </div>
  );
};

export default InputField;
