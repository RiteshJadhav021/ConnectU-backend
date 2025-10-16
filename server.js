require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http'); // Added for Socket.io
const socketIo = require('socket.io'); // Added for Socket.io

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/student', require('./routes/student'));
// Alias for plural path used in frontend
app.use('/api/students', require('./routes/student'));
app.use('/api/alumni', require('./routes/alumni'));
app.use('/api/alumni/posts', require('./routes/post'));
app.use('/api/connections', require('./routes/connection'));
app.use('/api/messages', require('./routes/message')); // New route for messages
app.use('/api/tpo', require('./routes/tpo')); // New route for TPO

// --- Socket.io setup ---
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });

  socket.on('sendMessage', ({ roomId, message }) => {
    io.to(roomId).emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
