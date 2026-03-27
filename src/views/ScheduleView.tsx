import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  BookOpen, 
  CheckSquare, 
  Edit2, 
  X, 
  Video, 
  Plus, 
  Share2, 
  Check, 
  MapPin, 
  Target,
  Trash2,
  Table
} from 'lucide-react';
import { useData } from '../DataContext';
import { ScheduleItem, OnlineClass, WeeklyGoal, TimetableEntry } from '../types';

const iconMap: Record<string, any> = {
  BookOpen,
  Users,
  CheckSquare,
  CalendarIcon,
  Clock,
  Video
};

export default function ScheduleView() {
  const { 
    schedule, 
    currentUser, 
    updateScheduleItem, 
    onlineClasses, 
    scheduleClass, 
    deleteClass, 
    setCurrentView,
    weeklyGoals,
    timetable,
    updateWeeklyGoal,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry
  } = useData();
  
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isSchedulingClass, setIsSchedulingClass] = useState(false);
  const [newClass, setNewClass] = useState({ title: '', startTime: '', duration: 60 });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WeeklyGoal | null>(null);

  const [isAddingTimetable, setIsAddingTimetable] = useState(false);
  const [newTimetableEntry, setNewTimetableEntry] = useState<Omit<TimetableEntry, 'id'>>({
    day: 'Monday',
    time: '',
    subject: '',
    coordinator: ''
  });

  const isLeader = currentUser?.role === 'Group Leader';

  const currentGoal = weeklyGoals[0] || { id: '1', week: 'Current Week', goal: 'No goal set yet.', location: 'Not specified' };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoal) {
      updateWeeklyGoal(editingGoal);
      setIsEditingGoal(false);
    }
  };

  const handleAddTimetable = (e: React.FormEvent) => {
    e.preventDefault();
    addTimetableEntry(newTimetableEntry);
    setIsAddingTimetable(false);
    setNewTimetableEntry({ day: 'Monday', time: '', subject: '', coordinator: '' });
  };

  const handleShare = (c: OnlineClass) => {
    const shareUrl = window.location.origin;
    const message = `*Online Class Invitation*\n\n*Title:* ${c.title}\n*Time:* ${new Date(c.startTime).toLocaleString()}\n*Duration:* ${c.duration} mins\n\nJoin here: ${shareUrl}\n\n_Sent via Charlie 2 Learning Hub_`;
    
    navigator.clipboard.writeText(message).then(() => {
      setCopiedId(c.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateScheduleItem(editingItem);
      setEditingItem(null);
    }
  };

  const handleScheduleClass = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleClass(newClass.title, newClass.startTime, newClass.duration);
    setIsSchedulingClass(false);
    setNewClass({ title: '', startTime: '', duration: 60 });
  };

  return (
    <div className="space-y-8">
      {/* Weekly Goal / Place Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Target size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={24} className="text-indigo-200" />
              <h3 className="text-lg font-bold uppercase tracking-wider text-indigo-100">Weekly Focus & Place</h3>
            </div>
            {isLeader && (
              <button 
                onClick={() => {
                  setEditingGoal(currentGoal);
                  setIsEditingGoal(true);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-indigo-200 text-xs font-bold uppercase">Main Goal</p>
              <p className="text-xl font-medium leading-tight">{currentGoal.goal}</p>
            </div>
            <div className="space-y-2">
              <p className="text-indigo-200 text-xs font-bold uppercase">Meeting Place / Platform</p>
              <div className="flex items-center gap-2 text-xl font-medium">
                <MapPin size={20} className="text-indigo-300" />
                {currentGoal.location}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Weekly Schedule</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">The standard learning cycle for Charlie 2.</p>
        </div>
        {isLeader && (
          <button 
            onClick={() => setIsSchedulingClass(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <Plus size={18} />
            Schedule Online Class
          </button>
        )}
      </div>

      {/* Online Classes Section */}
      {onlineClasses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Video size={20} className="text-indigo-600" />
            Upcoming Online Classes
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {onlineClasses.filter(c => !c.isCompleted).map(c => (
              <div key={c.id} className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-300">{c.title}</h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {new Date(c.startTime).toLocaleString()} ({c.duration} mins)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleShare(c)}
                    className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${copiedId === c.id ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-indigo-600 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-50'}`}
                    title="Share Class Link"
                  >
                    {copiedId === c.id ? <Check size={14} /> : <Share2 size={14} />}
                    {copiedId === c.id ? 'Copied!' : 'Share'}
                  </button>
                  {isLeader && (
                    <button 
                      onClick={() => deleteClass(c.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Class"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => setCurrentView('online-class')}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Join Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {schedule.map((item) => {
          const Icon = iconMap[item.iconName] || CalendarIcon;
          return (
            <div key={item.id} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border ${item.color.split(' ')[2]} dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-6 items-start relative`}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${item.color.split(' ').slice(0,2).join(' ')} dark:bg-slate-700 dark:text-slate-300`}>
                <Icon size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{item.day}</h3>
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{item.title}</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
              </div>
              {isLeader && (
                <button 
                  onClick={() => setEditingItem(item)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Group Timetable Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
              <Table size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Group Timetable</h3>
              <p className="text-xs text-slate-500">Weekly subject and coordinator schedule</p>
            </div>
          </div>
          {isLeader && (
            <button 
              onClick={() => setIsAddingTimetable(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              <Plus size={14} />
              Add Entry
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50">
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Day</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Coordinator</th>
                {isLeader && <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {timetable.length === 0 ? (
                <tr>
                  <td colSpan={isLeader ? 5 : 4} className="px-6 py-8 text-center text-slate-500 italic">
                    No timetable entries yet.
                  </td>
                </tr>
              ) : (
                timetable.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{entry.day}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{entry.time}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">{entry.subject}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{entry.coordinator}</td>
                    {isLeader && (
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteTimetableEntry(entry.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Goal Modal */}
      {isEditingGoal && editingGoal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Weekly Goal</h3>
              <button onClick={() => setIsEditingGoal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Main Goal</label>
                <textarea 
                  required
                  rows={3}
                  value={editingGoal.goal}
                  onChange={e => setEditingGoal({...editingGoal, goal: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meeting Place / Platform</label>
                <input 
                  type="text" 
                  required
                  value={editingGoal.location}
                  onChange={e => setEditingGoal({...editingGoal, location: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditingGoal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Timetable Entry Modal */}
      {isAddingTimetable && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add Timetable Entry</h3>
              <button onClick={() => setIsAddingTimetable(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleAddTimetable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Day</label>
                <select 
                  value={newTimetableEntry.day}
                  onChange={e => setNewTimetableEntry({...newTimetableEntry, day: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter Time Range"
                  value={newTimetableEntry.time}
                  onChange={e => setNewTimetableEntry({...newTimetableEntry, time: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter Subject Name"
                  value={newTimetableEntry.subject}
                  onChange={e => setNewTimetableEntry({...newTimetableEntry, subject: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Coordinator</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter Coordinator Name"
                  value={newTimetableEntry.coordinator}
                  onChange={e => setNewTimetableEntry({...newTimetableEntry, coordinator: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddingTimetable(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Schedule</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Day(s)</label>
                <input 
                  type="text" 
                  required
                  value={editingItem.day || ''}
                  onChange={e => setEditingItem({...editingItem, day: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={editingItem.title || ''}
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={editingItem.description || ''}
                  onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.4)] dark:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Online Class Modal */}
      {isSchedulingClass && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Schedule Online Class</h3>
              <button onClick={() => setIsSchedulingClass(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleScheduleClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter Class Title"
                  value={newClass.title}
                  onChange={e => setNewClass({...newClass, title: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={newClass.startTime}
                  onChange={e => setNewClass({...newClass, startTime: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (minutes)</label>
                <input 
                  type="number" 
                  required
                  min="15"
                  step="15"
                  value={newClass.duration}
                  onChange={e => setNewClass({...newClass, duration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Note: After scheduling, you can share the class link via WhatsApp or other platforms.
              </p>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsSchedulingClass(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Schedule Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
