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

// Routes
app.use('/', require('./routes/auth'));
app.use('/api/student', require('./routes/student'));
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

server.listen(5000, () => console.log('Server running on port 5000'));
