const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Serve static files from client/dist (production build)
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store room state: roomId -> Set of socketIds
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} (${socket.id}) joined room ${roomId}`);

    // Notify others in the room
    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });

  // Signaling events
  socket.on('offer', (payload) => {
    // payload: { target: targetUserId, caller: myUserId, sdp: offerSdp }
    // Or simpler: broadcast to room for 1-on-1
    // We'll assume the client sends the offer to the room or specific user.
    // Let's implement forwarding to a specific target or broadcast if simple 1-on-1.
    // For robust app, use target.

    // Use socket.to(roomId).emit('offer', payload) ?
    // Better: payload has { sdp, roomId }

    console.log('Received offer');
    socket.to(payload.roomId).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    console.log('Received answer');
    socket.to(payload.roomId).emit('answer', payload);
  });

  socket.on('ice-candidate', (payload) => {
    socket.to(payload.roomId).emit('ice-candidate', payload);
  });

  // Chat
  socket.on('chat-message', (payload) => {
    socket.to(payload.roomId).emit('chat-message', payload);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
