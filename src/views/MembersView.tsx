import React, { useState } from 'react';
import { useData } from '../DataContext';
import { Mail, Shield, Edit2, X, Hash, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { User, UserRole } from '../types';

export default function MembersView() {
  const { users, updateUser, addUser, deleteUser, currentUser, notify, onlineUserIds } = useData();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [newUser, setNewUser] = useState<Omit<User, 'id' | 'createdAt'>>({
    name: '',
    email: '',
    role: 'Member',
    regNo: '',
    hasReported: false
  });

  const isLeader = currentUser?.role === 'Group Leader' || currentUser?.role === 'Assistant Leader';
  const groupLeader = users.find(u => u.role === 'Group Leader');
  const onlineMembers = users.filter(u => onlineUserIds.includes(u.id));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader) {
      setPermissionError('not group leder permission denied contact your leader');
      return;
    }
    if (editingUser) {
      updateUser(editingUser);
      setEditingUser(null);
      notify('success', 'Member updated successfully');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader) {
      setPermissionError('Permission denied. Only leaders can add members.');
      return;
    }
    await addUser(newUser as any);
    setIsAdding(false);
    setNewUser({
      name: '',
      email: '',
      role: 'Member',
      regNo: '',
      hasReported: false
    });
  };

  const handleAddClick = () => {
    if (isLeader) {
      setIsAdding(true);
      setPermissionError('');
    } else {
      setPermissionError('not group leder permission denied contact your leader');
      setTimeout(() => setPermissionError(''), 3000);
    }
  };

  const handleEditClick = (user: User) => {
    if (isLeader) {
      setEditingUser(user);
      setPermissionError('');
    } else {
      setPermissionError('not group leder permission denied contact your leader');
      setTimeout(() => setPermissionError(''), 3000);
    }
  };

  const handleRemoveClick = (user: User) => {
    if (isLeader) {
      if (user.id === currentUser?.id) {
        setPermissionError('You cannot remove yourself!');
        setTimeout(() => setPermissionError(''), 3000);
        return;
      }
      setDeletingUser(user);
      setPermissionError('');
    } else {
      setPermissionError('not group leder permission denied contact your leader');
      setTimeout(() => setPermissionError(''), 3000);
    }
  };

  const confirmDelete = () => {
    if (deletingUser) {
      deleteUser(deletingUser.id);
      setDeletingUser(null);
      notify('info', 'Member removed');
    }
  };

  return (
    <div className="space-y-8">
      {/* Group Leader Spotlight */}
      {groupLeader && (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              {groupLeader.profilePicture ? (
                <img src={groupLeader.profilePicture} alt={groupLeader.name} className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-lg" />
              ) : groupLeader.avatar ? (
                <img src={groupLeader.avatar} alt={groupLeader.name} className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/20 shadow-lg">
                  {groupLeader.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              {onlineUserIds.includes(groupLeader.id) && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-indigo-600 rounded-full shadow-sm" />
              )}
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <Shield size={12} />
                Group Leader
              </div>
              <h3 className="text-3xl font-bold mb-1">{groupLeader.name}</h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-white/80 text-sm">
                  {(isLeader || groupLeader.id === currentUser?.id) && (
                    <>
                      <div className="flex items-center gap-2">
                        <Hash size={16} />
                        {groupLeader.regNo}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        {groupLeader.email}
                      </div>
                    </>
                  )}
                </div>
            </div>
            <div className="md:ml-auto flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <div className={`w-2 h-2 rounded-full ${onlineUserIds.includes(groupLeader.id) ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
              <span className="text-sm font-medium">
                {onlineUserIds.includes(groupLeader.id) ? 'Active Now' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Online Members Section */}
      {onlineMembers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Currently Online ({onlineMembers.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {onlineMembers.map(member => (
              <div key={member.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center group hover:border-indigo-500 transition-all shadow-sm">
                <div className="relative mb-2">
                  {member.profilePicture ? (
                    <img src={member.profilePicture} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                  {member.hasReported && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-sm border border-white dark:border-slate-800 scale-75">
                      <ShieldCheck size={12} />
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate w-full">{member.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Members</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage study group members and roles.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={handleAddClick}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.4)] dark:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
          >
            Add Member
          </button>
          {permissionError && (
            <p className="text-xs text-rose-500 font-bold animate-pulse">{permissionError}</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reg No</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {users.filter(u => isLeader || u.id === currentUser?.id).map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        {onlineUserIds.includes(user.id) && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                        )}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {user.name}
                        {onlineUserIds.includes(user.id) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.hasReported ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                        <ShieldCheck size={12} />
                        Reported
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">
                        <AlertCircle size={12} />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {(isLeader || user.id === currentUser?.id) ? (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-mono">
                        <Hash size={14} />
                        {user.regNo}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Hidden</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                      ${user.role.includes('Leader') ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400' : 
                        user.role.includes('Coordinator') ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 
                        user.role === 'Secretary' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }
                    `}>
                      {user.role !== 'Member' && <Shield size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(isLeader || user.id === currentUser?.id) ? (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                        <Mail size={14} />
                        {user.email}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Hidden</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleRemoveClick(user)}
                        className="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 text-sm font-medium flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Member</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input 
                  type="text" 
                  required
                  value={editingUser.name || ''}
                  onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registration Number</label>
                <input 
                  type="text" 
                  required
                  value={editingUser.regNo || ''}
                  onChange={e => setEditingUser({...editingUser, regNo: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={editingUser.email || ''}
                  onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select 
                  value={editingUser.role || 'Member'}
                  onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="Group Leader">Group Leader</option>
                  <option value="Assistant Leader">Assistant Leader</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Tech Coordinator">Tech Coordinator</option>
                  <option value="Subject Coordinator">Subject Coordinator</option>
                  <option value="Member">Member</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
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

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add Member</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input 
                  type="text" 
                  required
                  value={newUser.name || ''}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registration Number</label>
                <input 
                  type="text" 
                  required
                  value={newUser.regNo || ''}
                  onChange={e => setNewUser({...newUser, regNo: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email || ''}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registration Number</label>
                <input 
                  type="text" 
                  required
                  value={newUser.regNo || ''}
                  placeholder="e.g. REG-001"
                  onChange={e => setNewUser({...newUser, regNo: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select 
                  value={newUser.role || 'Member'}
                  onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="Group Leader">Group Leader</option>
                  <option value="Assistant Leader">Assistant Leader</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Tech Coordinator">Tech Coordinator</option>
                  <option value="Subject Coordinator">Subject Coordinator</option>
                  <option value="Member">Member</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.4)] dark:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Remove Member?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to remove <span className="font-semibold text-slate-900 dark:text-slate-100">{deletingUser.name}</span>? 
              They will no longer be able to sign in.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingUser(null)}
                className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/20"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
