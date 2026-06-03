import { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from './Logo';
import { authService } from '../services/auth';
import type { UserType } from '../types/database';
import { AuthAtmosphere } from './site/AuthAtmosphere';
import '../styles/landing.css';

interface LoginProps {
  onSignUp: () => void;
  onLoginSuccess: (userType: UserType) => void;
}

export function Login({ onSignUp, onLoginSuccess }: LoginProps) {
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
    } catch (err) {
      console.error('Auth error:', err);
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials and try again.';
      setError(message);
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
        <div className="auth__panel">
          <div className="login__header">
            <Logo iconSize={48} textColor="#f6f1ea" />
            <p className="login__subtitle">Log in to continue</p>
          </div>

          {error && (
            <motion.div
              className="login__error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="login__form">
            <div className="login__field">
              <label className="login__label">Email</label>
              <div className="login__input-wrap">
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="login__input"
                  placeholder="your@email.com"
                  required
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login__field">
              <label className="login__label">Password</label>
              <div className="login__input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="login__input"
                  placeholder="Enter your password"
                  required
                  autoCapitalize="none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login__eye"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button
                type="button"
                className="login__forgot"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="login__submit"
              disabled={!formData.email || !formData.password || isLoading}
            >
              {isLoading ? (
                <><Loader2 size={20} className="animate-spin" /> Logging in…</>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <p className="login__meta">
            Don't have an account?{' '}
            <button className="login__signup" onClick={onSignUp}>Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}