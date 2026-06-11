import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/InputField';
import GlowButton from '../../components/GlowButton';
import { AlertCircle } from 'lucide-react';
import { getAuthErrorMessage } from '../../utils/errorHandlers';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password) {
      return setError('Please fill in all fields');
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/mode-selection');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-left">
        <h2 className="text-3xl font-bold text-white font-display">Sign In</h2>
        <p className="text-slate-400 mt-2">Access your medical dashboard</p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-center gap-3 text-error text-sm" data-testid="login-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="login-email"
        />
        <InputField
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          data-testid="login-password"
        />

        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-slate-500 cursor-not-allowed flex items-center gap-2"
            disabled
          >
            Forgot Password? <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Coming Soon</span>
          </button>
        </div>

        <GlowButton type="submit" loading={loading} data-testid="login-button">
          Sign In
        </GlowButton>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#161d2b] px-2 text-slate-500">Or continue with</span>
        </div>
      </div>

      <p className="text-center text-slate-400 text-sm">
        New to MedMonitor?{' '}
        <Link to="/register" className="text-primary-cyan font-semibold hover:underline" data-testid="register-link">
          Create Account
        </Link>
      </p>
    </motion.div>
  );
};

export default Login;
