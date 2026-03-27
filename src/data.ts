import { User, Resource, Quiz, Attendance, Message } from './types';

export const users: User[] = [
  { id: '1', name: 'Joshua Kennedy', email: 'joshuakennedy312@gmail.com', role: 'Group Leader', regNo: 'sc/com/0339/25', hasReported: false, createdAt: new Date().toISOString() },
  { id: '2', name: 'Bob Johnson', email: 'bob@example.com', role: 'Assistant Leader', regNo: 'REG-002', hasReported: false, createdAt: new Date().toISOString() },
  { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Tech Coordinator', regNo: 'REG-004', hasReported: false, createdAt: new Date().toISOString() },
  { id: '5', name: 'Evan Wright', email: 'evan@example.com', role: 'Subject Coordinator', regNo: 'REG-005', hasReported: false, createdAt: new Date().toISOString() },
  { id: '6', name: 'Fiona Gallagher', email: 'fiona@example.com', role: 'Member', regNo: 'REG-006', hasReported: false, createdAt: new Date().toISOString() },
  { id: '7', name: 'George Miller', email: 'george@example.com', role: 'Member', regNo: 'REG-007', hasReported: false, createdAt: new Date().toISOString() },
  { id: '8', name: 'Hannah Abbott', email: 'hannah@example.com', role: 'Member', regNo: 'REG-008', hasReported: false, createdAt: new Date().toISOString() },
  { id: '9', name: 'Ian Malcolm', email: 'ian@example.com', role: 'Member', regNo: 'REG-009', hasReported: false, createdAt: new Date().toISOString() },
  { id: '10', name: 'Julia Roberts', email: 'julia@example.com', role: 'Member', regNo: 'REG-010', hasReported: false, createdAt: new Date().toISOString() },
];

export const resources: Resource[] = [
  { id: '1', title: 'Advanced Calculus Notes', link: '#', uploadedBy: 'Evan Wright', date: '2026-03-15', type: 'PDF' },
  { id: '2', title: 'Physics Mechanics Video', link: '#', uploadedBy: 'Diana Prince', date: '2026-03-16', type: 'Video' },
  { id: '3', title: 'Chemistry Lab Report Guide', link: '#', uploadedBy: 'Joshua Kennedy', date: '2026-03-18', type: 'Doc' },
];

export const quizzes: Quiz[] = [
  { id: '1', title: 'Calculus Midterm Prep', date: '2026-03-21', status: 'Upcoming' },
  { id: '2', title: 'Physics Quiz 1', date: '2026-03-14', status: 'Completed' },
];

export const attendance: Attendance[] = [
  { userId: '1', date: '2026-03-19', status: 'Present' },
  { userId: '2', date: '2026-03-19', status: 'Present' },
  { userId: '3', date: '2026-03-19', status: 'Late' },
  { userId: '4', date: '2026-03-19', status: 'Present' },
  { userId: '5', date: '2026-03-19', status: 'Absent' },
  { userId: '6', date: '2026-03-19', status: 'Present' },
  { userId: '7', date: '2026-03-19', status: 'Present' },
  { userId: '8', date: '2026-03-19', status: 'Present' },
  { userId: '9', date: '2026-03-19', status: 'Absent' },
  { userId: '10', date: '2026-03-19', status: 'Late' },
];

export const initialSchedule = [
  {
    id: '1',
    day: 'Monday - Wednesday',
    title: 'Individual Study & Online Discussion',
    description: 'Focus on personal study goals and engage in online discussions via WhatsApp/Telegram.',
    iconName: 'BookOpen',
    color: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  {
    id: '2',
    day: 'Thursday',
    title: 'Group Discussion & Problem Solving',
    description: 'Collaborative session to tackle difficult concepts and solve problems together.',
    iconName: 'Users',
    color: 'bg-purple-50 text-purple-600 border-purple-200'
  },
  {
    id: '3',
    day: 'Saturday',
    title: 'Physical/Virtual Meeting + Quiz',
    description: 'Main weekly gathering for evaluation, peer teaching, and weekly quiz.',
    iconName: 'CheckSquare',
    color: 'bg-rose-50 text-rose-600 border-rose-200'
  },
  {
    id: '4',
    day: 'Sunday',
    title: 'Review & Planning',
    description: 'Review the past week\'s performance and set goals for the upcoming week.',
    iconName: 'CalendarIcon',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  }
];

export const messages: Message[] = [
  { id: '1', author: 'Joshua Kennedy', content: 'Welcome to the new dashboard! Feel free to share ideas here.', timestamp: new Date(Date.now() - 86400000).toISOString(), isPinned: true },
  { id: '2', author: 'Bob Johnson', content: 'Should we move our Thursday meeting to 6 PM?', timestamp: new Date(Date.now() - 3600000).toISOString(), isPinned: false },
];
