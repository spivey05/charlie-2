import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useData } from '../DataContext';

interface LogoProps {
  className?: string;
  iconSize?: number;
  hideText?: boolean;
  variant?: 'light' | 'dark' | 'default';
}

export default function Logo({ className = '', iconSize = 32, hideText = false, variant = 'default' }: LogoProps) {
  const { groupName, groupPhoto } = useData();
  const textColorClass = variant === 'light' ? 'text-white' : variant === 'dark' ? 'text-slate-900' : 'text-slate-900 dark:text-white';
  const subtextColorClass = variant === 'light' ? 'text-indigo-100' : variant === 'dark' ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {groupPhoto ? (
          <img 
            src={groupPhoto} 
            alt="Group Logo" 
            className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-indigo-500/20 transform hover:scale-105 transition-transform duration-300 border-2 border-indigo-500/20"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 glow-primary transform hover:scale-105 transition-transform duration-300">
            <ShieldCheck size={iconSize} strokeWidth={2.5} />
          </div>
        )}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
      </div>
      
      {!hideText && (
        <div className="flex flex-col">
          <span className={`text-xl font-black tracking-tight leading-none uppercase ${textColorClass}`}>
            {groupName}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ${subtextColorClass}`}>
            Learning Hub
          </span>
        </div>
      )}
    </div>
  );
}
