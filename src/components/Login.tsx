import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ArrowUpRight } from 'lucide-react';
import { Logo } from './Logo';
import { authService } from '../services/auth';
import type { UserType } from '../types/database';
import { AuthAtmosphere, AuthBrandPanel } from './site/AuthAtmosphere';
import '../styles/landing.css';

interface LoginProps {
  onClose: () => void;
  onSignUp: () => void;
  onLoginSuccess: (userType: UserType) => void;
}

export function Login({ onClose, onSignUp, onLoginSuccess }: LoginProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: profile, error: authError } = await authService.login(
        formData.email,
        formData.password
      );

      if (authError || !profile) {
        setError(authError?.message || 'Login failed. Please check your credentials.');
        return;
      }

      onLoginSuccess(profile.user_type as UserType);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authService.requestPasswordReset(formData.email);
      if (error) {
        setError(error.message);
      } else {
        alert('If that email exists, a password reset link has been sent.');
      }
    } catch (err) {
      alert('Password reset failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth">
      <AuthAtmosphere />

      <div className="auth__shell">
        <AuthBrandPanel title="Welcome back to fair work." />

        <div className="auth__panel">
          <div className="auth__topbar">
            <div className="auth__brand-mobile">
              <Logo textColor="text-white" />
            </div>
            <button className="lk__navlink" onClick={onClose}>← Back to site</button>
          </div>

          <motion.div
            className="auth__card"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="auth__title">Log in</h1>
            <p className="auth__subtitle">Continue discovering hidden gems.</p>

            {error && (
              <motion.div className="auth__error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth__field">
                <label className="auth__label">Email or phone</label>
                <div className="auth__input-wrap">
                  <Mail size={18} />
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="auth__input"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="auth__field">
                <label className="auth__label">Password</label>
                <div className="auth__input-wrap">
                  <Lock size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="auth__input"
                    placeholder="Enter your password"
                    required
                  />
                  <button type="button" className="auth__eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: 12 }}>
                <button type="button" className="auth__link" onClick={handleForgotPassword} disabled={isLoading}>
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="auth__submit"
                disabled={!formData.email || !formData.password || isLoading}
              >
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Logging in…</>
                ) : (
                  <>Log in <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <p className="auth__meta">
              Don’t have an account?{' '}
              <button className="auth__link" onClick={onSignUp}>Sign up <ArrowUpRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /></button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}