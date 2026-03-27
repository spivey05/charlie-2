import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Resource, Quiz, Attendance, Message, ScheduleItem, View, OnlineClass, WeeklyGoal, TimetableEntry, ParticipationRecord, UserRole, LearningModelStep, WeeklyAttendance } from './types';
import { io, Socket } from 'socket.io-client';
import { NotificationContainer, NotificationType } from './components/Notification';

interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
}

interface DataContextType {
  users: User[];
  resources: Resource[];
  quizzes: Quiz[];
  attendance: Attendance[];
  attendanceHistory: WeeklyAttendance[];
  messages: Message[];
  theme: 'light' | 'dark' | 'system';
  schedule: ScheduleItem[];
  currentUser: User | null;
  currentView: View;
  socket: Socket | null;
  setCurrentView: (view: View) => void;
  setCurrentUser: (user: User | null) => void;
  manualLogin: (email: string, regNo: string, role: UserRole) => Promise<void>;
  logout: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateUser: (user: User) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => void;
  updateScheduleItem: (item: ScheduleItem) => void;
  markAttendance: (userId: string, date: string, status: 'Present' | 'Absent' | 'Late') => void;
  addResource: (resource: Omit<Resource, 'id' | 'uploadedBy' | 'date'>) => void;
  addQuiz: (quiz: Omit<Quiz, 'id' | 'status'>) => void;
  submitQuiz: (quizId: string, answers: string[]) => void;
  completeQuiz: (quizId: string) => void;
  addMessage: (content: string) => void;
  deleteMessage: (id: string) => void;
  togglePinMessage: (id: string) => void;
  isLoaded: boolean;
  isSaving: boolean;
  systemError: { type: string; message: string } | null;
  setSystemError: (error: { type: string; message: string } | null) => void;
  onlineClasses: OnlineClass[];
  onlineUserIds: string[];
  scheduleClass: (title: string, startTime: string, duration: number) => void;
  deleteClass: (classId: string) => void;
  endClass: (classId: string) => void;
  startClass: (classId: string, meetLink: string) => void;
  muteParticipant: (classId: string, userId: string, muted: boolean) => void;
  toggleChatStatus: (classId: string, disabled: boolean) => void;
  joinClass: (classId: string) => void;
  leaveClass: (classId: string) => void;
  participationRecords: ParticipationRecord[];
  deleteParticipationRecord: (id: string) => void;
  learningModel: LearningModelStep[];
  updateLearningModel: (steps: LearningModelStep[]) => void;
  updateProfilePicture: (url: string) => void;
  updateGroupSettings: (name: string, photo: string) => void;
  reportForDuty: () => void;
  restartSystem: () => Promise<void>;
  groupName: string;
  groupPhoto: string;
  discussionDisabled: boolean;
  weeklyGoals: WeeklyGoal[];
  timetable: TimetableEntry[];
  toggleDiscussion: (disabled: boolean) => void;
  updateWeeklyGoal: (goal: WeeklyGoal) => void;
  addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => void;
  updateTimetableEntry: (entry: TimetableEntry) => void;
  deleteTimetableEntry: (id: string) => void;
  notify: (type: NotificationType, message: string) => void;
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const load = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    return fallback;
  }
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<WeeklyAttendance[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => load('c2_theme', 'system'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => load('c2_current_user', null));
  const [onlineClasses, setOnlineClasses] = useState<OnlineClass[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [systemError, setSystemError] = useState<{ type: string; message: string } | null>(null);
  const [discussionDisabled, setDiscussionDisabled] = useState(false);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [participationRecords, setParticipationRecords] = useState<ParticipationRecord[]>([]);
  const [learningModel, setLearningModel] = useState<LearningModelStep[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [groupName, setGroupName] = useState('Academic Excellence Group');
  const [groupPhoto, setGroupPhoto] = useState('https://picsum.photos/seed/group/800/400');

  const notify = useCallback((type: NotificationType, message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Initialize Socket.io
  useEffect(() => {
    let newSocket: Socket | null = null;
    try {
      newSocket = io({
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        timeout: 20000
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setSystemError(null);
        if (currentUser) {
          newSocket?.emit('user:online', currentUser.id);
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        // Don't show error for benign Vite HMR issues
        if (err.message !== 'WebSocket closed without opened.') {
          setSystemError({ type: 'connection', message: 'Real-time connection lost. Trying to reconnect...' });
        }
      });

      newSocket.on('data-updated', (data) => {
        if (data.users) setUsers(data.users);
        if (data.resources) setResources(data.resources);
        if (data.quizzes) setQuizzes(data.quizzes);
        if (data.attendance) setAttendance(data.attendance);
        if (data.attendanceHistory) setAttendanceHistory(data.attendanceHistory);
        if (data.messages) setMessages(data.messages);
        if (data.schedule) setSchedule(data.schedule);
        if (data.onlineClasses) setOnlineClasses(data.onlineClasses);
        if (data.discussionDisabled !== undefined) setDiscussionDisabled(data.discussionDisabled);
        if (data.groupName) setGroupName(data.groupName);
        if (data.groupPhoto) setGroupPhoto(data.groupPhoto);
        if (data.weeklyGoals) setWeeklyGoals(data.weeklyGoals);
        if (data.timetable) setTimetable(data.timetable);
        if (data.participationRecords) setParticipationRecords(data.participationRecords);
        if (data.learningModel) setLearningModel(data.learningModel);
      });

      newSocket.on('presence:update', (userIds: string[]) => {
        setOnlineUserIds(userIds);
      });

      newSocket.on('system-error', (error: { type: string; message: string }) => {
        setSystemError(error);
        notify('error', error.message);
      });

      newSocket.on('discussion-status-updated', ({ disabled }: { disabled: boolean }) => {
        setDiscussionDisabled(disabled);
      });
    } catch (err) {
      console.error('Failed to initialize socket:', err);
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [currentUser?.id, notify]);

  const fetchData = useCallback(async (retries = 3, delay = 1000, userOverride?: User | null) => {
    try {
      const headers: any = {};
      const user = userOverride !== undefined ? userOverride : currentUser;
      if (user) {
        headers['x-user-role'] = user.role;
        headers['x-user-id'] = user.id;
      }

      const response = await fetch('/api/data', { headers });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setUsers(data.users || []);
      setResources(data.resources || []);
      setQuizzes(data.quizzes || []);
      setAttendance(data.attendance || []);
      setAttendanceHistory(data.attendanceHistory || []);
      setMessages(data.messages || []);
      setSchedule(data.schedule || []);
      setOnlineClasses(data.onlineClasses || []);
      setDiscussionDisabled(data.discussionDisabled || false);
      setGroupName(data.groupName || 'Academic Excellence Group');
      setGroupPhoto(data.groupPhoto || 'https://picsum.photos/seed/group/800/400');
      setWeeklyGoals(data.weeklyGoals || []);
      setTimetable(data.timetable || []);
      setParticipationRecords(data.participationRecords || []);
      setLearningModel(data.learningModel || [
        { id: '1', phase: 'Phase 1: Planning', desc: 'Set goals, assign topics, prepare materials' },
        { id: '2', phase: 'Phase 2: Learning', desc: 'Individual study, group discussions, peer teaching' },
        { id: '3', phase: 'Phase 3: Practice', desc: 'Solve problems together, work on assignments' },
        { id: '4', phase: 'Phase 4: Evaluation', desc: 'Weekly quizzes/tests, performance review' },
        { id: '5', phase: 'Phase 5: Feedback', desc: 'Identify weaknesses, adjust strategies' },
      ]);
      setSystemError(null);
    } catch (err) {
      console.error(`Failed to fetch data (retries left: ${retries}):`, err);
      if (retries > 0) {
        setTimeout(() => fetchData(retries - 1, delay * 1.5), delay);
      } else {
        setSystemError({ 
          type: 'fetch', 
          message: 'Failed to load data from server after multiple attempts. Please check your internet connection or refresh the page.' 
        });
        notify('error', 'Failed to load data from server.');
      }
    } finally {
      setIsLoaded(true);
    }
  }, [notify, currentUser?.id, currentUser?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync data whenever it changes locally
  const syncData = useCallback(async (newData: any, retries = 3, delay = 1000) => {
    setIsSaving(true);
    
    if (socket && socket.connected) {
      socket.emit('update-data', newData);
    }
    
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
      if (!response.ok) {
        throw new Error(`Sync failed with ${response.status}`);
      }
      setSystemError(null);
    } catch (err) {
      console.error(`Failed to sync data (retries left: ${retries}):`, err);
      if (retries > 0) {
        setTimeout(() => syncData(newData, retries - 1, delay * 1.5), delay);
      } else {
        notify('warning', 'Changes saved locally but failed to sync with server after multiple attempts. They will sync when connection is restored.');
      }
    } finally {
      // Small delay to make the saving indicator visible and not flickering
      setTimeout(() => setIsSaving(false), 800);
    }
  }, [socket, notify]);

  useEffect(() => localStorage.setItem('c2_theme', JSON.stringify(theme)), [theme]);
  useEffect(() => localStorage.setItem('c2_current_user', JSON.stringify(currentUser)), [currentUser]);

  useEffect(() => {
    if (socket && currentUser) {
      socket.emit('user:online', currentUser.id);
    }
  }, [socket, currentUser]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const updateUser = (updatedUser: User) => {
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(newUsers);
    syncData({ users: newUsers, resources, quizzes, attendance, messages, schedule, onlineClasses });
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString()
    };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    syncData({ users: newUsers, resources, quizzes, attendance, messages, schedule, onlineClasses });
  };

  const deleteUser = (id: string) => {
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    syncData({ users: newUsers, resources, quizzes, attendance, messages, schedule, onlineClasses });
    if (currentUser?.id === id) {
      logout();
    }
  };

  const updateScheduleItem = (updatedItem: ScheduleItem) => {
    const newSchedule = schedule.map(item => item.id === updatedItem.id ? updatedItem : item);
    setSchedule(newSchedule);
    syncData({ users, resources, quizzes, attendance, messages, schedule: newSchedule, onlineClasses });
  };

  const markAttendance = (userId: string, date: string, status: 'Present' | 'Absent' | 'Late') => {
    const newAttendance = attendance.filter(a => !(a.userId === userId && a.date === date));
    newAttendance.push({ userId, date, status });
    setAttendance(newAttendance);
    syncData({ users, resources, quizzes, attendance: newAttendance, messages, schedule, onlineClasses });
  };

  const addResource = (res: Omit<Resource, 'id' | 'uploadedBy' | 'date'>) => {
    const newRes: Resource = {
      ...res,
      id: Date.now().toString(),
      uploadedBy: currentUser?.name || 'Unknown',
      date: new Date().toISOString().split('T')[0]
    };
    const newResources = [newRes, ...resources];
    setResources(newResources);
    syncData({ users, resources: newResources, quizzes, attendance, messages, schedule, onlineClasses });
  };

  const addQuiz = (quiz: Omit<Quiz, 'id' | 'status'>) => {
    const newQuiz: Quiz = {
      ...quiz,
      id: Date.now().toString(),
      status: 'Upcoming' as const,
      questions: quiz.questions || [],
      submissions: {}
    };
    const newQuizzes = [...quizzes, newQuiz];
    setQuizzes(newQuizzes);
    syncData({ users, resources, quizzes: newQuizzes, attendance, messages, schedule, onlineClasses });
  };

  const submitQuiz = (quizId: string, answers: string[]) => {
    if (!currentUser) return;
    const newQuizzes = quizzes.map(q => {
      if (q.id === quizId) {
        return {
          ...q,
          submissions: {
            ...(q.submissions || {}),
            [currentUser.id]: answers
          }
        };
      }
      return q;
    });
    setQuizzes(newQuizzes);
    syncData({ users, resources, quizzes: newQuizzes, attendance, messages, schedule, onlineClasses });
  };

  const completeQuiz = (quizId: string) => {
    const newQuizzes: Quiz[] = quizzes.map(q => q.id === quizId ? { ...q, status: 'Completed' as const } : q);
    setQuizzes(newQuizzes);
    syncData({ users, resources, quizzes: newQuizzes, attendance, messages, schedule, onlineClasses });
  };

  const addMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      author: currentUser?.name || 'Unknown',
      content,
      timestamp: new Date().toISOString(),
      isPinned: false
    };
    const newMessages = [newMessage, ...messages];
    setMessages(newMessages);
    syncData({ users, resources, quizzes, attendance, messages: newMessages, schedule, onlineClasses });
  };

  const deleteMessage = (id: string) => {
    const newMessages = messages.filter(m => m.id !== id);
    setMessages(newMessages);
    syncData({ users, resources, quizzes, attendance, messages: newMessages, schedule, onlineClasses });
  };

  const togglePinMessage = (id: string) => {
    const newMessages = messages.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m);
    setMessages(newMessages);
    syncData({ users, resources, quizzes, attendance, messages: newMessages, schedule, onlineClasses });
  };

  const scheduleClass = (title: string, startTime: string, duration: number) => {
    const newClass: OnlineClass = {
      id: Date.now().toString(),
      title,
      startTime,
      duration,
      scheduledBy: currentUser?.name || 'Unknown',
      isLive: false,
      isCompleted: false,
      participants: []
    };
    const newClasses = [...onlineClasses, newClass];
    setOnlineClasses(newClasses);
    syncData({ users, resources, quizzes, attendance, messages, schedule, onlineClasses: newClasses });
  };

  const deleteClass = (classId: string) => {
    const newClasses = onlineClasses.filter(c => c.id !== classId);
    setOnlineClasses(newClasses);
    syncData({ users, resources, quizzes, attendance, messages, schedule, onlineClasses: newClasses });
  };

  const endClass = (classId: string) => {
    const newClasses = onlineClasses.map(c => 
      c.id === classId ? { ...c, isLive: false, isCompleted: true, endTime: new Date().toISOString() } : c
    );
    setOnlineClasses(newClasses);
    syncData({ onlineClasses: newClasses });
  };

  const startClass = (classId: string, meetLink: string) => {
    const newClasses = onlineClasses.map(c => 
      c.id === classId ? { ...c, isLive: true, meetLink } : c
    );
    setOnlineClasses(newClasses);
    syncData({ onlineClasses: newClasses });
  };

  const muteParticipant = (classId: string, userId: string, muted: boolean) => {
    if (socket) {
      socket.emit('mute-user', { classId, userId, muted });
    }
  };

  const toggleChatStatus = (classId: string, disabled: boolean) => {
    const newClasses = onlineClasses.map(c => 
      c.id === classId ? { ...c, chatDisabled: disabled } : c
    );
    setOnlineClasses(newClasses);
    syncData({ onlineClasses: newClasses });
    
    if (socket) {
      socket.emit('toggle-chat', { classId, disabled });
    }
  };

  const toggleDiscussion = (disabled: boolean) => {
    setDiscussionDisabled(disabled);
    syncData({ discussionDisabled: disabled });
    if (socket) {
      socket.emit('toggle-discussion', { disabled });
    }
  };

  const updateWeeklyGoal = (goal: WeeklyGoal) => {
    const newGoals = weeklyGoals.map(g => g.id === goal.id ? goal : g);
    if (!weeklyGoals.find(g => g.id === goal.id)) {
      newGoals.push(goal);
    }
    setWeeklyGoals(newGoals);
    syncData({ weeklyGoals: newGoals });
  };

  const addTimetableEntry = (entry: Omit<TimetableEntry, 'id'>) => {
    const newEntry: TimetableEntry = { ...entry, id: Date.now().toString() };
    const newTimetable = [...timetable, newEntry];
    setTimetable(newTimetable);
    syncData({ timetable: newTimetable });
  };

  const updateTimetableEntry = (entry: TimetableEntry) => {
    const newTimetable = timetable.map(e => e.id === entry.id ? entry : e);
    setTimetable(newTimetable);
    syncData({ timetable: newTimetable });
  };

  const deleteTimetableEntry = (id: string) => {
    const newTimetable = timetable.filter(e => e.id !== id);
    setTimetable(newTimetable);
    syncData({ timetable: newTimetable });
  };

  const joinClass = (classId: string) => {
    if (!currentUser) return;
    
    let classFound = false;
    let participationAdded = false;
    let newRecords = participationRecords;

    const newClasses = onlineClasses.map(c => {
      if (c.id === classId) {
        classFound = true;
        if (!c.participants.includes(currentUser.id)) {
          // Record attendance when joining
          markAttendance(currentUser.id, new Date().toISOString().split('T')[0], 'Present');
          
          // Record participation
          const newRecord: ParticipationRecord = {
            id: Date.now().toString(),
            userId: currentUser.id,
            classId: c.id,
            className: c.title,
            timestamp: new Date().toISOString()
          };
          newRecords = [...participationRecords, newRecord];
          participationAdded = true;

          return { ...c, participants: [...c.participants, currentUser.id] };
        }
      }
      return c;
    });

    if (classFound) {
      setOnlineClasses(newClasses);
      if (participationAdded) {
        setParticipationRecords(newRecords);
        syncData({ onlineClasses: newClasses, participationRecords: newRecords });
      } else {
        syncData({ onlineClasses: newClasses });
      }
      
      if (socket) {
        socket.emit('join-class', classId);
      }
    }
  };

  const leaveClass = (classId: string) => {
    if (!currentUser) return;
    const newClasses = onlineClasses.map(c => {
      if (c.id === classId) {
        const newParticipants = c.participants.filter(p => p !== currentUser.id);
        return { ...c, participants: newParticipants };
      }
      return c;
    });
    setOnlineClasses(newClasses);
    syncData({ onlineClasses: newClasses });
    
    if (socket) {
      socket.emit('leave-class', classId);
    }
  };

  const deleteParticipationRecord = (id: string) => {
    const newRecords = participationRecords.filter(r => r.id !== id);
    setParticipationRecords(newRecords);
    syncData({ participationRecords: newRecords });
    notify('success', 'Participation record deleted.');
  };

  const updateLearningModel = (steps: LearningModelStep[]) => {
    setLearningModel(steps);
    syncData({ learningModel: steps });
    notify('success', 'Learning model updated successfully!');
  };

  const updateProfilePicture = (url: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, profilePicture: url, avatar: url };
    setCurrentUser(updatedUser);
    const newUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    setUsers(newUsers);
    syncData({ users: newUsers });
    notify('success', 'Profile picture updated successfully!');
  };

  const updateGroupSettings = (name: string, photo: string) => {
    if (!currentUser || currentUser.role !== 'Group Leader') return;
    setGroupName(name);
    setGroupPhoto(photo);
    syncData({ groupName: name, groupPhoto: photo });
    notify('success', 'Group settings updated successfully!');
  };

  const reportForDuty = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, hasReported: true };
    setCurrentUser(updatedUser);
    const newUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    setUsers(newUsers);
    
    // Also record in attendance table for weekly progress
    const today = new Date().toISOString().split('T')[0];
    const newAttendance = attendance.filter(a => !(a.userId === currentUser.id && a.date === today));
    newAttendance.push({ userId: currentUser.id, date: today, status: 'Present' });
    setAttendance(newAttendance);
    
    syncData({ users: newUsers, attendance: newAttendance });
    notify('success', 'You have successfully reported for duty!');
  };

  const restartSystem = async () => {
    if (!currentUser || currentUser.role !== 'Group Leader') return;
    
    try {
      const response = await fetch('/api/restart', {
        method: 'POST',
        headers: {
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id
        }
      });
      
      if (response.ok) {
        notify('success', 'System has been restarted successfully.');
        await fetchData();
      } else {
        const err = await response.json();
        notify('error', err.error || 'Failed to restart system.');
      }
    } catch (err) {
      notify('error', 'Network error while restarting system.');
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const manualLogin = async (email: string, regNo: string, role: UserRole) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, regNo, role })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { user } = await response.json();
      setCurrentUser(user);
      localStorage.setItem('c2_current_user', JSON.stringify(user));
      notify('success', `Welcome back, ${user.name}!`);
      
      // Re-fetch data with the new user credentials to get unmasked data if they are a leader
      await fetchData(3, 1000, user);
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  return (
    <DataContext.Provider value={{ 
      users, 
      resources, 
      quizzes, 
      attendance, 
      attendanceHistory,
      messages, 
      schedule, 
      theme, 
      currentUser, 
      setTheme, 
      updateUser, 
      addUser, 
      deleteUser,
      updateScheduleItem, 
      markAttendance, 
      addResource, 
      addQuiz, 
      submitQuiz,
      completeQuiz, 
      addMessage, 
      deleteMessage,
      togglePinMessage,
      setCurrentUser,
      manualLogin,
      logout,
      currentView,
      setCurrentView,
      isLoaded,
      isSaving,
      systemError,
      setSystemError,
      onlineClasses,
      onlineUserIds,
      scheduleClass,
      deleteClass,
      endClass,
      startClass,
      muteParticipant,
      toggleChatStatus,
      joinClass,
      leaveClass,
      participationRecords,
      deleteParticipationRecord,
      learningModel,
      updateLearningModel,
      updateProfilePicture,
      updateGroupSettings,
      reportForDuty,
      restartSystem,
      socket,
      groupName,
      groupPhoto,
      discussionDisabled,
      toggleDiscussion,
      weeklyGoals,
      timetable,
      updateWeeklyGoal,
      addTimetableEntry,
      updateTimetableEntry,
      deleteTimetableEntry,
      notify,
      isAIAssistantOpen,
      setIsAIAssistantOpen
    }}>
      {children}
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
