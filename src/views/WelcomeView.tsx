import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useData } from '../DataContext';
import Logo from '../components/Logo';

interface WelcomeViewProps {
  onComplete: () => void;
}

export default function WelcomeView({ onComplete }: WelcomeViewProps) {
  const { currentUser } = useData();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 overflow-hidden">
      <div className="max-w-2xl w-full text-center relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12 flex justify-center"
        >
          <div className="relative">
            <Logo iconSize={64} hideText className="scale-150" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -top-8 -right-8 text-amber-400"
            >
              <Sparkles size={32} />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-6xl font-black text-slate-900 dark:text-slate-100 mb-6 tracking-tight"
        >
          Welcome, <span className="text-indigo-600 dark:text-indigo-400">{currentUser?.name}</span>!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-2xl text-slate-600 dark:text-slate-400 mb-12 font-medium"
        >
          Preparing your study dashboard...
        </motion.p>

        <div className="w-64 h-2 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 5, ease: "linear" }}
            className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
          />
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.5 }}
          className="mt-4 text-sm text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold"
        >
          Redirecting in a moment
        </motion.p>
      </div>
    </div>
  );
}
