/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BookOpen, 
  GraduationCap,
  ClipboardCheck,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Video,
  Camera,
  AlertCircle,
  Lock,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { DataProvider, useData } from './DataContext';
import { View, UserRole } from './types';
import DashboardView from './views/DashboardView';
import MembersView from './views/MembersView';
import ScheduleView from './views/ScheduleView';
import ResourcesView from './views/ResourcesView';
import QuizzesView from './views/QuizzesView';
import AttendanceView from './views/AttendanceView';
import OnlineClassView from './views/OnlineClassView';
import LeaderInsightView from './views/LeaderInsightView';
import LandingView from './views/LandingView';
import LoginView from './views/LoginView';
import WelcomeView from './views/WelcomeView';
import SetupRequiredView from './components/SetupRequiredView';
import ProfileModal from './components/ProfileModal';
import AIAssistant from './components/AIAssistant';
import Logo from './components/Logo';
import { ArrowLeft } from 'lucide-react';

type AuthStep = 'landing' | 'login' | 'welcome';

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

function AppContent() {
  const { theme, setTheme, currentUser, logout, currentView, setCurrentView, systemError, setSystemError } = useData();
  const [authStep, setAuthStep] = useState<AuthStep>('landing');
  const [defaultRole, setDefaultRole] = useState<UserRole>('Member');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (systemError?.type === 'configuration') {
    return <SetupRequiredView />;
  }

  // Auto-logout logic (30 minutes of inactivity)
  React.useEffect(() => {
    if (!currentUser) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('User inactive for 30 minutes, logging out...');
        logout();
      }, 30 * 60 * 1000); // 30 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer(); // Initial call

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [currentUser, logout]);

  if (!currentUser || authStep === 'welcome') {
    if (authStep === 'landing') {
      return (
        <LandingView 
          onNext={(role) => {
            if (role) setDefaultRole(role);
            setAuthStep('login');
          }} 
        />
      );
    }
    if (authStep === 'login') {
      return (
        <LoginView 
          defaultRole={defaultRole}
          onLoginSuccess={() => setAuthStep('welcome')} 
          onBack={() => setAuthStep('landing')} 
        />
      );
    }
    return <WelcomeView onComplete={() => setAuthStep('landing')} />;
  }

  const isLeader = currentUser?.role === 'Group Leader' || currentUser?.role === 'Assistant Leader';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    ...(isLeader ? [{ id: 'leader-insight', label: 'Leader Insight', icon: ShieldCheck }] : []),
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'online-class', label: 'Online Class', icon: Video },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'quizzes', label: 'Quizzes & Tests', icon: GraduationCap },
  ] as { id: View; label: string; icon: any }[];

  const renderView = () => {
    if (currentView !== 'dashboard' && !currentUser?.hasReported) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Access Restricted</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
            You must report for duty on the dashboard before you can participate in classes, access the timetable, or view other group activities.
          </p>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <LayoutDashboard size={20} />
            Go to Dashboard
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'members': return <MembersView />;
      case 'attendance': return <AttendanceView />;
      case 'schedule': return <ScheduleView />;
      case 'resources': return <ResourcesView />;
      case 'quizzes': return <QuizzesView />;
      case 'online-class': return <OnlineClassView />;
      case 'leader-insight': 
        return isLeader ? <LeaderInsightView /> : <DashboardView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="hover:opacity-80 transition-opacity text-left w-full"
          >
            <Logo />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isLocked = item.id !== 'dashboard' && !currentUser?.hasReported;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                  {item.label}
                </div>
                {isLocked && <Lock size={14} className="text-slate-400" />}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex justify-center p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Light Mode"
            >
              <Sun size={16} />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 flex justify-center p-1.5 rounded-md transition-colors ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="System Default"
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex justify-center p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Dark Mode"
            >
              <Moon size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 px-3 py-2">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="relative group"
            >
              {currentUser.profilePicture ? (
                <img src={currentUser.profilePicture} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/20 group-hover:border-indigo-500 transition-all" />
              ) : currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/20 group-hover:border-indigo-500 transition-all" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm uppercase group-hover:bg-indigo-200 transition-all">
                  {currentUser.name.substring(0, 2)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 transition-colors">
                <Camera size={10} />
              </div>
              {currentUser.hasReported ? (
                <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
              ) : (
                <div className="absolute top-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.role}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full relative">
        {/* System Error Banner */}
        {systemError && (
          <div className="sticky top-0 z-[60] bg-rose-600 text-white px-4 py-2 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold">{systemError.message}</p>
            </div>
            <button 
              onClick={() => setSystemError(null)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-16 lg:pt-8">
          {/* Back Button for every menu */}
          {currentView !== 'dashboard' && (
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="mb-6 flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-medium opacity-40 hover:opacity-100 group hover:scale-105 active:scale-95"
            >
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-all group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              </div>
              <span className="text-sm tracking-wide uppercase font-bold text-[10px]">Back to Dashboard</span>
            </button>
          )}

          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </div>
        <AIAssistant />
      </main>
    </div>
  );
}
