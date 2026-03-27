import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

import { getAllData, updateData } from './database.ts';

const BACKUP_FILE = path.join(process.cwd(), 'data.backup.json');
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Helper to safely read data
function readData() {
  return getAllData();
}

// Helper to safely write data
function writeData(data: any) {
  return updateData(data);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

async function sendEmail(to: string, subject: string, text: string, io?: Server) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Body: ${text}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Charlie 2 Learning Hub" <${GMAIL_USER}>`,
      to,
      subject,
      text
    });
    console.log(`[EMAIL SENT] To: ${to}`);
  } catch (err: any) {
    console.error('Failed to send email:', err);
    if (err.message.includes('Application-specific password required')) {
      console.error('CRITICAL: Gmail App Password is required. Please generate one at https://myaccount.google.com/apppasswords');
      if (io) {
        io.emit('system-error', {
          type: 'EMAIL_AUTH_REQUIRED',
          message: 'Gmail App Password is required for notifications. Please check your Secrets configuration.'
        });
      }
    }
  }
}

// Initialize data file if it doesn't exist
readData();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    maxHttpBufferSize: 5e7, // 50MB
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const onlineUsers = new Map<string, string>(); // socketId -> userId

  // Daily/Weekly Attendance Reset Check
  setInterval(() => {
    try {
      const data = readData();
      const lastReset = new Date(data.lastResetDate || 0);
      const lastDailyReset = new Date(data.lastDailyResetDate || 0);
      const now = new Date();
      
      const isNewDay = now.toDateString() !== lastDailyReset.toDateString();
      const diffDays = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

      if (isNewDay || diffDays >= 7) {
        let changed = false;

        if (isNewDay) {
          console.log('Resetting daily reporting status (Interval)...');
          data.users = data.users.map((u: any) => ({ ...u, hasReported: false }));
          data.lastDailyResetDate = now.toISOString();
          changed = true;
        }

        if (diffDays >= 7) {
          console.log('Resetting weekly attendance (Interval)...');
          const weekRange = `${lastReset.toLocaleDateString()} - ${now.toLocaleDateString()}`;
          const historyEntry = {
            id: Date.now().toString(),
            weekRange,
            records: [...data.attendance],
            completedAt: now.toISOString()
          };
          
          data.attendanceHistory = data.attendanceHistory || [];
          data.attendanceHistory.push(historyEntry);
          data.attendance = [];
          data.lastResetDate = now.toISOString();
          changed = true;
        }
        
        if (changed) {
          writeData(data);
          io.emit('data-updated', data);
        }
      }
    } catch (err) {
      console.error('Error in reset interval:', err);
    }
  }, 60000); // Check every minute

  // Socket.io logic
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('user:online', (userId) => {
      onlineUsers.set(socket.id, userId);
      io.emit('presence:update', Array.from(new Set(onlineUsers.values())));
    });

    socket.on('join-class', (classId) => {
      socket.join(`class-${classId}`);
      console.log(`User joined class: ${classId}`);
      // Notify others in the room that a new peer has joined
      socket.to(`class-${classId}`).emit('webrtc:user-joined', { socketId: socket.id, userId: onlineUsers.get(socket.id) });
    });

    socket.on('webrtc:signal', ({ target, signal, userId }) => {
      io.to(target).emit('webrtc:signal', { from: socket.id, signal, userId });
    });

    socket.on('leave-class', (classId) => {
      socket.leave(`class-${classId}`);
      console.log(`User left class: ${classId}`);
      socket.to(`class-${classId}`).emit('webrtc:user-left', { socketId: socket.id });
    });

    socket.on('send-class-reaction', ({ classId, type, userId }) => {
      io.to(`class-${classId}`).emit('class-reaction', { classId, type, id: Date.now(), userId });
    });

    socket.on('send-class-chat', (msg) => {
      io.to(`class-${msg.classId}`).emit('class-chat-message', { ...msg, id: Date.now().toString(), timestamp: new Date().toISOString() });
    });

    socket.on('toggle-class-chat', ({ classId, disabled }) => {
      // Persist to data.json
      try {
        const data = readData();
        const classIndex = data.onlineClasses.findIndex((c: any) => c.id === classId);
        if (classIndex !== -1) {
          data.onlineClasses[classIndex].chatDisabled = disabled;
          writeData(data);
          // Broadcast to all clients to update their local data state if needed
          io.emit('data-updated', data);
        }
      } catch (err) {
        console.error('Failed to persist chat toggle:', err);
      }
      io.to(`class-${classId}`).emit('class-chat-toggle', { classId, disabled });
    });
    
    socket.on('toggle-discussion', ({ disabled }) => {
      io.emit('discussion-status-updated', { disabled });
    });

    socket.on('whiteboard-draw', ({ classId, data }) => {
      socket.to(`class-${classId}`).emit('whiteboard-draw', data);
    });

    socket.on('whiteboard-clear', ({ classId }) => {
      socket.to(`class-${classId}`).emit('whiteboard-clear');
    });

    socket.on('update-data', (partialData) => {
      // Persist to file
      try {
        const currentData = readData();
        const updatedData = { ...currentData, ...partialData };
        writeData(updatedData);
        // Broadcast data update to all clients
        io.emit('data-updated', updatedData);
      } catch (err) {
        console.error('Failed to save data via socket:', err);
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      io.emit('presence:update', Array.from(new Set(onlineUsers.values())));
      console.log('User disconnected:', socket.id);
    });
  });

  // API Routes
  app.get('/api/data', (req, res) => {
    try {
      const data = readData();

      // Backend protection: Filter sensitive data based on role
      const role = req.headers['x-user-role'];
      const currentUserId = req.headers['x-user-id'];
      const isLeader = role === 'Group Leader' || role === 'Assistant Leader';

      if (!isLeader) {
        // If not a leader, we mask sensitive fields for other users
        data.users = data.users.map((user: any) => {
          // Don't mask the user's own data
          if (currentUserId && user.id === currentUserId) return user;
          return {
            ...user,
            regNo: '***',
            email: '***'
          };
        });
      }

      res.json(data);
    } catch (err: any) {
      console.error('API Error (GET /api/data):', err);
      res.status(500).json({ 
        error: 'Failed to read data', 
        details: process.env.NODE_ENV === 'development' ? err.message : undefined 
      });
    }
  });

  app.post('/api/login', (req, res) => {
    try {
      const { email, regNo, role } = req.body;
      const data = readData();
      const user = data.users.find((u: any) => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.regNo.toLowerCase() === regNo.toLowerCase() && 
        u.role === role
      );
      
      if (user) {
        res.json({ success: true, user });
      } else {
        res.status(401).json({ error: 'Invalid credentials or role. Please check your details.' });
      }
    } catch (err: any) {
      console.error('API Error (POST /api/login):', err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/data', (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid data format' });
      }
      
      const currentData = readData();
      
      // Special handling for users array to prevent masking overwrite
      let updatedData = { ...currentData, ...req.body };
      
      if (req.body.users && Array.isArray(req.body.users)) {
        updatedData.users = currentData.users.map((existingUser: any) => {
          const newUser = req.body.users.find((u: any) => u.id === existingUser.id);
          if (!newUser) return existingUser;
          
          // Only update fields that are NOT masked in the incoming data
          const mergedUser = { ...existingUser };
          Object.keys(newUser).forEach(key => {
            if (newUser[key] !== '***') {
              mergedUser[key] = newUser[key];
            }
          });
          return mergedUser;
        });
        
        // Add any brand new users
        const existingIds = new Set(currentData.users.map((u: any) => u.id));
        const newUsers = req.body.users.filter((u: any) => !existingIds.has(u.id));
        updatedData.users = [...updatedData.users, ...newUsers];
      }

      writeData(updatedData);
      
      // Notify all clients that data has changed
      io.emit('data-updated', updatedData);
      res.json({ success: true });
    } catch (err: any) {
      console.error('API Error (POST /api/data):', err);
      res.status(500).json({ 
        error: 'Failed to save data', 
        details: process.env.NODE_ENV === 'development' ? err.message : undefined 
      });
    }
  });

  app.post('/api/test-email', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      
      await sendEmail(email, 'Charlie 2 Learning Hub: Test Email', 'This is a test email to verify your notification settings. If you received this, your Gmail App Password is configured correctly!', io);
      res.json({ success: true });
    } catch (err: any) {
      console.error('API Error (POST /api/test-email):', err);
      res.status(500).json({ error: 'Failed to send test email' });
    }
  });

  app.post('/api/restart', (req, res) => {
    try {
      const role = req.headers['x-user-role'];
      if (role !== 'Group Leader') {
        return res.status(403).json({ error: 'Only Group Leaders can restart the system.' });
      }

      const initialData = {
        users: readData().users.map((u: any) => ({ ...u, hasReported: false })), // Keep users but reset reporting
        resources: [],
        quizzes: [],
        attendance: [],
        attendanceHistory: [],
        lastResetDate: new Date().toISOString(),
        lastDailyResetDate: new Date().toISOString(),
        messages: [],
        schedule: [],
        onlineClasses: [],
        discussionDisabled: false,
        weeklyGoals: [],
        timetable: [],
        participationRecords: [],
        learningModel: [
          { id: '1', phase: 'Phase 1: Planning', desc: 'Set goals, assign topics, prepare materials' },
          { id: '2', phase: 'Phase 2: Learning', desc: 'Individual study, group discussions, peer teaching' },
          { id: '3', phase: 'Phase 3: Practice', desc: 'Solve problems together, work on assignments' },
          { id: '4', phase: 'Phase 4: Evaluation', desc: 'Weekly quizzes/tests, performance review' },
          { id: '5', phase: 'Phase 5: Feedback', desc: 'Identify weaknesses, adjust strategies' },
        ]
      };
      
      writeData(initialData);
      io.emit('data-updated', initialData);
      res.json({ success: true, message: 'System state has been reset successfully.' });
    } catch (err: any) {
      console.error('API Error (POST /api/restart):', err);
      res.status(500).json({ error: 'Failed to restart system' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
