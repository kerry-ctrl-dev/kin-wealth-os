const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const crypto = require('crypto');
require('dotenv').config();
const { isAllowedOrigin, isSafeSignal, verifyFirebaseIdToken } = require('./security');

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Store active users
const activeUsers = new Map();
const activeCalls = new Map();

io.use(async (socket, next) => {
  try {
    if (!isAllowedOrigin(socket.handshake.headers.origin, allowedOrigins)) {
      return next(new Error('Unauthorized'));
    }

    const identity = await verifyFirebaseIdToken(socket.handshake.auth?.token);
    if (!identity) return next(new Error('Unauthorized'));

    socket.data.user = identity;
    return next();
  } catch {
    return next(new Error('Unauthorized'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  const user = socket.data.user;
  activeUsers.set(socket.id, user);
  io.emit('user_online', { uid: user.uid, displayName: user.displayName, socketId: socket.id });

  const activeRecipient = (id) =>
    typeof id === 'string' && id.length > 0 && id.length <= 128 && activeUsers.has(id) ? id : null;
  const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

  // Handle messages
  socket.on('send_message', (data) => {
    if (!isRecord(data)) return;
    const recipientId = activeRecipient(data.recipientId);
    const text = typeof data.text === 'string' ? data.text : data.message;
    if (!recipientId || recipientId === socket.id || typeof text !== 'string' || !text.trim() || text.length > 4000) {
      return;
    }

    io.to(recipientId).emit('receive_message', {
      id: crypto.randomUUID(),
      sender: user.uid,
      senderId: user.uid,
      senderName: user.displayName,
      recipientId,
      text,
      message: text,
      timestamp: Date.now(),
    });
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    if (!isRecord(data)) return;
    const recipientId = activeRecipient(data.recipientId);
    if (!recipientId || recipientId === socket.id) return;
    io.to(recipientId).emit('user_typing', {
      senderId: user.uid,
      senderName: user.displayName,
      isTyping: data.isTyping === true,
    });
  });

  // Handle call initiation
  socket.on('call_user', (data) => {
    if (!isRecord(data) || !isSafeSignal(data.signal)) return;
    const recipientSocketId = activeRecipient(data.recipientSocketId);
    if (!recipientSocketId || recipientSocketId === socket.id) return;

    const now = Date.now();
    for (const [callId, call] of activeCalls) {
      if (
        now - call.createdAt > 120000 ||
        !activeUsers.has(call.callerSocketId) ||
        !activeUsers.has(call.recipientSocketId)
      ) {
        activeCalls.delete(callId);
      }
    }

    const callId = crypto.randomUUID();
    activeCalls.set(callId, { callerSocketId: socket.id, recipientSocketId, createdAt: now });
    io.to(recipientSocketId).emit('incoming_call', {
      callId,
      callerId: socket.id,
      callerUid: user.uid,
      callerName: user.displayName,
      signal: data.signal,
    });
  });

  // Handle call answer
  socket.on('answer_call', (data) => {
    if (!isRecord(data) || typeof data.callId !== 'string' || !isSafeSignal(data.signal)) return;
    const call = activeCalls.get(data.callId);
    if (!call || call.recipientSocketId !== socket.id || !activeUsers.has(call.callerSocketId)) return;

    activeCalls.delete(data.callId);
    io.to(call.callerSocketId).emit('call_answered', {
      callId: data.callId,
      answeredBy: user.uid,
      signal: data.signal,
    });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    activeUsers.delete(socket.id);
    for (const [callId, call] of activeCalls) {
      if (call.callerSocketId === socket.id || call.recipientSocketId === socket.id) {
        activeCalls.delete(callId);
      }
    }
    io.emit('user_offline', socket.id);
  });
});

// REST API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'WhatsApp Clone Server is running' });
});

app.get('/api/users', (req, res) => {
  const users = Array.from(activeUsers.entries()).map(([socketId, user]) => ({
    ...user,
    socketId,
  }));
  res.json(users);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
server.listen(PORT, () => {
  console.log(`WhatsApp Clone Server running on port ${PORT}`);
});
