import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import { useData } from '../DataContext';
import { UserRole } from '../types';

interface LandingViewProps {
  onNext: (role?: UserRole) => void;
}

export default function LandingView({ onNext }: LandingViewProps) {
  const { users } = useData();
  const leaderExists = users.some(u => u.role === 'Group Leader');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="mb-10 flex justify-center"
        >
          <Logo iconSize={48} className="scale-150" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <h1 className="text-7xl md:text-8xl font-black mb-6 tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600 dark:from-indigo-400 dark:via-violet-400 dark:to-emerald-400">
              Charlie 2
            </span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-8 tracking-tight">
            Learning Study Group
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
          
          <div className="max-w-xl mx-auto space-y-4">
            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed">
              "Excellence through Collaboration & Continuous Learning"
            </p>
            
            {!leaderExists && (
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-700 dark:text-amber-400 text-sm font-bold animate-pulse">
                <ShieldAlert size={20} className="shrink-0" />
                <p>System requires initialization. Group Leader must setup the hub first.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => onNext('Member')}
              className={`group relative px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-2xl active:scale-95 overflow-hidden ${!leaderExists ? 'bg-indigo-600 text-white shadow-indigo-500/40' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-slate-900/40'}`}
            >
              <span className="relative z-10 flex items-center gap-3">
                {!leaderExists ? (
                  <>
                    <ShieldCheck size={24} />
                    Setup Group Leader
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              <div className={`absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity ${!leaderExists ? 'opacity-10' : ''}`} />
            </button>

            {leaderExists && (
              <button
                onClick={() => onNext('Group Leader')}
                className="px-8 py-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold text-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-xl active:scale-95 flex items-center gap-2"
              >
                <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400" />
                Leader Portal
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
