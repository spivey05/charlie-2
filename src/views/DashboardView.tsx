import React, { useState, useEffect } from 'react';
import { Target, Award, BookMarked, Users, UserCheck, UserX, Clock, MessageCircle, Send, Pin, CheckCircle2, X, Video, Calendar, Bell, Loader2, ExternalLink, MessageSquareOff, Camera, ShieldCheck, AlertCircle, Trash2, Edit2, Save, Plus, Download } from 'lucide-react';
import { useData } from '../DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DashboardView() {
  const { users, resources, quizzes, attendance, messages, addMessage, deleteMessage, togglePinMessage, markAttendance, currentUser, setCurrentView, onlineClasses, isSaving, systemError, setSystemError, discussionDisabled, toggleDiscussion, onlineUserIds, reportForDuty, restartSystem, updateProfilePicture, participationRecords, deleteParticipationRecord, learningModel, updateLearningModel, notify } = useData();
  const [newMessage, setNewMessage] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState(currentUser?.profilePicture || '');
  const [isUpdatingPic, setIsUpdatingPic] = useState(false);
  const [isEditingLearningModel, setIsEditingLearningModel] = useState(false);
  const [editingSteps, setEditingSteps] = useState(learningModel);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestEmail = async () => {
    if (!currentUser?.email) return;
    setIsTestingEmail(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
      if (response.ok) {
        setTestResult({ success: true, message: 'Test email sent! Check your inbox.' });
      } else {
        setTestResult({ success: false, message: 'Failed to send test email. Check your secrets.' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Network error while testing email.' });
    } finally {
      setIsTestingEmail(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isLeader = currentUser?.role === 'Group Leader';

  // Next Class Logic
  const upcomingClasses = onlineClasses
    .filter(c => !c.isCompleted && new Date(c.startTime) > currentTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const nextClass = upcomingClasses[0];
  const liveClass = onlineClasses.find(c => c.isLive);

  // Alert logic
  useEffect(() => {
    const checkAlerts = () => {
      onlineClasses.forEach(c => {
        if (!c.isCompleted && !c.isLive) {
          const startTime = new Date(c.startTime).getTime();
          const now = new Date().getTime();
          const diff = startTime - now;
          
          // Alert if class starts in less than 1 minute or has already started
          if (diff > 0 && diff < 60000) {
            setActiveAlert(`Class "${c.title}" is starting in less than a minute!`);
            // Auto-clear after 10 seconds
            setTimeout(() => setActiveAlert(null), 10000);
          }
        }
      });
    };
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [onlineClasses]);

  const formatCountdown = (startTime: string) => {
    const diff = new Date(startTime).getTime() - currentTime.getTime();
    if (diff <= 0) return "Starting now...";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };
  
  // Self Report State
  const [isReporting, setIsReporting] = useState(false);
  const [reportUserId, setReportUserId] = useState('');
  const [reportRegNo, setReportRegNo] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState('');
  const [lastReportedUserId, setLastReportedUserId] = useState<string | null>(null);
  
  const dates = [...new Set(attendance.map(a => a.date))].sort().reverse();
  const displayDate = dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0];
  const latestAttendance = attendance.filter(a => a.date === displayDate);
  const presentCount = latestAttendance.filter(a => a.status === 'Present').length;
  const absentCount = latestAttendance.filter(a => a.status === 'Absent').length;
  const lateCount = latestAttendance.filter(a => a.status === 'Late').length;
  const totalMembers = users.length;

  const absentUsers = users.filter(u => latestAttendance.find(a => a.userId === u.id)?.status === 'Absent');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newMessage.trim()) return;
    addMessage(newMessage.trim());
    setNewMessage('');
  };

  const sortedMessages = [...messages].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleSelfReport = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === reportUserId);
    if (user && user.regNo === reportRegNo) {
      markAttendance(user.id, new Date().toISOString().split('T')[0], 'Present');
      
      // If the user reporting is the current user, also set their hasReported status
      if (user.id === currentUser?.id) {
        reportForDuty();
      }
      
      setReportSuccess(true);
      setReportError('');
      setLastReportedUserId(user.id);
      setTimeout(() => {
        setIsReporting(false);
        setReportSuccess(false);
        setReportUserId('');
        setReportRegNo('');
      }, 2000);
    } else {
      setReportError('Invalid Registration Number or User.');
    }
  };

  // Calculate current week dates (Monday to Sunday)
  const getWeekDates = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    return weekDates;
  };

  const weekDates = getWeekDates();
  const todayStr = new Date().toISOString().split('T')[0];
  const passedWeekDates = weekDates.filter(d => d <= todayStr);
  const userWeekAttendance = attendance.filter(a => a.userId === currentUser?.id && passedWeekDates.includes(a.date) && a.status === 'Present');
  const attendancePercentage = passedWeekDates.length > 0 
    ? Math.round((userWeekAttendance.length / passedWeekDates.length) * 100) 
    : 0;

  const reportedUser = users.find(u => u.id === (lastReportedUserId || currentUser?.id));

  const handleUpdateProfilePic = (e: React.FormEvent) => {
    e.preventDefault();
    if (profilePicUrl.trim()) {
      updateProfilePicture(profilePicUrl.trim());
      setIsUpdatingPic(false);
    }
  };

  const handleSaveLearningModel = () => {
    updateLearningModel(editingSteps);
    setIsEditingLearningModel(false);
  };

  const handleAddStep = () => {
    setEditingSteps([...editingSteps, { id: Date.now().toString(), phase: 'New Phase', desc: 'Description here' }]);
  };

  const handleRemoveStep = (id: string) => {
    setEditingSteps(editingSteps.filter(s => s.id !== id));
  };

  const handleUpdateStep = (id: string, field: 'phase' | 'desc', value: string) => {
    setEditingSteps(editingSteps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const downloadProgress = () => {
    if (!currentUser) return;

    const doc = new jsPDF();
    const userAttendance = attendance.filter(a => a.userId === currentUser.id);
    const userQuizzes = quizzes.filter(q => q.submissions && q.submissions[currentUser.id]);
    const userParticipation = participationRecords.filter(p => p.userId === currentUser.id);

    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('Charlie 2 Learning Hub', 14, 22);
    
    doc.setFontSize(16);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text('Member Progress Report', 14, 32);
    
    // User Info Section
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, 38, 196, 38);
    
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(`Name: ${currentUser.name}`, 14, 48);
    doc.text(`Email: ${currentUser.email}`, 14, 55);
    doc.text(`Registration No: ${currentUser.regNo}`, 14, 62);
    doc.text(`Role: ${currentUser.role}`, 14, 69);
    doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, 76);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Performance Summary', 14, 90);
    
    autoTable(doc, {
      startY: 95,
      head: [['Metric', 'Total Count']],
      body: [
        ['Total Attendance (Present)', userAttendance.length],
        ['Quizzes Completed', userQuizzes.length],
        ['Online Classes Participated', userParticipation.length]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      styles: { fontSize: 10 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // Attendance Table
    if (userAttendance.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text('Attendance History', 14, currentY - 5);
      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Status']],
        body: userAttendance.map(a => [a.date, a.status]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Quizzes Table
    if (userQuizzes.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text('Quiz Submissions', 14, currentY - 5);
      autoTable(doc, {
        startY: currentY,
        head: [['Quiz Title', 'Questions', 'Status']],
        body: userQuizzes.map(q => [q.title, q.questions.length, q.status]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Participation Table
    if (userParticipation.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text('Class Participation', 14, currentY - 5);
      autoTable(doc, {
        startY: currentY,
        head: [['Class Name', 'Date & Time']],
        body: userParticipation.map(p => [p.className, new Date(p.timestamp).toLocaleString()]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 }
      });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        doc.text('Charlie 2 Learning Hub - Empowering Your Growth', 105, 290, { align: 'center' });
    }

    doc.save(`C2_Progress_${currentUser.name.replace(/\s+/g, '_')}.pdf`);
    notify('success', 'Progress report downloaded as PDF!');
  };

  useEffect(() => {
    if (!isEditingLearningModel) {
      setEditingSteps(learningModel);
    }
  }, [learningModel, isEditingLearningModel]);

  return (
    <div className="space-y-6 relative">
      {/* Reporting Requirement Banner */}
      {!currentUser?.hasReported && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-500/20 p-2 rounded-lg text-amber-600 dark:text-amber-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Action Required: Report for Duty</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">You must report for duty to participate in classes and access the timetable.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setReportUserId(currentUser?.id || '');
              setIsReporting(true);
            }}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
          >
            <ShieldCheck size={18} />
            Report Now
          </button>
        </motion.div>
      )}

      {currentUser?.hasReported && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-6 rounded-2xl shadow-sm mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">Reporting Successful</h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">You have successfully reported for duty today.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Status</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">PRESENT</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-500/20">
            <div className="bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">Report Time</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">Registration No</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentUser.regNo}</p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">Member ID</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">#{currentUser.id.substring(0, 8)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Saving Indicator */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[60] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <Loader2 size={16} className="text-indigo-600 animate-spin" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Saving Progress</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Notification */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed bottom-6 right-6 z-[60] bg-indigo-600 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-sm border border-indigo-400/30"
          >
            <div className="bg-white/20 p-2 rounded-lg">
              <Bell size={20} className="animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Class Starting Soon!</p>
              <p className="text-xs text-indigo-100 mt-1">{activeAlert}</p>
            </div>
            <button onClick={() => setActiveAlert(null)} className="text-white/60 hover:text-white">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Errors */}
      <AnimatePresence>
        {systemError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 shadow-sm"
          >
            <div className="bg-rose-100 dark:bg-rose-500/20 p-2 rounded-lg text-rose-600 dark:text-rose-400">
              <X size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">System Configuration Required</h4>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">{systemError.message}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a 
                  href="https://myaccount.google.com/apppasswords" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                >
                  Generate App Password <ExternalLink size={12} />
                </a>
                <button 
                  onClick={handleTestEmail}
                  disabled={isTestingEmail}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-50"
                >
                  {isTestingEmail ? 'Testing...' : 'Test Connection'}
                </button>
                <button 
                  onClick={() => setSystemError(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  Dismiss
                </button>
              </div>
              {testResult && (
                <p className={`text-[10px] mt-2 font-medium ${testResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {testResult.message}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {currentUser?.profilePicture ? (
              <img 
                src={currentUser.profilePicture} 
                alt={currentUser.name} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl border-2 border-indigo-500/20 shadow-lg">
                {currentUser?.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <button 
              onClick={() => setIsUpdatingPic(true)}
              className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform"
            >
              <Camera size={14} />
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back, {currentUser?.name}!</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-500 dark:text-slate-400">Here's what's happening in Charlie 2 Learning Hub.</p>
              {currentUser?.hasReported && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <ShieldCheck size={10} /> Reported
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={downloadProgress}
            className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download size={18} />
            Download Progress
          </button>
          {isLeader && (
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to restart the system? This will reset all data except users.')) {
                  restartSystem();
                }
              }}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors shadow-lg flex items-center gap-2"
            >
              <Trash2 size={18} />
              Restart System
            </button>
          )}
          {!currentUser?.hasReported && (
            <button 
              onClick={() => {
                setReportUserId(currentUser?.id || '');
                setIsReporting(true);
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] dark:shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-2"
            >
              <UserCheck size={18} />
              Report Attendance
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={users.length.toString()} color="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" />
        <StatCard icon={BookMarked} label="Resources" value={resources.length.toString()} color="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" />
        <StatCard icon={Target} label="Upcoming Quizzes" value={quizzes.filter(q => q.status === 'Upcoming').length.toString()} color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={Award} label="My Attendance" value={currentUser ? (attendancePercentage + '%') : '0%'} color="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" />
      </div>

      {/* Daily Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg glow-primary flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Award size={20} />
              Daily Feedback
            </h3>
            <p className="text-indigo-100 italic">
              {presentCount > totalMembers / 2 
                ? "Great job today! The group is showing strong commitment. Keep up the momentum!" 
                : "A bit quiet today. Let's encourage each other to stay consistent with our study goals."}
            </p>
          </div>
        </div>

        {/* Next Class Countdown */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="text-indigo-600 dark:text-indigo-400" size={20} />
              Next Online Class
            </h3>
            {liveClass && (
              <span className="px-2 py-1 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse">LIVE</span>
            )}
          </div>
          
          {liveClass ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{liveClass.title}</p>
              <button 
                onClick={() => setCurrentView('online-class')}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all"
              >
                Join Live Class
              </button>
            </div>
          ) : nextClass ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{nextClass.title}</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Starts In</p>
                  <p className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatCountdown(nextClass.startTime)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled for {new Date(nextClass.startTime).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming classes scheduled.</p>
              <button 
                onClick={() => setCurrentView('schedule')}
                className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Schedule a Class
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {reportedUser && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Target className="text-indigo-600 dark:text-indigo-400" size={20} />
                {reportedUser.name}'s Weekly Progress
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((dateStr, idx) => {
                  const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
                  const record = attendance.find(a => a.userId === reportedUser.id && a.date === dateStr);
                  const status = record?.status;
                  
                  let bgColor = 'bg-slate-100 dark:bg-slate-700';
                  let textColor = 'text-slate-500 dark:text-slate-400';
                  
                  if (status === 'Present') {
                    bgColor = 'bg-emerald-100 dark:bg-emerald-500/20';
                    textColor = 'text-emerald-700 dark:text-emerald-400';
                  } else if (status === 'Absent') {
                    bgColor = 'bg-rose-100 dark:bg-rose-500/20';
                    textColor = 'text-rose-700 dark:text-rose-400';
                  } else if (status === 'Late') {
                    bgColor = 'bg-amber-100 dark:bg-amber-500/20';
                    textColor = 'text-amber-700 dark:text-amber-400';
                  }

                  return (
                    <div key={dateStr} className={`flex flex-col items-center p-2 rounded-lg ${bgColor}`}>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{dayName}</span>
                      <span className={`text-sm font-bold ${textColor}`}>
                        {status ? status.charAt(0) : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Class Participation */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Video className="text-indigo-600 dark:text-indigo-400" size={20} />
              Class Participation
            </h3>
            <div className="space-y-4">
              {isLeader ? (
                // Leader sees all participation
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {participationRecords && participationRecords.length > 0 ? (
                    [...participationRecords].reverse().map(record => {
                      const user = users.find(u => u.id === record.userId);
                      return (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-[10px]">
                              {user?.name.substring(0, 2).toUpperCase() || '??'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name || 'Unknown User'}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Joined: {record.className}</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="text-[10px] text-slate-400">{new Date(record.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            {isLeader && (
                              <button 
                                onClick={() => deleteParticipationRecord(record.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 text-sm py-4 italic">No participation records yet.</p>
                  )}
                </div>
              ) : (
                // Member sees only their own participation
                <div className="space-y-3">
                  {participationRecords && participationRecords.filter(r => r.userId === currentUser?.id).length > 0 ? (
                    [...participationRecords].filter(r => r.userId === currentUser?.id).reverse().slice(0, 5).map(record => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-xl border border-indigo-100/50 dark:border-indigo-500/10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                            <CheckCircle2 size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{record.className}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(record.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Recorded</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <Video size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">You haven't participated in any online classes yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Target className="text-indigo-600 dark:text-indigo-400" size={20} />
              Our Mission
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              To provide a supportive and structured environment where members can learn effectively, share knowledge, and achieve their academic and professional goals.
            </p>
            
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">Core Values</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Discipline', color: 'hover:bg-blue-500 hover:text-white' },
                  { name: 'Consistency', color: 'hover:bg-emerald-500 hover:text-white' },
                  { name: 'Collaboration', color: 'hover:bg-indigo-500 hover:text-white' },
                  { name: 'Accountability', color: 'hover:bg-amber-500 hover:text-white' },
                  { name: 'Growth mindset', color: 'hover:bg-rose-500 hover:text-white' }
                ].map(value => (
                  <span key={value.name} className={`px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium transition-all cursor-default ${value.color}`}>
                    {value.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Learning Model */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Learning Model</h3>
              {isLeader && (
                <button
                  onClick={() => setIsEditingLearningModel(!isEditingLearningModel)}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                >
                  {isEditingLearningModel ? <X size={20} /> : <Edit2 size={20} />}
                </button>
              )}
            </div>
            
            {isEditingLearningModel ? (
              <div className="space-y-4">
                {editingSteps.map((step, i) => (
                  <div key={step.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Step {i + 1}</span>
                      <button 
                        onClick={() => handleRemoveStep(step.id)}
                        className="text-rose-500 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <input 
                      type="text"
                      value={step.phase}
                      onChange={(e) => handleUpdateStep(step.id, 'phase', e.target.value)}
                      placeholder="Phase Title"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold"
                    />
                    <textarea 
                      value={step.desc}
                      onChange={(e) => handleUpdateStep(step.id, 'desc', e.target.value)}
                      placeholder="Phase Description"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm min-h-[60px]"
                    />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleAddStep}
                    className="flex-1 py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-bold hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Step
                  </button>
                  <button 
                    onClick={handleSaveLearningModel}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    <Save size={16} /> Save Model
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {learningModel.map((step, i) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{step.phase}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
                {learningModel.length === 0 && (
                  <p className="text-center text-slate-500 dark:text-slate-400 text-sm py-4 italic">No learning model defined.</p>
                )}
              </div>
            )}
          </div>

          {/* Discussion Board */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageCircle className="text-indigo-600 dark:text-indigo-400" size={20} />
                Group Discussion & Ideas
              </h3>
              {isLeader && (
                <button
                  onClick={() => toggleDiscussion(!discussionDisabled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    discussionDisabled 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                  }`}
                >
                  {discussionDisabled ? (
                    <><MessageCircle size={14} /> Enable Discussion</>
                  ) : (
                    <><MessageSquareOff size={14} /> Disable Discussion</>
                  )}
                </button>
              )}
            </div>

            {/* Input */}
            {discussionDisabled ? (
              <div className="mb-6 p-6 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-dashed border-rose-200 dark:border-rose-500/20 text-center">
                <MessageSquareOff size={32} className="mx-auto text-rose-400 mb-2 opacity-50" />
                <p className="text-sm font-medium text-rose-700 dark:text-rose-400">The Group Leader has temporarily disabled the discussion board.</p>
              </div>
            ) : currentUser ? (
              <form onSubmit={handleSendMessage} className="mb-6 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Share a concern or idea..."
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 glow-primary"
                >
                  <Send size={18} />
                  <span className="hidden sm:inline">Post</span>
                </button>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Only members can post comments.</p>
              </div>
            )}

            {/* Messages List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {sortedMessages.map(msg => {
                const authorUser = users.find(u => u.name === msg.author);
                return (
                  <div key={msg.id} className={`p-4 rounded-xl border ${msg.isPinned ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 mb-2">
                        {authorUser?.profilePicture || authorUser?.avatar ? (
                          <img 
                            src={authorUser.profilePicture || authorUser.avatar} 
                            alt={msg.author} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-[10px]">
                            {msg.author.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{msg.author}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(msg.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">{msg.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePinMessage(msg.id)}
                          className={`p-1.5 rounded-md transition-colors ${msg.isPinned ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                          title={msg.isPinned ? "Unpin message" : "Pin message"}
                        >
                          <Pin size={16} className={msg.isPinned ? "fill-current" : ""} />
                        </button>
                        {isLeader && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors"
                            title="Delete message"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="text-center text-slate-500 dark:text-slate-400 text-sm py-4">No messages yet. Be the first to post!</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar content */}
        <div className="space-y-6">
          {/* Members Reported for Duty Today */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={20} />
                Members Reported Today
              </h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                {users.filter(u => u.hasReported).length} Reported
              </span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {users.filter(u => u.hasReported).map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-emerald-50/30 dark:bg-emerald-500/5 rounded-xl border border-emerald-100/50 dark:border-emerald-500/10">
                  <div className="flex items-center gap-3">
                    {user.profilePicture || user.avatar ? (
                      <img src={user.profilePicture || user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-emerald-500/20" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-bold uppercase">Reported</span>
                  </div>
                </div>
              ))}
              {users.filter(u => u.hasReported).length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No members have reported for duty yet today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Members Pending for Duty Today */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="text-amber-600 dark:text-amber-400" size={20} />
                Members Pending Today
              </h3>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full">
                {users.filter(u => !u.hasReported).length} Pending
              </span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {users.filter(u => !u.hasReported).map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-amber-50/30 dark:bg-amber-500/5 rounded-xl border border-amber-100/50 dark:border-amber-500/10">
                  <div className="flex items-center gap-3 opacity-70">
                    {user.profilePicture || user.avatar ? (
                      <img src={user.profilePicture || user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-amber-500/20" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-[10px]">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase">Pending</span>
                  </div>
                </div>
              ))}
              {users.filter(u => !u.hasReported).length === 0 && (
                <div className="text-center py-8">
                  <ShieldCheck size={32} className="mx-auto text-emerald-300 dark:text-emerald-600 mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">All members have reported for duty today!</p>
                </div>
              )}
            </div>
          </div>

          {/* Who's Online Widget */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Who's Online
              </h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                {onlineUserIds.length} Active
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {users.filter(u => onlineUserIds.includes(u.id)).map(user => (
                <div key={user.id} className="relative group cursor-help" title={user.name}>
                  {user.profilePicture || user.avatar ? (
                    <img src={user.profilePicture || user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500/20 group-hover:border-emerald-500 transition-all" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-[10px] border-2 border-emerald-500/20 group-hover:border-emerald-500 transition-all">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                </div>
              ))}
              {onlineUserIds.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No one else is online right now.</p>
              )}
            </div>
            <button 
              onClick={() => setCurrentView('members')}
              className="mt-4 w-full py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all border border-indigo-100 dark:border-indigo-500/20"
            >
              View All Members
            </button>
          </div>

          {/* Attendance Stats - Leader Only */}
          {isLeader && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Last Session Attendance</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-center">
                  <UserCheck className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1" size={20} />
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{presentCount}</p>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Present</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-100 dark:border-rose-100/20 text-center">
                  <UserX className="mx-auto text-rose-600 dark:text-rose-400 mb-1" size={20} />
                  <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{absentCount}</p>
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-500 uppercase tracking-wider">Absent</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-100 dark:border-amber-500/20 text-center">
                  <Clock className="mx-auto text-amber-600 dark:text-amber-400 mb-1" size={20} />
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{lateCount}</p>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wider">Late</p>
                </div>
              </div>
              
              {absentUsers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Absent Members ({displayDate}):</p>
                  <div className="flex flex-wrap gap-2">
                    {absentUsers.map(u => (
                      <span key={u.id} className="px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded text-xs font-medium">
                        {u.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Schedule */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">This Week</h3>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300">View all</button>
            </div>
            <div className="space-y-4">
              <ScheduleItem day="Mon-Wed" title="Individual Study" type="study" />
              <ScheduleItem day="Thursday" title="Group Discussion" type="group" />
              <ScheduleItem day="Saturday" title="Meeting + Quiz" type="quiz" />
              <ScheduleItem day="Sunday" title="Review + Planning" type="planning" />
            </div>
          </div>

          {/* Recent Resources */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Resources</h3>
            <div className="space-y-3">
              {resources.slice(0, 3).map(res => (
                <button 
                  key={res.id} 
                  onClick={() => setCurrentView('resources')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <BookMarked size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{res.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">By {res.uploadedBy}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Class History */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Calendar className="text-indigo-600 dark:text-indigo-400" size={20} />
              Class History
            </h3>
            <div className="space-y-3">
              {onlineClasses.filter(c => c.isCompleted).slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{c.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(c.startTime).toLocaleDateString()}
                      {c.endTime && ` • Ended at ${new Date(c.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{c.participants.length}</span>
                  </div>
                </div>
              ))}
              {onlineClasses.filter(c => c.isCompleted).length === 0 && (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-4">No past classes recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Picture Modal */}
      <AnimatePresence>
        {isUpdatingPic && (
          <div className="fixed inset-0 bg-slate-900/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Update Profile Picture</h3>
                <button onClick={() => setIsUpdatingPic(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={20}/>
                </button>
              </div>

              <form onSubmit={handleUpdateProfilePic} className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {profilePicUrl ? (
                      <img src={profilePicUrl} alt="Preview" className="w-24 h-24 rounded-3xl object-cover border-4 border-indigo-500/20 shadow-xl" />
                    ) : (
                      <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 border-4 border-dashed border-slate-200 dark:border-slate-700">
                        <Camera size={32} />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
                  <input 
                    type="url" 
                    required
                    value={profilePicUrl}
                    onChange={e => setProfilePicUrl(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <p className="text-[10px] text-slate-500 mt-2">Paste a direct link to an image (Unsplash, Imgur, etc.)</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      const randomId = Math.floor(Math.random() * 1000);
                      setProfilePicUrl(`https://picsum.photos/seed/${randomId}/400/400`);
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                  >
                    Random Image
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Self Report Modal */}
      {isReporting && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Report Attendance</h3>
              <button onClick={() => setIsReporting(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20}/>
              </button>
            </div>

            {reportSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Successfully Reported!</h4>
                <p className="text-slate-500 dark:text-slate-400">Your attendance for today has been recorded.</p>
              </div>
            ) : (
              <form onSubmit={handleSelfReport} className="space-y-4">
                {reportError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-lg border border-rose-100 dark:border-rose-500/20">
                    {reportError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Your Name</label>
                  <select 
                    required
                    value={reportUserId}
                    onChange={e => setReportUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Select Member --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registration Number</label>
                  <input 
                    type="text" 
                    required
                    value={reportRegNo}
                    onChange={e => setReportRegNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                    placeholder="e.g., REG-001"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsReporting(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] dark:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  >
                    Verify & Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function ScheduleItem({ day, title, type }: { day: string, title: string, type: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-16 shrink-0 pt-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{day}</span>
      </div>
      <div className="flex-1">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
        </div>
      </div>
    </div>
  );
}
