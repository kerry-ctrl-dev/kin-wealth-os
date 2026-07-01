const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Store active users
const activeUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', (userData) => {
    activeUsers.set(socket.id, userData);
    io.emit('user_online', { ...userData, socketId: socket.id });
  });

  // Handle messages
  socket.on('send_message', (data) => {
    io.to(data.recipientId).emit('receive_message', data);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    io.to(data.recipientId).emit('user_typing', data);
  });

  // Handle call initiation
  socket.on('call_user', (data) => {
    io.to(data.recipientSocketId).emit('incoming_call', {
      callerId: socket.id,
      callerName: data.callerName,
      signal: data.signal,
    });
  });

  // Handle call answer
  socket.on('answer_call', (data) => {
    io.to(data.callerId).emit('call_answered', {
      signal: data.signal,
    });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    activeUsers.delete(socket.id);
    io.emit('user_offline', socket.id);
    console.log(`User disconnected: ${socket.id}`);
  });
});

// REST API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'WhatsApp Clone Server is running' });
});

app.get('/api/users', (req, res) => {
  const users = Array.from(activeUsers.values()).map((user, index) => ({
    ...user,
    socketId: Array.from(activeUsers.keys())[index],
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
