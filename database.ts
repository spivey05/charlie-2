import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'database.sqlite');
const db = new Database(DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    regNo TEXT,
    role TEXT,
    avatar TEXT,
    profilePicture TEXT,
    hasReported INTEGER DEFAULT 0,
    bio TEXT,
    joinedAt TEXT,
    lastActive TEXT
  );

  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    title TEXT,
    type TEXT,
    url TEXT,
    category TEXT,
    uploadedBy TEXT,
    uploadedAt TEXT,
    description TEXT,
    size TEXT
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    duration INTEGER,
    questions TEXT, -- JSON
    createdBy TEXT,
    createdAt TEXT,
    attempts TEXT -- JSON
  );

  CREATE TABLE IF NOT EXISTS attendance (
    userId TEXT,
    date TEXT,
    status TEXT,
    PRIMARY KEY (userId, date)
  );

  CREATE TABLE IF NOT EXISTS attendanceHistory (
    id TEXT PRIMARY KEY,
    weekRange TEXT,
    records TEXT, -- JSON
    completedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    senderId TEXT,
    senderName TEXT,
    text TEXT,
    timestamp TEXT,
    type TEXT,
    replyTo TEXT, -- JSON
    reactions TEXT, -- JSON
    isPinned INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS schedule (
    id TEXT PRIMARY KEY,
    title TEXT,
    date TEXT,
    startTime TEXT,
    endTime TEXT,
    type TEXT,
    description TEXT,
    location TEXT,
    createdBy TEXT
  );

  CREATE TABLE IF NOT EXISTS onlineClasses (
    id TEXT PRIMARY KEY,
    title TEXT,
    startTime TEXT,
    endTime TEXT,
    instructor TEXT,
    status TEXT,
    participants TEXT, -- JSON
    chatDisabled INTEGER DEFAULT 0,
    recordingUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS weeklyGoals (
    id TEXT PRIMARY KEY,
    text TEXT,
    completed INTEGER DEFAULT 0,
    userId TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS timetable (
    id TEXT PRIMARY KEY,
    day TEXT,
    time TEXT,
    subject TEXT,
    room TEXT,
    teacher TEXT
  );

  CREATE TABLE IF NOT EXISTS participationRecords (
    id TEXT PRIMARY KEY,
    userId TEXT,
    points INTEGER,
    reason TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS learningModel (
    id TEXT PRIMARY KEY,
    phase TEXT,
    desc TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed default Group Leader if not exists
const leaderExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get('joshuakennedy312@gmail.com') as { count: number };
if (leaderExists.count === 0) {
  db.prepare(`
    INSERT INTO users (id, name, email, regNo, role, joinedAt, hasReported)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'leader-1',
    'Joshua Kennedy',
    'joshuakennedy312@gmail.com',
    'sc/com/0339/25',
    'Group Leader',
    new Date().toISOString(),
    0
  );
}

// Seed default group settings
const groupNameExists = db.prepare('SELECT COUNT(*) as count FROM settings WHERE key = ?').get('groupName') as { count: number };
if (groupNameExists.count === 0) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('groupName', JSON.stringify('Academic Excellence Group'));
}
const groupPhotoExists = db.prepare('SELECT COUNT(*) as count FROM settings WHERE key = ?').get('groupPhoto') as { count: number };
if (groupPhotoExists.count === 0) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('groupPhoto', JSON.stringify('https://picsum.photos/seed/group/800/400'));
}

// Seed default members if no users exist (excluding the leader we just checked/added)
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count <= 1) {
  // Add some default members for testing
  const defaultMembers = [
    { id: 'mem-1', name: 'Alice Smith', email: 'alice@example.com', regNo: 'REG/001', role: 'Member' },
    { id: 'mem-2', name: 'Bob Johnson', email: 'bob@example.com', regNo: 'REG/002', role: 'Member' },
    { id: 'mem-3', name: 'Charlie Brown', email: 'charlie@example.com', regNo: 'REG/003', role: 'Member' }
  ];
  
  const insertMember = db.prepare('INSERT INTO users (id, name, email, regNo, role, joinedAt, hasReported) VALUES (?, ?, ?, ?, ?, ?, ?)');
  defaultMembers.forEach(m => {
    if (m.email !== 'joshuakennedy312@gmail.com') {
      insertMember.run(m.id, m.name, m.email, m.regNo, m.role, new Date().toISOString(), 0);
    }
  });
}

export function getAllData() {
  const users = db.prepare('SELECT * FROM users').all().map((u: any) => ({ ...u, hasReported: !!u.hasReported }));
  const resources = db.prepare('SELECT * FROM resources').all();
  const quizzes = db.prepare('SELECT * FROM quizzes').all().map((q: any) => ({
    ...q,
    questions: JSON.parse(q.questions || '[]'),
    attempts: JSON.parse(q.attempts || '[]')
  }));
  const attendance = db.prepare('SELECT * FROM attendance').all();
  const attendanceHistory = db.prepare('SELECT * FROM attendanceHistory').all().map((h: any) => ({
    ...h,
    records: JSON.parse(h.records || '[]')
  }));
  const messages = db.prepare('SELECT * FROM messages').all().map((m: any) => ({
    ...m,
    replyTo: JSON.parse(m.replyTo || 'null'),
    reactions: JSON.parse(m.reactions || '[]'),
    isPinned: !!m.isPinned
  }));
  const schedule = db.prepare('SELECT * FROM schedule').all();
  const onlineClasses = db.prepare('SELECT * FROM onlineClasses').all().map((c: any) => ({
    ...c,
    participants: JSON.parse(c.participants || '[]'),
    chatDisabled: !!c.chatDisabled
  }));
  const weeklyGoals = db.prepare('SELECT * FROM weeklyGoals').all().map((g: any) => ({
    ...g,
    completed: !!g.completed
  }));
  const timetable = db.prepare('SELECT * FROM timetable').all();
  const participationRecords = db.prepare('SELECT * FROM participationRecords').all();
  const learningModel = db.prepare('SELECT * FROM learningModel').all();

  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings: any = {};
  settingsRows.forEach((row: any) => {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  });

  return {
    users,
    resources,
    quizzes,
    attendance,
    attendanceHistory,
    messages,
    schedule,
    onlineClasses,
    weeklyGoals,
    timetable,
    participationRecords,
    learningModel,
    ...settings
  };
}

export function updateData(data: any) {
  const transaction = db.transaction((data: any) => {
    if (data.users) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO users (id, name, email, regNo, role, avatar, profilePicture, hasReported, bio, joinedAt, lastActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.users.forEach((u: any) => {
        stmt.run(u.id, u.name, u.email, u.regNo, u.role, u.avatar, u.profilePicture, u.hasReported ? 1 : 0, u.bio, u.joinedAt, u.lastActive);
      });
      
      // Handle deletions if the incoming array is a full replacement
      // For simplicity in this app, we often send partial updates. 
      // If the app sends the WHOLE users array, we might want to delete missing ones.
      // But usually it's safer to just upsert.
    }

    if (data.resources) {
      db.prepare('DELETE FROM resources').run();
      const stmt = db.prepare(`
        INSERT INTO resources (id, title, type, url, category, uploadedBy, uploadedAt, description, size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.resources.forEach((r: any) => {
        stmt.run(r.id, r.title, r.type, r.url, r.category, r.uploadedBy, r.uploadedAt, r.description, r.size);
      });
    }

    if (data.quizzes) {
      db.prepare('DELETE FROM quizzes').run();
      const stmt = db.prepare(`
        INSERT INTO quizzes (id, title, description, duration, questions, createdBy, createdAt, attempts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.quizzes.forEach((q: any) => {
        stmt.run(q.id, q.title, q.description, q.duration, JSON.stringify(q.questions), q.createdBy, q.createdAt, JSON.stringify(q.attempts));
      });
    }

    if (data.attendance) {
      db.prepare('DELETE FROM attendance').run();
      const stmt = db.prepare(`
        INSERT INTO attendance (userId, date, status)
        VALUES (?, ?, ?)
      `);
      data.attendance.forEach((a: any) => {
        stmt.run(a.userId, a.date, a.status);
      });
    }

    if (data.attendanceHistory) {
      db.prepare('DELETE FROM attendanceHistory').run();
      const stmt = db.prepare(`
        INSERT INTO attendanceHistory (id, weekRange, records, completedAt)
        VALUES (?, ?, ?, ?)
      `);
      data.attendanceHistory.forEach((h: any) => {
        stmt.run(h.id, h.weekRange, JSON.stringify(h.records), h.completedAt);
      });
    }

    if (data.messages) {
      db.prepare('DELETE FROM messages').run();
      const stmt = db.prepare(`
        INSERT INTO messages (id, senderId, senderName, text, timestamp, type, replyTo, reactions, isPinned)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.messages.forEach((m: any) => {
        stmt.run(m.id, m.senderId, m.senderName, m.text, m.timestamp, m.type, JSON.stringify(m.replyTo), JSON.stringify(m.reactions), m.isPinned ? 1 : 0);
      });
    }

    if (data.schedule) {
      db.prepare('DELETE FROM schedule').run();
      const stmt = db.prepare(`
        INSERT INTO schedule (id, title, date, startTime, endTime, type, description, location, createdBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.schedule.forEach((s: any) => {
        stmt.run(s.id, s.title, s.date, s.startTime, s.endTime, s.type, s.description, s.location, s.createdBy);
      });
    }

    if (data.onlineClasses) {
      db.prepare('DELETE FROM onlineClasses').run();
      const stmt = db.prepare(`
        INSERT INTO onlineClasses (id, title, startTime, endTime, instructor, status, participants, chatDisabled, recordingUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.onlineClasses.forEach((c: any) => {
        stmt.run(c.id, c.title, c.startTime, c.endTime, c.instructor, c.status, JSON.stringify(c.participants), c.chatDisabled ? 1 : 0, c.recordingUrl);
      });
    }

    if (data.weeklyGoals) {
      db.prepare('DELETE FROM weeklyGoals').run();
      const stmt = db.prepare(`
        INSERT INTO weeklyGoals (id, text, completed, userId, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `);
      data.weeklyGoals.forEach((g: any) => {
        stmt.run(g.id, g.text, g.completed ? 1 : 0, g.userId, g.createdAt);
      });
    }

    if (data.timetable) {
      db.prepare('DELETE FROM timetable').run();
      const stmt = db.prepare(`
        INSERT INTO timetable (id, day, time, subject, room, teacher)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      data.timetable.forEach((t: any) => {
        stmt.run(t.id, t.day, t.time, t.subject, t.room, t.teacher);
      });
    }

    if (data.participationRecords) {
      db.prepare('DELETE FROM participationRecords').run();
      const stmt = db.prepare(`
        INSERT INTO participationRecords (id, userId, points, reason, date)
        VALUES (?, ?, ?, ?, ?)
      `);
      data.participationRecords.forEach((p: any) => {
        stmt.run(p.id, p.userId, p.points, p.reason, p.date);
      });
    }

    if (data.learningModel) {
      db.prepare('DELETE FROM learningModel').run();
      const stmt = db.prepare(`
        INSERT INTO learningModel (id, phase, desc)
        VALUES (?, ?, ?)
      `);
      data.learningModel.forEach((l: any) => {
        stmt.run(l.id, l.phase, l.desc);
      });
    }

    // Handle settings
    const settingKeys = ['lastResetDate', 'lastDailyResetDate', 'discussionDisabled', 'groupName', 'groupPhoto'];
    settingKeys.forEach(key => {
      if (data[key] !== undefined) {
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(data[key]));
      }
    });
  });

  transaction(data);
}

// Migration from JSON
export function migrateFromJson(jsonPath: string) {
  if (fs.existsSync(jsonPath)) {
    try {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      const data = JSON.parse(content);
      updateData(data);
      console.log('Successfully migrated data from JSON to SQLite');
      // Rename file to mark as migrated
      fs.renameSync(jsonPath, jsonPath + '.migrated');
    } catch (err) {
      console.error('Failed to migrate data from JSON:', err);
    }
  }
}

// Initial migration check
migrateFromJson(path.join(process.cwd(), 'data.json'));
