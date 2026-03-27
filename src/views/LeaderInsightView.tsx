import React, { useState, useMemo } from 'react';
import { useData } from '../DataContext';
import { 
  Search, 
  Filter, 
  User as UserIcon, 
  Mail, 
  Hash, 
  Shield, 
  Calendar, 
  ChevronRight, 
  ExternalLink,
  Activity,
  Award,
  Clock,
  CheckCircle2,
  X,
  BarChart3,
  Settings as SettingsIcon,
  Users as UsersIcon,
  Image as ImageIcon,
  Save,
  RotateCcw
} from 'lucide-react';
import { User, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

type Tab = 'members' | 'analytics' | 'settings';

export default function LeaderInsightView() {
  const { 
    users, 
    attendance, 
    attendanceHistory, 
    participationRecords, 
    onlineUserIds, 
    groupName, 
    groupPhoto, 
    updateGroupSettings,
    restartSystem
  } = useData();
  
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Online' | 'Offline' | 'Reported' | 'Pending'>('All');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  
  // Settings state
  const [newGroupName, setNewGroupName] = useState(groupName);
  const [newGroupPhoto, setNewGroupPhoto] = useState(groupPhoto);

  const filteredMembers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.regNo.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      
      const isOnline = onlineUserIds.includes(user.id);
      const matchesStatus = statusFilter === 'All' || 
                           (statusFilter === 'Online' && isOnline) ||
                           (statusFilter === 'Offline' && !isOnline) ||
                           (statusFilter === 'Reported' && user.hasReported) ||
                           (statusFilter === 'Pending' && !user.hasReported);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter, onlineUserIds]);

  const getMemberStats = (userId: string) => {
    const memberAttendance = attendance.filter(a => a.userId === userId);
    const presentCount = memberAttendance.filter(a => a.status === 'Present').length;
    const attendanceRate = memberAttendance.length > 0 ? Math.round((presentCount / memberAttendance.length) * 100) : 0;
    
    const memberParticipation = participationRecords.filter(p => p.userId === userId);
    
    return {
      attendanceRate,
      participationCount: memberParticipation.length,
      lastActive: memberParticipation.length > 0 ? memberParticipation[memberParticipation.length - 1].timestamp : null
    };
  };

  // Analytics Data
  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);

  const attendanceData = useMemo(() => {
    if (!attendanceHistory || attendanceHistory.length === 0) return [];
    return attendanceHistory.slice(-5).map(week => {
      const present = week.records.filter(r => r.status === 'Present').length;
      const total = week.records.length;
      return {
        name: week.weekRange.split(' - ')[0],
        rate: total > 0 ? Math.round((present / total) * 100) : 0
      };
    });
  }, [attendanceHistory]);

  const participationData = useMemo(() => {
    const topMembers = users
      .map(u => ({
        name: u.name,
        count: participationRecords.filter(p => p.userId === u.id).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return topMembers;
  }, [users, participationRecords]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

  const handleSaveSettings = () => {
    updateGroupSettings(newGroupName, newGroupPhoto);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="text-indigo-600 dark:text-indigo-400" size={28} />
            Leader Insight Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Comprehensive overview of all group members and their activities.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'members' 
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <UsersIcon size={18} />
          Members
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'analytics' 
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'settings' 
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <SettingsIcon size={18} />
          Settings
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'members' && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filters & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="text-slate-400 shrink-0" size={18} />
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="All">All Roles</option>
                  <option value="Group Leader">Group Leader</option>
                  <option value="Assistant Leader">Assistant Leader</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Tech Coordinator">Tech Coordinator</option>
                  <option value="Subject Coordinator">Subject Coordinator</option>
                  <option value="Member">Member</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="text-slate-400 shrink-0" size={18} />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="All">All Statuses</option>
                  <option value="Online">Online Now</option>
                  <option value="Offline">Offline</option>
                  <option value="Reported">Reported for Duty</option>
                  <option value="Pending">Pending Report</option>
                </select>
              </div>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map(member => {
                const stats = getMemberStats(member.id);
                const isOnline = onlineUserIds.includes(member.id);
                
                return (
                  <motion.div
                    layout
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative">
                        {member.profilePicture ? (
                          <img src={member.profilePicture} alt={member.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-700 group-hover:border-indigo-500/30 transition-all" />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        {isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        member.role.includes('Leader') ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400' : 
                        member.role.includes('Coordinator') ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 
                        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {member.role}
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{member.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Hash size={12} />
                        {member.regNo}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Attendance</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{stats.attendanceRate}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Participation</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{stats.participationCount} sessions</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        {member.hasReported ? (
                          <CheckCircle2 size={12} className="text-emerald-500" />
                        ) : (
                          <Clock size={12} className="text-amber-500" />
                        )}
                        {member.hasReported ? 'Reported' : 'Pending'}
                      </span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No members found</h3>
                <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Role Distribution */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <UsersIcon className="text-indigo-600" size={20} />
                Role Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {roleDistribution.map((role, index) => (
                  <div key={role.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate">{role.name}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{role.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Trends */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Activity className="text-emerald-600" size={20} />
                Attendance Trends (%)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                    />
                    <Area type="monotone" dataKey="rate" stroke="#10b981" fillOpacity={1} fill="url(#colorRate)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Participants */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Award className="text-amber-500" size={20} />
                Top Participants
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={participationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/20">
              <h3 className="text-lg font-bold mb-6">Group Summary</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-indigo-100 text-xs uppercase font-bold tracking-wider">Total Members</p>
                  <p className="text-4xl font-black">{users.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-indigo-100 text-xs uppercase font-bold tracking-wider">Online Now</p>
                  <p className="text-4xl font-black">{onlineUserIds.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-indigo-100 text-xs uppercase font-bold tracking-wider">Reported Today</p>
                  <p className="text-4xl font-black">{users.filter(u => u.hasReported).length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-indigo-100 text-xs uppercase font-bold tracking-wider">Avg. Attendance</p>
                  <p className="text-4xl font-black">
                    {attendanceData.length > 0 ? Math.round(attendanceData.reduce((acc, curr) => acc + curr.rate, 0) / attendanceData.length) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <SettingsIcon className="text-indigo-600" size={24} />
                Group Settings
              </h3>
              
              <div className="space-y-6">
                {/* Group Name */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <UserIcon size={16} />
                    Group Name
                  </label>
                  <input 
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Group Photo */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ImageIcon size={16} />
                    Group Photo URL
                  </label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input 
                        type="text"
                        value={newGroupPhoto}
                        onChange={(e) => setNewGroupPhoto(e.target.value)}
                        placeholder="Enter image URL..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shrink-0">
                      <img src={newGroupPhoto} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Provide a direct URL to an image (e.g., from Unsplash or Picsum).</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={handleSaveSettings}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Save Settings
                  </button>
                  <button 
                    onClick={() => {
                      setNewGroupName(groupName);
                      setNewGroupPhoto(groupPhoto);
                    }}
                    className="px-6 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-500/5 p-8 rounded-3xl border border-rose-100 dark:border-rose-500/20">
              <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                <RotateCcw size={20} />
                System Maintenance
              </h3>
              <p className="text-sm text-rose-600 dark:text-rose-400/70 mb-6">
                Restarting the system will clear temporary states and refresh all data from the database. Use this if you encounter synchronization issues.
              </p>
              <button 
                onClick={restartSystem}
                className="w-full bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 py-3 rounded-xl font-bold transition-all border border-rose-200 dark:border-rose-500/30"
              >
                Restart System
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-violet-700">
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-8 pb-8">
                <div className="relative -mt-12 mb-6 flex items-end gap-6">
                  <div className="relative">
                    {selectedMember.profilePicture ? (
                      <img src={selectedMember.profilePicture} alt={selectedMember.name} className="w-32 h-32 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-xl" />
                    ) : (
                      <div className="w-32 h-32 rounded-3xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-4xl border-4 border-white dark:border-slate-900 shadow-xl">
                        {selectedMember.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    {onlineUserIds.includes(selectedMember.id) && (
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full shadow-sm" />
                    )}
                  </div>
                  <div className="pb-2">
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{selectedMember.name}</h3>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2">
                      <Shield size={16} />
                      {selectedMember.role}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Contact Information</h5>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Mail size={16} />
                          </div>
                          <span className="text-sm">{selectedMember.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Hash size={16} />
                          </div>
                          <span className="text-sm">{selectedMember.regNo}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Activity Status</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.hasReported ? (
                          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 size={14} />
                            Reported for Duty
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <Clock size={14} />
                            Pending Report
                          </span>
                        )}
                        {onlineUserIds.includes(selectedMember.id) ? (
                          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <Activity size={14} />
                            Active Now
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-bold">
                            Offline
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Performance Metrics</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                            <Award size={16} />
                            <span className="text-[10px] font-bold uppercase">Attendance</span>
                          </div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{getMemberStats(selectedMember.id).attendanceRate}%</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                            <Activity size={16} />
                            <span className="text-[10px] font-bold uppercase">Participation</span>
                          </div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{getMemberStats(selectedMember.id).participationCount}</p>
                        </div>
                      </div>
                    </div>

                    {getMemberStats(selectedMember.id).lastActive && (
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Last Session Participation</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(getMemberStats(selectedMember.id).lastActive!).toLocaleDateString()} at {new Date(getMemberStats(selectedMember.id).lastActive!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {attendanceHistory && attendanceHistory.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Weekly Attendance History</h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {attendanceHistory.map(week => {
                        const userRecords = week.records.filter(r => r.userId === selectedMember.id);
                        const presentCount = userRecords.filter(r => r.status === 'Present').length;
                        const totalCount = userRecords.length;
                        const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

                        return (
                          <div key={week.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <Calendar size={14} />
                              </div>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{week.weekRange}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 transition-all duration-500" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 w-8 text-right">{percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button 
                    onClick={() => setSelectedMember(null)}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
