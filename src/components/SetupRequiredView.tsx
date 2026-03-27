import React from 'react';
import { Settings, ShieldAlert, Key, Globe, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function SetupRequiredView() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="bg-indigo-600 p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings size={40} className="animate-spin-slow" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Configuration Required</h1>
          <p className="text-indigo-100">Your real-time learning hub is almost ready. Just a few steps to connect your database.</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <ShieldAlert className="text-amber-600 dark:text-amber-400 shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-100">Supabase Connection Missing</h3>
              <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
                The application is currently in "Real-time Mode" and requires valid Supabase credentials to function. Demo mode has been disabled per your request.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key size={20} className="text-indigo-500" />
              How to Setup
            </h2>

            <div className="grid gap-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Open Settings</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Click the gear icon in the bottom-left corner of the AI Studio Build interface.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Add Secrets</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Add the following variables to the <strong>Secrets</strong> section:</p>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                      <Globe size={12} /> VITE_SUPABASE_URL
                    </li>
                    <li className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                      <Key size={12} /> VITE_SUPABASE_ANON_KEY
                    </li>
                    <li className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                      <ShieldAlert size={12} /> SUPABASE_SERVICE_ROLE_KEY
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Wait for Rebuild</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">The app will automatically restart and connect to your live database.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={20} />
              <span>Ready for production once configured</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
