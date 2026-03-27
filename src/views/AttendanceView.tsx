import React, { useState } from 'react';
import { useData } from '../DataContext';
import { UserCheck, UserX, Clock, Calendar as CalendarIcon, History, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AttendanceView() {
  const { users, attendance, attendanceHistory, markAttendance, currentUser } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showOnlyPresent, setShowOnlyPresent] = useState(true);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const isLeader = currentUser?.role === 'Group Leader';

  const getStatus = (userId: string) => {
    const record = attendance.find(a => a.userId === userId && a.date === selectedDate);
    return record ? record.status : null;
  };

  const filteredUsers = users.filter(user => {
    if (!isLeader && user.id !== currentUser?.id) return false;
    const status = getStatus(user.id);
    // If marked absent, hide them if showOnlyPresent is true
    if (showOnlyPresent && status === 'Absent') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance Record</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isLeader ? 'Mark attendance for your group members.' : 'View your attendance status.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="showOnlyPresent"
              checked={showOnlyPresent}
              onChange={(e) => setShowOnlyPresent(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="showOnlyPresent" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Show Present Members Only
            </label>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <CalendarIcon size={18} className="text-slate-400" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredUsers.map((user) => {
                const status = getStatus(user.id);
                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs shrink-0">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{user.role}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isLeader ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => markAttendance(user.id, selectedDate, 'Present')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${status === 'Present' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'}`}
                          >
                            <UserCheck size={14} /> Reported
                          </button>
                          <button 
                            onClick={() => markAttendance(user.id, selectedDate, 'Absent')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${status === 'Absent' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'}`}
                          >
                            <UserX size={14} /> Absent
                          </button>
                          <button 
                            onClick={() => markAttendance(user.id, selectedDate, 'Late')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${status === 'Late' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'}`}
                          >
                            <Clock size={14} /> Late
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                          status === 'Absent' ? 'bg-rose-100 text-rose-700' :
                          status === 'Late' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {status === 'Present' ? 'Reported' : (status || 'Pending')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {attendanceHistory && attendanceHistory.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <History size={20} className="text-indigo-500" />
            <h3 className="text-lg font-bold">Past Weekly Progress</h3>
          </div>
          
          <div className="grid gap-4">
            {attendanceHistory.map((week) => (
              <div 
                key={week.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
              >
                <button 
                  onClick={() => setExpandedHistory(expandedHistory === week.id ? null : week.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <CalendarIcon size={18} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{week.weekRange}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Completed on {new Date(week.completedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Records</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{week.records.length}</p>
                    </div>
                    {expandedHistory === week.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedHistory === week.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-100 dark:border-slate-700"
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {users.filter(u => isLeader || u.id === currentUser?.id).map(user => {
                            const userRecords = week.records.filter(r => r.userId === user.id);
                            const presentCount = userRecords.filter(r => r.status === 'Present').length;
                            const totalCount = userRecords.length;
                            const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

                            return (
                              <div key={user.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                                    <p className="text-[10px] text-slate-500">{user.role}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{percentage}%</p>
                                  <p className="text-[9px] text-slate-400 uppercase tracking-tighter">{presentCount}/{totalCount} Reported</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
