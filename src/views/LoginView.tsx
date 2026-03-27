import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Eye, EyeOff, ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useData } from '../DataContext';
import { UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onBack: () => void;
  defaultRole?: UserRole;
}

export default function LoginView({ onLoginSuccess, onBack, defaultRole }: LoginViewProps) {
  const { notify, manualLogin, users, setupLeader } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole || 'Member');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupName, setSetupName] = useState('');

  const leaderExists = users.some(u => u.role === 'Group Leader');

  // Sync role with defaultRole if it changes
  React.useEffect(() => {
    if (defaultRole) {
      setRole(defaultRole);
    }
  }, [defaultRole]);

  // Automatically enter setup mode if no leader exists
  React.useEffect(() => {
    if (!leaderExists) {
      setIsSetupMode(true);
    }
  }, [leaderExists]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (isSetupMode) {
        await setupLeader(setupName, email, password);
        onLoginSuccess();
      } else {
        await manualLogin(email, password, role);
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700"
      >
        {leaderExists && (
          <button 
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        )}

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-2xl ${isSetupMode ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
              {isSetupMode ? <ShieldCheck size={32} /> : <LogIn size={32} />}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {isSetupMode 
              ? (leaderExists ? 'Setup New Leader' : 'System Initialization') 
              : (role === 'Group Leader' ? 'Leader Portal' : 'Sign In')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {!leaderExists 
              ? 'No Group Leader detected. Please create the administrator account to begin.' 
              : isSetupMode 
                ? 'Create additional leader credentials' 
                : (role === 'Group Leader' ? 'Administrative access for group leaders' : 'Access the Charlie 2 Learning Hub')}
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {!isSetupMode && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                >
                  <option value="Member">Member</option>
                  <option value="Group Leader">Group Leader</option>
                  <option value="Assistant Leader">Assistant Leader</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Tech Coordinator">Tech Coordinator</option>
                  <option value="Subject Coordinator">Subject Coordinator</option>
                </select>
              </div>
            )}

            {isSetupMode && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input 
                  type="text"
                  required
                  disabled={isLoading}
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <input 
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {isSetupMode ? 'Password' : 'Registration Number / Password'}
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                  placeholder={isSetupMode ? "Create a password" : "Enter your registration number"}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm"
              >
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSetupMode ? <ShieldCheck size={20} /> : <LogIn size={20} />}
                  {isSetupMode ? 'Complete Setup' : 'Sign In'}
                </>
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                If credentials to login are unavailable, contact the group leader to be added.
              </p>
            </div>

            {isSetupMode && leaderExists && (
              <button 
                type="button"
                onClick={() => setIsSetupMode(false)}
                className="w-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium"
              >
                Cancel Setup
              </button>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
