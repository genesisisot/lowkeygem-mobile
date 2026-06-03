import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../services/auth';
import type { UserType } from '../types/database';
import { AuthAtmosphere } from './site/AuthAtmosphere';
import '../styles/landing.css';

interface LoginProps {
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
            <div className="login__logo">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="url(#gl)"/>
                <path d="M18 8a10 10 0 0 0-3.16 19.48A8 8 0 0 1 18 20a8 8 0 0 1 3.16 7.48A10 10 0 0 0 18 8Z" fill="#fff" opacity="0.9"/>
                <path d="M18 20a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="url(#gl)"/>
                <defs>
                  <linearGradient id="gl" x1="0" y1="0" x2="36" y2="36">
                    <stop stopColor="#FF1D68"/>
                    <stop offset="1" stopColor="#7C3AED"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="login__title">Lowkey Gem</h1>
            <p className="login__subtitle">Find fair work, grow your career</p>
          </div>

          <motion.div
            className="login__card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {error && (
              <motion.div className="login__error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login__field">
                <div className="login__input-wrap">
                  <Mail size={18} />
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="login__input"
                    placeholder="Email"
                    required
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="login__field">
                <div className="login__input-wrap">
                  <Lock size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="login__input"
                    placeholder="Password"
                    required
                    autoCapitalize="none"
                    autoComplete="current-password"
                  />
                  <button type="button" className="login__eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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

            <button type="button" className="login__link" onClick={handleForgotPassword} disabled={isLoading}>
              Forgot password?
            </button>
          </motion.div>

          <p className="login__meta">
            Don't have an account?{' '}
            <button className="login__link login__link--bold" onClick={onSignUp}>Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}