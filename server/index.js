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

  socket.on('join-room', ({ roomId, userId, password, limit }) => {
    let room = rooms.get(roomId);

    // Create room if not exists
    if (!room) {
      room = {
        users: new Set(),
        password,
        limit: parseInt(limit) || 5,
        admin: userId // First user is admin
      };
      rooms.set(roomId, room);
      console.log(`Created room ${roomId} with limit ${room.limit} and admin ${userId}`);
    }

    // Validation
    if (room.users.size >= room.limit) {
      return socket.emit('join-error', 'Room is full.');
    }

    if (room.password && room.password !== password) {
      return socket.emit('join-error', 'Invalid password.');
    }

    // Join
    socket.join(roomId);
    room.users.add(userId);
    console.log(`User ${userId} (${socket.id}) joined room ${roomId}`);

    // Notify others
    socket.emit('admin-status', { isAdmin: userId === room.admin }); // Tell user if they are admin
    socket.to(roomId).emit('user-connected', userId);

    // Admin Events
    socket.on('admin-mute-all', () => {
      if (room.admin === userId) {
        socket.to(roomId).emit('admin-mute-command');
      }
    });

    socket.on('admin-mute-user', (targetId) => {
      if (room.admin === userId) {
        socket.to(roomId).emit('admin-mute-command-user', targetId);
      }
    });

    socket.on('admin-kick-user', (targetId) => {
      if (room.admin === userId) {
        // We need to find the socket for this user to disconnect them?
        // Actually we can just broadcast a "kick" message and the client handles it,
        // OR we map userId -> socketId to force disconnect here.
        // For simple MVP without user->socket map, we broadcast "kick-command" to room
        // and let the specific client react.
        io.to(roomId).emit('admin-kick-command', targetId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      if (room && room.users) {
        room.users.delete(userId);
        if (room.users.size === 0) {
          rooms.delete(roomId);
        } else if (room.admin === userId) {
          // Reassign admin to next available user
          const nextAdmin = [...room.users][0];
          room.admin = nextAdmin;
          // Notify new admin (trickier without direct socket map, but we can broadcast)
          // Ideally we'd map userId -> socketId.
          // For now, let's keep it simple: No admin transfer or simple one.
          // Let's iterate sockets in room to find the one matching nextAdmin?
          // Expensive. Let's just not reassign for MVP or keep it simple.
          console.log(`Admin left. New admin: ${nextAdmin}`);
        }
      }
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

const PORT = process.env.PORT || 2000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`Network access enabled. Host IP: ${require('os').networkInterfaces().eth0?.[0]?.address || 'unknown'}`);
});
