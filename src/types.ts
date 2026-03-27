export type View = 'dashboard' | 'members' | 'schedule' | 'resources' | 'quizzes' | 'attendance' | 'online-class' | 'leader-insight';

export type UserRole = 'Group Leader' | 'Assistant Leader' | 'Secretary' | 'Tech Coordinator' | 'Subject Coordinator' | 'Member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  regNo: string;
  hasReported?: boolean;
  profilePicture?: string;
  createdAt?: string;
  password?: string;
  isOnline?: boolean;
  progress?: number;
  lastReportedAt?: string;
}

export interface Attendance {
  userId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface Resource {
  id: string;
  title: string;
  link: string;
  uploadedBy: string;
  date: string;
  type: 'PDF' | 'Video' | 'Link' | 'Doc';
}

export interface Quiz {
  id: string;
  title: string;
  date: string;
  status: 'Upcoming' | 'Completed';
  questions?: string[];
  correctAnswers?: string[]; // Added for grading
  submissions?: Record<string, string[]>; // userId -> answers
}

export interface Message {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isPinned: boolean;
}

export interface ScheduleItem {
  id: string;
  day: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
}

export interface Result {
  userId: string;
  quizId: string;
  score: number;
  total: number;
}

export interface OnlineClass {
  id: string;
  title: string;
  startTime: string;
  duration: number; // in minutes
  scheduledBy: string;
  isLive: boolean;
  isCompleted?: boolean;
  endTime?: string;
  chatDisabled?: boolean;
  notifiedStart?: boolean;
  participants: string[]; // userIds
  meetLink?: string;
}

export interface TimetableEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  coordinator: string;
}

export interface WeeklyGoal {
  id: string;
  week: string;
  goal: string;
  location: string;
}

export interface ParticipationRecord {
  id: string;
  userId: string;
  classId: string;
  className: string;
  timestamp: string;
}

export interface LearningModelStep {
  id: string;
  phase: string;
  desc: string;
}

export interface WeeklyAttendance {
  id: string;
  weekRange: string;
  records: Attendance[];
  completedAt: string;
}

export interface AppData {
  users: User[];
  resources: Resource[];
  quizzes: Quiz[];
  attendance: Attendance[];
  attendanceHistory?: WeeklyAttendance[];
  messages: Message[];
  schedule: ScheduleItem[];
  onlineClasses: OnlineClass[];
  discussionDisabled?: boolean;
  weeklyGoals?: WeeklyGoal[];
  timetable?: TimetableEntry[];
  participationRecords?: ParticipationRecord[];
  learningModel?: LearningModelStep[];
  groupName?: string;
  groupPhoto?: string;
}
