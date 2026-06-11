import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/InputField';
import GlowButton from '../../components/GlowButton';
import { AlertCircle } from 'lucide-react';
import { getAuthErrorMessage } from '../../utils/errorHandlers';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      await register(email, password, name);
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
        <h2 className="text-3xl font-bold text-white font-display">Register</h2>
        <p className="text-slate-400 mt-2">Join the next-gen healthcare platform</p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-center gap-3 text-error text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          data-testid="register-name-input"
        />
        <InputField
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="register-email-input"
        />
        <InputField
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          data-testid="register-password-input"
        />
        <InputField
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          data-testid="register-confirm-input"
        />

        <GlowButton type="submit" loading={loading} className="mt-2">
          Create Account
        </GlowButton>
      </form>

      <p className="text-center text-slate-400 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-cyan font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </motion.div>
  );
};

export default Register;
